window.ActiveTheme = {
    els: {},

    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Scale Size',
            default: 100,
            min: 50,
            max: 150,
            displaySuffix: '%'
        },
        accentColor: {
            type: 'palette',
            label: 'Neon Accent',
            default: '#7cf9ff',
            options: ['#7cf9ff', '#ff2a6d', '#39ff14', '#ffd062', '#ffffff', '#d600ff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();

        // 1. Load Font
        this.injectLink('../fonts/audiowide-latin-400-normal.woff');
        this.injectLink('https://fonts.googleapis.com/css2?family=Audiowide&display=swap');


        // 2. Inject CSS (Combining New Structure + Aurora Visuals + Big Sizes)
        this.injectStyles(`
            /* --- RESET --- */
            body { margin: 0; background: #02030a; overflow: hidden; }

            :root {
                --accent: #7cf9ff;
                --accent-glow: rgba(124, 249, 255, 0.7);
                --accent-dim: rgba(124, 249, 255, 0.25);
            }

            /* --- 1. BACKGROUND LAYER (Fixed Full Screen) --- */
            /* This ensures no black bars on the sides */
            #theme-bg {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                z-index: 0;
                font-family: 'Audiowide', sans-serif;
                color: var(--accent);
                overflow: hidden;
            }

            /* Gradient Orbs */
            #theme-bg::before {
                content: '';
                position: absolute; inset: 0;
                background: 
                    radial-gradient(circle at 20% 20%, #1b68ff, transparent 50%),
                    radial-gradient(circle at 80% 0%, #ff2ba0, transparent 40%),
                    radial-gradient(circle at 70% 80%, #00ffcf, transparent 45%),
                    #02030a;
                filter: blur(40px);
                opacity: 0.8;
                z-index: 0;
            }

            /* Grid Overlay */
            .grid-overlay {
                position: absolute; inset: 0;
                background-image:
                    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                background-size: 4vw 4vw;
                mix-blend-mode: screen;
                z-index: 1;
            }

            /* Scanline Animation */
            .scanline {
                position: absolute; inset: 0;
                background: linear-gradient(transparent, rgba(255,255,255,0.08), transparent);
                animation: scan 6s linear infinite;
                z-index: 2;
                pointer-events: none;
            }
            @keyframes scan {
                from { transform: translateY(-100%); }
                to   { transform: translateY(100%); }
            }

            /* --- 2. CLOCK ROOT (Floating on top) --- */
            #lcd-root {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                display: flex; justify-content: center; align-items: center;
                z-index: 10;
            }

            #lcd-aspect-box {
                position: relative;
                width: min(100vw, 177.78vh); 
                height: min(56.25vw, 100vh);
            }

            #lcd-scaler {
                width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                transform-origin: center center;
            }

            /* --- 3. MAIN LAYOUT & TYPOGRAPHY --- */
            .lcd-container {
                display: grid;
                grid-template-rows: 15% 1fr 15%;
                grid-template-columns: 1fr 2fr 1fr;
                width: 100%; height: 100%;
                padding: 1vmin;
                box-sizing: border-box;
                
                font-family: 'Audiowide', sans-serif;
                color: var(--accent);
            }

            .lcd-glow {
                text-shadow: 0 0 12px var(--accent-dim), 0 0 32px var(--accent-glow);
                letter-spacing: 0.08em;
            }

            .lcd-dim { opacity: 0.25; transition: opacity 0.2s ease; }
            #lcd-am.active, #lcd-pm.active { opacity: 1; text-shadow: 0 0 10px var(--accent-glow); }

            /* --- RESTORED BIG SIZES (Original) --- */
            .top-left, .top-right, .bottom-left, .bottom-right { 
                font-size: 5vmin; 
                text-transform: uppercase; 
                white-space: nowrap;
                align-self: center;
            }

            .top-left { align-self: start; padding-top: 2vmin; }
            .top-right { text-align: right; align-self: start; padding-top: 2vmin; }
            
            .bottom-left { align-self: end; padding-bottom: 2vmin; }
            .bottom-right {
                text-align: right;
                align-self: end;
                padding-bottom: 2vmin;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 1vmin;
            }

            .clock-center { 
                grid-column: 1 / 4; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                /* ORIGINAL BIG SIZE */ 
                line-height: 0.8;
                margin-top: -2vmin;
            }

            #lcd-ampm {
                margin-left: 2vmin;
                font-size: 8vmin; 
                display: flex;
                flex-direction: column;
                gap: 0.5vmin;
                justify-content: center;
                line-height: 1;
            }

            #lcd-seconds {
                font-size: 8vmin;
            }

            /* --- MOBILE FIXES --- */
            @media (orientation: portrait) {
                .clock-center {  margin-top: 0; }
                .top-left, .top-right, .bottom-left, .bottom-right { font-size: 4vmin; }
                #lcd-ampm, #lcd-seconds { font-size: 6vmin; }
            }
 /* Pulse Bar */
            .pulse-bar {
                width: 8vmin;
                height: 0.8vmin;
                background: var(--accent);
                border-radius: 999px;
                box-shadow: 0 0 20px var(--accent-glow);
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0% { transform: scaleX(0.4); opacity: 0.4; }
                50% { transform: scaleX(1); opacity: 1; }
                100% { transform: scaleX(0.4); opacity: 0.4; }
            }
        `);

        stage.innerHTML = this.template();
        this.cache(stage);

        const accent = savedSettings.accentColor || '#7cf9ff';
        const zoom = savedSettings.zoom || 100;

        this.applyAccent(accent);
        this.applyZoom(zoom);
    },

    update() {
        if (!this.els.time) return;

        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const isPM = h >= 12;

        if (h > 12) h -= 12;
        if (h === 0) h = 12;

        this.els.time.textContent = `${h}:${String(m).padStart(2, '0')}`;
        this.els.seconds.textContent = String(s).padStart(2, '0');
        this.els.am.classList.toggle('active', !isPM);
        this.els.pm.classList.toggle('active', isPM);

        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const fullMonths = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

        this.els.shortDate.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
        this.els.fullDate.textContent = `${fullMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

        // Status text logic
        if (this.els.status) {
            this.els.status.textContent = this.statusPhrases[now.getSeconds() % this.statusPhrases.length];
        }
    },

    onSettingsChange(key, val) {
        if (key === 'accentColor') this.applyAccent(val);
        if (key === 'zoom') this.applyZoom(val);
    },

    destroy() {
        document.getElementById('theme-font-link')?.remove();
        document.getElementById('theme-main-style')?.remove();
        this.els = {};
    },

    /* Helpers */
    injectLink(href) {
        const link = document.createElement('link');
        link.id = 'theme-font-link';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    },

    injectStyles(css) {
        const style = document.createElement('style');
        style.id = 'theme-main-style';
        style.textContent = css;
        document.head.appendChild(style);
    },

    cache(stage) {
        this.els = {
            bg: stage.querySelector('#theme-bg'),
            scaler: stage.querySelector('#lcd-scaler'),
            container: stage.querySelector('.lcd-container'),
            time: stage.querySelector('#lcd-time'),
            seconds: stage.querySelector('#lcd-seconds'),
            am: stage.querySelector('#lcd-am'),
            pm: stage.querySelector('#lcd-pm'),
            shortDate: stage.querySelector('#lcd-short-date'),
            fullDate: stage.querySelector('#lcd-full-date'),
            status: stage.querySelector('#holo-status')
        };
    },

    applyZoom(val) {
        if (this.els.scaler) {
            this.els.scaler.style.transform = `scale(${val / 100})`;
        }
    },

    applyAccent(color) {
        // We set variables on the Root, but we also manually hit the containers
        // to ensure immediate repaint on both layers
        const glow = color + 'B3'; // ~70% opacity hex
        const dim = color + '40';  // ~25% opacity hex

        const setVars = (el) => {
            if (!el) return;
            el.style.setProperty('--accent', color);
            el.style.setProperty('--accent-glow', glow);
            el.style.setProperty('--accent-dim', dim);
        };

        setVars(this.els.bg);
        setVars(this.els.container);
    },

    template() {
        return `
            <!-- 1. BACKGROUND LAYER (Full Screen) -->
            <div id="theme-bg">
                <div class="grid-overlay"></div>
                <div class="scanline"></div>
            </div>

            <!-- 2. CLOCK LAYER (Scaled) -->
            <div id="lcd-root">
                <div id="lcd-aspect-box">
                    <div id="lcd-scaler">
                        <div class="lcd-container aurora">
                            <div class="top-left lcd-glow" id="holo-status">.</div>
                            <div class="top-right lcd-glow" id="lcd-full-date"></div>

                            <div class="clock-center lcd-glow">
                                <span id="lcd-time">9:00</span>
                                <div id="lcd-ampm">
                                    <div id="lcd-am" class="lcd-dim">AM</div>
                                    <div id="lcd-pm" class="lcd-dim">PM</div>
                                </div>
                            </div>

                            <div class="bottom-left lcd-glow" id="lcd-short-date"></div>
                            <div class="bottom-right lcd-glow">
                                <span id="lcd-seconds">00</span>
                                <div class="pulse-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    statusPhrases: ['.', ' ']
};