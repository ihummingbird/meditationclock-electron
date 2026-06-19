// *** CONFIGURATION ***
const API_URL = 'https://script.google.com/macros/s/AKfycbwHCfHaBJFXXyvASFf5x5Iy0OCiQLD38hsW4_gOGiWdiJPIURBcFovTVvDN7qShd6R5AA/exec';

// DOM Elements
const dom = {
    username: document.getElementById('username-display'),
    rank: document.getElementById('rank-badge'),
    search: document.getElementById('user-search'),
    history: document.getElementById('history-list'),
    profileCard: document.querySelector('.profile-card'),
    btnDaily: document.getElementById('btn-daily'),
    btnHourly: document.getElementById('btn-hourly')
    
};

// App State
let currentUser = localStorage.getItem('meditation_user') || 'HUMMINGBIRD';
let rawData = [];
let myMainChart = null;
let myDistChart = null;
let myDurationChart = null; // New Chart
let distMode = 'hourly'; // Changed default to HOURLY
let distRange = 'all'; // time range for Distribution chart
let durRange = 'all';  // time range for Session Length chart
let currentThemeColor = '#666';
let currentRequestId = 0;


// Init
dom.username.innerText = currentUser;
setupEventListeners();
updateToggleUI(); // Ensure UI matches default state
fetchData();

function setupEventListeners() {
    dom.username.addEventListener('click', () => {
        dom.username.style.display = 'none';
        dom.search.style.display = 'block';
        dom.search.value = currentUser;
        dom.search.focus();
    });
    dom.search.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmSearch();
    });
    dom.search.addEventListener('blur', () => confirmSearch());

    dom.btnDaily.addEventListener('click', () => {
        distMode = 'daily';
        updateToggleUI();
        const sessions = filterSessions();
        renderDistChart(sessions);
    });

    dom.btnHourly.addEventListener('click', () => {
        distMode = 'hourly';
        updateToggleUI();
        const sessions = filterSessions();
        renderDistChart(sessions);
    });

    // Range toggles for Distribution + Session Length
    document.querySelectorAll('.range-group').forEach(group => {
        group.addEventListener('click', (e) => {
            const btn = e.target.closest('.range-btn');
            if (!btn) return;
            group.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const range = btn.dataset.range;
            const sessions = filterSessions();
            if (group.dataset.target === 'dist') {
                distRange = range;
                renderDistChart(sessions);
            } else if (group.dataset.target === 'dur') {
                durRange = range;
                renderDurationChart(sessions);
            }
        });
    });

}

function updateToggleUI() {
    if (distMode === 'daily') {
        dom.btnDaily.classList.add('active');
        dom.btnHourly.classList.remove('active');
    } else {
        dom.btnHourly.classList.add('active');
        dom.btnDaily.classList.remove('active');
    }
}

function confirmSearch() {
    const val = dom.search.value.trim().toUpperCase();
    if (val && val !== currentUser) {
        currentUser = val;
        localStorage.setItem('meditation_user', currentUser);
        dom.username.innerText = currentUser;
        renderDashboard();
    }
    dom.search.style.display = 'none';
    dom.username.style.display = 'block';
}

// --- Connection retry state ---
let retryTimer = null;
let countdownTimer = null;
const RETRY_DELAY = 7000; // 7 seconds

function fetchData() {
    const reqId = ++currentRequestId;
    showStatus('Connecting…', false);

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            if (reqId !== currentRequestId) return; // stale response, ignore
            clearTimers();
            rawData = data;
            hideStatus();
            safeRender();          // render is OUTSIDE the catch now
        })
        .catch(err => {
            if (reqId !== currentRequestId) return;
            console.error("Fetch Error:", err);
            startRetry();
        });
}

// Render errors must NOT look like network failures.
function safeRender() {
    try {
        renderDashboard();
    } catch (e) {
        console.error("Render error (data downloaded fine):", e);
    }
}


function startRetry() {
    clearTimers();
    let remaining = Math.round(RETRY_DELAY / 1000);
    showStatus(`Connection failed. Retrying in ${remaining}s…`, true);

    countdownTimer = setInterval(() => {
        remaining--;
        const text = document.getElementById('status-text');
        if (remaining <= 0) {
            if (text) text.innerText = 'Reconnecting…';
            clearInterval(countdownTimer);
        } else if (text) {
            text.innerText = `Connection failed. Retrying in ${remaining}s…`;
        }
    }, 1000);

    retryTimer = setTimeout(fetchData, RETRY_DELAY);
}

function clearTimers() {
    if (retryTimer) clearTimeout(retryTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    retryTimer = null;
    countdownTimer = null;
}

function showStatus(msg, isError) {
    const banner = document.getElementById('status-banner');
    const text = document.getElementById('status-text');
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.classList.toggle('error', !!isError);
    if (text) text.innerText = msg;
    // Tap the banner to retry immediately
    banner.onclick = () => { clearTimers(); fetchData(); };
}

function hideStatus() {
    const banner = document.getElementById('status-banner');
    if (banner) banner.classList.add('hidden');
}


function filterSessions() {
    if (!rawData || rawData.length === 0) return [];
    return rawData.filter(row => {
        if (!row[1]) return false;
        return row[1].toString().toUpperCase() === currentUser.toUpperCase();
    });
}

// Filter sessions to a rolling time window: 'all' | '3m' | '1m' | '1w'
function filterByRange(sessions, range) {
    if (range === 'all') return sessions;
    const now = new Date();
    const cutoff = new Date(now);
    if (range === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (range === '1m') cutoff.setMonth(now.getMonth() - 1);
    else if (range === '1w') cutoff.setDate(now.getDate() - 7);
    return sessions.filter(row => new Date(row[0]) >= cutoff);
}


function renderDashboard() {
    const mySessions = filterSessions();
    if (mySessions.length === 0) return;

    // METRICS
    const totalCount = mySessions.length;
    const totalSeconds = mySessions.reduce((acc, row) => acc + Number(row[2]), 0);
    const hours = (totalSeconds / 3600).toFixed(1);

    // RANK
    let rank = "NOVICE";
    currentThemeColor = "#666";

    if (hours > 5) { rank = "APPRENTICE"; currentThemeColor = "#fff"; }
    if (hours > 20) { rank = "ADEPT"; currentThemeColor = "#4caf50"; }
    if (hours > 50) { rank = "EXPERT"; currentThemeColor = "#00bcd4"; }
    if (hours > 100) { rank = "MASTER"; currentThemeColor = "#a855f7"; }
    if (hours > 500) { rank = "ZEN LEGEND"; currentThemeColor = "#ff9800"; }

    // STREAK 
    const uniqueDays = [...new Set(mySessions.map(row => new Date(row[0]).toDateString()))].length;

    // UPDATE DOM
    document.getElementById('total-hours').innerText = hours;
    document.getElementById('total-sessions').innerText = totalCount;
    let avgMins = 0;
    if (totalCount > 0) avgMins = Math.floor((totalSeconds / totalCount) / 60);
    document.getElementById('avg-time').innerText = avgMins + "m";
    document.getElementById('longest-streak').innerText = uniqueDays;

    dom.rank.innerText = rank;
    dom.rank.style.color = currentThemeColor;
    dom.profileCard.style.borderColor = currentThemeColor;

    renderMainChart(mySessions, currentThemeColor);
    renderDistChart(mySessions);
    renderDurationChart(mySessions); // NEW CHART CALL
    renderDailyScroller(mySessions, currentThemeColor);
    renderHeatmap(mySessions, currentThemeColor); // NEW CALL
    renderHistory(mySessions);
    renderProgress(mySessions);   // was renderHighlights(mySessions);

}

// 1. MAIN CHART (Last 7 Days Trend)
function renderMainChart(sessions, themeColor) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    const last7Days = [];
    const labels = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    const dailyMinutes = last7Days.map(targetDate => {
        const matchSessions = sessions.filter(row =>
            new Date(row[0]).toDateString() === targetDate.toDateString()
        );
        const seconds = matchSessions.reduce((acc, row) => acc + Number(row[2]), 0);
        return Math.floor(seconds / 60);
    });

    if (myMainChart) myMainChart.destroy();

    const context = ctx.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, themeColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    // Draws the minute value above each data point
    const valueLabels = {
        id: 'valueLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            const data = chart.data.datasets[0].data;
            ctx.save();
            ctx.font = "bold 10px Inter, sans-serif";
            ctx.fillStyle = "#bbb";
            ctx.textAlign = "center";
            meta.data.forEach((pt, i) => {
                if (data[i] > 0) ctx.fillText(data[i] + 'm', pt.x, pt.y - 9);
            });
            ctx.restore();
        }
    };

    myMainChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Minutes',
                data: dailyMinutes,
                backgroundColor: gradient,
                borderColor: themeColor,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: themeColor,
                pointHitRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 18 } },
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#222' }, ticks: { color: '#666' } },
                x: { grid: { display: false }, ticks: { color: '#666' } }
            }
        },
        plugins: [valueLabels]
    });
}



// 2. DAILY / HOURLY DISTRIBUTION
function renderDistChart(sessions) {
    const ctx = document.getElementById('distChart');
    if (!ctx) return;
    sessions = filterByRange(sessions, distRange);

    let labels = [];
    let dataPoints = [];
    let labelString = "Total Minutes";

    if (distMode === 'daily') {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = [0, 0, 0, 0, 0, 0, 0];
        sessions.forEach(row => {
            const date = new Date(row[0]);
            const dayIndex = (date.getDay() + 6) % 7;
            dataPoints[dayIndex] += Math.floor(Number(row[2]) / 60);
        });
    } else {
        labelString = "% of Sessions";
        labels = Array.from({ length: 24 }, (_, i) => i);
        const counts = new Array(24).fill(0);
        const total = sessions.length;
        sessions.forEach(row => counts[new Date(row[0]).getHours()]++);
        dataPoints = total > 0
            ? counts.map(c => Number(((c / total) * 100).toFixed(1)))
            : counts;
    }

    const context = ctx.getContext('2d');

    // Pretty vertical gradient fill for the bars
    const grad = context.createLinearGradient(0, 0, 0, 180);
    grad.addColorStop(0, currentThemeColor);
    grad.addColorStop(1, currentThemeColor + '33');

    const maxVal = Math.max(...dataPoints.map(Number), 1);


        // MORPH: if the chart already exists, just update its data → animated transition
    if (myDistChart) {
        myDistChart.data.labels = labels;
        myDistChart.data.datasets[0].data = dataPoints.map(() => maxVal); // ghost
        myDistChart.data.datasets[1].data = dataPoints;                   // real
        myDistChart.data.datasets[1].label = labelString;
        myDistChart.data.datasets[1].backgroundColor = grad;
        myDistChart.options.scales.y.max = maxVal;
        myDistChart.update();
        return;
    }

    myDistChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '_ghost',
                    data: dataPoints.map(() => maxVal),
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.9,
                    categoryPercentage: 0.8,
                    order: 2
                },
                {
                    label: labelString,
                    data: dataPoints,
                    backgroundColor: grad,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.9,
                    categoryPercentage: 0.8,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: item => item.dataset.label !== '_ghost',
                    backgroundColor: '#000',
                    borderColor: '#333',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: items => distMode === 'daily'
                            ? items[0].label
                            : items[0].label + ':00',
                        label: item => distMode === 'daily'
                            ? item.parsed.y + ' min'
                            : item.parsed.y + '% of sessions'
                    }
                }
            },
            scales: {
                y: { display: false, max: maxVal, stacked: false },
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        color: '#666',
                        font: { size: 10 },
                        callback: function (val, index) {
                            if (distMode === 'daily') return this.getLabelForValue(val);
                            if (index % 4 === 0) return index + 'h';
                            return '';
                        }
                    }
                }
            }
        }
    });

}


// 3. RECORD DURATION DISTRIBUTION (New!)
function renderDurationChart(sessions) {
    const ctx = document.getElementById('durationChart');
    if (!ctx) return;
    sessions = filterByRange(sessions, durRange);

    const bucketSums = [0, 0, 0, 0, 0, 0, 0, 0];
    const labels = ["< 5m", "5-10m", "10-15m", "15-20m", "20-30m", "30-45m", "45-60m", "> 60m"];
    let totalMinutes = 0;

    sessions.forEach(row => {
        const mins = Number(row[2]) / 60;
        totalMinutes += mins;
        if (mins < 5) bucketSums[0] += mins;
        else if (mins < 10) bucketSums[1] += mins;
        else if (mins < 15) bucketSums[2] += mins;
        else if (mins < 20) bucketSums[3] += mins;
        else if (mins < 30) bucketSums[4] += mins;
        else if (mins < 45) bucketSums[5] += mins;
        else if (mins < 60) bucketSums[6] += mins;
        else bucketSums[7] += mins;
    });

    const percentages = bucketSums.map(sum =>
        totalMinutes > 0 ? Number(((sum / totalMinutes) * 100).toFixed(1)) : 0);

    const context = ctx.getContext('2d');

    // Horizontal gradient for the bars
    const grad = context.createLinearGradient(0, 0, ctx.width || 400, 0);
    grad.addColorStop(0, currentThemeColor + '55');
    grad.addColorStop(1, currentThemeColor);


        // MORPH: update existing chart instead of rebuilding
    if (myDurationChart) {
        myDurationChart.data.labels = labels;
        myDurationChart.data.datasets[0].data = percentages.map(() => 100); // ghost
        myDurationChart.data.datasets[1].data = percentages;                // real
        myDurationChart.data.datasets[1].backgroundColor = grad;
        myDurationChart.update();
        return;
    }

    myDurationChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '_ghost',
                    data: percentages.map(() => 100),
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    order: 2
                },
                {
                    label: '% of Total Time',
                    data: percentages,
                    backgroundColor: grad,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.7,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: item => item.dataset.label !== '_ghost',
                    backgroundColor: '#000',
                    borderColor: '#333',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: item => item.parsed.x + '% of total time'
                    }
                }
            },
            scales: {
                x: { display: false, max: 100, stacked: false },
                y: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#888', font: { size: 11, weight: 'bold' } }
                }
            }
        }
    });

}


// 5. DAILY HISTORY SCROLLER (NEW!)
function renderDailyScroller(sessions, color) {
    const container = document.getElementById('day-scroller');
    if (!container) return;
    container.innerHTML = '';

    // Determine range: 365 days back from today
    const daysToRender = 365;
    const today = new Date();

    // Create Map of 'YYYY-MM-DD' -> total minutes
    const activityMap = new Map();
    let maxDailyMins = 0;

    sessions.forEach(row => {
        const dateStr = new Date(row[0]).toDateString();
        const mins = Math.floor(Number(row[2]) / 60);
        const newTotal = (activityMap.get(dateStr) || 0) + mins;
        activityMap.set(dateStr, newTotal);
        if (newTotal > maxDailyMins) maxDailyMins = newTotal;
    });

    if (maxDailyMins === 0) maxDailyMins = 60; // Default scale if no data

    for (let i = daysToRender; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toDateString();
        const mins = activityMap.get(dateStr) || 0;

        // Wrapper Column
        const col = document.createElement('div');
        col.className = 'day-col';
        col.title = `${dateStr}: ${mins} min`;

        // Bar
        const barHeight = Math.min((mins / maxDailyMins) * 100, 100); // Max 100px height
        const bar = document.createElement('div');
        bar.className = 'day-bar';
        bar.style.height = `${barHeight}px`;
        if (mins > 0) {
            bar.style.backgroundColor = color;
            bar.style.opacity = 0.5; // Slight transparency
        }

        // Tile
        const tile = document.createElement('div');
        tile.className = 'day-tile';
        if (mins > 0) {
            tile.classList.add('has-data');
            // If significant activity (e.g. > 10m), make it active/colored
            if (mins > 10) {
                tile.classList.add('active');
                tile.style.backgroundColor = color + '22'; // 22 is hex alpha ~13%
                tile.style.borderColor = color;
                tile.style.color = color;
                // Bar becomes solid if active
                bar.style.opacity = 0.8;
            }
        }

        const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
        const dayNum = d.getDate();

        tile.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-num">${dayNum}</span>
            <span class="day-mins">${mins > 0 ? mins + 'm' : ''}</span>
        `;


        col.appendChild(bar);
        col.appendChild(tile);
        container.appendChild(col);
    }

    // Auto-scroll to end (Today)
    requestAnimationFrame(() => {
        container.scrollLeft = container.scrollWidth;
    });
}

// 6. ACTIVITY HEATMAP (GitHub Style)
function renderHeatmap(sessions, color) {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;
    container.innerHTML = '';

    // 1. Map Data
    const activityMap = new Map();
    sessions.forEach(row => {
        const dateStr = new Date(row[0]).toDateString();
        const mins = Math.floor(Number(row[2]) / 60);
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + mins);
    });

    // 2. Determine Date Range (Past 52 weeks approx, start on Sunday)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 365);

    // Adjust start date to previous Sunday to align grid rows correctly
    // Day: 0 (Sun) ... 6 (Sat)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Loop until today
    const d = new Date(startDate);
    while (d <= today) {
        const dateStr = d.toDateString();
        const mins = activityMap.get(dateStr) || 0;

        const cell = document.createElement('div');
        cell.className = 'heatmap-day';
        cell.title = `${dateStr}: ${mins} min`;

        if (mins > 0) {
            // Calculate Intensity
            // Lvl 1: 1-15m, Lvl 2: 15-30m, Lvl 3: 30-60m, Lvl 4: >60m
            let opacity = 0.3;
            if (mins > 15) opacity = 0.5;
            if (mins > 30) opacity = 0.7;
            if (mins > 60) opacity = 1.0;

            // Convert Hex Color to RGB to apply Opacity? 
            // Or just use hex with opacity if supported. 
            // Assuming color is hex like #ffffff or #00bcd4.
            // Let's manually reconstruct color with opacity if strictly hex.
            // Or use style.opacity (but valid hex background is needed).

            cell.style.backgroundColor = color;
            cell.style.opacity = opacity;
        }

        container.appendChild(cell);

        // Next Day
        d.setDate(d.getDate() + 1);
    }

    // Scroll to end
    requestAnimationFrame(() => {
        container.scrollLeft = container.scrollWidth;
    });
}

// 4. HISTORY
function renderHistory(sessions) {
    dom.history.innerHTML = '';

    if (sessions.length === 0) {
        dom.history.innerHTML = '<div style="text-align:center; color:#444; margin-top:10px;">No sessions found.</div>';
        return;
    }

    // Show last 5
    [...sessions].reverse().slice(0, 5).forEach(row => {
        const div = document.createElement('div');
        div.className = 'history-item';

        const dateObj = new Date(row[0]);
        const datePart = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timePart = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const prettyString = `${datePart} • ${timePart}`;

        const mins = Math.floor(row[2] / 60);
        const secs = row[2] % 60;

        div.innerHTML = `
            <span class="date">${prettyString}</span>
            <span class="duration">${mins}m ${secs}s</span>
        `;
        dom.history.appendChild(div);
    });
}




// PROGRESS STATS (replaces renderHighlights)
function renderProgress(sessions) {
    if (!sessions.length) return;

    const now = new Date();
    const mins = row => Number(row[2]) / 60;

    // 7-day window starts at 00:00, 6 days ago (today included = 7 days)
    const cutoff7 = new Date(now);
    cutoff7.setDate(now.getDate() - 6);
    cutoff7.setHours(0, 0, 0, 0);

    // Previous 7-day window (days 8–14 ago)
    const cutoff14 = new Date(now);
    cutoff14.setDate(now.getDate() - 13);
    cutoff14.setHours(0, 0, 0, 0);

    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthRef = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthRef.getMonth();
    const lastMonthYear = lastMonthRef.getFullYear();

    const monthDays = new Set();
    const lastMonthDays = new Set();
    let thisWeekMins = 0, lastWeekMins = 0;
    let thisMonthMins = 0, lastMonthMins = 0;
    let week7Mins = 0, sessionsWeek = 0;

    sessions.forEach(row => {
        const d = new Date(row[0]);
        const m = mins(row);

        // Rolling 7-day + sessions this week
        if (d >= cutoff7) {
            week7Mins += m;
            thisWeekMins += m;
            sessionsWeek++;
        } else if (d >= cutoff14) {
            lastWeekMins += m;
        }

        // Monthly buckets
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
            thisMonthMins += m;
            monthDays.add(d.toDateString());
        } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
            lastMonthMins += m;
            lastMonthDays.add(d.toDateString());
        }
    });

    // Days this month
    document.getElementById('days-this-month').innerText = monthDays.size;
    document.getElementById('days-this-month-sub').innerText = 'last: ' + lastMonthDays.size;

    // Rolling 7-day average (per day)
    document.getElementById('avg-7day').innerText = Math.round(week7Mins / 7) + 'm';

    // Sessions this week
    document.getElementById('sessions-week').innerText = sessionsWeek;

    // This week vs last week
    setCompare('week-compare', 'week-compare-sub', thisWeekMins, lastWeekMins);

    // This month vs last month
    setCompare('month-compare', 'month-compare-sub', thisMonthMins, lastMonthMins);

    // Avg per day this month (vs last month)
    const avgThis = monthDays.size ? Math.round(thisMonthMins / monthDays.size) : 0;
    const avgLast = lastMonthDays.size ? Math.round(lastMonthMins / lastMonthDays.size) : 0;
    document.getElementById('avg-day-month').innerText = avgThis + 'm';
    document.getElementById('avg-day-month-sub').innerText = 'last: ' + avgLast + 'm';
}

function setCompare(numId, subId, current, previous) {
    document.getElementById(numId).innerText = Math.round(current) + 'm';
    const diff = Math.round(current - previous);
    const sub = document.getElementById(subId);
    if (diff > 0) {
        sub.innerText = '▲ ' + diff + 'm';
        sub.style.color = '#141414';
    } else if (diff < 0) {
        sub.innerText = '▼ ' + Math.abs(diff) + 'm';
        sub.style.color = '#141414';
    } else {
        sub.innerText = '— same';
        sub.style.color = '#141414';
    }
}





