window.ActiveTheme = {
    els: {},

    settingsConfig: {
        accentColor: {
            type: 'palette',
            label: 'Accent',
            default: '#7cf9ff',
            options: ['#7cf9ff', '#ff8bff', '#7dff7a', '#ffd062', '#ffffff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();
        this.injectLink('https://fonts.googleapis.com/css2?family=Audiowide&display=swap');

        stage.innerHTML = this.template();
        this.cache(stage);

        const accent = savedSettings.accentColor || '#7cf9ff';
        this.applyAccent(accent);
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

        const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const fullMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

        this.els.shortDate.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
        this.els.fullDate.textContent = `${fullMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        this.els.status.textContent = this.statusPhrases[now.getSeconds() % this.statusPhrases.length];
    },

    onSettingsChange(key, val) {
        if (key === 'accentColor') this.applyAccent(val);
    },

    destroy() {
        document.getElementById('theme-font-link')?.remove();
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

    cache(stage) {
        this.els = {
            container: stage.querySelector('.aurora-shell'),
            time: stage.querySelector('#lcd-time'),
            seconds: stage.querySelector('#lcd-seconds'),
            am: stage.querySelector('#lcd-am'),
            pm: stage.querySelector('#lcd-pm'),
            shortDate: stage.querySelector('#lcd-short-date'),
            fullDate: stage.querySelector('#lcd-full-date'),
            status: stage.querySelector('#holo-status')
        };
    },

    applyAccent(color) {
        this.els.container?.style.setProperty('--accent', color);
        this.els.container?.style.setProperty('--accent-glow', `${color}80`);
        this.els.container?.style.setProperty('--accent-dim', `${color}40`);
    },

    template() {
        return `
            <div class="aurora-shell">
                <div class="grid-overlay"></div>
                <div class="scanline"></div>

                <div class="lcd-container aurora">
                    <div class="top-left lcd-glow" id="holo-status">CALIBRATING</div>
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
        `;
    },

    statusPhrases: [
        'CALIBRATING', 'LINK STABLE', 'SYNC READY', 'DATA FLOW', 'AURORA MODE',
        'QUANTUM LOCK', 'HARMONIZING', 'FIELD STABLE'
    ]
};