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
let currentThemeColor = '#666';

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

function fetchData() {
    console.log("Fetching data...");
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            rawData = data;
            renderDashboard();
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            dom.history.innerHTML = '<div style="text-align:center; padding:20px;">Error Loading Data</div>';
        });
}

function filterSessions() {
    if (!rawData || rawData.length === 0) return [];
    return rawData.filter(row => {
        if (!row[1]) return false;
        return row[1].toString().toUpperCase() === currentUser.toUpperCase();
    });
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
        const matchSessions = sessions.filter(row => {
            const rowDate = new Date(row[0]);
            return rowDate.toDateString() === targetDate.toDateString();
        });
        const seconds = matchSessions.reduce((acc, row) => acc + Number(row[2]), 0);
        return Math.floor(seconds / 60);
    });

    if (myMainChart) myMainChart.destroy();

    const context = ctx.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, themeColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

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
                pointRadius: 0,
                pointHitRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#222' }, ticks: { color: '#666' } },
                x: { grid: { display: false }, ticks: { color: '#666' } }
            }
        }
    });
}

// 2. DAILY / HOURLY DISTRIBUTION
function renderDistChart(sessions) {
    const ctx = document.getElementById('distChart');
    if (!ctx) return;

    let labels = [];
    let dataPoints = [];
    let labelString = "Total Minutes"; // Tooltip label

    if (distMode === 'daily') {
        // DAILY: Sum of Minutes
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = [0, 0, 0, 0, 0, 0, 0];

        sessions.forEach(row => {
            const date = new Date(row[0]);
            const dayIndex = (date.getDay() + 6) % 7;
            const mins = Math.floor(Number(row[2]) / 60);
            dataPoints[dayIndex] += mins;
        });

    } else {
        // HOURLY: Percentage of Total Sessions (Habit Tracking)
        labelString = "% of Sessions";
        labels = Array.from({ length: 24 }, (_, i) => i); // 0-23
        const counts = new Array(24).fill(0);
        const total = sessions.length;

        sessions.forEach(row => {
            const date = new Date(row[0]);
            const hour = date.getHours();
            counts[hour]++;
        });

        // Convert counts to percentages
        if (total > 0) {
            dataPoints = counts.map(c => ((c / total) * 100).toFixed(1));
        } else {
            dataPoints = counts;
        }
    }

    if (myDistChart) myDistChart.destroy();

    myDistChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: labelString,
                data: dataPoints,
                backgroundColor: currentThemeColor,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#666',
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

    // Define Buckets
    // 0: < 5 mins
    // 1: 5 - 10 mins
    // 2: 10 - 15 mins
    // 3: 15 - 20 mins
    // 4: 20 - 30 mins
    // 5: 30 - 45 mins
    // 6: 45 - 60 mins
    // 7: > 60 mins
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

    // Convert to Percentages of Total Time
    const percentages = bucketSums.map(sum => totalMinutes > 0 ? ((sum / totalMinutes) * 100).toFixed(1) : 0);

    if (myDurationChart) myDurationChart.destroy();

    myDurationChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '% of Total Time',
                data: percentages,
                backgroundColor: currentThemeColor,
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.6 // Make bars slightly thinner
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // MAKES IT HORIZONTAL!
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    display: false, // Hide X axis (Percentage)
                    max: 100
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: '#888',
                        font: { size: 11, weight: 'bold' }
                    }
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