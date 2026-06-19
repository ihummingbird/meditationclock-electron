window.ActiveTheme = {
    els: {},
    gsapTimelines: {},
    rafId: null,

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Accent',
            default: 220,
            options: [220, 310, 170, 30, 340, 50]
        },
        markers: {
            type: 'select',
            label: 'Dial Style',
            default: 'numbers',
            options: [
                { value: 'numbers', text: 'Numbers' },
                { value: 'dots', text: 'Dots' },
                { value: 'minimal', text: 'Minimal' }
            ]
        },
        glow: {
            type: 'range',
            label: 'Glow Intensity',
            default: 60,
            min: 0,
            max: 100,
            displaySuffix: '%'
        },
        scale: {
            type: 'range',
            label: 'Size',
            default: 100,
            min: 60,
            max: 130,
            displaySuffix: '%'
        }
    },

    init: function (stage, settings) {
        const s = settings || {};

        stage.innerHTML = `
            <div class="cc-stage" id="cc-root">
                <div class="cc-ambient">
                    <div class="cc-ambient-orb"></div>
                    <div class="cc-ambient-orb"></div>
                </div>

                <div class="cc-watch" id="cc-watch">
                    <div class="cc-bezel">
                        <div class="cc-bezel-inner">
                            <div class="cc-markers" id="cc-markers"></div>
                            <div class="cc-numbers" id="cc-numbers"></div>
                            <div class="cc-date-window" id="cc-date">--</div>
                            <div class="cc-brand">CHRONO</div>
                            <div class="cc-crystal"></div>
                            <div class="cc-hand-container">
                                <div class="cc-hand cc-hand-hour" id="cc-hand-h"></div>
                                <div class="cc-hand cc-hand-minute" id="cc-hand-m"></div>
                                <div class="cc-hand cc-hand-second" id="cc-hand-s"></div>
                            </div>
                            <div class="cc-center-cap"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.cc-stage'),
            watch: document.getElementById('cc-watch'),
            handH: document.getElementById('cc-hand-h'),
            handM: document.getElementById('cc-hand-m'),
            handS: document.getElementById('cc-hand-s'),
            markers: document.getElementById('cc-markers'),
            numbers: document.getElementById('cc-numbers'),
            date: document.getElementById('cc-date')
        };

        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyScale(s.scale ?? this.settingsConfig.scale.default);
        this.applyGlow(s.glow ?? this.settingsConfig.glow.default);
        this.applyMarkers(s.markers ?? this.settingsConfig.markers.default);

        this.createMarkers();
        this.createNumbers();
        this.startLoop();
    },

    createMarkers: function () {
        if (!this.els.markers) return;
        this.els.markers.innerHTML = '';

        // 60 minute markers
        for (let i = 0; i < 60; i++) {
            const marker = document.createElement('div');
            marker.className = 'cc-marker minute';
            marker.style.setProperty('--cc-rot', (i * 6) + 'deg');
            this.els.markers.appendChild(marker);
        }

        // 12 hour markers (overlaid, thicker)
        for (let i = 0; i < 12; i++) {
            const marker = document.createElement('div');
            marker.className = 'cc-marker hour';
            marker.style.setProperty('--cc-rot', (i * 30) + 'deg');
            this.els.markers.appendChild(marker);
        }
    },

    createNumbers: function () {
        if (!this.els.numbers) return;
        this.els.numbers.innerHTML = '';

        const nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const containerSize = this.els.numbers.getBoundingClientRect();
        const radius = Math.min(containerSize.width, containerSize.height) / 2;
        const numRadius = radius * 0.78;

        nums.forEach((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = radius + Math.cos(angle) * numRadius;
            const y = radius + Math.sin(angle) * numRadius;

            const el = document.createElement('div');
            el.className = 'cc-num';
            el.textContent = num;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            this.els.numbers.appendChild(el);
        });
    },

    startLoop: function () {
        this.stopLoop();

        // GSAP ticker for smooth 60fps hand updates
        this._tickHandler = () => this.tick();
        gsap.ticker.add(this._tickHandler);

        // Set initial positions immediately
        this.tick();
    },

    stopLoop: function () {
        if (this._tickHandler) {
            gsap.ticker.remove(this._tickHandler);
            this._tickHandler = null;
        }
    },

    tick: function () {
        const now = new Date();
        const h = now.getHours() % 12;
        const m = now.getMinutes();
        const s = now.getSeconds();
        const ms = now.getMilliseconds();

        // Smooth angles
        const secAngle = (s + ms / 1000) * 6;
        const minAngle = (m + s / 60) * 6;
        const hourAngle = (h + m / 60) * 30;

        // GSAP smooth rotation for second hand
        if (this.els.handS) {
            gsap.set(this.els.handS, { rotation: secAngle, transformOrigin: '50% 100%' });
        }

        // GSAP tween for minute hand (smooth every second)
        if (this.els.handM) {
            gsap.to(this.els.handM, {
                rotation: minAngle,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true,
                transformOrigin: '50% 100%'
            });
        }

        // GSAP tween for hour hand (smooth every second)
        if (this.els.handH) {
            gsap.to(this.els.handH, {
                rotation: hourAngle,
                duration: 1,
                ease: 'power2.out',
                overwrite: true,
                transformOrigin: '50% 100%'
            });
        }

        // Update date
        if (this.els.date) {
            this.els.date.textContent = now.getDate();
        }
    },

    update: function (t) {
        // The GSAP ticker handles everything, but we still update the date
        // in case the engine calls update on the tick
    },

    applyHue: function (val) {
        const h = Number(val);
        const el = this.els.stage;
        if (!el) return;
        el.style.setProperty('--cc-accent', `hsl(${h}, 80%, 60%)`);
        el.style.setProperty('--cc-glow', `hsl(${h}, 90%, 70%)`);
    },

    applyScale: function (val) {
        if (this.els.watch) {
            this.els.watch.style.transform = `scale(${val / 100})`;
        }
    },

    applyGlow: function (val) {
        const intensity = val / 100;
        const handS = this.els.handS;
        const cap = this.els.stage ? this.els.stage.querySelector('.cc-center-cap') : null;
        if (handS) {
            handS.style.boxShadow = `0 0 ${8 * intensity}px var(--cc-glow), 0 0 ${16 * intensity}px var(--cc-glow)`;
        }
        if (cap) {
            cap.style.boxShadow = `0 0 ${8 * intensity}px var(--cc-glow), 0 0 ${16 * intensity}px var(--cc-glow)`;
        }
    },

    applyMarkers: function (val) {
        const style = val || 'numbers';
        if (this.els.numbers) {
            this.els.numbers.style.display = style === 'numbers' ? '' : 'none';
        }
        const markers = this.els.markers ? this.els.markers.querySelectorAll('.cc-marker') : [];
        markers.forEach(m => {
            if (style === 'minimal') {
                m.style.display = m.classList.contains('hour') ? '' : 'none';
            } else {
                m.style.display = '';
            }
        });
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'scale') this.applyScale(val);
        if (key === 'glow') this.applyGlow(val);
        if (key === 'markers') this.applyMarkers(val);
    },

    destroy: function () {
        this.stopLoop();
        this.els = {};
    }
};
