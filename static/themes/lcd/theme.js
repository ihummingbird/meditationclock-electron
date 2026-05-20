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
            label: 'LCD Color',
            default: '#00d5ff',
            options: ['#00d5ff', '#ff8000', '#ff0000', '#39ff14', '#ffffff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();
        
        // --- SAFE FONT DEFINITION (UNTOUCHED) ---
        this.injectFont(`
            @font-face {
                font-family: 'DS-Digital', 'Segoe UI', sans-serif;
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url("https://cdn.jsdelivr.net/gh/keshikan/DSEG@v0.46/dist/DSEG7Classic-Regular.woff2") format("woff2"),
                     url("https://cdn.jsdelivr.net/gh/keshikan/DSEG@v0.46/dist/DSEG7Classic-Regular.woff") format("woff");
            }
        `);

        // --- CSS STYLES ---
        // Note: I bumped the sizes significantly here to match the 'Previous' look
        this.injectStyles(`
            @import url('https://fonts.cdnfonts.com/css/ds-digital');

            :root {
                --lcd-color: #00d5ff;
                --lcd-glow: rgba(0, 213, 255, 0.5);
                --lcd-dim: rgba(0, 213, 255, 0.2);
            }

            body { margin: 0; background: #000; overflow: hidden; }

            /* --- ROOT & ASPECT RATIO SETUP --- */
            #lcd-root {
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                display: flex; justify-content: center; align-items: center;
                background: #000;
            }

            #lcd-aspect-box {
                position: relative;
                width: min(100vw, 177.78vh); 
                height: min(56.25vw, 100vh);
                background: #000;
            }

            #lcd-scaler {
                width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                transform-origin: center center;
            }

            /* --- MAIN LAYOUT --- */
            .lcd-container {
                display: grid;
                grid-template-rows: 15% 1fr 15%; /* Adjusted rows to give clock more room */
                grid-template-columns: 1fr 2fr 1fr;
                width: 100%; height: 100%;
                padding: 1vmin; /* Reduced padding to maximize size */
                box-sizing: border-box;
                font-family: 'DS-Digital', 'Segoe UI', sans-serif;
                color: var(--lcd-color);
            }

            /* --- VISUALS --- */
            .lcd-glow { text-shadow: 0 0 10px var(--lcd-dim), 0 0 20px var(--lcd-glow); }
            .lcd-dim { opacity: 0.25; }
            #lcd-am.active, #lcd-pm.active { opacity: 1; text-shadow: 0 0 15px var(--lcd-glow); }

            /* --- RESTORED LARGE SIZES --- */
            /* Using larger vmin values to mimic the old vw impact */
            
            .top-left, .top-right, .bottom-left, .bottom-right { 
                font-size: 5vmin; /* Increased from 3 to 5 */
                text-transform: uppercase; 
                white-space: nowrap;
                align-self: center;
            }

            .top-left, .bottom-left { text-align: left; }
            .top-right, .bottom-right { text-align: right; }
            /* Align bottom row to bottom to frame the clock */
            .bottom-left, .bottom-right { align-self: end; padding-bottom: 2vmin; }
            .top-left, .top-right { align-self: start; padding-top: 2vmin; }

            .clock-center { 
                grid-column: 1 / 4; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                /* RESTORED BIG SIZE: 25vw on 16:9 is roughly 42vmin */
                font-size: 42vmin; 
                line-height: 0.8;
                margin-top: -2vmin; /* Optical alignment */
            }

            #lcd-ampm { 
                font-size: 8vmin; /* Increased from 5 to 8 */
                margin-left: 3vmin; 
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 1vmin;
                line-height: 1;
            }

            #lcd-seconds {
                font-size: 8vmin; /* Increased size */
            }
        `);

        stage.innerHTML = this.template();
        this.cache(stage);
        
        this.applyColor(savedSettings.tintColor || '#00d5ff');
        this.applyZoom(savedSettings.zoom || 100);
    },

    update() { this.updateClock(); },

    onSettingsChange(key, val) {
        if (key === 'tintColor') this.applyColor(val);
        if (key === 'zoom') this.applyZoom(val);
    },

    destroy() {
        document.getElementById('theme-font-style')?.remove();
        document.getElementById('theme-main-style')?.remove();
        this.els = {};
    },

    /* helpers */
    cache(stage) {
        this.els = {
            scaler: stage.querySelector('#lcd-scaler'),
            container: stage.querySelector('.lcd-container'),
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
        const glow = hex + '80';
        const dim = hex + '40';
        if (this.els.container) {
            this.els.container.style.setProperty('--lcd-color', hex);
            this.els.container.style.setProperty('--lcd-glow', glow);
            this.els.container.style.setProperty('--lcd-dim', dim);
        }
    },

    injectFont(css) {
        const style = document.createElement('style');
        style.id = 'theme-font-style';
        style.textContent = css;
        document.head.appendChild(style);
    },

    // Helper to inject the main CSS
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
                        <div class="lcd-container segment">
                            <div class="top-left lcd-glow">.</div>
                            <div class="top-right lcd-glow" id="lcd-full-date"></div>
                            <div class="clock-center lcd-glow">
                                <span id="lcd-time">9:00</span>
                                <div id="lcd-ampm">
                                    <div id="lcd-am" class="lcd-dim">AM</div>
                                    <div id="lcd-pm" class="lcd-dim">PM</div>
                                </div>
                            </div>
                            <div class="bottom-left lcd-glow" id="lcd-short-date"></div>
                            <div class="bottom-right lcd-glow" id="lcd-seconds">00</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};