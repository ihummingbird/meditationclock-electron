window.ActiveTheme = {
    els: {},
    cycleTimer: null,
    currentPhase: 'inhale',

    // --- CONFIGURATION ---
    settingsConfig: {
        tintColor: {
            type: 'palette',
            label: 'Aura Color',
            default: '#5AC8FA',
            options: [
                '#5AC8FA', // Apple Sky Blue
                '#32D74B', // Apple Green
                '#BF5AF2', // Violet
                '#FF9F0A', // Amber
                '#FF375F', // Rose
                '#FFFFFF'  // Moonlight White
            ]
        },
        secondaryColor: {
            type: 'palette',
            label: 'Accent Glow',
            default: '#BF5AF2',
            options: [
                '#BF5AF2', // Purple
                '#64D2FF', // Cyan
                '#30D158', // Green
                '#FFD60A', // Yellow
                '#FF453A', // Red
                '#FFFFFF'  // White
            ]
        },
        zoomLevel: {
            type: 'range',
            label: 'Size / Zoom',
            default: 100,
            min: 60,
            max: 150,
            displaySuffix: '%'
        },
        inhaleTime: {
            type: 'range',
            label: 'Inhale',
            default: 4,
            min: 2,
            max: 10,
            displaySuffix: 's'
        },
        holdTime: {
            type: 'range',
            label: 'Hold',
            default: 2,
            min: 0,
            max: 10,
            displaySuffix: 's'
        },
        exhaleTime: {
            type: 'range',
            label: 'Exhale',
            default: 6,
            min: 2,
            max: 12,
            displaySuffix: 's'
        }
    },

    config: {
        inhale: 4,
        hold: 2,
        exhale: 6,
        zoom: 100
    },

    init: function(stage, savedSettings = {}) {
        let particlesHtml = '';
        for (let i = 1; i <= 18; i++) {
            particlesHtml += `<span class="aura-particle particle-${i}"></span>`;
        }

        stage.innerHTML = `
            <div class="liquid-aura-container">
                <div class="ambient-field"></div>

                <div class="aura-wrap" id="aura-wrap">
                    <div class="aura-orb" id="aura-orb">
                        <div class="orb-core"></div>
                        <div class="orb-ring ring-one"></div>
                        <div class="orb-ring ring-two"></div>
                        <div class="orb-ring ring-three"></div>
                        <div class="orb-shine"></div>
                        ${particlesHtml}
                    </div>
                </div>

                <div class="breath-label" id="breath-label">READY</div>
                <div class="breath-subtitle" id="breath-subtitle">breathe softly</div>
                <div class="aura-time" id="aura-time">00:00</div>
            </div>
        `;

        this.els.container = stage.querySelector('.liquid-aura-container');
        this.els.wrap = stage.querySelector('#aura-wrap');
        this.els.orb = stage.querySelector('#aura-orb');
        this.els.label = stage.querySelector('#breath-label');
        this.els.subtitle = stage.querySelector('#breath-subtitle');
        this.els.time = stage.querySelector('#aura-time');
        this.els.particles = stage.querySelectorAll('.aura-particle');
        this.els.rings = stage.querySelectorAll('.orb-ring');

        if (savedSettings.inhaleTime) this.config.inhale = parseInt(savedSettings.inhaleTime);
        if (savedSettings.holdTime !== undefined) this.config.hold = parseInt(savedSettings.holdTime);
        if (savedSettings.exhaleTime) this.config.exhale = parseInt(savedSettings.exhaleTime);

        this.applyColor(savedSettings.tintColor || this.settingsConfig.tintColor.default);
        this.applySecondaryColor(savedSettings.secondaryColor || this.settingsConfig.secondaryColor.default);
        this.applyZoom(savedSettings.zoomLevel || this.settingsConfig.zoomLevel.default);

        this.runCycle();
    },

    runCycle: function() {
        if (!this.els.orb) return;

        const nextStep = (phase, duration, label, subtitle, cssClass) => {
            this.els.label.innerText = label;
            this.els.subtitle.innerText = subtitle;

            this.els.orb.style.transitionDuration = `${duration}s`;
            this.els.wrap.style.transitionDuration = `${duration}s`;

            this.els.rings.forEach(ring => {
                ring.style.transitionDuration = `${duration}s`;
            });

            this.els.particles.forEach(particle => {
                particle.style.transitionDuration = `${duration}s`;
            });

            this.els.orb.className = `aura-orb ${cssClass}`;

            this.cycleTimer = setTimeout(() => {
                this.advancePhase(phase);
            }, duration * 1000);
        };

        switch (this.currentPhase) {
            case 'inhale':
                nextStep(
                    'inhale',
                    this.config.inhale,
                    'INHALE',
                    'expand with the light',
                    'phase-inhale'
                );
                break;

            case 'hold':
                nextStep(
                    'hold',
                    this.config.hold,
                    'HOLD',
                    'rest in stillness',
                    'phase-hold'
                );
                break;

            case 'exhale':
                nextStep(
                    'exhale',
                    this.config.exhale,
                    'EXHALE',
                    'soften and release',
                    'phase-exhale'
                );
                break;
        }
    },

    advancePhase: function(current) {
        if (current === 'inhale') {
            this.currentPhase = this.config.hold > 0 ? 'hold' : 'exhale';
        } else if (current === 'hold') {
            this.currentPhase = 'exhale';
        } else {
            this.currentPhase = 'inhale';
        }

        this.runCycle();
    },

    update: function(t) {
        if (this.els.time) {
            this.els.time.innerText = `${t.h}:${t.m}`;
        }
    },

    onSettingsChange: function(key, val) {
        if (key === 'tintColor') {
            this.applyColor(val);
            return;
        }

        if (key === 'secondaryColor') {
            this.applySecondaryColor(val);
            return;
        }

        if (key === 'zoomLevel') {
            this.applyZoom(val);
            return;
        }

        const intVal = parseInt(val);

        if (key === 'inhaleTime') this.config.inhale = intVal;
        if (key === 'holdTime') this.config.hold = intVal;
        if (key === 'exhaleTime') this.config.exhale = intVal;
    },

    applyZoom: function(val) {
        this.config.zoom = parseInt(val);
        const scale = this.config.zoom / 100;

        if (this.els.wrap) {
            this.els.wrap.style.setProperty('--user-zoom', scale);
        }
    },

    applyColor: function(hex) {
        const rgb = this.hexToRgb(hex);

        if (this.els.container) {
            this.els.container.style.setProperty('--aura-rgb', rgb);
        }
    },

    applySecondaryColor: function(hex) {
        const rgb = this.hexToRgb(hex);

        if (this.els.container) {
            this.els.container.style.setProperty('--accent-rgb', rgb);
        }
    },

    hexToRgb: function(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 255, 255';
    },

    destroy: function() {
        if (this.cycleTimer) clearTimeout(this.cycleTimer);
        this.els = {};
    }
};
