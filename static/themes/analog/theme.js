window.ActiveTheme = {
    els: {},
    currentDateStr: '',

    settingsConfig: {
        tintColor: {
            type: 'palette',
            label: 'Accent Color',
            default: '#ff453a',
            options: [
                '#ff453a', // Red
                '#ff9f0a', // Orange
                '#30d158', // Green
                '#0a84ff', // Blue
                '#ffffff'  // White
            ]
        },
        // NEW: ZOOM SLIDER
        scale: {
            type: 'range',
            label: 'Size Zoom',
            default: 100, // 100%
            min: 50,
            max: 150,
            displaySuffix: '%'
        }
    },

    init: function(stage, savedSettings) {
        stage.innerHTML = `
            <div class="analog-container">
                <div class="clock-face" id="clock-face">
                    <div class="center-dot"></div>
                    <div class="hand hand-hour" id="hand-h"></div>
                    <div class="hand hand-minute" id="hand-m"></div>
                    <div class="hand hand-second" id="hand-s"></div>
                </div>

                <div class="calendar-widget">
                    <div class="cal-header" id="cal-month">MONTH</div>
                    <div class="cal-grid" id="cal-grid"></div>
                </div>
            </div>
        `;

        this.els.container = stage.querySelector('.analog-container');
        this.els.clockFace = document.getElementById('clock-face');
        this.els.handH = document.getElementById('hand-h');
        this.els.handM = document.getElementById('hand-m');
        this.els.handS = document.getElementById('hand-s');
        this.els.calMonth = document.getElementById('cal-month');
        this.els.calGrid = document.getElementById('cal-grid');

        this.generateClockFace();

        // Apply Initial Settings
        const color = savedSettings.tintColor || '#ff453a';
        const scale = savedSettings.scale || 100;
        
        this.applyColor(color);
        this.applyScale(scale);

        this.renderCalendar();
        this.update({ raw: new Date() });
    },

    update: function(t) {
        const now = new Date();
        
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        const sDeg = seconds * 6;
        const mDeg = (minutes * 6) + (seconds * 0.1);
        const hDeg = (hours * 30) + (minutes * 0.5);

        this.els.handS.style.transform = `rotate(${sDeg}deg)`;
        this.els.handM.style.transform = `rotate(${mDeg}deg)`;
        this.els.handH.style.transform = `rotate(${hDeg}deg)`;

        const dateKey = now.toDateString();
        if (dateKey !== this.currentDateStr) {
            this.renderCalendar();
            this.currentDateStr = dateKey;
        }
    },

    generateClockFace: function() {
        const existingTicks = this.els.clockFace.querySelectorAll('.tick, .clock-num');
        existingTicks.forEach(el => el.remove());

        for (let i = 0; i < 60; i++) {
            const tick = document.createElement('div');
            tick.className = i % 5 === 0 ? 'tick major' : 'tick';
            tick.style.transform = `rotate(${i * 6}deg)`;
            this.els.clockFace.appendChild(tick);
        }

        for (let i = 1; i <= 12; i++) {
            const num = document.createElement('div');
            num.className = 'clock-num';
            num.innerText = i;
            
            const angle = (i * 30) * (Math.PI / 180);
            const x = Math.sin(angle) * 16; 
            const y = -Math.cos(angle) * 16;
            
            num.style.transform = `translate(${x}vh, ${y}vh)`;
            this.els.clockFace.appendChild(num);
        }
    },

    renderCalendar: function() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();

        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        this.els.calMonth.innerText = monthNames[month];

        this.els.calGrid.innerHTML = '';

        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(d => {
            const el = document.createElement('div');
            el.className = 'cal-day-name';
            el.innerText = d;
            this.els.calGrid.appendChild(el);
        });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const el = document.createElement('div');
            el.className = 'cal-date empty';
            this.els.calGrid.appendChild(el);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const el = document.createElement('div');
            el.className = 'cal-date';
            el.innerText = i;
            if (i === today) el.classList.add('today');
            this.els.calGrid.appendChild(el);
        }
    },

    onSettingsChange: function(key, val) {
        if (key === 'tintColor') this.applyColor(val);
        if (key === 'scale') this.applyScale(val);
    },

    applyColor: function(color) {
        this.els.container.style.setProperty('--theme-color', color);
    },

    // APPLY ZOOM
    applyScale: function(val) {
        // Convert 100 -> 1.0, 150 -> 1.5
        const scale = val / 100;
        this.els.container.style.transform = `scale(${scale})`;
    },

    destroy: function() {
        this.els = {};
    }
};