window.ActiveTheme = {
    els: {},
    anims: [],

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
            options: [190, 280, 150, 330, 40, 0] // cyan, violet, mint, rose, gold, red
        },
        spin: {
            type: 'range',
            label: 'Spin Speed',
            default: 100,
            min: 20,
            max: 220,
            displaySuffix: '%'
        }
    },

    // build a cube of `size` px with N glowing edges
    _cube: function (size, cls) {
        const h = size / 2;
        const faces = [
            `rotateY(0deg) translateZ(${h}px)`,
            `rotateY(180deg) translateZ(${h}px)`,
            `rotateY(90deg) translateZ(${h}px)`,
            `rotateY(-90deg) translateZ(${h}px)`,
            `rotateX(90deg) translateZ(${h}px)`,
            `rotateX(-90deg) translateZ(${h}px)`
        ];
        let f = '';
        faces.forEach(t => {
            f += `<div class="tess-face ${cls}"
                    style="width:${size}px;height:${size}px;
                    margin:-${h}px;transform:${t}"></div>`;
        });
        return `<div class="tess-cube ${cls}-cube" style="width:0;height:0">${f}</div>`;
    },

    init: function (stage, savedSettings) {
        this.settings = Object.assign({}, savedSettings);

        stage.innerHTML = `
            <div class="tess-stage">
                <div class="tess-scene" id="tess-scene">
                    <div class="tess-rig" id="tess-rig">
                        ${this._cube(320, 'tess-h')}
                        ${this._cube(220, 'tess-m')}
                        ${this._cube(130, 'tess-s')}
                        <div class="tess-core" id="tess-core">
                            <div class="tess-time" id="tess-time">00:00</div>
                            <div class="tess-sec"  id="tess-sec">00</div>
                            <div class="tess-date" id="tess-date">—</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els.stage = stage.querySelector('.tess-stage');
        this.els.scene = document.getElementById('tess-scene');
        this.els.rig   = document.getElementById('tess-rig');
        this.els.hCube = stage.querySelector('.tess-h-cube');
        this.els.mCube = stage.querySelector('.tess-m-cube');
        this.els.sCube = stage.querySelector('.tess-s-cube');
        this.els.time  = document.getElementById('tess-time');
        this.els.secEl = document.getElementById('tess-sec');
        this.els.date  = document.getElementById('tess-date');

        this.applyScale(this.settings.scale ?? 100);
        this.applyHue(this.settings.hue ?? 190);

        // parallax tilt state
        this.tilt = { x: 0, y: 0, tx: 0, ty: 0 };
        this._onMove = (e) => {
            const p = e.touches ? e.touches[0] : e;
            this.tilt.tx = (p.clientY / window.innerHeight - 0.5) * -24;
            this.tilt.ty = (p.clientX / window.innerWidth  - 0.5) *  24;
        };
        window.addEventListener('mousemove', this._onMove);
        window.addEventListener('touchmove', this._onMove, { passive: true });

        const start = () => {
            if (typeof anime === 'undefined') { setTimeout(start, 60); return; }
            this._startAnime();
        };
        this._ensureAnime(start);

        // smooth render loop for parallax + clock rotation
        this.running = true;
        const loop = () => {
            if (!this.running) return;
            this._frame();
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);

        this.update({ raw: new Date() });
    },

    _ensureAnime: function (cb) {
        if (typeof anime !== 'undefined') return cb();
        if (document.getElementById('tess-anime-lib')) { cb(); return; }
        const s = document.createElement('script');
        s.id = 'tess-anime-lib';
        s.src = 'https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js';
        s.onload = cb;
        document.head.appendChild(s);
    },

    _startAnime: function () {
        const sp = (this.settings.spin ?? 100) / 100;

        // each cube tumbles on a different axis combo
        this.anims.push(anime({
            targets: this.els.hCube,
            rotateX: [0, 360], rotateY: [0, -360],
            duration: 60000 / sp, easing: 'linear', loop: true
        }));
        this.anims.push(anime({
            targets: this.els.mCube,
            rotateY: [0, 360], rotateZ: [0, 360],
            duration: 28000 / sp, easing: 'linear', loop: true
        }));
        this.anims.push(anime({
            targets: this.els.sCube,
            rotateX: [0, -360], rotateZ: [0, 360],
            duration: 11000 / sp, easing: 'linear', loop: true
        }));

        // breathing glow on the core
        this.anims.push(anime({
            targets: this.els.core || document.getElementById('tess-core'),
            scale: [1, 1.06],
            direction: 'alternate', loop: true,
            duration: 2400, easing: 'easeInOutSine'
        }));
    },

    _frame: function () {
        // ease parallax tilt
        this.tilt.x += (this.tilt.tx - this.tilt.x) * 0.06;
        this.tilt.y += (this.tilt.ty - this.tilt.y) * 0.06;
        this.els.rig.style.transform =
            `rotateX(${this.tilt.x.toFixed(2)}deg) rotateY(${this.tilt.y.toFixed(2)}deg)`;
    },

    update: function (t) {
        const now = (t && t.raw) ? t.raw : new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        this.els.time.innerText = `${h}:${m}`;
        this.els.secEl.innerText = s;
        const opts = { weekday: 'short', month: 'short', day: 'numeric' };
        this.els.date.innerText = now.toLocaleDateString(undefined, opts).toUpperCase();
    },

    applyScale: function (val) {
        this.els.scene.style.transform =
            `translate(-50%, -50%) scale(${val / 100})`;
    },

    applyHue: function (val) {
        const h = Number(val);
        const st = this.els.stage.style;
        st.setProperty('--hue', h);
        st.setProperty('--c1', `hsl(${h}, 95%, 65%)`);
        st.setProperty('--c2', `hsl(${(h + 40) % 360}, 90%, 60%)`);
        st.setProperty('--c-glow', `hsla(${h}, 95%, 65%, 0.55)`);
    },

    onSettingsChange: function (key, val) {
        if (key === 'scale') this.applyScale(val);
        if (key === 'hue')   this.applyHue(val);
        if (key === 'spin') {
            // rebuild spin tweens at new speed
            this.anims.forEach(a => a.pause && a.pause());
            this.anims = [];
            if (typeof anime !== 'undefined') this._startAnime();
        }
    },

    destroy: function () {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.anims.forEach(a => { if (a.pause) a.pause(); });
        this.anims = [];
        window.removeEventListener('mousemove', this._onMove);
        window.removeEventListener('touchmove', this._onMove);
        this.els = {};
    }
};
