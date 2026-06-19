// face-logic.js



class DigitalFace {
    constructor() {
        this.navBrand = document.querySelector('.nav-brand');
        this.idleTime = 10000;
        this.idleTimer = null;
        this.faceActive = false;
        this.displayMode = 'face'; // 'face', 'shutting_down', 'text', 'booting'

        this.COLS = 28; this.ROWS = 14; this.cellPx = 9;
        this.color = '#37e6ff';
        this.buf = new Float32Array(this.COLS * this.ROWS);

        this.look = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.glance = { x: 0, y: 0 };
        this.nextGlance = 0;

        this.blink = 1; this.blinking = false; this.blinkStart = 0;
        this.nextBlink = 0; this.blinkSpeed = 160; this.blinkQueue = 0;

        this.expression = 'neutral'; this.exprStart = 0; this.exprUntil = 0;
        this.talkUntil = 0;

        // breath is now a STILL value (no positional jitter -> no flicker).
        // pulse is a gentle glow breathing used only in render().
        this.breath = 0; this.pulse = 1;

        this.gazeLock = null;
        this.gx = 0; this.gy = 0; // kept for drawers; never translated

        this.booting = true; this.bootStart = 0;
        this.asleep = false; this.sleepIdle = 30000;

        this.mouse = { x: null, y: null }; this.lastMove = 0;
        this.tilt = { x: 0, y: 0, active: false };

        this.behaviors = new FaceBehaviors();
        this.init();
    }

        init() {
        if (!this.navBrand) return;
        this.originalTitle = this.navBrand.innerHTML;
        this.faceMode = localStorage.getItem('hermanFaceMode') || 'title'; // changed 'face' -> 'title'

        if (this.faceMode === 'title') this.enableTitleToggle();
        else this.startIdleTimer();

        ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach((t) => {
            document.addEventListener(t, (e) => {
                if (t === 'mousemove') {
                    this.mouse.x = e.clientX; this.mouse.y = e.clientY;
                    this.lastMove = performance.now();
                }
                if (this.faceActive || this.faceMode === 'title') return;
                if (t === 'mousemove' && e.movementX === 0 && e.movementY === 0) return;
                this.startIdleTimer();
            });
        });

        this.injectFaceToggle();

        // --- GLOBAL BUTTON DETECTION ---
        // NOTE: Navbar button reactions are handled by face-interactions.js
        // which provides richer, personality-based responses with username
        // substitution. Do NOT add triggerOverride calls here — they would
        // race with the interactions layer and prevent %U replacement.
    }
    


    startIdleTimer() {
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => this.showFace(), this.idleTime);
    }

        showFace() {
        this.faceActive = true;
        this.navBrand.style.opacity = '0';
        setTimeout(() => {
            this.navBrand.innerHTML = '';
            this.buildCanvas();
            this.navBrand.style.opacity = '1';
            this.bootStart = performance.now();
            this.nextBlink = this.bootStart + 1200;
            this.booting = true;
            this.running = true;
            requestAnimationFrame((t) => this.loop(t));
            
            // --- NEW: Schedule greeting 10 seconds after boot ---
            clearTimeout(this._greetTimer);
            this._greetTimer = setTimeout(() => {
                // Only greet if the user hasn't clicked away or triggered another override
                if (this.faceActive && this.displayMode === 'face') {
                    this.greetUser();
                }
            }, 10000); 
        }, 300);
    }


    buildCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const cv = document.createElement('canvas');
        cv.className = 'digital-face-canvas';
        this.cw = this.COLS * this.cellPx;
        this.ch = this.ROWS * this.cellPx;
        cv.width = this.cw * dpr; cv.height = this.ch * dpr;
        cv.style.width = '5.2em';
        cv.style.height = (5.2 * this.ROWS / this.COLS) + 'em';
        const ctx = cv.getContext('2d');
        ctx.scale(dpr, dpr);
        this.ctx = ctx; this.canvas = cv;
        this.navBrand.appendChild(cv);

        cv.addEventListener('mouseenter', () => {
         if (!this.asleep && performance.now() - (this.justWoke || 0) > 1500)
            this.setExpression('happy', 2000);
        });
        cv.addEventListener('mouseleave', () => {
            if (!this.asleep && performance.now() - (this.justWoke || 0) > 1500)
                this.setExpression('neutral', 1);
        });
        cv.addEventListener('click', () => this.restoreTitle());
        cv.setAttribute('title', 'Click to switch back to the title');
        cv.style.cursor = 'pointer';
        cv.addEventListener('touchstart', () => {
            this.setExpression('happy', 2000);
            this.enableTilt();
        }, { passive: true });
    }

    // --- public API ---
    setExpression(name, dur) {
        if (!FACE_EXPRESSIONS[name]) return;
        this.expression = name;
        this.exprStart = performance.now();
        this.exprUntil = this.exprStart + (dur || 1800);
    }
    say(dur) { this.talkUntil = performance.now() + (dur || 2000); }
     
    
    // --- Robot Override Sequence ---
    triggerOverride(text) {
        if (this.displayMode !== 'face') return; // Don't interrupt an ongoing sequence
        
        clearTimeout(this._greetTimer); // 
        
        this.displayMode = 'shutting_down';
        this.shutDownStart = performance.now();
        this.overrideText = text.toUpperCase();
        this.textOffset = this.COLS; // Start text off-screen right
    }

    // --- Time-based Greeting ---
    greetUser() {
        const user = (localStorage.getItem('meditation_user') || 'Traveler').toUpperCase();
        const hour = new Date().getHours();
        
        let timeOfDay = 'night';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';

        const presets = GREETINGS[timeOfDay];
        const randomMsg = presets[Math.floor(Math.random() * presets.length)];
        
        // Replace %U with the actual username
        const finalMsg = randomMsg.replace('%U', user);
        this.triggerOverride(finalMsg);
    }

    drawPixelText(text, offset) {
        const yStart = Math.floor(this.ROWS / 2) - 2; // Center vertically
        let x = Math.floor(offset);
        
        for (let i = 0; i < text.length; i++) {
            const charData = PIXEL_FONT[text[i]];
            if (!charData) { x += 4; continue; }
            
            for (let row = 0; row < 5; row++) {
                const bits = charData[row];
                for (let col = 0; col < 3; col++) {
                    if (bits & (1 << (2 - col))) {
                        this.setPx(x + col, yStart + row, 0.9);
                    }
                }
            }
            x += 4; // Move to next letter (3px + 1px space)
        }
    }

    doubleBlink(now) { this.triggerBlink(now); this.blinkQueue = 1; }
    triggerBlink(now) { this.blinking = true; this.blinkStart = now; }

    // gaze control used by scenes (eye movement only — natural, no head jerk)
    lookAt(x, y) { this.gazeLock = { x, y }; }
    releaseGaze() { this.gazeLock = null; }

    loop(now) {
        if (!this.running) return;
        this.update(now);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    // --- title <-> face toggle ---
    restoreTitle() {
        this.faceMode = 'title';
        localStorage.setItem('hermanFaceMode', 'title');
        this.running = false;
        this.faceActive = false;
        clearTimeout(this.idleTimer);
        this.navBrand.style.opacity = '0';
        setTimeout(() => {
            this.navBrand.innerHTML = this.originalTitle;
            this.navBrand.style.opacity = '1';
            this.enableTitleToggle();
        }, 300);
        this.syncFaceToggle();
    }

    enableTitleToggle() {
        this.navBrand.setAttribute('title', 'Click to wake Herman 🙂');
        this.navBrand.style.cursor = 'pointer';
        if (this._titleClick) this.navBrand.removeEventListener('click', this._titleClick);
        this._titleClick = () => this.switchToFace();
        this.navBrand.addEventListener('click', this._titleClick);
    }

    switchToFace() {
        this.faceMode = 'face';
        localStorage.setItem('hermanFaceMode', 'face');
        if (this._titleClick) {
            this.navBrand.removeEventListener('click', this._titleClick);
            this._titleClick = null;
        }
        this.navBrand.removeAttribute('title');
        this.navBrand.style.cursor = '';
        this.showFace();
        this.syncFaceToggle();   // <-- Updates the toggle
    }


    // --- A toggle for the face ---
    injectFaceToggle() {
        const inject = () => {
            const container = document.getElementById('settings-content');
            if (!container) return;
            if (container.querySelector('#face-toggle-row')) return;

            const sysBox = container.querySelector('.system-section') || container;

            const toggleRow = document.createElement('div');
            toggleRow.className = 'toggle-row';
            toggleRow.id = 'face-toggle-row';

            const label = document.createElement('div');
            label.className = 'toggle-label';
            label.innerText = 'Herman';
            toggleRow.appendChild(label);

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = (this.faceMode === 'face');

            checkbox.onchange = (e) => {
                if (e.target.checked) this.switchToFace();
                else this.restoreTitle();
            };

            const slider = document.createElement('span');
            slider.className = 'slider';

            switchLabel.appendChild(checkbox);
            switchLabel.appendChild(slider);
            toggleRow.appendChild(switchLabel);
            sysBox.appendChild(toggleRow);
        };

        inject();

        if (typeof Engine !== 'undefined' && !Engine._faceHooked && Engine.buildSettingsUI) {
            Engine._faceHooked = true;
            const orig = Engine.buildSettingsUI.bind(Engine);
            Engine.buildSettingsUI = (themeId) => {
                orig(themeId);
                inject();
            };
        }
    }

    // --- Update the toggle when title is clicked ---
    syncFaceToggle() {
        const cb = document.querySelector('#face-toggle-row input[type="checkbox"]');
        if (cb) cb.checked = (this.faceMode === 'face');
    }





    update(now) {
        // --- NEW: Pause background logic during text/override sequences ---
        if (this.displayMode !== 'face') {
            this.buildFrame(now); // Keep drawing the text/glitch
            return;               // Skip gaze, blink, and sleep logic
        }
        
        // calm glow breathing (does NOT move pixels)
        this.pulse = 0.9 + 0.1 * Math.sin(now * 0.0016);

        // ---- gaze ----
        if (this.gazeLock) {
            this.target.x = this.gazeLock.x;
            this.target.y = this.gazeLock.y;
        } else {
            const rect = this.canvas.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const idle = !this.mouse.x || (now - this.lastMove) > 2500;
            if (this.tilt.active && idle) {
                this.target.x = this.tilt.x; this.target.y = this.tilt.y;
            } else if (idle) {
                if (now > this.nextGlance) {
                    this.glance.x = (Math.random() * 2 - 1) * 0.45;
                    this.glance.y = (Math.random() * 2 - 1) * 0.28;
                    this.nextGlance = now + 3000 + Math.random() * 3500;
                }
                this.target.x = this.glance.x; this.target.y = this.glance.y;
            } else {
                const w = innerWidth / 2, h = innerHeight / 2;
                this.target.x = Math.max(-1, Math.min(1, (this.mouse.x - cx) / w));
                this.target.y = Math.max(-1, Math.min(1, (this.mouse.y - cy) / h));
            }
        }
        // slower easing for a smoother, calmer drift
        this.look.x += (this.target.x - this.look.x) * 0.08;
        this.look.y += (this.target.y - this.look.y) * 0.08;

        // ---- blink ----
        if (!this.booting) {
            if (!this.blinking && now > this.nextBlink) this.triggerBlink(now);
            if (this.blinking) {
                const p = (now - this.blinkStart) / this.blinkSpeed;
                if (p >= 1) {
                    this.blinking = false; this.blink = 0;
                    if (this.blinkQueue > 0) { this.blinkQueue--; this.nextBlink = now + 110; }
                    else this.nextBlink = now + 2500 + Math.random() * 4000;
                } else this.blink = Math.sin(p * Math.PI);
            } else this.blink *= 0.8;
        }

        if (this.expression !== 'neutral' && now > this.exprUntil) this.expression = 'neutral';

        // ---- idle -> sleep ----
        if (!this.booting) {
            const idleMs = now - (this.lastMove || this.bootStart);
            if (!this.asleep && idleMs > this.sleepIdle) {
                this.asleep = true;
                this.setExpression('sleep', 999999);
            } else if (this.asleep && this.lastMove && idleMs < 400) {
                this.asleep = false;
                this.justWoke = now;
                this.setExpression('surprised', 600);
                setTimeout(() => { if (!this.asleep) this.setExpression('happy', 800); }, 600);
            }

        }

        if (!this.booting && !this.asleep) this.behaviors.update(this, now);

        this.buildFrame(now);

    }

    enableTilt() {
        if (this._tiltAsked) return;
        this._tiltAsked = true;
        const h = (e) => {
            if (e.gamma == null) return;
            this.tilt.x = Math.max(-1, Math.min(1, e.gamma / 30));
            this.tilt.y = Math.max(-1, Math.min(1, (e.beta - 30) / 30));
            this.tilt.active = true;
        };
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            DeviceOrientationEvent.requestPermission) {
            DeviceOrientationEvent.requestPermission()
                .then((s) => { if (s === 'granted') addEventListener('deviceorientation', h); })
                .catch(() => {});
        } else addEventListener('deviceorientation', h);
    }

        buildFrame(now) {
        this.buf.fill(0);

        // --- STATE MACHINE ---
        if (this.displayMode === 'shutting_down') {
            const p = (now - this.shutDownStart) / 300; // 300ms fast glitch shutdown
            if (p >= 1) {
                this.displayMode = 'text';
                this.textStart = now;
            } else {
                // Random pixel glitch as it powers off
                for (let y = 0; y < this.ROWS; y++) {
                    for (let x = 0; x < this.COLS; x++) {
                        if (Math.random() > p) this.buf[y * this.COLS + x] = Math.random() * 0.8;
                    }
                }
                return;
            }
        }

        if (this.displayMode === 'text') {
            const textWidth = this.overrideText.length * 4;
            // Scroll until the whole text has passed the left edge
            if (this.textOffset < -textWidth) {
                this.displayMode = 'booting';
                this.booting = true;
                this.bootStart = now;
                return;
            }
            this.drawPixelText(this.overrideText, this.textOffset);
            this.textOffset -= 0.25; // Scroll speed
            return;
        }

        if (this.displayMode === 'booting') {
            const p = (now - this.bootStart) / 800; // 800ms boot up
            if (p >= 1) {
                this.displayMode = 'face';
                this.booting = false;
                this.blink = 1;
            } else {
                const col = Math.floor(p * this.COLS);
                for (let y = 0; y < this.ROWS; y++)
                    for (let x = 0; x <= col; x++)
                        this.buf[y * this.COLS + x] =
                            x > col - 2 ? 1 : (Math.random() < 0.5 ? 0.22 : 0.07);
                return;
            }
        }

        // --- NORMAL FACE LOGIC ---
        if (this.booting) {
            const p = (now - this.bootStart) / 800;
            if (p >= 1) { this.booting = false; this.blink = 1; }
            else {
                const col = Math.floor(p * this.COLS);
                for (let y = 0; y < this.ROWS; y++)
                    for (let x = 0; x <= col; x++)
                        this.buf[y * this.COLS + x] =
                            x > col - 2 ? 1 : (Math.random() < 0.5 ? 0.22 : 0.07);
                return;
            }
        }
        const base = FACE_EXPRESSIONS[this.expression] || FACE_EXPRESSIONS.neutral;
        if (base.draw) { base.draw(this, now); return; }
        this.drawEyes(base);
        this.drawMouth(this.talkUntil > now ? { mouth: 'talk' } : base, now);
    }

    // ---------- pixel primitives ----------
    setPx(x, y, b) {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= this.COLS || y >= this.ROWS) return;
        const i = y * this.COLS + x;
        if (b > this.buf[i]) this.buf[i] = Math.min(1, b);
    }
    fillEllipse(cx, cy, rx, ry) {
        for (let y = 0; y < this.ROWS; y++)
            for (let x = 0; x < this.COLS; x++) {
                const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
                const d = dx * dx + dy * dy;
                if (d <= 1) this.setPx(x, y, Math.min(1, (1 - d) * 3 + 0.45));
            }
    }

    // ---------- features ----------
    drawEyes(cfg) {
        const cy = this.ROWS * 0.40 + this.breath;
        const ex = this.look.x * 2.0, ey = this.look.y * 1.3;
        const open = 1 - this.blink;
        [this.COLS * 0.30, this.COLS * 0.70].forEach((cx, idx) => {
            const type = (cfg.eye === 'wink' && idx === 1) ? 'line' : cfg.eye;
            this.renderEye(cx + ex, cy + ey, type, cfg, open);
        });
    }

    renderEye(cx, cy, type, cfg, open) {
        switch (type) {
            case 'happy':
                for (let i = -3; i <= 3; i++) {
                    const y = cy - 1.0 + i * i * 0.18;
                    this.setPx(cx + i, y, 1); this.setPx(cx + i, y + 1, 0.7);
                }
                break;
            case 'wide':
                this.fillEllipse(cx, cy, 2.8, Math.max(0.5, 3.9 * open));
                break;
            case 'sleepy':
                this.fillEllipse(cx, cy + 1.2, 2.4, Math.max(0.45, 1.1 * open));
                break;
            case 'line':
                for (let i = -2; i <= 2; i++) this.setPx(cx + i, cy, 0.95);
                break;
            case 'angry': {
                const left = cx < this.COLS / 2;
                for (let i = -2; i <= 2; i++)
                    this.setPx(cx + i, cy + (left ? i : -i) * 0.6, 0.95);
                this.setPx(cx, cy + 1.6, 0.8);
                break;
            }
            default: { // round
                const ry = 3.2 * open * (cfg.eyeScaleY || 1);
                this.fillEllipse(cx, cy, 2.4, Math.max(0.45, ry));
            }
        }
    }

    drawMouth(cfg, now = performance.now()) {
        const my = this.ROWS * 0.74 + this.breath;
        const cx = this.COLS * 0.5 + this.look.x * 1.2;
        switch (cfg.mouth) {
            case 'smile': 
                // Cute curved smile: ends up, center down (∪)
                const w = 5;
                for (let i = -w; i <= w; i++) {
                    const r = i / w;
                    this.setPx(cx + i, my + 2 * (1 - r * r), 0.95);
                    // thicken slightly toward the corners so it reads cleanly
                    if (Math.abs(i) >= w - 1) this.setPx(cx + i, my + 2 * (1 - r * r) - 1, 0.7);
                }
                break;
            case 'grin':
                for (let i = -5; i <= 5; i++) {
                    const r = i / 5; const y = my - 2 * r * r;
                    this.setPx(cx + i, y, 1); this.setPx(cx + i, y + 1, 0.55);
                }
                break;
            case 'frown':
                for (let i = -5; i <= 5; i++) { const r = i / 5; this.setPx(cx + i, my + 1 - 2 * r * r, 0.95); }
                break;
            case 'cat':
                for (let i = -4; i <= 4; i++) {
                    const r = Math.abs(i) / 4;
                    this.setPx(cx + i, my - 1.2 * r * r + (Math.abs(i) > 2 ? 0 : 0.4), 0.95);
                }
                break;
            case 'o':
                this.fillEllipse(cx, my, 1.6, 1.9);
                break;
            case 'talk': {
                const o = 0.4 + 0.5 * Math.abs(Math.sin(now * 0.018));
                this.fillEllipse(cx, my, 1.8, 0.6 + o * 2.2);
                break;
            }
            case 'flat':
                for (let i = -2; i <= 4; i++) this.setPx(cx + i, my, 0.85);
                break;
            case 'small':
                for (let i = -1; i <= 1; i++) this.setPx(cx + i, my, 0.85);
                break;
            default: // line
                for (let i = -3; i <= 3; i++) this.setPx(cx + i, my, 0.85);
        }
    }

    render() {
        const ctx = this.ctx, s = this.cellPx;
        ctx.clearRect(0, 0, this.cw, this.ch);
        const inner = s * 0.6, off = (s - inner) / 2;
        const pulse = this.pulse;
        for (let y = 0; y < this.ROWS; y++)
            for (let x = 0; x < this.COLS; x++) {
                const b = this.buf[y * this.COLS + x];
                const px = x * s + off, py = y * s + off;
                ctx.fillStyle = this.color;
                if (b > 0.04) {
                    ctx.globalAlpha = Math.min(1, b) * pulse;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = s * 0.9 * b;
                } else {
                    ctx.globalAlpha = 0.10;
                    ctx.shadowBlur = 0;
                }
                ctx.fillRect(px, py, inner, inner);
            }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => { window.face = new DigitalFace(); });
