window.ActiveTheme = {
    els: { clock: null, text: null, canvas: null, ctx: null },
    
    rafId: null,
    tick: 0,
    w: 0, 
    h: 0,

    settingsConfig: {},

    init(stage, settings) {
    stage.innerHTML = `
        <div class="astral-stage">
            <canvas id="board-canvas"></canvas>
            <div class="astral-grain"></div>
            <div class="ui-layer">
                <div class="clock-display" id="board-clock">00:00:00</div>
                <div class="board-container">
                    <span class="speaker-label">THE BOARD</span>
                    <span class="board-text" id="board-text">&lt; Connection Established &gt;</span>
                </div>
            </div>
        </div>
    `;

    this.els.clock = document.getElementById('board-clock');
    this.els.text = document.getElementById('board-text');
    
    // ADD THIS LINE HERE:
    this.els.container = stage.querySelector('.board-container'); 

    this.els.canvas = document.getElementById('board-canvas');
    this.els.ctx = this.els.canvas.getContext('2d');
    
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    this.handleResize();
    this.loadLogic();
    this.loop();
    
    this.startTime = Date.now();
    this.lastMinute = -1; 
    this.msgShowTime = 0; 
    } ,  

    handleResize() {
        if (!this.els.canvas) return;
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        this.els.canvas.width = this.w * dpr;
        this.els.canvas.height = this.h * dpr;
        this.els.ctx.scale(dpr, dpr);
        this.draw();
    },

    loop() {
        // EXTREMELY SLOW movement (0.001)
        this.tick += 0.005; 
        this.draw();
        this.rafId = requestAnimationFrame(() => this.loop());
    },

    draw() {
        const ctx = this.els.ctx;
        const w = this.w;
        const h = this.h;

        // 1. CLEAR & BACKGROUND FOG
        // Increased radius to h * 1.2 for bigger, softer spread
        const bg = ctx.createRadialGradient(w/2, h*0.6, 0, w/2, h*0.6, h * 1.2);
        
        // Colors tuned to be more gray/subtle
        bg.addColorStop(0, '#ced3d9');   // Center: Light Gray (Not pure white)
        bg.addColorStop(0.5, '#b0b5ba'); // Mid: Fog
        bg.addColorStop(1, '#8a9199');   // Edge: Vignette
        
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // 2. GEOMETRY (EGYPTIAN RATIO)
        // Pyramid Height = 85% of screen height
        const pHeight = h * 0.85; 
        // Egyptian Ratio: Base Width = Height / 0.636
        const pBaseW = pHeight / 0.636;
        
        const centerX = w / 2;
        
        // Tip Fixed Position: 65% down screen
        const tipY = h * 0.65;
        const baseY = tipY - pHeight;

        // Breathing Effect: Reduced amplitude (5px) for subtle motion
        const breathe = Math.sin(this.tick) * 5; 
        const currentTipY = tipY + breathe;
        const currentBaseY = baseY + breathe;

        // 3. DRAW FACES
        // Front Face Width (Visible portion)
        const frontHalfW = (pBaseW / 2) * 0.85; 
        
        // -- FRONT FACE (Directly facing us) --
        const tip = {x: centerX, y: currentTipY};
        const tl = {x: centerX - frontHalfW, y: currentBaseY};
        const tr = {x: centerX + frontHalfW, y: currentBaseY};

        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(tl.x, tl.y);
        ctx.closePath();

        // Gradient: Solid Gray -> Mist
        const gradFront = ctx.createLinearGradient(0, currentBaseY, 0, currentTipY);
        gradFront.addColorStop(0, '#3e464d'); 
        gradFront.addColorStop(0.6, '#3e464d');
        gradFront.addColorStop(1, 'rgba(62, 70, 77, 0)');
        ctx.fillStyle = gradFront;
        ctx.fill();

        // -- SIDE SLIVERS --
        // Left Sliver
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tl.x, tl.y);
        ctx.lineTo(tl.x - (pBaseW * 0.1), tl.y - 20); 
        ctx.closePath();
        
        const gradSide = ctx.createLinearGradient(0, currentBaseY, 0, currentTipY);
        gradSide.addColorStop(0, '#22262b'); // Darker Shadow
        gradSide.addColorStop(1, 'rgba(34, 38, 43, 0)');
        ctx.fillStyle = gradSide;
        ctx.fill();

        // Right Sliver
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(tr.x + (pBaseW * 0.1), tr.y - 20); 
        ctx.closePath();
        ctx.fillStyle = gradSide; 
        ctx.fill();
    },

    loadLogic() {
        if (window.BoardLogic) {
            this.updateText(0);
            return;
        }
        const script = document.createElement('script');
        script.src = 'themes/the_board/board_logic.js';
        script.onload = () => { this.updateText(0); };
        document.body.appendChild(script);
    },

    update(time) {
        if(this.els.clock) this.els.clock.innerText = `${time.h}:${time.m}:${time.s}`;
        
        // No arguments needed now, it calculates from this.startTime
        this.updateText(); 
    },

    updateText() {
        // Safety check
        if (!window.BoardLogic || !this.els.text || !this.els.container) return;
        
        const now = Date.now();
        const elapsedMinutes = Math.floor((now - this.startTime) / 301000);
        
        // --- 1. SHOW MESSAGE (Minute Changed) ---
        if (this.lastMinute !== elapsedMinutes) {
            this.lastMinute = elapsedMinutes;
            
            const phrase = window.BoardLogic.getPhrase(elapsedMinutes);
            
            this.els.text.innerText = phrase;
            
            // Hard snap to visible
            this.els.container.style.opacity = '1'; 
            
            this.msgShowTime = now;
        }

        // --- 2. HIDE BOX (Hard Cut after 5s) ---
        if (this.els.container.style.opacity === '1' && (now - this.msgShowTime > 5000)) {
            // Hard snap to hidden
            this.els.container.style.opacity = '0'; 
        }
    },

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        cancelAnimationFrame(this.rafId);
        this.els = {};
    }

};
