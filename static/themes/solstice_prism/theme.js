window.ActiveTheme = {
    els: {},
    state: {},

    settingsConfig: {
        scale: {
            type: 'range',
            label: 'Scale',
            default: 100,
            min: 70,
            max: 120,
            displaySuffix: '%'
        },
        palette: {
            type: 'palette',
            label: 'Accent Palette',
            default: '#8ef7ff',
            options: ['#8ef7ff', '#ff9eb8', '#ffd479', '#b192ff', '#7bffc7', '#ffb3ff']
        },
        band: {
            type: 'range',
            label: 'Light Bands',
            default: 50,
            min: 0,
            max: 100,
            displaySuffix: '%'
        },
        grid: {
            type: 'range',
            label: 'Grid Opacity',
            default: 18,
            min: 0,
            max: 40,
            displaySuffix: '%'
        },
        speed: {
            type: 'range',
            label: 'Glimmer Speed',
            default: 26,
            min: 12,
            max: 50,
            displaySuffix: 's'
        },
        font: {
            type: 'select',
            label: 'Typeface',
            default: 'grotesk',
            options: [
                { value: 'grotesk', text: 'Grotesk' },
                { value: 'mono', text: 'Mono' },
                { value: 'serif', text: 'Serif' }
            ]
        },
        layout: {
            type: 'select',
            label: 'Layout',
            default: 'center',
            options: [
                { value: 'center', text: 'Centered' },
                { value: 'offset', text: 'Offset Left' }
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="solstice-canvas">
                <div class="solstice-gradient"></div>
                <div class="glimmer"></div>
                <div class="solstice-noise"></div>
                <div class="safe-box">
                    <div class="solstice-panel" data-layout="center">
                        <div class="panel-grid"></div>
                        <div class="solstice-content">
                            <div class="headline">
                                <span class="tag">SOLSTICE PRISM</span>
                                <span class="date">MON • JAN 01</span>
                            </div>
                            <div class="time-row">
                                <span class="hh">00</span>
                                <span class="dot">:</span>
                                <span class="mm">00</span>
                            </div>
                            <div class="subline">
                                <span class="seconds-pill seconds">00</span>
                                <span class="timezone">UTC</span>
                                <span class="mantra"> </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            hh: stage.querySelector('.hh'),
            mm: stage.querySelector('.mm'),
            dot: stage.querySelector('.dot'),
            seconds: stage.querySelector('.seconds'),
            timezone: stage.querySelector('.timezone'),
            date: stage.querySelector('.date'),
            mantra: stage.querySelector('.mantra'),
            panel: stage.querySelector('.solstice-panel')
        };

        this.state = {
            scale: settings.scale ?? this.settingsConfig.scale.default,
            palette: settings.palette ?? this.settingsConfig.palette.default,
            band: settings.band ?? this.settingsConfig.band.default,
            grid: settings.grid ?? this.settingsConfig.grid.default,
            speed: settings.speed ?? this.settingsConfig.speed.default,
            font: settings.font ?? this.settingsConfig.font.default,
            layout: settings.layout ?? this.settingsConfig.layout.default
        };

        this.applySettings();
    },

    applySettings() {
        const root = document.documentElement;
        root.style.setProperty('--sp-scale', (this.state.scale / 100).toString());
        root.style.setProperty('--sp-band-strength', (this.state.band / 100).toString());
        root.style.setProperty('--sp-grid-opacity', (this.state.grid / 100).toString());
        root.style.setProperty('--sp-glimmer-speed', `${this.state.speed}s`);
        root.style.setProperty('--sp-accent', this.state.palette);
        root.style.setProperty('--sp-accent2', this.deriveSecondary(this.state.palette));

        const fontMap = {
            grotesk: "'Space Grotesk', 'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace",
            serif: "'Playfair Display', 'Inter', serif"
        };
        root.style.setProperty('--sp-font', fontMap[this.state.font] || fontMap.grotesk);

        if (this.els.panel) this.els.panel.dataset.layout = this.state.layout;
    },

    deriveSecondary(color) {
        const map = {
            '#8ef7ff': '#ffadf1',
            '#ff9eb8': '#9ad7ff',
            '#ffd479': '#ff9a62',
            '#b192ff': '#68f0ff',
            '#7bffc7': '#80a4ff',
            '#ffb3ff': '#9bc4ff'
        };
        return map[color] || '#ffadf1';
    },

    update(time) {
        if (!this.els.hh) return;
        this.els.hh.textContent = time.h;
        this.els.mm.textContent = time.m;
        this.els.dot.style.opacity = (parseInt(time.s, 10) % 2 === 0) ? 1 : 0.25;
        this.els.seconds.textContent = time.s;

        const now = new Date();
        const weekday = now.toLocaleString('en', { weekday: 'short' }).toUpperCase();
        const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
        const day = String(now.getDate()).padStart(2, '0');
        this.els.date.textContent = `${weekday} • ${month} ${day}`;

        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'LOCAL';
        this.els.timezone.textContent = zone.toUpperCase();

        const phases = [' ', '.', ' ', '.'];
        const phaseIndex = Math.floor((now.getSeconds() % 16) / 4);
        this.els.mantra.textContent = phases[phaseIndex];
    },

    onSettingsChange(key, value) {
        if (key === 'palette' || key === 'layout' || key === 'font') {
            this.state[key] = value;
        } else {
            this.state[key] = Number(value);
        }
        this.applySettings();
    },

    destroy() {
        this.els = {};
    }
};