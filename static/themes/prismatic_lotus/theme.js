window.ActiveTheme = {
    els: {},
    rafId: null,
    particlesCreated: false,

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Prism',
            default: 200,
            options: [280, 330, 200, 160, 30, 45]
        },
        bloom: {
            type: 'range',
            label: 'Bloom Intensity',
            default: 100,
            min: 30,
            max: 150,
            displaySuffix: '%'
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
        const circumference = 2 * Math.PI * 480;

        stage.innerHTML = `
            <div class="lotus-stage" id="lotus-root">
                <!-- Ambient Nebulae -->
                <div class="lotus-ambient">
                    <div class="lotus-nebula lotus-nebula-1"></div>
                    <div class="lotus-nebula lotus-nebula-2"></div>
                    <div class="lotus-nebula lotus-nebula-3"></div>
                </div>

                <!-- Floating Particles -->
                <div class="lotus-particles" id="lotus-particles"></div>

                <!-- Mandala -->
                <div class="lotus-mandala" id="lotus-mandala">
                    <!-- Seconds Progress Ring -->
                    <div class="lotus-seconds-ring">
                        <svg viewBox="0 0 1000 1000">
                            <circle class="lotus-seconds-track" cx="500" cy="500" r="480" />
                            <circle class="lotus-seconds-progress" id="lotus-sec-ring" cx="500" cy="500" r="480"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${circumference}" />
                        </svg>
                    </div>

                    <!-- Orbit Rings -->
                    <div class="lotus-orbit lotus-orbit-1"></div>
                    <div class="lotus-orbit lotus-orbit-2"></div>
                    <div class="lotus-orbit lotus-orbit-3"></div>

                    <!-- Petal Ring 1 (8 petals) -->
                    <div class="lotus-petal-ring">
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                    </div>

                    <!-- Petal Ring 2 (6 petals) -->
                    <div class="lotus-petal-ring">
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                    </div>

                    <!-- Petal Ring 3 (10 petals) -->
                    <div class="lotus-petal-ring">
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                        <div class="lotus-petal"></div><div class="lotus-petal"></div>
                    </div>

                    <!-- Glass Capsule -->
                    <div class="lotus-capsule">
                        <div class="lotus-time">
                            <span class="lotus-hours" id="lotus-h">00</span>
                            <span class="lotus-separator"></span>
                            <span class="lotus-minutes" id="lotus-m">00</span>
                        </div>
                        <div class="lotus-seconds-display">
                            <span id="lotus-s">00</span>
                        </div>
                        <div class="lotus-date" id="lotus-date">LOADING</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.lotus-stage'),
            h: document.getElementById('lotus-h'),
            m: document.getElementById('lotus-m'),
            s: document.getElementById('lotus-s'),
            date: document.getElementById('lotus-date'),
            secRing: document.getElementById('lotus-sec-ring'),
            particles: document.getElementById('lotus-particles')
        };

        this.circumference = circumference;

        const s = settings || {};
        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyBloom(s.bloom ?? this.settingsConfig.bloom.default);
        this.applySpeed(s.speed ?? this.settingsConfig.speed.default);
        this.applyScale(s.scale ?? this.settingsConfig.scale.default);

        if (!this.particlesCreated) {
            this.createParticles();
            this.particlesCreated = true;
        }
    },

    createParticles: function () {
        if (!this.els.particles) return;
        const count = 20;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'lotus-particle';
            const x = Math.random() * 100;
            const delay = Math.random() * 15;
            const dur = 10 + Math.random() * 12;
            const size = 2 + Math.random() * 3;
            p.style.left = x + '%';
            p.style.bottom = '-5%';
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.animationDuration = dur + 's';
            p.style.animationDelay = '-' + delay + 's';
            p.style.opacity = '0';
            this.els.particles.appendChild(p);
        }
    },

    update: function (t) {
        if (!this.els.h) return;
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        this.els.s.innerText = t.s;

        const secNum = parseInt(t.s, 10);
        const offset = this.circumference - (secNum / 60) * this.circumference;
        this.els.secRing.style.strokeDashoffset = offset;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        this.els.date.textContent = dateStr;
    },

    applyHue: function (val) {
        const h = Number(val);
        const el = this.els.stage;
        if (!el) return;
        if (h === 0) {
            el.style.setProperty('--lotus-p1', 'hsl(280, 80%, 65%)');
            el.style.setProperty('--lotus-p2', 'hsl(320, 75%, 60%)');
            el.style.setProperty('--lotus-p3', 'hsl(200, 80%, 65%)');
            el.style.setProperty('--lotus-glow', 'hsl(280, 90%, 75%)');
        } else {
            el.style.setProperty('--lotus-p1', `hsl(${h}, 80%, 65%)`);
            el.style.setProperty('--lotus-p2', `hsl(${(h + 50) % 360}, 75%, 60%)`);
            el.style.setProperty('--lotus-p3', `hsl(${(h + 140) % 360}, 80%, 65%)`);
            el.style.setProperty('--lotus-glow', `hsl(${h}, 90%, 75%)`);
        }
        el.style.setProperty('--lotus-hue', h);
    },

    applyBloom: function (val) {
        const el = this.els.stage;
        if (el) el.style.setProperty('--lotus-bloom', val / 100);
    },

    applySpeed: function (val) {
        const el = this.els.stage;
        if (el) el.style.setProperty('--lotus-speed', val / 50);
    },

    applyScale: function (val) {
        const el = this.els.stage;
        if (el) el.style.setProperty('--lotus-scale', val / 100);
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'bloom') this.applyBloom(val);
        if (key === 'speed') this.applySpeed(val);
        if (key === 'scale') this.applyScale(val);
    },

    destroy: function () {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        const el = this.els.stage;
        if (el) {
            ['--lotus-p1', '--lotus-p2', '--lotus-p3', '--lotus-glow', '--lotus-bloom', '--lotus-speed', '--lotus-scale', '--lotus-hue'].forEach(
                v => el.style.removeProperty(v)
            );
        }
        this.els = {};
        this.particlesCreated = false;
    }
};
