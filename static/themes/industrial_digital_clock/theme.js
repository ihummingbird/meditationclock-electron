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
        tintColor: {
            type: 'palette',
            label: 'Text Color',
            default: '#66fcf1', // Default Industrial Cyan
            options: ['#66fcf1', '#ff0000', '#00ff00', '#ffa500', '#ffffff', '#ff00ff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();

        // 1. Load Font
        this.injectLink('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        // 2. Inject CSS
        this.injectStyles(`
            /* --- RESET --- */
            body { margin: 0; overflow: hidden; }

            /* --- 1. ROOT CONTAINER (Background goes here now) --- */
            #lcd-root {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                display: flex; justify-content: center; align-items: center;
                
                /* MOVED BACKGROUND HERE so it fills the screen */
                background: linear-gradient(135deg, #0b0c10 0%, #1f2833 100%);
            }

            /* --- 2. ASPECT BOX (Transparent now) --- */
            #lcd-aspect-box {
                position: relative;
                width: min(100vw, 177.78vh); 
                height: min(56.25vw, 100vh);
                background: transparent; /* Seamless with root */
            }

            #lcd-scaler {
                width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                transform-origin: center center;
            }

            /* --- 3. TYPOGRAPHY & COLORS --- */
            .lcd-container {
                display: grid;
                grid-template-rows: 15% 1fr 15%;
                grid-template-columns: 1fr 2fr 1fr;
                width: 100%; height: 100%;
                padding: 1vmin;
                box-sizing: border-box;
                
                font-family: 'Share Tech Mono', 'Consolas', monospace;
                
                /* USE VARIABLE FOR COLOR PICKER */
                color: var(--lcd-color, #66fcf1);
                letter-spacing: 0.05em;
            }

            /* --- 4. SIZING (Big sizes kept) --- */
            .top-left, .top-right, .bottom-left, .bottom-right { 
                font-size: 5vmin; 
                text-transform: uppercase; 
                white-space: nowrap;
                align-self: center;
                text-shadow: none;
            }

            .top-left, .bottom-left { text-align: left; }
            .top-right, .bottom-right { text-align: right; }
            .bottom-left, .bottom-right { align-self: end; padding-bottom: 2vmin; }
            .top-left, .top-right { align-self: start; padding-top: 2vmin; }

            .clock-center { 
                grid-column: 1 / 4; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                font-size: 42vmin; 
                line-height: 0.8;
                margin-top: -2vmin;
                text-shadow: none; 
            }

            #lcd-ampm { 
                font-size: 8vmin;
                margin-left: 3vmin; 
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 1vmin;
                line-height: 1;
            }

            #lcd-seconds {
                font-size: 8vmin;
            }

            /* Dimmed elements */
            #lcd-am, #lcd-pm { opacity: 0.3; }
            #lcd-am.active, #lcd-pm.active { opacity: 1; font-weight: bold; }
        `);

        stage.innerHTML = this.template();
        this.cache(stage);
        
        // Apply Settings
        this.applyColor(savedSettings.tintColor || '#66fcf1');
        this.applyZoom(savedSettings.zoom || 100);
    },

    update() { this.updateClock(); },

    onSettingsChange(key, val) {
        if (key === 'zoom') this.applyZoom(val);
        if (key === 'tintColor') this.applyColor(val);
    },

    destroy() {
        document.getElementById('theme-font-link')?.remove();
        document.getElementById('theme-main-style')?.remove();
        this.els = {};
    },

    /* helpers */
    cache(stage) {
        this.els = {
            container: stage.querySelector('.lcd-container'), // Need container for color
            scaler: stage.querySelector('#lcd-scaler'),
            time: stage.querySelector('#lcd-time'),
            seconds: stage.querySelector('#lcd-seconds'),
            am: stage.querySelector('#lcd-am'),
            pm: stage.querySelector('#lcd-pm'),
            shortDate: stage.querySelector('#lcd-short-date'),
            fullDate: stage.querySelector('#lcd-full-date')
        };
    },

    updateClock() {
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

        const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const fullMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

        this.els.shortDate.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
        this.els.fullDate.textContent = `${fullMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    },

    applyZoom(val) {
        if (this.els.scaler) {
            this.els.scaler.style.transform = `scale(${val / 100})`;
        }
    },

    applyColor(hex) {
        // Just setting the variable is enough because we used var(--lcd-color) in CSS
        if (this.els.container) {
            this.els.container.style.setProperty('--lcd-color', hex);
        }
    },

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

    template() {
        return `
            <div id="lcd-root">
                <div id="lcd-aspect-box">
                    <div id="lcd-scaler">
                        <div class="lcd-container industrial">
                            <div class="top-left">.</div>
                            <div class="top-right" id="lcd-full-date"></div>
                            <div class="clock-center">
                                <span id="lcd-time">9:00</span>
                                <div id="lcd-ampm">
                                    <div id="lcd-am">AM</div>
                                    <div id="lcd-pm">PM</div>
                                </div>
                            </div>
                            <div class="bottom-left" id="lcd-short-date"></div>
                            <div class="bottom-right" id="lcd-seconds">00</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};