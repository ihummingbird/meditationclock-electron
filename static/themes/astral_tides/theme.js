
class AstralTidesTheme {
    constructor() {
        this.timer = null;
        this.root = null;
        // Variables to track rotation loops (fixes the glitchy rewind at 12 o'clock)
        this.sLoops = 0;
        this.mLoops = 0;
        this.hLoops = 0;
        this.lastS = -1;
        this.lastM = -1;
        this.lastH = -1;
    }

    

    init(stage, settings) {
        this.root = stage;
        
        // 1. Create DOM Structure (Exact same as your original)
        this.root.innerHTML = `
            <div id="astral-bg">
                <div class="nebula nebula-1"></div>
                <div class="nebula nebula-2"></div>
                <div class="particles-container" id="particles"></div>
            </div>
            <div id="clock-root">
                <div class="clock-face">
                    <div class="marker-ring" id="markers"></div>
                    <div class="center-point"></div>
                    <div class="hand hour-hand" id="hand-h"></div>
                    <div class="hand minute-hand" id="hand-m"></div>
                    <div class="hand second-hand" id="hand-s"></div>
                    <div class="date-display" id="date-display"></div>
                </div>
            </div>
        `;

        // 2. FORCE FIX: Hands centering and pivot point
        // We apply this inline so it fixes the position without overriding your CSS colors.
        const hands = this.root.querySelectorAll('.hand');
        hands.forEach(hand => {
            hand.style.position = 'absolute';
            hand.style.left = '50%';   // Center horizontally
            hand.style.bottom = '50%'; // Bottom of hand sits at vertical center
            hand.style.transformOrigin = 'bottom center'; // Pivot from the bottom
        });

        this.generateMarkers();
        this.generateParticles();
        this.startTick();
    }

    update(time) {
        // Engine calls this every second
    }

    generateMarkers() {
        const container = document.getElementById('markers');
        for (let i = 0; i < 60; i++) {
            const el = document.createElement('div');
            el.className = `marker ${i % 5 === 0 ? 'major' : ''}`;
            
            // Reverted to your original logic to preserve border/marker layout
            // (Assuming your CSS handles the absolute positioning of .marker)
            el.style.transform = `rotate(${i * 6}deg)`;
            
            el.innerHTML = '<div class="marker-dot"></div>';
            container.appendChild(el);
        }
    }

    generateParticles() {
        const container = document.getElementById('particles');
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'particle';

            const size = Math.random() * 4 + 2;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;

            p.style.animationDuration = `${Math.random() * 10 + 10}s`;
            p.style.animationDelay = `${Math.random() * 5}s`;

            container.appendChild(p);
        }
    }

    startTick() {
        const update = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const s = now.getSeconds();
            const ms = now.getMilliseconds();

            // --- FIX START: Smooth Infinite Rotation Logic ---
            let rawS = (s * 6) + (ms * 0.006);
            let rawM = (m * 6) + (s * 0.1);
            let rawH = ((h % 12) * 30) + (m * 0.5);

            // Check if we passed 12 o'clock (angle drop)
            if (this.lastS !== -1) {
                if (rawS < this.lastS - 180) this.sLoops++;
                if (rawM < this.lastM - 180) this.mLoops++;
                if (rawH < this.lastH - 180) this.hLoops++;
            }

            this.lastS = rawS;
            this.lastM = rawM;
            this.lastH = rawH;

            // Add 360 * loops to keep the number growing (prevents backward spin)
            const finalS = rawS + (this.sLoops * 360);
            const finalM = rawM + (this.mLoops * 360);
            const finalH = rawH + (this.hLoops * 360);
            // --- FIX END ---

            const handH = document.getElementById('hand-h');
            const handM = document.getElementById('hand-m');
            const handS = document.getElementById('hand-s');

            // We add translateX(-50%) to center the hand's width on the pivot line
            if (handH) handH.style.transform = `translateX(-50%) rotate(${finalH}deg)`;
            if (handM) handM.style.transform = `translateX(-50%) rotate(${finalM}deg)`;
            if (handS) handS.style.transform = `translateX(-50%) rotate(${finalS}deg)`;

            // Date Display
            const dateEl = document.getElementById('date-display');
            if (dateEl) {
                const options = { weekday: 'short', month: 'long', day: 'numeric' };
                const dateStr = now.toLocaleDateString('en-US', options);
                if (dateEl.innerText !== dateStr) {
                    dateEl.innerText = dateStr;
                }
            }

            this.timer = requestAnimationFrame(update);
        };
        update();
    }

    destroy() {
        if (this.timer) cancelAnimationFrame(this.timer);
        this.root.innerHTML = '';
    }
}

// Assign to global ActiveTheme for engine to pick up
window.ActiveTheme = new AstralTidesTheme();
