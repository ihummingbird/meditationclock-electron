window.ActiveTheme = {
    els: {},
    ctx: null,
    animationId: null,
    width: 0,
    height: 0,
    
    config: {
        baseColor: { h: 190, s: 100, l: 50 },
    },

    settingsConfig: {
        // 1. GLOBAL SCALE SLIDER
        zoom: {
            type: 'range',
            label: 'Scale UI',
            default: 100,
            min: 50,   // 50% size
            max: 120,  // 120% size
            displaySuffix: '%'
        },
        mood: {
            type: 'palette',
            label: 'Energy Flow',
            default: '#00d5ff',
            options: ['#00d5ff', '#ff0055', '#ccff00', '#aa00ff', '#ffffff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy(); 

        stage.innerHTML = this.template();
        this.cache(stage);

        this.ctx = this.els.canvas.getContext('2d');
        this.handleResize();
        window.addEventListener('resize', this.boundResize);

        // Apply settings
        this.applyColor(savedSettings.mood || '#00d5ff');
        this.applyZoom(savedSettings.zoom || 100);

        this.animate();
    },

    update() {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        
        const hStr = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const mStr = String(m).padStart(2, '0');
        
        if (this.els.time) this.els.time.innerText = `${hStr}:${mStr}`;

        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        if (this.els.date) {
            this.els.date.innerText = `${months[now.getMonth()]} ${now.getDate()}`;
        }
        
        if (this.els.label) {
             this.els.label.innerText = h >= 12 ? 'PM' : 'AM';
        }
    },

    animate() {
        if (!this.els.canvas) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds() + (ms / 1000);
        const m = now.getMinutes() + (s / 60);
        const h = (now.getHours() % 12) + (m / 60);

        const cx = this.width / 2;
        const cy = this.height / 2;

        this.drawRing(cx, cy, this.width * 0.35, s / 60, 2, 0.8);
        this.drawRing(cx, cy, this.width * 0.28, m / 60, 6, 0.5);
        this.drawRing(cx, cy, this.width * 0.20, h / 12, 12, 0.3);

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    drawRing(cx, cy, radius, progress, thickness, opacity) {
        // Max radius constraint
        const maxR = Math.min(this.width, this.height) * 0.45;
        if (radius > maxR) radius = maxR * (radius / (this.width * 0.35));

        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * progress);
        
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `hsla(${this.config.baseColor.h}, ${this.config.baseColor.s}%, 50%, 0.8)`;
        
        // Track
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `hsla(${this.config.baseColor.h}, ${this.config.baseColor.s}%, 30%, 0.1)`;
        this.ctx.lineWidth = thickness;
        this.ctx.stroke();

        // Arc
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        this.ctx.strokeStyle = `hsla(${this.config.baseColor.h}, ${this.config.baseColor.s}%, 60%, ${opacity})`;
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Dot
        const px = cx + Math.cos(endAngle) * radius;
        const py = cy + Math.sin(endAngle) * radius;
        this.ctx.beginPath();
        this.ctx.arc(px, py, thickness * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    },

    handleResize() {
        if (!this.els.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        this.els.canvas.width = this.width * dpr;
        this.els.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    },

    applyColor(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if(result) {
            let r = parseInt(result[1], 16) / 255;
            let g = parseInt(result[2], 16) / 255;
            let b = parseInt(result[3], 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) { h = s = 0; } 
            else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            this.config.baseColor = { h: h * 360, s: s * 100, l: l * 100 };
        }
    },

    // --- ZOOM LOGIC ---
    applyZoom(val) {
        if (!this.els.scaler) return;
        // Transform the entire DIV containing canvas + text
        this.els.scaler.style.transform = `scale(${val / 100})`;
    },

    onSettingsChange(key, val) {
        if (key === 'mood') this.applyColor(val);
        if (key === 'zoom') this.applyZoom(val);
    },

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.boundResize);
        this.els = {};
        this.ctx = null;
    },

    cache(stage) {
        this.els = {
            canvas: stage.querySelector('#zen-canvas'),
            scaler: stage.querySelector('#zen-scaler'), // Cache the scaler
            time: stage.querySelector('.zen-time'),
            date: stage.querySelector('.zen-date'),
            label: stage.querySelector('.zen-label')
        };
        this.boundResize = this.handleResize.bind(this);
    },

    template() {
        return `
            <!-- The Root -->
            <div id="zen-root">
                <!-- The Scalable Container -->
                <div id="zen-scaler">
                    <canvas id="zen-canvas"></canvas>
                    <div class="zen-overlay">
                        <div class="zen-date">INITIALIZING</div>
                        <div class="zen-time">--:--</div>
                        <div class="zen-label">--</div>
                    </div>
                </div>
            </div>
        `;
    }
};