window.ActiveTheme = {
    els: {},

    settingsConfig: {
        inkColor: {
            type: 'palette',
            label: 'Ink Color',
            default: '#2f2b24',
            options: ['#2f2b24', '#17334f', '#4b1f1f', '#2a3d2a', '#000000']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();
        this.injectLink('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');

        stage.innerHTML = this.template();
        this.cache(stage);

        const ink = savedSettings.inkColor || '#2f2b24';
        this.applyInk(ink);
    },

    update() {
        if (!this.els.time) return;

        const now = new Date();
        const m = now.getMinutes();
        const s = now.getSeconds();
        let h = now.getHours();
        const isPM = h >= 12;
        if (h > 12) h -= 12;
        if (h === 0) h = 12;

        this.els.time.textContent = `${h}:${String(m).padStart(2, '0')}`;
        this.els.seconds.textContent = String(s).padStart(2, '0');
        this.els.am.classList.toggle('active', !isPM);
        this.els.pm.classList.toggle('active', isPM);

        const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

        this.els.shortDate.textContent = `${days[now.getDay()]}`;
        this.els.fullDate.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        this.els.sequence.textContent = `#${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(m).padStart(2,'0')}${String(s).padStart(2,'0')}`;
    },

    onSettingsChange(key, val) {
        if (key === 'inkColor') this.applyInk(val);
    },

    destroy() {
        document.getElementById('theme-font-link')?.remove();
        this.els = {};
    },

    /* helpers */
    injectLink(href) {
        const link = document.createElement('link');
        link.id = 'theme-font-link';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    },

    cache(stage) {
        this.els = {
            container: stage.querySelector('.tape-container'),
            time: stage.querySelector('#lcd-time'),
            seconds: stage.querySelector('#lcd-seconds'),
            am: stage.querySelector('#lcd-am'),
            pm: stage.querySelector('#lcd-pm'),
            shortDate: stage.querySelector('#lcd-short-date'),
            fullDate: stage.querySelector('#lcd-full-date'),
            sequence: stage.querySelector('#lcd-sequence')
        };
    },

    applyInk(color) {
        this.els.container?.style.setProperty('--ink', color);
        this.els.container?.style.setProperty('--ink-faded', `${color}80`);
    },

    template() {
        return `
            <div class="tape-container">
                <div class="paper">
                    <div class="perforation perforation-top"></div>
                    <div class="perforation perforation-bottom"></div>

                    <div class="top-row">
                        <div class="tag" id="lcd-sequence">#000000</div>
                        <div class="date" id="lcd-full-date"></div>
                    </div>

                    <div class="clock-row">
                        <span id="lcd-time">9:00</span>
                        <div id="lcd-ampm">
                            <div id="lcd-am">AM</div>
                            <div id="lcd-pm">PM</div>
                        </div>
                        <span class="seconds" id="lcd-seconds">00</span>
                    </div>

                    <div class="footer-row">
                        <div class="note">FIELD UNIT</div>
                        <div id="lcd-short-date">MONDAY</div>
                    </div>
                </div>
            </div>
        `;
    }
};