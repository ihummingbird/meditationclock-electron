window.ActiveTheme = {
    els: {},

    settingsConfig: {
        accentColor: {
            type: 'palette',
            label: 'Accent',
            default: '#f0d38a',
            options: ['#f0d38a', '#90d6ff', '#ff9eb2', '#9bffb7', '#ffffff']
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();
        this.injectLink('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600&display=swap');

        stage.innerHTML = this.template();
        this.cache(stage);

        const accent = savedSettings.accentColor || '#f0d38a';
        this.applyAccent(accent);
    },

    update() {
        if (!this.els.hourHand) return;

        const now = new Date();
        const sec = now.getSeconds();
        const min = now.getMinutes();
        const hour = now.getHours() % 12 + min / 60;

        const hourDeg = hour * 30;
        const minDeg = min * 6 + sec * 0.1;
        const secDeg = sec * 6;

        this.els.hourHand.style.setProperty('--rot', `${hourDeg}deg`);
        this.els.minuteHand.style.setProperty('--rot', `${minDeg}deg`);
        this.els.secondHand.style.setProperty('--rot', `${secDeg}deg`);

        this.els.dateLabel.textContent = now.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        this.els.timeLabel.textContent = now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    onSettingsChange(key, val) {
        if (key === 'accentColor') this.applyAccent(val);
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
            container: stage.querySelector('.lunar-panel'),
            hourHand: stage.querySelector('.hand.hour'),
            minuteHand: stage.querySelector('.hand.minute'),
            secondHand: stage.querySelector('.hand.second'),
            dateLabel: stage.querySelector('#date-label'),
            timeLabel: stage.querySelector('#time-label')
        };
    },

    applyAccent(color) {
        this.els.container?.style.setProperty('--accent', color);
        this.els.container?.style.setProperty('--accent-soft', `${color}55`);
    },

    template() {
        const markers = Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30;
            return `<div class="hour-marker" style="--marker-rot:${angle}deg"></div>`;
        }).join('');

        const miniTicks = Array.from({ length: 60 }, (_, i) => {
            const angle = i * 6;
            return `<div class="minute-marker" style="--marker-rot:${angle}deg"></div>`;
        }).join('');

        return `
            <div class="lunar-panel">
                <div class="glow"></div>

                <div class="dial">
                    ${miniTicks}
                    ${markers}

                    <div class="hand hour"></div>
                    <div class="hand minute"></div>
                    <div class="hand second"></div>
                    <div class="cap"></div>
                </div>

                <div class="readouts">
                    <div class="label" id="date-label">MONDAY JAN 1, 2025</div>
                    <div class="label prominent" id="time-label">12:00:00</div>
                </div>
            </div>
        `;
    }
};