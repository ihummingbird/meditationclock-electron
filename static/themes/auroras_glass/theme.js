window.ActiveTheme = {
    els: {},
    settingsConfig: {
        size: {
            type: 'range',
            label: 'Scale',
            default: 90,
            min: 60,
            max: 110,
            displaySuffix: '%'
        },
        glow: {
            type: 'range',
            label: 'Glow Amount',
            default: 40,
            min: 0,
            max: 80,
            displaySuffix: '%'
        },
        blur: {
            type: 'range',
            label: 'Glass Blur',
            default: 18,
            min: 4,
            max: 30,
            displaySuffix: 'px'
        },
        palette: {
            type: 'palette',
            label: 'Accent',
            default: '#7cf3ff',
            options: ['#7cf3ff', '#f6a0ff', '#9eff9e', '#ffd166', '#8de5ff', '#ff8e8e']
        },
        speed: {
            type: 'range',
            label: 'Aurora Speed',
            default: 40,
            min: 10,
            max: 80,
            displaySuffix: 's'
        },
        font: {
            type: 'select',
            label: 'Typeface',
            default: 'mono',
            options: [
                { value: 'mono', text: 'Mono' },
                { value: 'rounded', text: 'Rounded' },
                { value: 'serif', text: 'Serif' }
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="aurora-shell">
                <div class="aurora-bg"></div>
                <div class="aurora-safe">
                    <div class="aurora-glass">
                        <div class="aurora-content">
                            <div class="time-block">
                                <span class="hh">00</span>
                                <span class="dot">:</span>
                                <span class="mm">00</span>
                                <span class="ss">00</span>
                            </div>
                            <div class="footer">
                                <div class="pill date"></div> 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els.shell = stage.querySelector('.aurora-shell');
        this.els.hh = stage.querySelector('.hh');
        this.els.mm = stage.querySelector('.mm');
        this.els.ss = stage.querySelector('.ss');
        this.els.dot = stage.querySelector('.dot');
        this.els.date = stage.querySelector('.date');
        this.els.glass = stage.querySelector('.aurora-glass');
        this.els.safe = stage.querySelector('.aurora-safe');
        this.els.bg = stage.querySelector('.aurora-bg');

        // Apply initial settings
        const s = {
            size: settings.size ?? this.settingsConfig.size.default,
            glow: settings.glow ?? this.settingsConfig.glow.default,
            blur: settings.blur ?? this.settingsConfig.blur.default,
            palette: settings.palette ?? this.settingsConfig.palette.default,
            speed: settings.speed ?? this.settingsConfig.speed.default,
            font: settings.font ?? this.settingsConfig.font.default
        };
        this.applySettings(s);
    },

    applySettings(s) {
        const root = document.documentElement;
        root.style.setProperty('--ag-scale', (s.size / 100).toString());
        root.style.setProperty('--ag-glow', s.glow + '%');
        root.style.setProperty('--ag-blur', s.blur + 'px');
        root.style.setProperty('--ag-accent', s.palette);
        // generate a secondary accent from palette (rotate hue via tiny tweak)
        const accent2 = s.palette === '#7cf3ff' ? '#9b6cff'
                      : s.palette === '#f6a0ff' ? '#6ac8ff'
                      : s.palette === '#9eff9e' ? '#61ffc8'
                      : s.palette === '#ffd166' ? '#ff8e53'
                      : s.palette === '#8de5ff' ? '#a59bff'
                      : '#ffadad';
        root.style.setProperty('--ag-accent2', accent2);

        this.els.bg.style.animationDuration = `${s.speed}s`;

        let fontFamily = "JetBrains Mono, 'Inter', monospace";
        if (s.font === 'rounded') fontFamily = "'Inter', 'SF Pro Rounded', system-ui, sans-serif";
        if (s.font === 'serif') fontFamily = "'Playfair Display', 'Inter', serif";
        root.style.setProperty('--ag-font', fontFamily);
    },

    update(timeObj) {
        this.els.hh.textContent = timeObj.h;
        this.els.mm.textContent = timeObj.m;
        this.els.ss.textContent = timeObj.s;

        // Blink the dot
        this.els.dot.style.opacity = (parseInt(timeObj.s, 10) % 2 === 0) ? 1 : 0.25;

        // Simple date display
        const now = new Date();
        const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        const day = days[now.getDay()];
        const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
        const date = now.getDate();
        this.els.date.textContent = `${day} • ${month} ${String(date).padStart(2,'0')}`;
    },

    onSettingsChange(key, val) {
        // Build a minimal settings map for live updates
        const s = {
            size: parseFloat(document.documentElement.style.getPropertyValue('--ag-scale')) * 100 || this.settingsConfig.size.default,
            glow: parseFloat((document.documentElement.style.getPropertyValue('--ag-glow') || '40%')),
            blur: parseFloat((document.documentElement.style.getPropertyValue('--ag-blur') || '18px')),
            palette: getComputedStyle(document.documentElement).getPropertyValue('--ag-accent').trim() || this.settingsConfig.palette.default,
            speed: parseFloat(this.els.bg.style.animationDuration) || this.settingsConfig.speed.default,
            font: this.settingsConfig.font.default
        };

        // Override the changed key
        if (key === 'size') s.size = Number(val);
        if (key === 'glow') s.glow = Number(val);
        if (key === 'blur') s.blur = Number(val);
        if (key === 'palette') s.palette = val;
        if (key === 'speed') s.speed = Number(val);
        if (key === 'font') s.font = val;

        this.applySettings(s);
    },

    destroy() {
        // Cleanup if needed
        this.els = {};
    }

};
