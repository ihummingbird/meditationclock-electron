window.ActiveTheme = {
    els: {},
    animations: [],
    particlesCreated: false,
    circumference: 0,

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Plasma',
            default: 200,
            options: [260, 310, 200, 170, 30, 340]
        },
        speed: {
            type: 'range',
            label: 'Flow Speed',
            default: 50,
            min: 10,
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
        this.circumference = 2 * Math.PI * 380;
        const s = settings || {};

        stage.innerHTML = `
            <div class="pr-stage" id="pr-root">
                <div class="pr-ambient">
                    <div class="pr-ambient-orb"></div>
                    <div class="pr-ambient-orb"></div>
                    <div class="pr-ambient-orb"></div>
                </div>

                <div class="pr-ring-container" id="pr-container">
                    <div class="pr-ring-halo"></div>
                    <div class="pr-ring"></div>
                    <div class="pr-ring-inner"></div>

                    <div class="pr-ticks" id="pr-ticks"></div>

                    <div class="pr-sec-arc">
                        <svg viewBox="0 0 800 800">
                            <circle class="pr-arc-track" cx="400" cy="400" r="380" />
                            <circle class="pr-arc-fill" id="pr-arc" cx="400" cy="400" r="380"
                                stroke-dasharray="${this.circumference}"
                                stroke-dashoffset="${this.circumference}" />
                        </svg>
                    </div>

                    <div class="pr-orbit-particles" id="pr-orbit-particles"></div>

                    <div class="pr-capsule">
                        <div class="pr-time">
                            <span class="pr-hours" id="pr-h">00</span>
                            <span class="pr-sep"></span>
                            <span class="pr-minutes" id="pr-m">00</span>
                        </div>
                        <div class="pr-seconds-label">
                            <span id="pr-s">00</span>
                        </div>
                        <div class="pr-date" id="pr-date">LOADING</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.pr-stage'),
            container: document.getElementById('pr-container'),
            h: document.getElementById('pr-h'),
            m: document.getElementById('pr-m'),
            s: document.getElementById('pr-s'),
            date: document.getElementById('pr-date'),
            arc: document.getElementById('pr-arc'),
            ticks: document.getElementById('pr-ticks'),
            orbitParticles: document.getElementById('pr-orbit-particles')
        };

        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyScale(s.scale ?? this.settingsConfig.scale.default);
        this.applySpeed(s.speed ?? this.settingsConfig.speed.default);

        this.createTicks();
        this.createOrbitParticles();
        this.startAnimations();
    },

    createTicks: function () {
        if (!this.els.ticks) return;
        this.els.ticks.innerHTML = '';
        for (let i = 0; i < 60; i++) {
            const tick = document.createElement('div');
            tick.className = 'pr-tick' + (i % 5 === 0 ? ' active' : '');
            const angle = (i / 60) * 360;
            tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            this.els.ticks.appendChild(tick);
        }
    },

    createOrbitParticles: function () {
        if (!this.els.orbitParticles) return;
        this.els.orbitParticles.innerHTML = '';
        const count = 12;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'pr-orbit-particle';
            const size = 3 + Math.random() * 4;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            this.els.orbitParticles.appendChild(p);
        }
    },

    startAnimations: function () {
        this.stopAnimations();

        // Orbit particles animation
        const particles = this.els.orbitParticles ? this.els.orbitParticles.querySelectorAll('.pr-orbit-particle') : [];
        particles.forEach((p, i) => {
            const angle = (i / particles.length) * 360;
            const radius = 48 + Math.random() * 8;
            const dur = 15000 + Math.random() * 10000;
            const delay = Math.random() * -dur;

            const anim = anime({
                targets: p,
                rotate: angle,
                translateX: [
                    { value: Math.cos(angle * Math.PI / 180) * radius + '%', duration: 0 },
                ],
                translateY: [
                    { value: Math.sin(angle * Math.PI / 180) * radius + '%', duration: 0 },
                ],
                opacity: [
                    { value: 0, duration: 0 },
                    { value: 0.9, duration: 600 },
                    { value: 0.4, duration: 1200 },
                    { value: 0.9, duration: 600 },
                    { value: 0, duration: 600 }
                ],
                scale: [0.3, 1.2, 0.6, 1, 0.3],
                duration: dur,
                easing: 'linear',
                loop: true,
                delay: delay
            });
            this.animations.push(anim);
        });

        // Halo subtle breathing
        const halo = this.els.container ? this.els.container.querySelector('.pr-ring-halo') : null;
        if (halo) {
            const breatheAnim = anime({
                targets: halo,
                scale: [
                    { value: 0.92, duration: 2500, easing: 'easeInOutSine' },
                    { value: 1.08, duration: 2500, easing: 'easeInOutSine' }
                ],
                opacity: [
                    { value: 0.12, duration: 2500, easing: 'easeInOutSine' },
                    { value: 0.22, duration: 2500, easing: 'easeInOutSine' }
                ],
                loop: true
            });
            this.animations.push(breatheAnim);
        }
    },

    stopAnimations: function () {
        this.animations.forEach(a => { if (a && a.pause) a.pause(); });
        this.animations = [];
    },

    update: function (t) {
        if (!this.els.h) return;
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        this.els.s.innerText = t.s;

        const secNum = parseInt(t.s, 10);
        const offset = this.circumference - (secNum / 60) * this.circumference;
        this.els.arc.style.strokeDashoffset = offset;

        // Highlight current tick
        if (this.els.ticks) {
            const ticks = this.els.ticks.children;
            for (let i = 0; i < ticks.length; i++) {
                ticks[i].classList.toggle('active', i === secNum);
            }
        }

        const now = new Date();
        this.els.date.textContent = now.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    },

    applyHue: function (val) {
        const h = Number(val);
        const el = this.els.stage;
        if (!el) return;
        el.style.setProperty('--pr-c1', `hsl(${h}, 90%, 65%)`);
        el.style.setProperty('--pr-c2', `hsl(${(h + 50) % 360}, 85%, 60%)`);
        el.style.setProperty('--pr-c3', `hsl(${(h + 140) % 360}, 90%, 65%)`);
        el.style.setProperty('--pr-glow', `hsl(${h}, 100%, 75%)`);
        el.style.setProperty('--pr-hue', h);
    },

    applyScale: function (val) {
        if (this.els.container) {
            this.els.container.style.transform = `scale(${val / 100})`;
        }
    },

    applySpeed: function (val) {
        document.documentElement.style.setProperty('--pr-speed', val / 50);
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'scale') this.applyScale(val);
        if (key === 'speed') this.applySpeed(val);
    },

    destroy: function () {
        this.stopAnimations();
        this.els = {};
        this.particlesCreated = false;
    }
};
