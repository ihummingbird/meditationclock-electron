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
            label: 'Display Color',
            default: '#66fcf1',
            options: ['#66fcf1', '#ff9f0a', '#ff453a', '#32d74b', '#ffffff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();
        this.injectLink('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        stage.innerHTML = this.template();
        this.cache(stage);
        
        // Add class for font styling (background is now handled by #theme-bg in CSS)
        this.els.container.classList.add('industrial');
        
        this.applyColor(savedSettings.tintColor || '#66fcf1');
        this.applyZoom(savedSettings.zoom || 100);
    },

    update() { this.updateClock(); },

    onSettingsChange(key, val) {
        if (key === 'tintColor') this.applyColor(val);
        if (key === 'zoom') this.applyZoom(val);
    },

    destroy() {
        document.getElementById('theme-font-link')?.remove();
        this.els = {};
    },

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

    template() {
        return `
            <!-- 1. BACKGROUND LAYER (Outside Scaler) -->
            <div id="theme-bg"></div>

            <!-- 2. CONTENT LAYER (Inside Scaler) -->
            <div id="lcd-root">
                <div id="lcd-aspect-box">
                    <div id="lcd-scaler">
                        <div class="lcd-container">
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