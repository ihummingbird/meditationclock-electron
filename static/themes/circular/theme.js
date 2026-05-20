window.ActiveTheme = {
    els: {},
    ctx: null,
    animationId: null,
    width: 0,
    height: 0,

    // Config state
    config: {
        hue: 190, // Default Cyan
    },

    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Scale UI',
            default: 100,
            min: 50,
            max: 120,
            displaySuffix: '%'
        },
        mood: {
            type: 'palette',
            label: 'Energy Flow',
            default: '190', // Default Blue
            options: [
                '190', // Cyan
                '340', // Pink/Red
                '80',  // Lime
                '270', // Purple
                '0'    // White/Red
            ]
        }
    },

    init(stage, settings) {
        // 1. Set up HTML
        stage.innerHTML = `
            <div class="zen-stage">
                <div id="scaler" class="zen-scaler">
                    <canvas id="canvas" class="zen-canvas"></canvas>
                    <div class="zen-overlay">
                        <div class="zen-date">INITIALIZING</div>
                        <div class="zen-time">--:--</div>
                    </div>
                </div>
            </div>
        `;

        // 2. Cache Elements
        this.els = {
            scaler: stage.querySelector('#scaler'),
            canvas: stage.querySelector('#canvas'),
            time: stage.querySelector('.zen-time'),
            date: stage.querySelector('.zen-date')
        };

        // 3. Setup Canvas
        // alpha: false improves performance on dark backgrounds
        this.ctx = this.els.canvas.getContext('2d', { alpha: false });

        // 4. Handle Resize
        this.boundResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.boundResize);
        this.handleResize(); // Trigger once immediately

        // 5. Apply Settings
        const s = settings || {};
        this.updateSettings(s.mood || '190', s.zoom || 100);

        // 6. Start Loop
        this.animate();
    },

    // --- MAIN LOOP ---
    animate() {
        if (!this.ctx) return;

        // A. Clear Screen (Black)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // B. Calculate Time
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds() + (ms / 1000);
        const m = now.getMinutes() + (s / 60);
        const h = (now.getHours() % 12) + (m / 60);

        // C. Calculate Geometry
        const cx = this.width / 2;
        const cy = this.height / 2;
        const minDim = Math.min(this.width, this.height);

        // D. Draw Rings
        // We normalize thickness based on screen size (minDim / 800)
        const scale = minDim / 800;
        
        // Seconds (Outer, Thin)
        this.drawComplexRing(cx, cy, minDim * 0.38, s / 60, 2.5 * scale);
        
        // Minutes (Middle, Medium)
        this.drawComplexRing(cx, cy, minDim * 0.30, m / 60, 6 * scale);
        
        // Hours (Inner, Thick)
        this.drawComplexRing(cx, cy, minDim * 0.22, h / 12, 10 * scale);

        // E. Loop
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    // --- UPDATE UI TEXT ---
    update(timeObj) {
        // We use the Engine's time object for the text to ensure it matches system clock perfectly
        if (this.els.time) this.els.time.innerText = `${timeObj.h}:${timeObj.m}`;

        const now = new Date();
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (this.els.date) {
            this.els.date.innerText = `${months[now.getMonth()]} ${now.getDate()}`;
        }
    },

    // --- PRO RENDERING LOGIC ---
    drawComplexRing(cx, cy, radius, progress, thickness) {
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * progress);
        const hue = this.config.hue;

        // 1. The "Track" (Dark groove background)
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#111'; // Dark grey
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 0;
        this.ctx.stroke();

        // 2. The "Glow" (Wide, transparent blur)
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        this.ctx.strokeStyle = `hsla(${hue}, 90%, 50%, 0.4)`;
        this.ctx.lineWidth = thickness * 3; 
        this.ctx.shadowBlur = thickness * 4; 
        this.ctx.shadowColor = `hsla(${hue}, 90%, 50%, 0.8)`;
        this.ctx.stroke();

        // 3. The "Core" (Thin, hot white center)
        this.ctx.shadowBlur = 0; // Reset shadow for crisp core
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        this.ctx.strokeStyle = `hsla(${hue}, 100%, 85%, 1)`; // Almost white
        this.ctx.lineWidth = thickness;
        this.ctx.stroke();

        // 4. The "Knob" (Leading particle)
        const px = cx + Math.cos(endAngle) * radius;
        const py = cy + Math.sin(endAngle) * radius;

        // Knob Halo
        this.ctx.beginPath();
        this.ctx.arc(px, py, thickness * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.5)`;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1)`;
        this.ctx.fill();

        // Knob Core
        this.ctx.beginPath();
        this.ctx.arc(px, py, thickness * 0.8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 0;
        this.ctx.fill();
    },

    // --- UTILITIES ---
    handleResize() {
        if (!this.els.canvas || !this.els.scaler) return;

        // Get actual size
        const rect = this.els.scaler.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        // Pass size to CSS for Font Scaling
        const minDim = Math.min(this.width, this.height);
        document.documentElement.style.setProperty('--zen-size', `${minDim}px`);

        // Handle High DPI (Retina) screens
        const dpr = window.devicePixelRatio || 1;
        this.els.canvas.width = this.width * dpr;
        this.els.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    },

    updateSettings(hue, zoom) {
        // Handle Hue (Canvas needs it for drawing)
        // If the palette passes a hex code, we might need conversion, 
        // but for simplicity, I set the palette options to be raw Hue numbers (0-360)
        // If your engine passes Hex, let me know and I'll add the converter back.
        this.config.hue = parseInt(hue);

        // Handle Zoom (CSS Transform)
        if (this.els.scaler) {
            this.els.scaler.style.transform = `scale(${zoom / 100})`;
        }
    },

    onSettingsChange(key, val) {
        if (key === 'mood') this.config.hue = parseInt(val);
        if (key === 'zoom') {
            if (this.els.scaler) this.els.scaler.style.transform = `scale(${val / 100})`;
        }
    },

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.boundResize);
        this.els = {};
        this.ctx = null;
    }
};