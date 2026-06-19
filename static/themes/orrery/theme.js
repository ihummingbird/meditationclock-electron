window.ActiveTheme = {
    els: {},
    currentHue: 200,
    smoothSec: 0,

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
            default: 200,
            options: [200, 280, 150, 330, 35, 12] // azure, violet, green, rose, amber, ember
        },
        ticks: {
            type: 'toggle',
            label: 'Show Numerals',
            default: true
        }
    },

    init: function (stage, savedSettings) {
        this.settings = Object.assign({}, savedSettings);
        const R = 200;                // svg coordinate radius
        const C = R;                  // center

        // build tick marks
        let ticks = '';
        for (let i = 0; i < 60; i++) {
            const big = i % 5 === 0;
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const r1 = big ? 168 : 176;
            const r2 = 182;
            const x1 = C + Math.cos(a) * r1, y1 = C + Math.sin(a) * r1;
            const x2 = C + Math.cos(a) * r2, y2 = C + Math.sin(a) * r2;
            ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
                class="orr-tick ${big ? 'orr-tick-big' : ''}"/>`;
        }

        // numerals
        let nums = '';
        for (let i = 1; i <= 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const rx = C + Math.cos(a) * 145;
            const ry = C + Math.sin(a) * 145;
            nums += `<text x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" class="orr-num">${i}</text>`;
        }

        stage.innerHTML = `
            <div class="orr-stage">
                <div class="orr-wrap" id="orr-wrap">
                    <svg viewBox="0 0 400 400" class="orr-svg">
                        <defs>
                            <radialGradient id="orr-sun" cx="50%" cy="50%" r="50%">
                                <stop offset="0%"  stop-color="#fff"/>
                                <stop offset="35%" stop-color="var(--c-bright)"/>
                                <stop offset="100%" stop-color="var(--c-deep)"/>
                            </radialGradient>
                            <filter id="orr-glow" x="-60%" y="-60%" width="220%" height="220%">
                                <feGaussianBlur stdDeviation="4" result="b"/>
                                <feMerge>
                                    <feMergeNode in="b"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        <!-- orbital rings -->
                        <circle cx="200" cy="200" r="60"  class="orr-orbit"/>
                        <circle cx="200" cy="200" r="105" class="orr-orbit"/>
                        <circle cx="200" cy="200" r="150" class="orr-orbit"/>

                        <!-- dial -->
                        <g class="orr-dial-marks">${ticks}</g>
                        <g class="orr-nums" id="orr-nums">${nums}</g>

                        <!-- sweep arc for seconds -->
                        <circle cx="200" cy="200" r="150" class="orr-sweep" id="orr-sweep"
                            pathLength="60" />

                        <!-- planets (groups rotated around center) -->
                        <g id="orr-hour-g">
                            <circle cx="200" cy="140" r="9" class="orr-planet orr-hour" filter="url(#orr-glow)"/>
                        </g>
                        <g id="orr-min-g">
                            <circle cx="200" cy="95" r="7" class="orr-planet orr-min" filter="url(#orr-glow)"/>
                        </g>
                        <g id="orr-sec-g">
                            <circle cx="200" cy="50" r="4.5" class="orr-planet orr-sec" filter="url(#orr-glow)"/>
                        </g>

                        <!-- sun -->
                        <circle cx="200" cy="200" r="20" fill="url(#orr-sun)" class="orr-suncore" filter="url(#orr-glow)"/>
                    </svg>

                    <div class="orr-digital" id="orr-digital">
                        <span id="orr-dt">00:00</span>
                        <span id="orr-dd">—</span>
                    </div>
                </div>
            </div>
        `;

        this.els.stage   = stage.querySelector('.orr-stage');
        this.els.wrap    = document.getElementById('orr-wrap');
        this.els.hourG   = document.getElementById('orr-hour-g');
        this.els.minG    = document.getElementById('orr-min-g');
        this.els.secG    = document.getElementById('orr-sec-g');
        this.els.sweep   = document.getElementById('orr-sweep');
        this.els.nums    = document.getElementById('orr-nums');
        this.els.dt      = document.getElementById('orr-dt');
        this.els.dd      = document.getElementById('orr-dd');

        this.applyScale(this.settings.scale ?? 100);
        this.applyHue(this.settings.hue ?? 200);
        this.applyTicks(this.settings.ticks ?? true);

        // smooth sweep loop (independent of engine tick so seconds glide)
        this.running = true;
        const loop = () => {
            if (!this.running) return;
            this.tickSmooth();
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);

        this.update({ raw: new Date() });
    },

    tickSmooth: function () {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s  = now.getSeconds() + ms / 1000;
        const m  = now.getMinutes() + s / 60;
        const h  = (now.getHours() % 12) + m / 60;

        const hourAng = h / 12 * 360;
        const minAng  = m / 60 * 360;
        const secAng  = s / 60 * 360;

        this.els.hourG.setAttribute('transform', `rotate(${hourAng} 200 200)`);
        this.els.minG.setAttribute('transform',  `rotate(${minAng} 200 200)`);
        this.els.secG.setAttribute('transform',  `rotate(${secAng} 200 200)`);

        // sweep arc grows with seconds (pathLength = 60)
        this.els.sweep.style.strokeDasharray  = `${s} 60`;
    },

    update: function (t) {
        const now = (t && t.raw) ? t.raw : new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        this.els.dt.innerText = `${h}:${m}`;
        const opts = { weekday: 'short', month: 'short', day: 'numeric' };
        this.els.dd.innerText = now.toLocaleDateString(undefined, opts).toUpperCase();
    },

    applyScale: function (val) {
        this.els.wrap.style.transform = `translate(-50%, -50%) scale(${val / 100})`;
    },

    applyHue: function (val) {
        const h = Number(val);
        this.currentHue = h;
        const s = this.els.stage.style;
        s.setProperty('--hue', h);
        s.setProperty('--c-bright', `hsl(${h}, 95%, 70%)`);
        s.setProperty('--c-deep',   `hsl(${h}, 80%, 40%)`);
        s.setProperty('--c-glow',   `hsl(${h}, 90%, 60%)`);
        s.setProperty('--c-soft',   `hsla(${h}, 70%, 75%, 0.18)`);
    },

    applyTicks: function (on) {
        this.els.nums.style.display = on ? 'block' : 'none';
    },

    onSettingsChange: function (key, val) {
        if (key === 'scale') this.applyScale(val);
        if (key === 'hue')   this.applyHue(val);
        if (key === 'ticks') this.applyTicks(val);
    },

    destroy: function () {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.els = {};
    }
};
