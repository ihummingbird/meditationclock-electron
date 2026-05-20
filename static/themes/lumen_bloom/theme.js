window.ActiveTheme = {
    container: null,
    els: {},
    settings: {},
    settingsConfig: {
        zoom: {
            label: 'Orb Size',
            type: 'range',
            min: 70,
            max: 140,
            default: 100,
            displaySuffix: '%'
        },
        glow: {
            label: 'Glow Strength',
            type: 'range',
            min: 20,
            max: 100,
            default: 55,
            displaySuffix: '%'
        },
        ringSpread: {
            label: 'Ring Spread',
            type: 'range',
            min: 70,
            max: 150,
            default: 100,
            displaySuffix: '%'
        },
        palette: {
            label: 'Color Mood',
            type: 'palette',
            default: '#8ec5ff',
            options: [
                '#8ec5ff',
                '#a78bfa',
                '#7ef0c9',
                '#ffd36e',
                '#ff9fb3',
                '#c8b6ff',
                '#9ad0ff',
                '#b7f397'
            ]
        },
        style: {
            label: 'Display Style',
            type: 'select',
            default: 'glass',
            options: [
                { value: 'glass', text: 'Glass' },
                { value: 'minimal', text: 'Minimal' },
                { value: 'radiant', text: 'Radiant' }
            ]
        }
    },

    init(stage, savedSettings = {}) {
        this.settings = {
            zoom: 100,
            glow: 55,
            ringSpread: 100,
            palette: '#8ec5ff',
            style: 'glass',
            ...savedSettings
        };

        stage.innerHTML = `
            <div class="lumen-bloom">
                <div class="lb-bg"></div>
                <div class="lb-vignette"></div>

                <div class="lb-center-wrap">
                    <div class="lb-rings">
                        <div class="lb-ring lb-ring-1"></div>
                        <div class="lb-ring lb-ring-2"></div>
                        <div class="lb-ring lb-ring-3"></div>
                        <div class="lb-second-orbit">
                            <div class="lb-second-marker"></div>
                        </div>
                    </div>

                    <div class="lb-orb">
                        <div class="lb-orb-core"></div>
                        <div class="lb-orb-highlight"></div>
                        <div class="lb-time-panel">
                            <div class="lb-hourminute">
                                <span class="lb-h">00</span>
                                <span class="lb-colon">:</span>
                                <span class="lb-m">00</span>
                            </div>
                            <div class="lb-seconds-row">
                                <span class="lb-s">00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container = stage.querySelector('.lumen-bloom');
        this.els = {
            root: stage.querySelector('.lumen-bloom'),
            bg: stage.querySelector('.lb-bg'),
            centerWrap: stage.querySelector('.lb-center-wrap'),
            orb: stage.querySelector('.lb-orb'),
            core: stage.querySelector('.lb-orb-core'),
            panel: stage.querySelector('.lb-time-panel'),
            h: stage.querySelector('.lb-h'),
            m: stage.querySelector('.lb-m'),
            s: stage.querySelector('.lb-s'),
            orbit: stage.querySelector('.lb-second-orbit'),
            marker: stage.querySelector('.lb-second-marker'),
            ring1: stage.querySelector('.lb-ring-1'),
            ring2: stage.querySelector('.lb-ring-2'),
            ring3: stage.querySelector('.lb-ring-3')
        };

        this.applySettings();
    },

    update(timeObj) {
        if (!this.els.h) return;

        this.els.h.textContent = timeObj.h;
        this.els.m.textContent = timeObj.m;
        this.els.s.textContent = timeObj.s;

        const sec = parseInt(timeObj.s, 10) || 0;
        const min = parseInt(timeObj.m, 10) || 0;
        const hour = parseInt(timeObj.h, 10) || 0;

        const secDeg = sec * 6;
        const minutePulse = 1 + (min / 59) * 0.04;
        const hourDrift = (hour % 12) / 12;

        this.els.orbit.style.transform = `translate(-50%, -50%) rotate(${secDeg}deg)`;

        this.els.ring1.style.transform = `translate(-50%, -50%) scale(${minutePulse})`;
        this.els.ring2.style.transform = `translate(-50%, -50%) scale(${1 + hourDrift * 0.03})`;
        this.els.ring3.style.transform = `translate(-50%, -50%) scale(${1 + sec / 60 * 0.02})`;

        this.els.core.style.filter = `blur(${18 + sec / 6}px)`;
    },

    onSettingsChange(key, value) {
        this.settings[key] = value;
        this.applySettings();
    },

    applySettings() {
        if (!this.container) return;

        const zoom = Number(this.settings.zoom || 100);
        const glow = Number(this.settings.glow || 55);
        const spread = Number(this.settings.ringSpread || 100);
        const palette = this.settings.palette || '#8ec5ff';
        const style = this.settings.style || 'glass';

        const glowAlpha = Math.max(0.15, Math.min(0.95, glow / 100));
        const ringScale = spread / 100;

        this.container.style.setProperty('--lb-accent', palette);
        this.container.style.setProperty('--lb-zoom', zoom / 100);
        this.container.style.setProperty('--lb-glow', glowAlpha);
        this.container.style.setProperty('--lb-ring-scale', ringScale);

        this.container.setAttribute('data-style', style);
    },

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.container = null;
        this.els = {};
    }
};
