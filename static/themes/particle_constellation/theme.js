window.ActiveTheme = {
    els: {},
    particles: [],
    ctx: null,
    canvas: null,
    raf: null,
    running: false,
    currentHue: 190,
    t0: 0,

    settingsConfig: {
        scale: {
            type: 'range',
            label: 'Size Zoom',
            default: 100,
            min: 50,
            max: 160,
            displaySuffix: '%'
        },
        hue: {
            type: 'palette',
            label: 'Color',
            default: 190,
            options: [190, 280, 150, 330, 35, 0] // cyan, violet, green, pink, gold, multi
        },
        density: {
            type: 'range',
            label: 'Stars',
            default: 90,
            min: 30,
            max: 180
        }
    },

    init: function (stage, savedSettings) {
        stage.innerHTML = `
            <div class="pc-stage">
                <canvas class="pc-canvas"></canvas>
                <div class="pc-clock" id="pc-clock">
                    <div class="pc-time">
                        <span id="pc-h">00</span><span id="pc-sep">:</span><span id="pc-m">00</span>
                    </div>
                    <div class="pc-sub">
                        <span id="pc-s">00</span>
                        <span id="pc-date">—</span>
                    </div>
                </div>
            </div>
        `;

        this.els.stage = stage.querySelector('.pc-stage');
        this.els.clock = document.getElementById('pc-clock');
        this.els.h     = document.getElementById('pc-h');
        this.els.m     = document.getElementById('pc-m');
        this.els.s     = document.getElementById('pc-s');
        this.els.sep   = document.getElementById('pc-sep');
        this.els.date  = document.getElementById('pc-date');
        this.canvas    = stage.querySelector('.pc-canvas');
        this.ctx       = this.canvas.getContext('2d');

        this.settings = Object.assign({}, savedSettings);
        this.t0 = performance.now();

        this.applyScale(this.settings.scale ?? 100);
        this.applyHue(this.settings.hue ?? 190);

        this._onResize = () => this.resize();
        window.addEventListener('resize', this._onResize);

        // wait one frame so layout has real width/height, then init canvas
        requestAnimationFrame(() => {
            this.ensureGsap(() => {
                this.resize();
                this.buildParticles(this.settings.density ?? 90);
                this.start();
            });
        });

        this.update({ raw: new Date() });
    },

    ensureGsap: function (cb) {
        if (window.gsap) { cb(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
        s.onload = cb;
        s.onerror = () => { console.warn('GSAP failed; using static fallback.'); cb(); };
        document.head.appendChild(s);
    },

    resize: function () {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // fall back to window size if stage hasn't laid out yet
        const w = this.els.stage.clientWidth  || window.innerWidth;
        const h = this.els.stage.clientHeight || window.innerHeight;
        this.w = w; this.h = h; this.dpr = dpr;
        this.canvas.width  = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width  = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cx = w / 2;
        this.cy = h / 2;
        this.linkDist = Math.max(90, Math.min(w, h) * 0.18);
    },

    buildParticles: function (count) {
        if (window.gsap) gsap.killTweensOf(this.particles);
        this.particles = [];
        count = Number(count);
        for (let i = 0; i < count; i++) {
            // depth: 0 (far/small/slow) -> 1 (near/big/fast)
            const depth = Math.random();
            const p = {
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                depth: depth,
                r: 0.6 + depth * 2.4,
                hueOffset: Math.random() * 70,
                tw: Math.random() * Math.PI * 2,   // twinkle phase
                twSpeed: 0.6 + Math.random() * 1.4
            };
            this.particles.push(p);
            this.animateParticle(p);
        }
    },

    animateParticle: function (p) {
        if (!window.gsap) return;
        const move = () => {
            // nearer particles drift faster (parallax)
            const dur = 16 - p.depth * 9 + Math.random() * 6;
            gsap.to(p, {
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                duration: dur,
                ease: 'sine.inOut',
                onComplete: move
            });
        };
        move();
    },

    setDensity: function (count) {
        this.buildParticles(count);
    },

    start: function () {
        if (this.running) return;
        this.running = true;
        const loop = () => {
            if (!this.running) return;
            this.draw();
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    },

    draw: function () {
        const ctx = this.ctx;
        const ps  = this.particles;
        const now = (performance.now() - this.t0) / 1000;
        ctx.clearRect(0, 0, this.w, this.h);

        const multi = (this.currentHue === 0);
        const baseHue = this.currentHue;
        const maxD = this.linkDist;

        // --- connection lines (brighter toward the center) ---
        ctx.lineWidth = 1;
        for (let i = 0; i < ps.length; i++) {
            const a = ps[i];
            for (let j = i + 1; j < ps.length; j++) {
                const b = ps[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxD) {
                    // distance of midpoint from center -> central glow
                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                    const cd = Math.sqrt((mx - this.cx) ** 2 + (my - this.cy) ** 2);
                    const central = 1 - Math.min(cd / (Math.min(this.w, this.h) * 0.6), 1);
                    const alpha = (1 - dist / maxD) * (0.18 + central * 0.45);
                    const hue = multi ? (a.hueOffset * 5) % 360 : baseHue;
                    ctx.strokeStyle = `hsla(${hue}, 85%, 68%, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // --- glowing twinkling stars ---
        ctx.shadowBlur = 10;
        for (let i = 0; i < ps.length; i++) {
            const p = ps[i];
            const twinkle = 0.55 + 0.45 * Math.sin(now * p.twSpeed + p.tw);
            const hue = multi
                ? (p.hueOffset * 5) % 360
                : (baseHue + p.hueOffset * 0.25) % 360;
            const light = 55 + p.depth * 25;
            ctx.globalAlpha = twinkle;
            ctx.fillStyle   = `hsl(${hue}, 90%, ${light}%)`;
            ctx.shadowColor = `hsl(${hue}, 95%, 65%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    },

    update: function (t) {
        const now = (t && t.raw) ? t.raw : new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        this.els.h.innerText = h;
        this.els.m.innerText = m;
        this.els.s.innerText = s;
        this.els.sep.style.opacity = (now.getSeconds() % 2 === 0) ? '1' : '0.25';

        const opts = { weekday: 'short', month: 'short', day: 'numeric' };
        this.els.date.innerText = now.toLocaleDateString(undefined, opts).toUpperCase();
    },

    applyScale: function (val) {
        this.els.clock.style.transform = `translate(-50%, -50%) scale(${val / 100})`;
    },

    applyHue: function (val) {
        const h = Number(val);
        this.currentHue = h;
        const glow = (h === 0) ? 'hsl(280, 90%, 75%)' : `hsl(${h}, 90%, 72%)`;
        const txt  = (h === 0) ? '#ffffff' : `hsl(${h}, 45%, 96%)`;
        this.els.stage.style.setProperty('--glow', glow);
        this.els.clock.style.color = txt;
    },

    onSettingsChange: function (key, val) {
        if (key === 'scale')   this.applyScale(val);
        if (key === 'hue')     this.applyHue(val);
        if (key === 'density') this.setDensity(val);
    },

    destroy: function () {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        if (window.gsap) gsap.killTweensOf(this.particles);
        window.removeEventListener('resize', this._onResize);
        this.particles = [];
        this.els = {};
    }
};
