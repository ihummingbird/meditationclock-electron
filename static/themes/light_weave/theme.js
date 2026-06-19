window.ActiveTheme = {
    els: {},
    rafId: null,
    circumference: 0,

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Prism',
            default: 200,
            options: [200, 260, 340, 170, 30, 50]
        },
        speed: {
            type: 'range',
            label: 'Weave Speed',
            default: 50,
            min: 10,
            max: 100,
            displaySuffix: '%'
        },
        petals: {
            type: 'select',
            label: 'Complexity',
            default: '12',
            options: [
                { value: '8', text: '8 Fold' },
                { value: '12', text: '12 Fold' },
                { value: '16', text: '16 Fold' }
            ]
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
        this.circumference = 2 * Math.PI * 360;
        const s = settings || {};

        stage.innerHTML = `
            <div class="lw-stage" id="lw-root">
                <div class="lw-ambient">
                    <div class="lw-orb"></div>
                    <div class="lw-orb"></div>
                    <div class="lw-orb"></div>
                </div>
                <div class="lw-particles" id="lw-particles"></div>

                <div class="lw-mandala" id="lw-mandala">
                    <svg class="lw-svg" viewBox="0 0 400 400" id="lw-svg"></svg>

                    <div class="lw-orbit-ring"></div>
                    <div class="lw-orbit-ring"></div>
                    <div class="lw-orbit-ring"></div>

                    <div class="lw-orbit-dot" id="lw-dot"></div>

                    <div class="lw-sec-arc">
                        <svg viewBox="0 0 800 800">
                            <circle class="lw-arc-track" cx="400" cy="400" r="360" />
                            <circle class="lw-arc-fill" id="lw-arc" cx="400" cy="400" r="360"
                                stroke-dasharray="${this.circumference}"
                                stroke-dashoffset="${this.circumference}" />
                        </svg>
                    </div>

                    <div class="lw-capsule">
                        <div class="lw-time">
                            <span class="lw-hours" id="lw-h">00</span>
                            <span class="lw-sep"></span>
                            <span class="lw-minutes" id="lw-m">00</span>
                        </div>
                        <div class="lw-seconds-label">
                            <span id="lw-s">00</span>
                        </div>
                        <div class="lw-date" id="lw-date">LOADING</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.lw-stage'),
            mandala: document.getElementById('lw-mandala'),
            svg: document.getElementById('lw-svg'),
            h: document.getElementById('lw-h'),
            m: document.getElementById('lw-m'),
            s: document.getElementById('lw-s'),
            date: document.getElementById('lw-date'),
            arc: document.getElementById('lw-arc'),
            dot: document.getElementById('lw-dot'),
            particles: document.getElementById('lw-particles')
        };

        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyScale(s.scale ?? this.settingsConfig.scale.default);
        this.applySpeed(s.speed ?? this.settingsConfig.speed.default);

        this.buildMandala(s.petals ?? this.settingsConfig.petals.default);
        this.createParticles();
        this.startAnimations();
    },

    buildMandala: function (foldStr) {
        if (!this.els.svg) return;
        const fold = parseInt(foldStr, 10) || 12;
        const cx = 200, cy = 200;
        let svgContent = '';

        // 3 concentric ring groups, each with different rotation
        const rings = [
            { r: 160, arcs: fold, cls: 'lw-arc-c1', sw: 1.5, group: 1 },
            { r: 120, arcs: fold, cls: 'lw-arc-c2', sw: 1.2, group: 2 },
            { r: 80, arcs: Math.floor(fold * 0.75), cls: 'lw-arc-c3', sw: 1, group: 3 }
        ];

        rings.forEach(ring => {
            svgContent += `<g class="lw-ring-group lw-ring-g${ring.group}">`;
            for (let i = 0; i < ring.arcs; i++) {
                const angle = (i / ring.arcs) * 360;
                const startAngle = (angle - 8) * (Math.PI / 180);
                const endAngle = (angle + 8) * (Math.PI / 180);
                const x1 = cx + Math.cos(startAngle) * ring.r;
                const y1 = cy + Math.sin(startAngle) * ring.r;
                const x2 = cx + Math.cos(endAngle) * ring.r;
                const y2 = cy + Math.sin(endAngle) * ring.r;

                svgContent += `<path class="lw-arc ${ring.cls}" stroke-width="${ring.sw}" d="M${x1},${y1} A${ring.r},${ring.r} 0 0,1 ${x2},${y2}"/>`;
            }
            svgContent += '</g>';
        });

        // Connecting lines between rings (sacred geometry feel)
        svgContent += `<g class="lw-ring-group lw-ring-g1">`;
        for (let i = 0; i < fold; i++) {
            const angle = (i / fold) * 360 * (Math.PI / 180);
            const x1 = cx + Math.cos(angle) * 80;
            const y1 = cy + Math.sin(angle) * 80;
            const x2 = cx + Math.cos(angle) * 160;
            const y2 = cy + Math.sin(angle) * 160;
            svgContent += `<line class="lw-arc lw-arc-c1" stroke-width="0.5" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" opacity="0.2"/>`;
        }
        svgContent += '</g>';

        this.els.svg.innerHTML = svgContent;
    },

    createParticles: function () {
        if (!this.els.particles) return;
        this.els.particles.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            p.className = 'lw-dot';
            p.style.left = (Math.random() * 100) + '%';
            p.style.bottom = '-3%';
            const size = 1.5 + Math.random() * 2.5;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            fragment.appendChild(p);
        }
        this.els.particles.appendChild(fragment);
    },

    startAnimations: function () {
        this.stopAnimations();

        // Orbit dot circular motion via GSAP rotation on a parent
        if (this.els.dot) {
            // Wrap dot in a rotator for clean circular motion
            const dotParent = this.els.dot.parentElement;
            const rotator = document.createElement('div');
            rotator.style.cssText = 'position:absolute;inset:0;border-radius:50%;z-index:6;';
            this.els.dot.style.position = 'absolute';
            this.els.dot.style.top = '0';
            this.els.dot.style.left = '50%';
            this.els.dot.style.marginLeft = '-3px';
            this.els.dot.style.marginTop = '-3px';
            rotator.appendChild(this.els.dot);
            dotParent.appendChild(rotator);
            this._dotRotator = rotator;

            const dotAnim = gsap.to(rotator, {
                rotation: 360,
                duration: 12,
                ease: 'none',
                repeat: -1,
                transformOrigin: '50% 50%'
            });
            this._dotAnim = dotAnim;
        }

        // Particle drift with GSAP
        const dots = this.els.particles ? this.els.particles.querySelectorAll('.lw-dot') : [];
        dots.forEach((dot, i) => {
            const xDrift = -40 + Math.random() * 80;
            const dur = 7000 + Math.random() * 8000;
            const anim = gsap.to(dot, {
                y: -(window.innerHeight * 1.1),
                x: xDrift,
                opacity: 0.6,
                duration: dur / 1000,
                ease: 'none',
                repeat: -1,
                delay: Math.random() * -dur / 1000
            });
            this._particleAnims = this._particleAnims || [];
            this._particleAnims.push(anim);
        });

        // Subtle mandala breathing (opacity pulse to avoid conflicting with applyScale)
        if (this.els.mandala) {
            this._breatheAnim = gsap.to(this.els.svg, {
                opacity: 0.7,
                duration: 3,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }
    },

    stopAnimations: function () {
        if (this._dotAnim) { this._dotAnim.kill(); this._dotAnim = null; }
        if (this._breatheAnim) { this._breatheAnim.kill(); this._breatheAnim = null; }
        if (this._particleAnims) {
            this._particleAnims.forEach(a => a.kill());
            this._particleAnims = [];
        }
    },

    update: function (t) {
        if (!this.els.h) return;
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        this.els.s.innerText = t.s;

        const secNum = parseInt(t.s, 10);
        const offset = this.circumference - (secNum / 60) * this.circumference;
        this.els.arc.style.strokeDashoffset = offset;

        const now = new Date();
        this.els.date.textContent = now.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    },

    applyHue: function (val) {
        const h = Number(val);
        const el = this.els.stage;
        if (!el) return;
        el.style.setProperty('--lw-c1', `hsl(${h}, 85%, 65%)`);
        el.style.setProperty('--lw-c2', `hsl(${(h + 60) % 360}, 80%, 60%)`);
        el.style.setProperty('--lw-c3', `hsl(${(h + 140) % 360}, 80%, 65%)`);
        el.style.setProperty('--lw-glow', `hsl(${h}, 90%, 75%)`);
    },

    applyScale: function (val) {
        if (this.els.mandala) {
            this.els.mandala.style.transform = `scale(${val / 100})`;
        }
    },

    applySpeed: function (val) {
        document.documentElement.style.setProperty('--lw-speed', val / 50);
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'scale') this.applyScale(val);
        if (key === 'speed') this.applySpeed(val);
        if (key === 'petals') {
            this.buildMandala(val);
        }
    },

    destroy: function () {
        this.stopAnimations();
        if (this._dotRotator && this._dotRotator.parentNode) {
            this._dotRotator.parentNode.removeChild(this._dotRotator);
        }
        this.els = {};
    }
};
