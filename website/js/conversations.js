// Conversations & Analytics Page Logic

let currentTab = 'calls';
let callLogs = [];
let leads = [];
let sentimentChart = null;
let outcomesChart = null;
let csatChart = null;
let hourlyChart = null;

// ============ DATA FETCHING ============

async function fetchCallLogs(filters = {}) {
  if (!db) {
    console.error('[fetchCallLogs] Supabase client not initialized');
    return [];
  }

  try {
    let query = db
      .from('call_logs')
      .select('*')
      .order('started_at', { ascending: false });

    // Apply date filter
    if (filters.date) {
      const now = new Date();
      let startDate;
      switch (filters.date) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = null;
      }
      if (startDate) {
        query = query.gte('started_at', startDate.toISOString());
      }
    }

    // Apply sentiment filter
    if (filters.sentiment && filters.sentiment !== 'all') {
      query = query.eq('sentiment', filters.sentiment);
    }

    // Apply outcome filter
    if (filters.outcome && filters.outcome !== 'all') {
      query = query.eq('outcome', filters.outcome);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[fetchCallLogs] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchCallLogs] Exception:', err);
    return [];
  }
}

async function fetchLeads(filters = {}) {
  if (!db) {
    console.error('[fetchLeads] Supabase client not initialized');
    return [];
  }

  try {
    let query = db
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.interest_level && filters.interest_level !== 'all') {
      query = query.eq('interest_level', filters.interest_level);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[fetchLeads] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchLeads] Exception:', err);
    return [];
  }
}

async function fetchInsights() {
  if (!db) {
    console.error('[fetchInsights] Supabase client not initialized');
    return null;
  }

  try {
    const { data, error } = await db
      .from('conversation_insights')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[fetchInsights] Error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[fetchInsights] Exception:', err);
    return null;
  }
}

async function fetchCallbacks() {
  if (!db) {
    console.error('[fetchCallbacks] Supabase client not initialized');
    return [];
  }

  try {
    // Get calls that have callback_requested = true
    const { data, error } = await db
      .from('call_logs')
      .select('*')
      .eq('callback_requested', true)
      .order('callback_scheduled_at', { ascending: true });

    if (error) {
      console.error('[fetchCallbacks] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchCallbacks] Exception:', err);
    return [];
  }
}

async function fetchAgentPerformance() {
  if (!db) {
    console.error('[fetchAgentPerformance] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
      .from('agent_performance')
      .select('*')
      .order('date', { ascending: false })
      .limit(7);

    if (error) {
      console.error('[fetchAgentPerformance] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchAgentPerformance] Exception:', err);
    return [];
  }
}

async function fetchHourlyStats() {
  if (!db) {
    console.error('[fetchHourlyStats] Supabase client not initialized');
    return [];
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await db
      .from('hourly_stats')
      .select('*')
      .eq('date', today)
      .order('hour', { ascending: true });

    if (error) {
      console.error('[fetchHourlyStats] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchHourlyStats] Exception:', err);
    return [];
  }
}

async function fetchEscalationLogs() {
  if (!db) {
    console.error('[fetchEscalationLogs] Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await db
      .from('escalation_logs')
      .select('*')
      .order('escalation_time', { ascending: false });

    if (error) {
      console.error('[fetchEscalationLogs] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[fetchEscalationLogs] Exception:', err);
    return [];
  }
}

// ============ METRICS & CHARTS ============

async function loadMetrics() {
  const calls = await fetchCallLogs({ date: 'week' });
  const leadsData = await fetchLeads();

  // Calculate basic metrics
  const totalCalls = calls.length;
  const leadsGenerated = calls.filter(c => c.outcome === 'lead_generated').length;
  const bookingsMade = calls.filter(c => c.outcome === 'booking_made').length;
  const escalations = calls.filter(c => c.outcome === 'escalated').length;
  const avgDuration = totalCalls > 0
    ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / totalCalls)
    : 0;
  const conversionRate = totalCalls > 0
    ? Math.round(((leadsGenerated + bookingsMade) / totalCalls) * 100)
    : 0;

  // Calculate enhanced metrics
  const fcrCalls = calls.filter(c => c.first_call_resolution === true).length;
  const fcrRate = totalCalls > 0 ? Math.round((fcrCalls / totalCalls) * 100) : 0;

  const csatCalls = calls.filter(c => c.csat_score != null);
  const avgCsat = csatCalls.length > 0
    ? (csatCalls.reduce((sum, c) => sum + c.csat_score, 0) / csatCalls.length).toFixed(1)
    : '-';

  const cesCalls = calls.filter(c => c.customer_effort_score != null);
  const avgCes = cesCalls.length > 0
    ? (cesCalls.reduce((sum, c) => sum + c.customer_effort_score, 0) / cesCalls.length).toFixed(1)
    : '-';

  // Talk/Listen metrics
  const totalTalkTime = calls.reduce((sum, c) => sum + (c.talk_time_seconds || 0), 0);
  const totalListenTime = calls.reduce((sum, c) => sum + (c.listen_time_seconds || 0), 0);
  const totalSilence = calls.reduce((sum, c) => sum + (c.silence_time_seconds || 0), 0);
  const totalTime = totalTalkTime + totalListenTime + totalSilence;
  const talkRatio = totalListenTime > 0 ? (totalTalkTime / totalListenTime).toFixed(2) : '-';
  const talkPct = totalTime > 0 ? Math.round((totalTalkTime / totalTime) * 100) : 0;
  const listenPct = totalTime > 0 ? Math.round((totalListenTime / totalTime) * 100) : 0;
  const silencePct = totalTime > 0 ? Math.round((totalSilence / totalTime) * 100) : 0;

  // Repeat callers
  const repeatCallers = calls.filter(c => c.is_repeat_caller === true).length;

  // Competitor mentions
  const competitorMentions = calls.filter(c => c.competitor_mentions && c.competitor_mentions.length > 0);
  const allCompetitors = [];
  competitorMentions.forEach(c => {
    (c.competitor_mentions || []).forEach(comp => {
      if (!allCompetitors.includes(comp)) allCompetitors.push(comp);
    });
  });

  // Update UI - Basic metrics
  document.getElementById('metric-total-calls').textContent = totalCalls;
  document.getElementById('metric-leads').textContent = leadsGenerated;
  document.getElementById('metric-bookings').textContent = bookingsMade;
  document.getElementById('metric-escalations').textContent = escalations;
  document.getElementById('metric-avg-duration').textContent = formatDuration(avgDuration);
  document.getElementById('metric-conversion').textContent = conversionRate + '%';
  document.getElementById('metric-fcr').textContent = fcrRate + '%';
  document.getElementById('metric-csat').textContent = avgCsat + '/5';

  // Update UI - Enhanced metrics
  document.getElementById('metric-talk-ratio').textContent = talkRatio;
  document.getElementById('metric-talk-pct').textContent = `Talk: ${talkPct}%`;
  document.getElementById('metric-listen-pct').textContent = `Listen: ${listenPct}%`;
  document.getElementById('metric-ces').textContent = avgCes + '/7';
  document.getElementById('metric-repeat').textContent = repeatCallers;
  document.getElementById('metric-competitors').textContent = competitorMentions.length;
  document.getElementById('competitor-names').textContent = allCompetitors.length > 0 ? allCompetitors.join(', ') : 'None detected';
  document.getElementById('metric-silence').textContent = silencePct + '%';

  // Update sentiment chart
  const positive = calls.filter(c => c.sentiment === 'positive').length;
  const neutral = calls.filter(c => c.sentiment === 'neutral').length;
  const negative = calls.filter(c => c.sentiment === 'negative').length;
  updateSentimentChart(positive, neutral, negative);

  // Update outcomes chart
  const infoProvided = calls.filter(c => c.outcome === 'info_provided').length;
  updateOutcomesChart(leadsGenerated, bookingsMade, escalations, infoProvided);

  // Update CSAT chart
  updateCsatChart(calls);

  // Update top topics
  updateTopTopics(calls);

  // Update top models
  updateTopModels(calls);

  // Update keywords cloud
  updateKeywordsCloud(calls);

  // Update hourly chart
  updateHourlyChart(calls);

  // Update agent performance
  await updateAgentPerformance(calls);

  // Update escalation stats
  updateEscalationStats(calls);

  // Store for later use
  callLogs = calls;
  leads = leadsData;
}

function updateEscalationStats(calls) {
  // Get escalated calls
  const escalatedCalls = calls.filter(c => c.escalated_to_human === true || c.outcome === 'escalated');
  const totalCalls = calls.length;
  const escalationCount = escalatedCalls.length;
  const escalationRate = totalCalls > 0 ? Math.round((escalationCount / totalCalls) * 100) : 0;

  // Calculate average takeover time
  const takeoverTimes = escalatedCalls.filter(c => c.human_takeover_time_seconds != null);
  const avgTakeoverTime = takeoverTimes.length > 0
    ? Math.round(takeoverTimes.reduce((sum, c) => sum + c.human_takeover_time_seconds, 0) / takeoverTimes.length)
    : 0;

  // Calculate resolved count (assume issue_resolved field or positive sentiment after escalation)
  const resolvedCalls = escalatedCalls.filter(c => c.issue_resolved === true).length;
  const pendingCalls = escalationCount - resolvedCalls;

  // Post-escalation satisfaction (from escalated calls with csat_score)
  const escalatedWithCsat = escalatedCalls.filter(c => c.csat_score != null);
  const avgEscalationCsat = escalatedWithCsat.length > 0
    ? (escalatedWithCsat.reduce((sum, c) => sum + c.csat_score, 0) / escalatedWithCsat.length).toFixed(1)
    : '-';

  // Update UI
  const escalationTotal = document.getElementById('escalation-total');
  const escalationRateEl = document.getElementById('escalation-rate');
  const escalationAvgTime = document.getElementById('escalation-avg-time');
  const escalationResolved = document.getElementById('escalation-resolved');
  const escalationSatisfaction = document.getElementById('escalation-satisfaction');
  const escalationPending = document.getElementById('escalation-pending');
  const escalationTrend = document.getElementById('escalation-trend');

  if (escalationTotal) escalationTotal.textContent = escalationCount;
  if (escalationRateEl) escalationRateEl.textContent = escalationRate + '%';
  if (escalationAvgTime) escalationAvgTime.textContent = avgTakeoverTime + 's';
  if (escalationResolved) escalationResolved.textContent = resolvedCalls;
  if (escalationSatisfaction) escalationSatisfaction.textContent = avgEscalationCsat !== '-' ? avgEscalationCsat + '/5' : '-';
  if (escalationPending) escalationPending.textContent = pendingCalls;

  // Trend indicator
  if (escalationTrend) {
    if (escalationRate <= 10) {
      escalationTrend.textContent = 'Low';
      escalationTrend.className = 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full';
    } else if (escalationRate <= 20) {
      escalationTrend.textContent = 'Normal';
      escalationTrend.className = 'text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full';
    } else {
      escalationTrend.textContent = 'High';
      escalationTrend.className = 'text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full';
    }
  }

  // Escalation reasons breakdown
  const reasonCounts = {};
  escalatedCalls.forEach(c => {
    const reason = c.escalation_reason || c.call_type || 'Other';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const sortedReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const reasonsContainer = document.getElementById('escalation-reasons');
  if (reasonsContainer) {
    if (sortedReasons.length === 0) {
      reasonsContainer.innerHTML = '<p class="text-gray-500 text-sm">No escalations</p>';
    } else {
      const maxReasonCount = sortedReasons[0][1];
      reasonsContainer.innerHTML = sortedReasons.map(([reason, count]) => `
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div class="bg-orange-500 h-2 rounded-full" style="width: ${(count / maxReasonCount) * 100}%"></div>
          </div>
          <span class="text-xs text-gray-600 w-32 truncate" title="${reason}">${reason.replace(/_/g, ' ')}</span>
          <span class="text-xs font-medium text-gray-900 w-6">${count}</span>
        </div>
      `).join('');
    }
  }

  // Human agents handling
  const agentCounts = {};
  escalatedCalls.forEach(c => {
    const agent = c.human_agent_name || 'Unassigned';
    agentCounts[agent] = (agentCounts[agent] || 0) + 1;
  });

  const sortedAgents = Object.entries(agentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const agentsContainer = document.getElementById('human-agents-list');
  if (agentsContainer) {
    if (sortedAgents.length === 0) {
      agentsContainer.innerHTML = '<p class="text-gray-500 text-sm">No agents assigned</p>';
    } else {
      agentsContainer.innerHTML = sortedAgents.map(([agent, count]) => `
        <div class="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
              ${agent.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm text-gray-700">${agent}</span>
          </div>
          <span class="text-sm font-medium text-gray-900">${count} calls</span>
        </div>
      `).join('');
    }
  }
}

async function updateAgentPerformance(calls) {
  // Calculate from call data
  const todayCalls = calls.filter(c => {
    const callDate = new Date(c.started_at).toDateString();
    const today = new Date().toDateString();
    return callDate === today;
  });

  const totalDuration = todayCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const avgHandleTime = todayCalls.length > 0 ? Math.round(totalDuration / todayCalls.length) : 0;

  // Calculate NPS from calls (nps_score ranges from -100 to 100)
  const npsCalls = calls.filter(c => c.nps_score != null);
  const avgNps = npsCalls.length > 0
    ? Math.round(npsCalls.reduce((sum, c) => sum + c.nps_score, 0) / npsCalls.length)
    : null;

  // Calculate transfer rate
  const transfers = calls.filter(c => c.was_transferred === true).length;
  const transferRate = calls.length > 0 ? Math.round((transfers / calls.length) * 100) : 0;

  // Calculate avg hold time
  const totalHoldTime = calls.reduce((sum, c) => sum + (c.hold_time_seconds || 0), 0);
  const avgHoldTime = calls.length > 0 ? Math.round(totalHoldTime / calls.length) : 0;

  // Average quality score from calls
  const qualityCalls = calls.filter(c => c.agent_quality_score != null);
  const avgQuality = qualityCalls.length > 0
    ? Math.round(qualityCalls.reduce((sum, c) => sum + c.agent_quality_score, 0) / qualityCalls.length)
    : 88;

  // Update UI
  const agentQuality = document.getElementById('agent-quality');
  const agentCalls = document.getElementById('agent-calls');
  const agentAht = document.getElementById('agent-aht');
  const agentNps = document.getElementById('agent-nps');
  const agentTransfer = document.getElementById('agent-transfer');
  const agentHold = document.getElementById('agent-hold');

  if (agentQuality) agentQuality.textContent = avgQuality + '%';
  if (agentCalls) agentCalls.textContent = todayCalls.length;
  if (agentAht) agentAht.textContent = formatDuration(avgHandleTime);
  if (agentNps) agentNps.textContent = avgNps !== null ? (avgNps > 0 ? '+' : '') + avgNps : '-';
  if (agentTransfer) agentTransfer.textContent = transferRate + '%';
  if (agentHold) agentHold.textContent = formatDuration(avgHoldTime);
}

function updateSentimentChart(positive, neutral, negative) {
  const ctx = document.getElementById('sentimentChart').getContext('2d');

  if (sentimentChart) {
    sentimentChart.destroy();
  }

  sentimentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        data: [positive, neutral, negative],
        backgroundColor: ['#10B981', '#9CA3AF', '#EF4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      cutout: '60%'
    }
  });
}

function updateOutcomesChart(leads, bookings, escalations, info) {
  const ctx = document.getElementById('outcomesChart')?.getContext('2d');
  if (!ctx) return;

  if (outcomesChart) {
    outcomesChart.destroy();
  }

  outcomesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Leads', 'Bookings', 'Escalations', 'Info'],
      datasets: [{
        data: [leads, bookings, escalations, info],
        backgroundColor: ['#10B981', '#3B82F6', '#EF4444', '#9CA3AF'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function updateCsatChart(calls) {
  const ctx = document.getElementById('csatChart')?.getContext('2d');
  if (!ctx) return;

  if (csatChart) {
    csatChart.destroy();
  }

  // Count CSAT scores
  const csatCounts = [0, 0, 0, 0, 0]; // 1-5
  calls.forEach(c => {
    if (c.csat_score >= 1 && c.csat_score <= 5) {
      csatCounts[c.csat_score - 1]++;
    }
  });

  csatChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1', '2', '3', '4', '5'],
      datasets: [{
        data: csatCounts,
        backgroundColor: ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#10B981'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { title: { display: true, text: 'CSAT Score' } }
      }
    }
  });
}

function updateHourlyChart(calls) {
  const ctx = document.getElementById('hourlyChart')?.getContext('2d');
  if (!ctx) return;

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  // Group calls by hour
  const hourCounts = new Array(24).fill(0);
  const today = new Date().toDateString();

  calls.forEach(call => {
    const callDate = new Date(call.started_at);
    if (callDate.toDateString() === today) {
      const hour = callDate.getHours();
      hourCounts[hour]++;
    }
  });

  // Find peak hour
  const maxCalls = Math.max(...hourCounts);
  const peakHour = hourCounts.indexOf(maxCalls);
  const peakLabel = document.getElementById('peak-hour-label');
  if (peakLabel && maxCalls > 0) {
    peakLabel.textContent = `Peak: ${peakHour}:00 - ${peakHour + 1}:00 (${maxCalls} calls)`;
  }

  // Generate labels for 24 hours (showing every 3rd hour for cleaner display)
  const labels = [];
  for (let i = 0; i < 24; i++) {
    labels.push(i.toString().padStart(2, '0') + ':00');
  }

  hourlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: hourCounts,
        backgroundColor: hourCounts.map((_, i) => i === peakHour ? '#E31837' : '#93C5FD'),
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: {
          ticks: {
            maxRotation: 0,
            callback: function(value, index) {
              // Show every 3rd hour
              return index % 3 === 0 ? this.getLabelForValue(value) : '';
            }
          }
        }
      }
    }
  });
}

function updateKeywordsCloud(calls) {
  const keywordCounts = {};
  calls.forEach(call => {
    (call.keywords_detected || []).forEach(kw => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
  });

  const sorted = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const container = document.getElementById('keywords-cloud');
  if (!container) return;

  if (sorted.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No keywords detected</p>';
    return;
  }

  const maxCount = sorted[0][1];
  container.innerHTML = sorted.map(([keyword, count]) => {
    const size = Math.max(0.75, Math.min(1.25, count / maxCount + 0.5));
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800', 'bg-pink-100 text-pink-800'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `<span class="px-2 py-1 rounded ${color} text-xs font-medium" style="font-size: ${size}rem">${keyword}</span>`;
  }).join('');
}

function updateTopTopics(calls) {
  const topicCounts = {};
  calls.forEach(call => {
    (call.topics || []).forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const sorted = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('top-topics');
  if (sorted.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No data yet</p>';
    return;
  }

  const maxCount = sorted[0][1];
  container.innerHTML = sorted.map(([topic, count]) => `
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-600 w-24 capitalize">${topic.replace(/_/g, ' ')}</span>
      <div class="flex-1 bg-gray-200 rounded-full h-2">
        <div class="bg-tvs-red h-2 rounded-full" style="width: ${(count / maxCount) * 100}%"></div>
      </div>
      <span class="text-sm font-medium text-gray-900 w-8">${count}</span>
    </div>
  `).join('');
}

function updateTopModels(calls) {
  const modelCounts = {};
  calls.forEach(call => {
    (call.models_discussed || []).forEach(model => {
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });
  });

  const sorted = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('top-models');
  if (sorted.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No data yet</p>';
    return;
  }

  const maxCount = sorted[0][1];
  container.innerHTML = sorted.map(([model, count]) => `
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-600 flex-1">${model}</span>
      <div class="w-24 bg-gray-200 rounded-full h-2">
        <div class="bg-blue-500 h-2 rounded-full" style="width: ${(count / maxCount) * 100}%"></div>
      </div>
      <span class="text-sm font-medium text-gray-900 w-8">${count}</span>
    </div>
  `).join('');
}

// ============ TAB RENDERING ============

function switchConversationTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-tvs-red', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-700');
  });
  document.getElementById(`tab-${tab}`).classList.remove('bg-gray-100', 'text-gray-700');
  document.getElementById(`tab-${tab}`).classList.add('bg-tvs-red', 'text-white');

  // Load content
  loadTabContent(tab);
}

async function loadTabContent(tab) {
  const container = document.getElementById('content-container');
  container.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-red"></div>
    </div>
  `;

  switch (tab) {
    case 'calls':
      await renderCallLogsTable();
      break;
    case 'leads':
      await renderLeadsTable();
      break;
    case 'escalations':
      await renderEscalationsTable();
      break;
  }
}

async function renderCallLogsTable() {
  const filters = getFilters();
  const calls = await fetchCallLogs(filters);
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Call Logs (${calls.length})</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sentiment</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${calls.length === 0 ? `
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">
                No call logs found. Start conversations to see data here!
              </td>
            </tr>
          ` : calls.map(call => `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDateTime(call.started_at)}
              </td>
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900">${call.customer_name || 'Unknown'}</div>
                <div class="text-xs text-gray-500">${call.customer_phone || '-'}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDuration(call.duration_seconds)}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                ${getSentimentBadge(call.sentiment, call.sentiment_score)}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 max-w-xs">
                ${(call.topics || []).slice(0, 3).map(t => `
                  <span class="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-1 mb-1">${t}</span>
                `).join('')}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                ${getOutcomeBadge(call.outcome)}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <button onclick="viewCallDetails('${call.id}')" class="text-blue-600 hover:text-blue-800">
                  View Details
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function renderLeadsTable() {
  const leadsData = await fetchLeads();
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Leads (${leadsData.length})</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Interested</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Level</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${leadsData.length === 0 ? `
            <tr>
              <td colspan="8" class="px-4 py-12 text-center text-gray-500">
                No leads yet. Leads are automatically extracted from conversations.
              </td>
            </tr>
          ` : leadsData.map(lead => `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-4">
                <div class="text-sm font-medium text-gray-900">${lead.customer_name}</div>
                <div class="text-xs text-gray-500">${lead.customer_phone || '-'}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                ${lead.model_interested || '-'}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${lead.customer_city || '-'}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                ${getInterestBadge(lead.interest_level)}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full ${lead.lead_score >= 70 ? 'bg-green-500' : lead.lead_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: ${lead.lead_score}%"></div>
                  </div>
                  <span class="text-sm text-gray-600">${lead.lead_score}</span>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                ${getStatusBadge(lead.status)}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(lead.created_at)}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <button onclick="viewLeadDetails('${lead.id}')" class="text-blue-600 hover:text-blue-800 mr-2">View</button>
                <button onclick="updateLeadStatus('${lead.id}')" class="text-green-600 hover:text-green-800">Update</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function renderEscalationsTable() {
  const escalatedCalls = callLogs.filter(c => c.outcome === 'escalated');
  const callbacks = await fetchCallbacks();
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-800">Escalations & Callbacks (${escalatedCalls.length + callbacks.length})</h2>
    </div>

    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Escalated Calls</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-red-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Date/Time</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Customer</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Reason</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Summary</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-red-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${escalatedCalls.length === 0 ? `
              <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                  No escalated calls
                </td>
              </tr>
            ` : escalatedCalls.map(call => `
              <tr class="hover:bg-red-50">
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${formatDateTime(call.started_at)}
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">${call.customer_name || 'Unknown'}</div>
                  <div class="text-xs text-gray-500">${call.customer_phone || '-'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${call.call_type || 'Escalation'}
                </td>
                <td class="px-4 py-4 text-sm text-gray-500 max-w-md truncate">
                  ${call.summary || '-'}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm">
                  <button onclick="viewCallDetails('${call.id}')" class="text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Callback Requests</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-yellow-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Customer</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Reason</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Priority</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-yellow-700 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${callbacks.length === 0 ? `
              <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                  No callback requests
                </td>
              </tr>
            ` : callbacks.map(cb => `
              <tr class="hover:bg-yellow-50">
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${formatDateTime(cb.created_at)}
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">${cb.customer_name || 'Unknown'}</div>
                  <div class="text-xs text-gray-500">${cb.customer_phone || '-'}</div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-500">
                  ${cb.reason || '-'}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  ${getPriorityBadge(cb.priority)}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  ${getStatusBadge(cb.status)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============ MODALS ============

async function viewCallDetails(callId) {
  const call = callLogs.find(c => c.id === callId);
  if (!call) return;

  const modal = document.getElementById('call-modal');
  const content = document.getElementById('call-modal-content');

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header Info -->
      <div class="flex items-start justify-between">
        <div>
          <h4 class="text-lg font-semibold text-gray-900">${call.customer_name || 'Unknown Customer'}</h4>
          <p class="text-sm text-gray-500">${call.customer_phone || 'No phone'} | ${call.customer_city || 'Unknown city'}</p>
        </div>
        ${getSentimentBadge(call.sentiment, call.sentiment_score)}
      </div>

      <!-- Call Info Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Date & Time</p>
          <p class="font-medium">${formatDateTime(call.started_at)}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Duration</p>
          <p class="font-medium">${formatDuration(call.duration_seconds)}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Call Type</p>
          <p class="font-medium capitalize">${call.call_type || 'Inquiry'}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500">Outcome</p>
          <p class="font-medium">${getOutcomeBadge(call.outcome)}</p>
        </div>
      </div>

      <!-- Topics & Models -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 class="text-sm font-semibold text-gray-700 mb-2">Topics Discussed</h5>
          <div class="flex flex-wrap gap-2">
            ${(call.topics || []).map(t => `
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">${t}</span>
            `).join('') || '<span class="text-gray-400">None</span>'}
          </div>
        </div>
        <div>
          <h5 class="text-sm font-semibold text-gray-700 mb-2">Models Discussed</h5>
          <div class="flex flex-wrap gap-2">
            ${(call.models_discussed || []).map(m => `
              <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${m}</span>
            `).join('') || '<span class="text-gray-400">None</span>'}
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div>
        <h5 class="text-sm font-semibold text-gray-700 mb-2">Summary</h5>
        <p class="text-gray-600 bg-gray-50 rounded-lg p-4">${call.summary || 'No summary available'}</p>
      </div>

      <!-- Key Points -->
      ${call.key_points && call.key_points.length > 0 ? `
        <div>
          <h5 class="text-sm font-semibold text-gray-700 mb-2">Key Points</h5>
          <ul class="list-disc list-inside space-y-1 text-gray-600">
            ${call.key_points.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Actions Taken -->
      ${call.actions_taken && call.actions_taken.length > 0 ? `
        <div>
          <h5 class="text-sm font-semibold text-gray-700 mb-2">Actions Taken</h5>
          <div class="flex flex-wrap gap-2">
            ${call.actions_taken.map(a => `
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${a.replace(/_/g, ' ')}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Follow-up -->
      ${call.follow_up_required ? `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 class="text-sm font-semibold text-yellow-800 mb-1">Follow-up Required</h5>
          <p class="text-sm text-yellow-700">${call.follow_up_notes || 'No notes'}</p>
          ${call.follow_up_date ? `<p class="text-xs text-yellow-600 mt-1">Due: ${formatDate(call.follow_up_date)}</p>` : ''}
        </div>
      ` : ''}

      <!-- Sentiment Score -->
      <div>
        <h5 class="text-sm font-semibold text-gray-700 mb-2">Sentiment Analysis</h5>
        <div class="flex items-center gap-4">
          <div class="flex-1 bg-gray-200 rounded-full h-3">
            <div class="h-3 rounded-full ${call.sentiment === 'positive' ? 'bg-green-500' : call.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'}"
                 style="width: ${((call.sentiment_score + 1) / 2) * 100}%"></div>
          </div>
          <span class="text-sm font-medium ${call.sentiment === 'positive' ? 'text-green-600' : call.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'}">
            ${(call.sentiment_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function viewLeadDetails(leadId) {
  // Similar to viewCallDetails but for leads
  showToast('Lead details view coming soon!', 'info');
}

function updateLeadStatus(leadId) {
  showToast('Lead status update coming soon!', 'info');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// ============ HELPERS ============

function getFilters() {
  return {
    date: document.getElementById('filter-date')?.value || 'week',
    sentiment: document.getElementById('filter-sentiment')?.value || 'all',
    outcome: document.getElementById('filter-outcome')?.value || 'all'
  };
}

function applyFilters() {
  loadTabContent(currentTab);
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getSentimentBadge(sentiment, score) {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800'
  };
  const icons = {
    positive: '😊',
    neutral: '😐',
    negative: '😟'
  };
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${colors[sentiment] || colors.neutral}">
    ${icons[sentiment] || ''} ${sentiment || 'neutral'} ${score ? `(${(score * 100).toFixed(0)}%)` : ''}
  </span>`;
}

function getOutcomeBadge(outcome) {
  const config = {
    lead_generated: { color: 'bg-green-100 text-green-800', label: 'Lead Generated' },
    booking_made: { color: 'bg-blue-100 text-blue-800', label: 'Booking Made' },
    escalated: { color: 'bg-red-100 text-red-800', label: 'Escalated' },
    info_provided: { color: 'bg-gray-100 text-gray-800', label: 'Info Provided' },
    dropped: { color: 'bg-yellow-100 text-yellow-800', label: 'Dropped' }
  };
  const c = config[outcome] || config.info_provided;
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${c.color}">${c.label}</span>`;
}

function getInterestBadge(level) {
  const config = {
    hot: { color: 'bg-red-100 text-red-800', icon: '🔥' },
    warm: { color: 'bg-yellow-100 text-yellow-800', icon: '⭐' },
    cold: { color: 'bg-blue-100 text-blue-800', icon: '❄️' }
  };
  const c = config[level] || config.warm;
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${c.color}">${c.icon} ${level}</span>`;
}

function getStatusBadge(status) {
  const config = {
    new: { color: 'bg-blue-100 text-blue-800' },
    contacted: { color: 'bg-yellow-100 text-yellow-800' },
    qualified: { color: 'bg-green-100 text-green-800' },
    converted: { color: 'bg-purple-100 text-purple-800' },
    lost: { color: 'bg-gray-100 text-gray-800' },
    pending: { color: 'bg-yellow-100 text-yellow-800' },
    resolved: { color: 'bg-green-100 text-green-800' }
  };
  const c = config[status] || config.new;
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${c.color} capitalize">${status}</span>`;
}

function getPriorityBadge(priority) {
  const config = {
    urgent: { color: 'bg-red-100 text-red-800' },
    high: { color: 'bg-orange-100 text-orange-800' },
    normal: { color: 'bg-blue-100 text-blue-800' },
    low: { color: 'bg-gray-100 text-gray-800' }
  };
  const c = config[priority] || config.normal;
  return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${c.color} capitalize">${priority}</span>`;
}

function exportData() {
  const data = currentTab === 'calls' ? callLogs : leads;
  if (data.length === 0) {
    showToast('No data to export', 'error');
    return;
  }

  // Convert to CSV
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (Array.isArray(val)) return `"${val.join('; ')}"`;
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return val || '';
    }).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tvs-${currentTab}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Data exported successfully!', 'success');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${bgColor} z-50 transform transition-all duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for Supabase to be ready
  setTimeout(async () => {
    await loadMetrics();
    await loadTabContent('calls');
  }, 500);
});
