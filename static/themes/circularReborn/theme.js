window.ActiveTheme = {
    els: {},
    ctx: null,
    animationId: null,
    width: 0,
    height: 0,
    boundResize: null,

    config: {
        hue: 190,
        glow: 1
    },

    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Scale UI',
            default: 100,
            min: 55,
            max: 125,
            displaySuffix: '%'
        },
        mood: {
            type: 'palette',
            label: 'Aurora Mood',
            default: '190',
            options: [
                '190', // cyan
                '275', // violet
                '330', // rose
                '145', // mint
                '45'   // gold
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="aurora-stage">
                <div id="scaler" class="aurora-scaler">
                    <canvas id="canvas" class="aurora-canvas"></canvas>
                    <div class="aurora-glass"></div>
                    <div class="aurora-vignette"></div>
                    <div class="aurora-overlay">
                        <div class="aurora-date">INITIALIZING</div>
                        <div class="aurora-time">--:--</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            scaler: stage.querySelector('#scaler'),
            canvas: stage.querySelector('#canvas'),
            time: stage.querySelector('.aurora-time'),
            date: stage.querySelector('.aurora-date')
        };

        this.ctx = this.els.canvas.getContext('2d', { alpha: false });

        this.boundResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundResize);
        this.handleResize();

        const s = settings || {};
        this.updateSettings(s.mood || '190', s.zoom || 100);

        this.animate();
    },

    animate() {
        if (!this.ctx) return;

        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds() + ms / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;

        const cx = this.width / 2;
        const cy = this.height / 2;
        const minDim = Math.min(this.width, this.height);

        const scale = minDim / 800;

        this.drawBackground(cx, cy, minDim, now);
        this.drawAmbient(cx, cy, minDim, now);

        this.drawGlassTrack(cx, cy, minDim * 0.38, 2.2 * scale, 0.16);
        this.drawGlassTrack(cx, cy, minDim * 0.30, 5.4 * scale, 0.18);
        this.drawGlassTrack(cx, cy, minDim * 0.22, 8.6 * scale, 0.22);

        this.drawAuroraRing(cx, cy, minDim * 0.38, s / 60, 2.6 * scale, 1.0);
        this.drawAuroraRing(cx, cy, minDim * 0.30, m / 60, 5.8 * scale, 0.92);
        this.drawAuroraRing(cx, cy, minDim * 0.22, h / 12, 9.8 * scale, 0.86);

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    update(timeObj) {
        if (this.els.time) {
            this.els.time.innerText = `${timeObj.h}:${timeObj.m}`;
        }

        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (this.els.date) {
            this.els.date.innerText = `${months[now.getMonth()]} ${now.getDate()}`;
        }
    },

    drawBackground(cx, cy, minDim, now) {
        const ctx = this.ctx;
        const hue = this.config.hue;
        const t = now.getTime() * 0.00012;

        const bg = ctx.createRadialGradient(
            cx, cy, minDim * 0.08,
            cx, cy, minDim * 0.78
        );
        bg.addColorStop(0, `hsl(${hue}, 22%, 10%)`);
        bg.addColorStop(0.45, `hsl(${(hue + 12) % 360}, 20%, 7%)`);
        bg.addColorStop(1, '#06080b');

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        const x1 = cx + Math.cos(t * 0.9) * minDim * 0.10;
        const y1 = cy + Math.sin(t * 1.1) * minDim * 0.08;
        const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, minDim * 0.42);
        g1.addColorStop(0, `hsla(${hue}, 95%, 60%, 0.17)`);
        g1.addColorStop(0.45, `hsla(${(hue + 20) % 360}, 90%, 55%, 0.09)`);
        g1.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, this.width, this.height);

        const x2 = cx + Math.cos(-t * 1.2) * minDim * 0.13;
        const y2 = cy + Math.sin(-t * 0.8) * minDim * 0.11;
        const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, minDim * 0.34);
        g2.addColorStop(0, `hsla(${(hue + 55) % 360}, 100%, 68%, 0.11)`);
        g2.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 90%, 58%, 0.05)`);
        g2.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, this.width, this.height);
    },

    drawAmbient(cx, cy, minDim, now) {
        const ctx = this.ctx;
        const hue = this.config.hue;
        const t = now.getTime() * 0.001;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < 3; i++) {
            const angle = t * (0.22 + i * 0.04) + i * 2.1;
            const r = minDim * (0.12 + i * 0.035);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle * 1.13) * r;

            const grad = ctx.createRadialGradient(x, y, 0, x, y, minDim * (0.20 + i * 0.05));
            grad.addColorStop(0, `hsla(${(hue + i * 28) % 360}, 100%, 72%, ${0.03 + i * 0.01})`);
            grad.addColorStop(1, `hsla(${(hue + i * 28) % 360}, 100%, 60%, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, minDim * (0.20 + i * 0.05), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawGlassTrack(cx, cy, radius, thickness, alpha) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,0.04)`;
        ctx.lineWidth = thickness * 2.4;
        ctx.shadowBlur = thickness * 2.2;
        ctx.shadowColor = `rgba(255,255,255,0.05)`;
        ctx.stroke();
    },

    drawAuroraRing(cx, cy, radius, progress, thickness, intensity = 1) {
        const ctx = this.ctx;
        const hue = this.config.hue;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * progress);

        ctx.save();

        // soft bloom
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = `hsla(${hue}, 100%, 62%, ${0.16 * intensity})`;
        ctx.lineWidth = thickness * 4.2;
        ctx.lineCap = 'round';
        ctx.shadowBlur = thickness * 5.5;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${0.55 * intensity})`;
        ctx.stroke();

        // color body
        const ringGrad = ctx.createLinearGradient(
            cx - radius, cy - radius,
            cx + radius, cy + radius
        );
        ringGrad.addColorStop(0, `hsla(${(hue + 22) % 360}, 100%, 78%, ${0.95 * intensity})`);
        ringGrad.addColorStop(0.45, `hsla(${hue}, 100%, 70%, ${0.98 * intensity})`);
        ringGrad.addColorStop(1, `hsla(${(hue + 58) % 360}, 100%, 78%, ${0.92 * intensity})`);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = thickness * 1.3;
        ctx.shadowColor = `hsla(${hue}, 100%, 80%, 0.25)`;
        ctx.stroke();

        // inner white filament
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255,255,255,0.82)`;
        ctx.lineWidth = Math.max(1, thickness * 0.24);
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;
        ctx.stroke();

        // leading bead
        const px = cx + Math.cos(endAngle) * radius;
        const py = cy + Math.sin(endAngle) * radius;

        ctx.beginPath();
        ctx.arc(px, py, thickness * 1.65, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 68%, 0.35)`;
        ctx.shadowBlur = thickness * 4;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.95)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, thickness * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fill();

        ctx.restore();
    },

    handleResize() {
        if (!this.els.canvas || !this.els.scaler || !this.ctx) return;

        const rect = this.els.scaler.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        const minDim = Math.min(this.width, this.height);
        document.documentElement.style.setProperty('--aurora-size', `${minDim}px`);

        const dpr = window.devicePixelRatio || 1;

        this.els.canvas.width = Math.round(this.width * dpr);
        this.els.canvas.height = Math.round(this.height * dpr);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    },

    updateSettings(hue, zoom) {
        this.config.hue = parseInt(hue, 10);

        if (this.els.scaler) {
            this.els.scaler.style.transform = `scale(${zoom / 100})`;
        }

        document.documentElement.style.setProperty('--aurora-hue', this.config.hue);
    },

    onSettingsChange(key, val) {
        if (key === 'mood') {
            this.config.hue = parseInt(val, 10);
            document.documentElement.style.setProperty('--aurora-hue', this.config.hue);
        }

        if (key === 'zoom') {
            if (this.els.scaler) {
                this.els.scaler.style.transform = `scale(${val / 100})`;
            }
        }
    },

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.boundResize) window.removeEventListener('resize', this.boundResize);
        this.els = {};
        this.ctx = null;
        this.animationId = null;
    }
};
