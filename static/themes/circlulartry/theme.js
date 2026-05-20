window.ActiveTheme = {
    els: {},

    settingsConfig: {
        accentColor: {
            type: 'palette',
            label: 'Accent Tone',
            default: '#0A84FF',
            options: [
                '#0A84FF', // Blue
                '#5E5CE6', // Indigo
                '#30D158', // Green
                '#FF375F', // Pink/Red
                '#FF9F0A'  // Orange
            ]
        },
        zoomLevel: {
            type: 'range',
            label: 'Dial Scale',
            default: 100,
            min: 70,
            max: 140,
            displaySuffix: '%'
        },
        glassOpacity: {
            type: 'range',
            label: 'Glass Frosting',
            default: 18,
            min: 6,
            max: 35,
            displaySuffix: '%'
        },
        glowStrength: {
            type: 'range',
            label: 'Aura Glow',
            default: 75,
            min: 20,
            max: 100,
            displaySuffix: '%'
        }
    },

    init: function(stage, savedSettings = {}) {
        stage.innerHTML = `
            <div class="halo-container">
                <div class="halo-bg">
                    <div class="halo-gradient"></div>
                    <div class="halo-orb halo-orb-1"></div>
                    <div class="halo-orb halo-orb-2"></div>
                    <div class="halo-orb halo-orb-3"></div>
                    <div class="halo-vignette"></div>
                </div>

                <div class="halo-dial-wrap">
                    <div class="halo-dial" data-role="dial">
                        <div class="halo-ring"></div>
                        <div class="halo-shine"></div>
                        <div class="halo-content">
                            <div class="halo-time" data-role="time-main">00:00</div>
                            <div class="halo-sec" data-role="time-sec">00</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els.container = stage.querySelector('.halo-container');
        this.els.dial = stage.querySelector('[data-role="dial"]');
        this.els.timeMain = stage.querySelector('[data-role="time-main"]');
        this.els.timeSec = stage.querySelector('[data-role="time-sec"]');

        this.applyColor(savedSettings.accentColor || this.settingsConfig.accentColor.default);
        this.applyZoom(savedSettings.zoomLevel || this.settingsConfig.zoomLevel.default);
        this.applyGlass(savedSettings.glassOpacity || this.settingsConfig.glassOpacity.default);
        this.applyGlow(savedSettings.glowStrength || this.settingsConfig.glowStrength.default);
    },

    update: function(t) {
        if (!this.els.timeMain || !this.els.timeSec) return;
        this.els.timeMain.innerText = `${t.h}:${t.m}`;
        this.els.timeSec.innerText = t.s;
    },

    onSettingsChange: function(key, val) {
        if (key === 'accentColor') this.applyColor(val);
        if (key === 'zoomLevel') this.applyZoom(val);
        if (key === 'glassOpacity') this.applyGlass(val);
        if (key === 'glowStrength') this.applyGlow(val);
    },

    applyColor: function(hex) {
        if (!this.els.container) return;
        this.els.container.style.setProperty('--halo-accent', hex);
    },

    applyZoom: function(val) {
        if (!this.els.dial) return;
        const scale = Number(val) / 100;
        this.els.dial.style.transform = `scale(${scale})`;
    },

    applyGlass: function(val) {
        if (!this.els.container) return;
        const alpha = Math.max(0.06, Number(val) / 100);
        this.els.container.style.setProperty('--halo-glass', `rgba(255,255,255,${alpha})`);
        this.els.container.style.setProperty('--halo-border', `rgba(255,255,255,${Math.min(alpha + 0.08, 0.42)})`);
    },

    applyGlow: function(val) {
        if (!this.els.container) return;
        const strength = Math.max(0.2, Number(val) / 100);
        this.els.container.style.setProperty('--halo-glow-strength', strength);
    },

    destroy: function() {
        this.els = {};
    }
};