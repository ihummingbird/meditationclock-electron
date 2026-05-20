window.ActiveTheme = {
    els: {},
    settingsConfig: {
        size: {
            type: 'range',
            label: 'Zoom',
            default: 92,
            min: 70,
            max: 115,
            displaySuffix: '%'
        },
        glow: {
            type: 'range',
            label: 'Glow',
            default: 38,
            min: 0,
            max: 85,
            displaySuffix: '%'
        },
        blur: {
            type: 'range',
            label: 'Glass Blur',
            default: 22,
            min: 6,
            max: 36,
            displaySuffix: 'px'
        },
        palette: {
            type: 'palette',
            label: 'Tint',
            default: '#8ec5ff',
            options: ['#8ec5ff', '#b8a1ff', '#7ee6d8', '#ffd58f', '#ffb3c7', '#c2f08a']
        },
        speed: {
            type: 'range',
            label: 'Ambient Motion',
            default: 42,
            min: 12,
            max: 90,
            displaySuffix: 's'
        },
        font: {
            type: 'select',
            label: 'Typeface',
            default: 'rounded',
            options: [
                { value: 'rounded', text: 'Rounded' },
                { value: 'mono', text: 'Mono' },
                { value: 'serif', text: 'Serif' }
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="lg-shell">
                <div class="lg-bg">
                    <div class="lg-orb orb-a"></div>
                    <div class="lg-orb orb-b"></div>
                    <div class="lg-orb orb-c"></div>
                    <div class="lg-noise"></div>
                </div>

                <div class="lg-safe">
                    <div class="lg-card">
                        <div class="lg-shine"></div>

                        <div class="lg-content">
                            <div class="lg-topline">
                                <div class="lg-status">LIQUID GLASS</div>
                                <div class="lg-date"></div>
                            </div>

                            <div class="lg-time-wrap">
                                <div class="lg-time">
                                    <span class="hh">00</span>
                                    <span class="dot">:</span>
                                    <span class="mm">00</span>
                                </div>
                                <div class="lg-seconds-wrap">
                                    <span class="ss">00</span>
                                </div>
                            </div>

                            
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els.shell = stage.querySelector('.lg-shell');
        this.els.bg = stage.querySelector('.lg-bg');
        this.els.card = stage.querySelector('.lg-card');
        this.els.hh = stage.querySelector('.hh');
        this.els.mm = stage.querySelector('.mm');
        this.els.ss = stage.querySelector('.ss');
        this.els.dot = stage.querySelector('.dot');
        this.els.date = stage.querySelector('.lg-date');
        this.els.status = stage.querySelector('.lg-status');
        this.els.safe = stage.querySelector('.lg-safe');
        this.els.bottomPill = stage.querySelector('.lg-pill');

        const s = {
            size: settings.size ?? this.settingsConfig.size.default,
            glow: settings.glow ?? this.settingsConfig.glow.default,
            blur: settings.blur ?? this.settingsConfig.blur.default,
            palette: settings.palette ?? this.settingsConfig.palette.default,
            speed: settings.speed ?? this.settingsConfig.speed.default,
            font: settings.font ?? this.settingsConfig.font.default
        };

        this.currentSettings = s;
        this.applySettings(s);
    },

    applySettings(s) {
        this.currentSettings = { ...this.currentSettings, ...s };

        const root = document.documentElement;

        root.style.setProperty('--lg-scale', String(s.size / 100));
        root.style.setProperty('--lg-glow', `${s.glow}%`);
        root.style.setProperty('--lg-blur', `${s.blur}px`);
        root.style.setProperty('--lg-accent', s.palette);
        root.style.setProperty('--lg-speed', `${s.speed}s`);

        let accent2 = '#d7c2ff';
        let accent3 = '#ffffff';

        if (s.palette === '#8ec5ff') {
            accent2 = '#c9b7ff';
            accent3 = '#dff4ff';
        } else if (s.palette === '#b8a1ff') {
            accent2 = '#8ed0ff';
            accent3 = '#efe7ff';
        } else if (s.palette === '#7ee6d8') {
            accent2 = '#8fc8ff';
            accent3 = '#dcfff7';
        } else if (s.palette === '#ffd58f') {
            accent2 = '#ffb6a3';
            accent3 = '#fff2da';
        } else if (s.palette === '#ffb3c7') {
            accent2 = '#c3b7ff';
            accent3 = '#ffe5ee';
        } else if (s.palette === '#c2f08a') {
            accent2 = '#8ee0b8';
            accent3 = '#f1ffdd';
        }

        root.style.setProperty('--lg-accent2', accent2);
        root.style.setProperty('--lg-accent3', accent3);

        let fontFamily = "'Inter', 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";
        if (s.font === 'mono') fontFamily = "'JetBrains Mono', 'SFMono-Regular', monospace";
        if (s.font === 'serif') fontFamily = "'Playfair Display', 'Times New Roman', serif";
        if (s.font === 'rounded') fontFamily = "'Inter', 'SF Pro Rounded', system-ui, sans-serif";

        root.style.setProperty('--lg-font', fontFamily);
    },

    update(timeObj) {
        this.els.hh.textContent = timeObj.h;
        this.els.mm.textContent = timeObj.m;
        this.els.ss.textContent = timeObj.s;

        this.els.dot.style.opacity = (parseInt(timeObj.s, 10) % 2 === 0) ? '1' : '0.28';

        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const day = days[now.getDay()];
        const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
        const date = String(now.getDate()).padStart(2, '0');

        this.els.date.textContent = `${day} · ${month} ${date}`;
    },

    onSettingsChange(key, val) {
        const s = { ...(this.currentSettings || {}) };

        if (key === 'size') s.size = Number(val);
        if (key === 'glow') s.glow = Number(val);
        if (key === 'blur') s.blur = Number(val);
        if (key === 'palette') s.palette = val;
        if (key === 'speed') s.speed = Number(val);
        if (key === 'font') s.font = val;

        this.applySettings(s);
    },

    destroy() {
        this.els = {};
        this.currentSettings = null;
    }
};
