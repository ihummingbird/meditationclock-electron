window.ActiveTheme = {
    els: {},
    ctx: null,
    animationId: null,
    boundResize: null,
    width: 0,
    height: 0,
    dpr: 1,

    config: {
        hue: 205,
        accent2: 275,
        zoom: 100
    },

    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Scale UI',
            default: 100,
            min: 65,
            max: 125,
            displaySuffix: '%'
        },
        mood: {
            type: 'palette',
            label: 'Aura Color',
            default: '205',
            options: [
                '205', // Apple Blue
                '285', // Violet
                '165', // Mint
                '330', // Rose
                '35',  // Amber
                '0'    // Lunar White / Red
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="aurora-stage">
                <div id="auroraScaler" class="aurora-scaler">
                    <canvas id="auroraCanvas" class="aurora-canvas"></canvas>

                    <div class="aurora-center">
                        <div class="aurora-glass">
                            <div class="aurora-date">INITIALIZING</div>
                            <div class="aurora-time">--:--</div>
                            <div class="aurora-subtitle">AURORA HALO</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            scaler: stage.querySelector('#auroraScaler'),
            canvas: stage.querySelector('#auroraCanvas'),
            time: stage.querySelector('.aurora-time'),
            date: stage.querySelector('.aurora-date'),
            subtitle: stage.querySelector('.aurora-subtitle')
        };

        this.ctx = this.els.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });

        const s = settings || {};
        this.updateSettings(s.mood || '205', s.zoom || 100);

        this.boundResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundResize);
        this.handleResize();

        this.animate();
    },

    animate() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        const now = new Date();
        const ms = now.getMilliseconds();
        const seconds = now.getSeconds() + ms / 1000;
        const minutes = now.getMinutes() + seconds / 60;
        const hours = (now.getHours() % 12) + minutes / 60;

        const secondProgress = seconds / 60;
        const minuteProgress = minutes / 60;
        const hourProgress = hours / 12;

        const cx = w / 2;
        const cy = h / 2;
        const minDim = Math.min(w, h);

        const t = performance.now() * 0.001;
        const scale = minDim / 800;

        this.drawBackgroundAura(ctx, cx, cy, minDim, t);

        this.drawHaloRing({
            ctx,
            cx,
            cy,
            radius: minDim * 0.385,
            progress: secondProgress,
            thickness: Math.max(1.5, 2.4 * scale),
            hue: this.config.hue,
            alpha: 0.78,
            glow: 18 * scale,
            phase: t
        });

        this.drawHaloRing({
            ctx,
            cx,
            cy,
            radius: minDim * 0.305,
            progress: minuteProgress,
            thickness: Math.max(3, 5.5 * scale),
            hue: this.config.accent2,
            alpha: 0.82,
            glow: 24 * scale,
            phase: t + 1.2
        });

        this.drawHaloRing({
            ctx,
            cx,
            cy,
            radius: minDim * 0.225,
            progress: hourProgress,
            thickness: Math.max(5, 9 * scale),
            hue: this.config.hue + 18,
            alpha: 0.95,
            glow: 30 * scale,
            phase: t + 2.4
        });

        this.drawSoftParticles(ctx, cx, cy, minDim, t);

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    drawBackgroundAura(ctx, cx, cy, minDim, t) {
        const hue = this.config.hue;
        const hue2 = this.config.accent2;

        const pulse = 0.5 + Math.sin(t * 0.55) * 0.5;

        const r1 = minDim * (0.35 + pulse * 0.035);
        const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
        g1.addColorStop(0, `hsla(${hue}, 90%, 58%, 0.12)`);
        g1.addColorStop(0.42, `hsla(${hue2}, 80%, 52%, 0.06)`);
        g1.addColorStop(1, `hsla(${hue}, 80%, 45%, 0)`);

        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, this.width, this.height);

        const ox = cx + Math.cos(t * 0.18) * minDim * 0.12;
        const oy = cy + Math.sin(t * 0.22) * minDim * 0.10;

        const r2 = minDim * 0.55;
        const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r2);
        g2.addColorStop(0, `hsla(${hue2}, 90%, 62%, 0.08)`);
        g2.addColorStop(0.5, `hsla(${hue}, 80%, 55%, 0.035)`);
        g2.addColorStop(1, `hsla(${hue2}, 80%, 40%, 0)`);

        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, this.width, this.height);
    },

    drawHaloRing({ ctx, cx, cy, radius, progress, thickness, hue, alpha, glow, phase }) {
        const start = -Math.PI / 2;
        const end = start + Math.PI * 2 * progress;

        ctx.save();

        // Track
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Subtle inner dark cut for a premium groove
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = Math.max(1, thickness * 0.45);
        ctx.stroke();

        // Main gradient arc
        const grad = ctx.createLinearGradient(
            cx - radius,
            cy - radius,
            cx + radius,
            cy + radius
        );

        grad.addColorStop(0, `hsla(${hue}, 100%, 76%, ${alpha})`);
        grad.addColorStop(0.45, `hsla(${hue + 28}, 100%, 68%, ${alpha})`);
        grad.addColorStop(1, `hsla(${hue - 18}, 100%, 82%, ${alpha})`);

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.24)`;
        ctx.lineWidth = thickness * 4.2;
        ctx.shadowBlur = glow * 1.7;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.85)`;
        ctx.stroke();

        // Color body
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.strokeStyle = grad;
        ctx.lineWidth = thickness * 1.45;
        ctx.shadowBlur = glow;
        ctx.shadowColor = `hsla(${hue}, 100%, 62%, 0.7)`;
        ctx.stroke();

        // Crisp highlight
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.strokeStyle = `rgba(255,255,255,0.82)`;
        ctx.lineWidth = Math.max(1, thickness * 0.34);
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Leading pearl
        const wobble = Math.sin(phase * 1.4) * thickness * 0.25;
        const px = cx + Math.cos(end) * (radius + wobble);
        const py = cy + Math.sin(end) * (radius + wobble);

        ctx.beginPath();
        ctx.arc(px, py, thickness * 2.15, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 64%, 0.25)`;
        ctx.shadowBlur = glow * 1.6;
        ctx.shadowColor = `hsla(${hue}, 100%, 62%, 1)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, thickness * 0.82, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.shadowBlur = thickness * 2;
        ctx.shadowColor = `hsla(${hue}, 100%, 80%, 0.9)`;
        ctx.fill();

        ctx.restore();
    },

    drawSoftParticles(ctx, cx, cy, minDim, t) {
        const hue = this.config.hue;
        const count = 18;
        const baseRadius = minDim * 0.42;

        ctx.save();

        for (let i = 0; i < count; i++) {
            const seed = i / count;
            const angle = seed * Math.PI * 2 + t * (0.035 + seed * 0.025);
            const drift = Math.sin(t * 0.7 + i * 1.9) * minDim * 0.018;
            const r = baseRadius + drift;

            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            const size = minDim * (0.0018 + seed * 0.0016);
            const alpha = 0.08 + Math.sin(t * 1.2 + i) * 0.035;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue + i * 4}, 100%, 75%, ${alpha})`;
            ctx.shadowBlur = size * 6;
            ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.45)`;
            ctx.fill();
        }

        ctx.restore();
    },

    update(timeObj) {
        if (this.els.time && timeObj) {
            this.els.time.innerText = `${timeObj.h}:${timeObj.m}`;
        }

        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        if (this.els.date) {
            this.els.date.innerText = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
        }
    },

    handleResize() {
        if (!this.els.canvas || !this.els.scaler || !this.ctx) return;

        const rect = this.els.scaler.getBoundingClientRect();

        this.width = Math.max(1, rect.width);
        this.height = Math.max(1, rect.height);

        const minDim = Math.min(this.width, this.height);
        document.documentElement.style.setProperty('--aurora-size', `${minDim}px`);
        document.documentElement.style.setProperty('--aurora-hue', `${this.config.hue}`);

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.els.canvas.width = Math.floor(this.width * this.dpr);
        this.els.canvas.height = Math.floor(this.height * this.dpr);

        this.els.canvas.style.width = `${this.width}px`;
        this.els.canvas.style.height = `${this.height}px`;

        // Important: avoids repeated scale multiplication after resize
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },

    updateSettings(hue, zoom) {
        const parsedHue = parseInt(hue, 10);

        this.config.hue = Number.isFinite(parsedHue) ? parsedHue : 205;
        this.config.accent2 = this.getSecondHue(this.config.hue);
        this.config.zoom = parseInt(zoom, 10) || 100;

        document.documentElement.style.setProperty('--aurora-hue', `${this.config.hue}`);
        document.documentElement.style.setProperty('--aurora-hue-2', `${this.config.accent2}`);

        if (this.els.scaler) {
            this.els.scaler.style.transform = `scale(${this.config.zoom / 100})`;
        }
    },

    onSettingsChange(key, val) {
        if (key === 'mood') {
            const hue = parseInt(val, 10);
            this.config.hue = Number.isFinite(hue) ? hue : 205;
            this.config.accent2 = this.getSecondHue(this.config.hue);

            document.documentElement.style.setProperty('--aurora-hue', `${this.config.hue}`);
            document.documentElement.style.setProperty('--aurora-hue-2', `${this.config.accent2}`);
        }

        if (key === 'zoom') {
            this.config.zoom = parseInt(val, 10) || 100;

            if (this.els.scaler) {
                this.els.scaler.style.transform = `scale(${this.config.zoom / 100})`;
            }
        }
    },

    getSecondHue(hue) {
        if (hue === 0) return 350;
        if (hue >= 320) return 25;
        if (hue >= 250) return hue + 45;
        if (hue >= 150 && hue < 210) return hue + 75;
        if (hue >= 20 && hue < 60) return 330;
        return hue + 55;
    },

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.boundResize) {
            window.removeEventListener('resize', this.boundResize);
            this.boundResize = null;
        }

        this.els = {};
        this.ctx = null;
    }
};
