window.ActiveTheme = {
    els: {},
    gsapAnims: [],
    circumference: 0,

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Void',
            default: 260,
            options: [260, 310, 200, 340, 190, 20]
        },
        layers: {
            type: 'select',
            label: 'Layers',
            default: '7',
            options: [
                { value: '5', text: '5 Rings' },
                { value: '7', text: '7 Rings' },
                { value: '9', text: '9 Rings (Heavy)' }
            ]
        },
        speed: {
            type: 'range',
            label: 'Chaos Speed',
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
        this.circumference = 2 * Math.PI * 480;
        const s = settings || {};

        stage.innerHTML = `
            <div class="vc-stage" id="vc-root">
                <div class="vc-ambient">
                    <div class="vc-ambient-orb"></div>
                    <div class="vc-ambient-orb"></div>
                    <div class="vc-ambient-orb"></div>
                </div>
                <div class="vc-particles" id="vc-particles"></div>

                <div class="vc-cathedral" id="vc-cathedral">
                    <svg class="vc-svg" viewBox="0 0 500 500" id="vc-svg"></svg>

                    <div class="vc-sec-arc">
                        <svg viewBox="0 0 1000 1000">
                            <circle class="vc-arc-track" cx="500" cy="500" r="480" />
                            <circle class="vc-arc-fill" id="vc-arc" cx="500" cy="500" r="480"
                                stroke-dasharray="${this.circumference}"
                                stroke-dashoffset="${this.circumference}" />
                        </svg>
                    </div>

                    <div class="vc-capsule">
                        <div class="vc-time">
                            <span class="vc-hours" id="vc-h">00</span>
                            <span class="vc-sep"></span>
                            <span class="vc-minutes" id="vc-m">00</span>
                        </div>
                        <div class="vc-seconds-label">
                            <span id="vc-s">00</span>
                        </div>
                        <div class="vc-date" id="vc-date">LOADING</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.vc-stage'),
            cathedral: document.getElementById('vc-cathedral'),
            svg: document.getElementById('vc-svg'),
            h: document.getElementById('vc-h'),
            m: document.getElementById('vc-m'),
            s: document.getElementById('vc-s'),
            date: document.getElementById('vc-date'),
            arc: document.getElementById('vc-arc'),
            particles: document.getElementById('vc-particles')
        };

        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyScale(s.scale ?? this.settingsConfig.scale.default);

        this.buildCathedral(s.layers ?? this.settingsConfig.layers.default);
        this.createParticles();
        this.startAnimations(s.speed ?? this.settingsConfig.speed.default);
    },

    buildCathedral: function (layersStr) {
        if (!this.els.svg) return;
        const numLayers = parseInt(layersStr, 10) || 7;
        const cx = 250, cy = 250;
        let svg = '';

        const layerDefs = this.getLayerDefinitions(numLayers);

        layerDefs.forEach((def, idx) => {
            const ringId = `vc-ring-${idx}`;
            svg += `<g class="vc-ring" id="${ringId}">`;

            if (def.type === 'arcs') {
                svg += this.buildArcRing(cx, cy, def);
            } else if (def.type === 'teeth') {
                svg += this.buildTeethRing(cx, cy, def);
            } else if (def.type === 'spokes') {
                svg += this.buildSpokeRing(cx, cy, def);
            } else if (def.type === 'diamonds') {
                svg += this.buildDiamondRing(cx, cy, def);
            } else if (def.type === 'hex') {
                svg += this.buildHexRing(cx, cy, def);
            } else if (def.type === 'arrows') {
                svg += this.buildArrowRing(cx, cy, def);
            } else if (def.type === 'triangles') {
                svg += this.buildTriangleRing(cx, cy, def);
            } else if (def.type === 'dots') {
                svg += this.buildDotRing(cx, cy, def);
            } else if (def.type === 'cross') {
                svg += this.buildCrossRing(cx, cy, def);
            }

            svg += '</g>';
        });

        // Central hexagon core
        svg += this.buildHexCore(cx, cy);

        // Connecting radial lines
        svg += `<g class="vc-ring" id="vc-ring-lines">`;
        for (let i = 0; i < numLayers * 2; i++) {
            const angle = (i / (numLayers * 2)) * 360 * (Math.PI / 180);
            const r1 = 45;
            const r2 = layerDefs[layerDefs.length - 1].r + 10;
            const x1 = cx + Math.cos(angle) * r1;
            const y1 = cy + Math.sin(angle) * r1;
            const x2 = cx + Math.cos(angle) * r2;
            const y2 = cy + Math.sin(angle) * r2;
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--vc-c1)" stroke-width="0.3" opacity="0.15"/>`;
        }
        svg += '</g>';

        this.els.svg.innerHTML = svg;
    },

    getLayerDefinitions: function (count) {
        const allLayers = [
            { r: 230, type: 'arrows',  count: 8,  cls: 'vc-c1', sw: 1.8, dur: 40, dir: 1 },
            { r: 205, type: 'triangles', count: 12, cls: 'vc-c2', sw: 1.2, dur: 55, dir: -1 },
            { r: 180, type: 'arcs',    count: 16, cls: 'vc-c3', sw: 1.5, dur: 35, dir: 1 },
            { r: 155, type: 'hex',     count: 6,  cls: 'vc-c1', sw: 1,   dur: 60, dir: -1 },
            { r: 130, type: 'teeth',   count: 20, cls: 'vc-c4', sw: 1.2, dur: 28, dir: 1 },
            { r: 108, type: 'diamonds', count: 10, cls: 'vc-c2', sw: 1,   dur: 45, dir: -1 },
            { r: 88,  type: 'spokes',  count: 24, cls: 'vc-c3', sw: 0.8, dur: 32, dir: 1 },
            { r: 70,  type: 'dots',    count: 8,  cls: 'vc-c1', sw: 1,   dur: 50, dir: -1 },
            { r: 55,  type: 'cross',   count: 4,  cls: 'vc-c4', sw: 0.8, dur: 20, dir: 1 }
        ];

        if (count <= 5) {
            return allLayers.filter((_, i) => i % 2 === 0).slice(0, 5);
        }
        return allLayers.slice(0, count);
    },

    buildArcRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360;
            const gap = 360 / def.count * 0.4;
            const a1 = (angle - gap) * (Math.PI / 180);
            const a2 = (angle + gap) * (Math.PI / 180);
            const x1 = cx + Math.cos(a1) * def.r;
            const y1 = cy + Math.sin(a1) * def.r;
            const x2 = cx + Math.cos(a2) * def.r;
            const y2 = cy + Math.sin(a2) * def.r;
            s += `<path d="M${x1},${y1} A${def.r},${def.r} 0 0,1 ${x2},${y2}" fill="none" stroke="var(--${def.cls})" stroke-width="${def.sw}" stroke-linecap="round" opacity="0.5"/>`;
        }
        return s;
    },

    buildTeethRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const nextAngle = ((i + 0.5) / def.count) * 360 * (Math.PI / 180);
            const rInner = def.r - 8;
            const rOuter = def.r + 8;
            const x1 = cx + Math.cos(angle) * rInner;
            const y1 = cy + Math.sin(angle) * rInner;
            const x2 = cx + Math.cos(angle) * rOuter;
            const y2 = cy + Math.sin(angle) * rOuter;
            const x3 = cx + Math.cos(nextAngle) * rOuter;
            const y3 = cy + Math.sin(nextAngle) * rOuter;
            const x4 = cx + Math.cos(nextAngle) * rInner;
            const y4 = cy + Math.sin(nextAngle) * rInner;
            s += `<path d="M${x1},${y1} L${x2},${y2} L${x3},${y3} L${x4},${y4} Z" fill="var(--${def.cls})" opacity="0.12" stroke="var(--${def.cls})" stroke-width="0.5"/>`;
        }
        return s;
    },

    buildSpokeRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const x1 = cx + Math.cos(angle) * (def.r - 6);
            const y1 = cy + Math.sin(angle) * (def.r - 6);
            const x2 = cx + Math.cos(angle) * (def.r + 6);
            const y2 = cy + Math.sin(angle) * (def.r + 6);
            s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--${def.cls})" stroke-width="${def.sw}" stroke-linecap="round" opacity="0.35"/>`;
        }
        return s;
    },

    buildDiamondRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const r = def.r;
            const size = 7;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            const dx = Math.cos(angle) * size;
            const dy = Math.sin(angle) * size;
            const nx = -dy * 0.6;
            const ny = dx * 0.6;
            s += `<path d="M${px + dx},${py + dy} L${px + nx},${py + ny} L${px - dx},${py - dy} L${px - nx},${py - ny} Z" fill="var(--${def.cls})" opacity="0.2" stroke="var(--${def.cls})" stroke-width="0.5"/>`;
        }
        return s;
    },

    buildHexRing: function (cx, cy, def) {
        let s = '';
        const pts = [];
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            pts.push(`${cx + Math.cos(angle) * def.r},${cy + Math.sin(angle) * def.r}`);
        }
        s += `<polygon points="${pts.join(' ')}" fill="none" stroke="var(--${def.cls})" stroke-width="${def.sw}" opacity="0.3"/>`;
        return s;
    },

    buildArrowRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const tipR = def.r + 15;
            const baseR = def.r - 10;
            const spread = 0.15;
            const tipX = cx + Math.cos(angle) * tipR;
            const tipY = cy + Math.sin(angle) * tipR;
            const lx = cx + Math.cos(angle - spread) * baseR;
            const ly = cy + Math.sin(angle - spread) * baseR;
            const rx = cx + Math.cos(angle + spread) * baseR;
            const ry = cy + Math.sin(angle + spread) * baseR;
            s += `<path d="M${tipX},${tipY} L${lx},${ly} L${rx},${ry} Z" fill="var(--${def.cls})" opacity="0.1" stroke="var(--${def.cls})" stroke-width="${def.sw}" stroke-linejoin="round"/>`;
        }
        return s;
    },

    buildTriangleRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const r1 = def.r - 10;
            const r2 = def.r + 10;
            const a1 = angle - 0.12;
            const a2 = angle + 0.12;
            const p1x = cx + Math.cos(angle) * r2;
            const p1y = cy + Math.sin(angle) * r2;
            const p2x = cx + Math.cos(a1) * r1;
            const p2y = cy + Math.sin(a1) * r1;
            const p3x = cx + Math.cos(a2) * r1;
            const p3y = cy + Math.sin(a2) * r1;
            s += `<path d="M${p1x},${p1y} L${p2x},${p2y} L${p3x},${p3y} Z" fill="none" stroke="var(--${def.cls})" stroke-width="${def.sw}" opacity="0.4" stroke-linejoin="round"/>`;
        }
        return s;
    },

    buildDotRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const px = cx + Math.cos(angle) * def.r;
            const py = cy + Math.sin(angle) * def.r;
            s += `<circle cx="${px}" cy="${py}" r="3" fill="var(--${def.cls})" opacity="0.5"/>`;
            s += `<circle cx="${px}" cy="${py}" r="6" fill="none" stroke="var(--${def.cls})" stroke-width="0.5" opacity="0.25"/>`;
        }
        return s;
    },

    buildCrossRing: function (cx, cy, def) {
        let s = '';
        for (let i = 0; i < def.count; i++) {
            const angle = (i / def.count) * 360 * (Math.PI / 180);
            const px = cx + Math.cos(angle) * def.r;
            const py = cy + Math.sin(angle) * def.r;
            const len = 5;
            s += `<line x1="${px - len}" y1="${py}" x2="${px + len}" y2="${py}" stroke="var(--${def.cls})" stroke-width="${def.sw}" opacity="0.4"/>`;
            s += `<line x1="${px}" y1="${py - len}" x2="${px}" y2="${py + len}" stroke="var(--${def.cls})" stroke-width="${def.sw}" opacity="0.4"/>`;
        }
        return s;
    },

    buildHexCore: function (cx, cy) {
        const r = 40;
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * 360 * (Math.PI / 180) - Math.PI / 6;
            pts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
        }
        let s = `<polygon points="${pts.join(' ')}" fill="none" stroke="var(--vc-c1)" stroke-width="1.5" opacity="0.4"/>`;

        // Inner hex
        const r2 = 25;
        const pts2 = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * 360 * (Math.PI / 180) + Math.PI / 6;
            pts2.push(`${cx + Math.cos(angle) * r2},${cy + Math.sin(angle) * r2}`);
        }
        s += `<polygon points="${pts2.join(' ')}" fill="var(--vc-c1)" opacity="0.06" stroke="var(--vc-c2)" stroke-width="0.8"/>`;

        // Center dot
        s += `<circle cx="${cx}" cy="${cy}" r="4" fill="var(--vc-glow)" opacity="0.6"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="var(--vc-glow)" stroke-width="0.5" opacity="0.3"/>`;

        return s;
    },

    createParticles: function () {
        if (!this.els.particles) return;
        this.els.particles.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 35; i++) {
            const p = document.createElement('div');
            p.className = 'vc-dot';
            p.style.left = (Math.random() * 100) + '%';
            p.style.bottom = '-3%';
            const size = 1 + Math.random() * 3;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            fragment.appendChild(p);
        }
        this.els.particles.appendChild(fragment);
    },

    startAnimations: function (speedVal) {
        this.stopAnimations();
        const speed = (Number(speedVal) || 50) / 50;

        // Rotate each ring with GSAP
        const rings = this.els.svg ? this.els.svg.querySelectorAll('.vc-ring') : [];
        rings.forEach((ring, i) => {
            const dur = (30 + i * 7) / speed;
            const dir = i % 2 === 0 ? 360 : -360;
            const anim = gsap.to(ring, {
                rotation: dir,
                duration: dur,
                ease: 'none',
                repeat: -1,
                svgOrigin: '250 250'
            });
            this.gsapAnims.push(anim);
        });

        // Particle drift
        const dots = this.els.particles ? this.els.particles.querySelectorAll('.vc-dot') : [];
        dots.forEach((dot) => {
            const xDrift = -50 + Math.random() * 100;
            const dur = 6000 + Math.random() * 10000;
            const anim = gsap.to(dot, {
                y: -(window.innerHeight * 1.15),
                x: xDrift,
                opacity: 0.5,
                duration: dur / 1000,
                ease: 'none',
                repeat: -1,
                delay: Math.random() * -dur / 1000
            });
            this.gsapAnims.push(anim);
        });

        // Subtle cathedral breathing (opacity pulse on SVG)
        if (this.els.svg) {
            const breathAnim = gsap.to(this.els.svg, {
                opacity: 0.75,
                duration: 4,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
            this.gsapAnims.push(breathAnim);
        }
    },

    stopAnimations: function () {
        this.gsapAnims.forEach(a => { if (a && a.kill) a.kill(); });
        this.gsapAnims = [];
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
        el.style.setProperty('--vc-c1', `hsl(${h}, 90%, 60%)`);
        el.style.setProperty('--vc-c2', `hsl(${(h + 50) % 360}, 80%, 55%)`);
        el.style.setProperty('--vc-c3', `hsl(${(h + 140) % 360}, 90%, 65%)`);
        el.style.setProperty('--vc-c4', `hsl(${(h + 200) % 360}, 85%, 55%)`);
        el.style.setProperty('--vc-glow', `hsl(${h}, 100%, 75%)`);
    },

    applyScale: function (val) {
        if (this.els.cathedral) {
            this.els.cathedral.style.transform = `scale(${val / 100})`;
        }
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'scale') this.applyScale(val);
        if (key === 'speed') {
            this.stopAnimations();
            this.startAnimations(val);
        }
        if (key === 'layers') {
            this.buildCathedral(val);
            this.stopAnimations();
            this.startAnimations(this.settingsConfig.speed.default);
        }
    },

    destroy: function () {
        this.stopAnimations();
        this.els = {};
    }
};
