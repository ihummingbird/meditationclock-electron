window.ActiveTheme = {
    els: {},
    animeInstances: [],

    settingsConfig: {
        palette: {
            type: 'palette',
            label: 'Aura Palette',
            default: '#6366f1', // Teal (Zen Mint)
            options: [
                '#2dd4bf', // Zen Mint
                '#6366f1', // Cosmic Indigo
                '#ec4899', // Sakura Pink
                '#f59e0b', // Sunset Amber
                '#10b981'  // Forest Jade
            ]
        },
        waveIntensity: {
            type: 'range',
            label: 'Aura Dispersion',
            default: 120,
            min: 40,
            max: 200
        },

        breathingSpeed: {
            type: 'range',
            label: 'Ring Speed',
            default: '10',
            min: 5,
            max: 20
        }
    },

    init: function(stage, settings) {
        // Fallbacks for settings
        const palette = settings.palette || this.settingsConfig.palette.default;
        const speed = parseFloat(settings.breathingSpeed || this.settingsConfig.breathingSpeed.default) * 1000;
        const intensity = settings.waveIntensity || this.settingsConfig.waveIntensity.default;

        stage.innerHTML = `
            <div class="lotus-stage" style="--accent-color: ${palette};">
                <div class="lotus-bg-glow"></div>
                
                <!-- Breathing Rings / Wave Layers -->
                <div class="lotus-ring-container">
                    <div class="lotus-ring ring-outer"></div>
                    <div class="lotus-ring ring-middle"></div>
                    <div class="lotus-ring ring-inner"></div>
                    <div class="lotus-breathing-orb"></div>
                </div>

                <!-- Clock Display -->
                <div class="lotus-clock">
                    <div class="lotus-time">
                        <span id="lotus-h">00</span><span class="colon">:</span><span id="lotus-m">00</span><span class="colon-sec">:</span><span id="lotus-s" class="sec">00</span>
                    </div>
                    <div id="lotus-guide" class="lotus-breathing-guide"></div>
                </div>
            </div>
        `;

        this.els.stage = stage.querySelector('.lotus-stage');
        this.els.h = document.getElementById('lotus-h');
        this.els.m = document.getElementById('lotus-m');
        this.els.s = document.getElementById('lotus-s');
        this.els.guide = document.getElementById('lotus-guide');
        this.els.orb = stage.querySelector('.lotus-breathing-orb');
        this.els.rings = stage.querySelectorAll('.lotus-ring');

        this.startBreathingAnimation(speed);
        this.startAuraWaveAnimation(intensity);
    },

    startBreathingAnimation: function(speedMs) {
        // Clear previous animations if any
        if (this.breathAnim) this.breathAnim.pause();

        // One seamless breathing timeline
        this.breathAnim = anime.timeline({
            loop: true,
            direction: 'alternate',
            easing: 'easeInOutQuad',
            update: (anim) => {
                const progress = anim.progress; // 0 to 100
                if (progress < 48) {
                    this.els.guide.innerText = "";
                } else if (progress > 52) {
                    this.els.guide.innerText = "";
                } else {
                    this.els.guide.innerText = "";
                }
            }
        });

        this.breathAnim
            .add({
                targets: this.els.orb,
                scale: [1, 1.45],
                opacity: [0.6, 0.95],
                duration: speedMs / 2,
            })
            .add({
                targets: this.els.rings,
                scale: (el, i) => [1, 1.6 + (i * 0.25)],
                opacity: [0.4, 0.05],
                delay: anime.stagger(150),
                duration: speedMs / 2,
            }, 0); // Start concurrently
    },

    startAuraWaveAnimation: function(intensity) {
        // Clean out wave animations
        this.animeInstances.forEach(inst => inst.pause());
        this.animeInstances = [];

        // Random organic movement for background aura
        const glowAnim = anime({
            targets: '.lotus-bg-glow',
            translateX: () => anime.random(-intensity/3, intensity/3),
            translateY: () => anime.random(-intensity/3, intensity/3),
            scale: () => anime.random(0.85, 1.3),
            duration: 8000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
        this.animeInstances.push(glowAnim);
    },

    update: function(t) {
        if (this.els.h) this.els.h.innerText = t.h;
        if (this.els.m) this.els.m.innerText = t.m;
        if (this.els.s) this.els.s.innerText = t.s;
    },

    onSettingsChange: function(key, val) {
        if (key === 'palette') {
            this.els.stage.style.setProperty('--accent-color', val);
        } else if (key === 'breathingSpeed') {
            const speedMs = parseFloat(val) * 1000;
            this.startBreathingAnimation(speedMs);
        } else if (key === 'waveIntensity') {
            this.startAuraWaveAnimation(val);
        }
    },

    destroy: function() {
        if (this.breathAnim) this.breathAnim.pause();
        this.animeInstances.forEach(inst => inst.pause());
        this.els = {};
    }
};
