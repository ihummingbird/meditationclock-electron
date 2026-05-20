// themes/aurelia/theme.js

window.ActiveTheme = {
    container: null,
    elements: {},
    settings: {},

    settingsConfig: {
        zoom: {
            label: 'Size',
            type: 'range',
            min: 55,
            max: 145,
            default: 100,
            displaySuffix: '%'
        },

        hue: {
            label: 'Aura Color',
            type: 'palette',
            // Ice Blue, Violet, Rose, Mint, Amber, Graphite Blue
            options: [205, 265, 335, 155, 38, 225],
            default: 205
        },

        format: {
            label: 'Time Format',
            type: 'select',
            options: [
                { value: '24h', text: '24-Hour' },
                { value: '12h', text: '12-Hour' }
            ],
            default: '12h'
        },

        speed: {
            label: 'Motion Speed',
            type: 'range',
            min: 12,
            max: 70,
            default: 36,
            displaySuffix: 's'
        },

        glow: {
            label: 'Glow',
            type: 'range',
            min: 20,
            max: 100,
            default: 70,
            displaySuffix: '%'
        }
    },

    init: function(container, savedSettings) {
        this.container = container;
        this.settings = { ...this.extractDefaults(), ...savedSettings };

        this.container.innerHTML = `
            <div class="aurelia-wrapper">
                
                <div class="aurelia-bg">
                    <div class="aurelia-vignette"></div>
                    <div class="aurelia-noise"></div>

                    <div class="aurelia-orb aurelia-orb-one"></div>
                    <div class="aurelia-orb aurelia-orb-two"></div>
                    <div class="aurelia-orb aurelia-orb-three"></div>

                    <div class="aurelia-ring aurelia-ring-one"></div>
                    <div class="aurelia-ring aurelia-ring-two"></div>
                </div>

                <main class="aurelia-stage">
                    <section class="aurelia-glass-card">
                        <div class="aurelia-date-line" data-aurelia-date>
                            Today
                        </div>

                        <div class="aurelia-time">
                            <span class="aurelia-hour" data-aurelia-hour>00</span>
                            <span class="aurelia-separator">:</span>
                            <span class="aurelia-minute" data-aurelia-minute>00</span>
                        </div>

                        <div class="aurelia-bottom-row">
                            <span class="aurelia-second" data-aurelia-second>00</span>
                            <span class="aurelia-ampm" data-aurelia-ampm></span>
                        </div>
                    </section>
                </main>

            </div>
        `;

        const root = this.container.querySelector('.aurelia-wrapper');

        this.elements = {
            root,
            stage: this.container.querySelector('.aurelia-stage'),
            hour: this.container.querySelector('[data-aurelia-hour]'),
            minute: this.container.querySelector('[data-aurelia-minute]'),
            second: this.container.querySelector('[data-aurelia-second]'),
            ampm: this.container.querySelector('[data-aurelia-ampm]'),
            date: this.container.querySelector('[data-aurelia-date]')
        };

        this.applySettingsToCSS();
        this.updateDateLine();
    },

    update: function(timeObj) {
        if (!this.elements.hour) return;

        let h = parseInt(timeObj.h, 10);
        let ampm = '';

        if (this.settings.format === '12h') {
            ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            if (h === 0) h = 12;
        }

        this.elements.hour.innerText = String(h).padStart(2, '0');
        this.elements.minute.innerText = timeObj.m;
        this.elements.second.innerText = timeObj.s;

        this.elements.ampm.innerText = ampm;
        this.elements.ampm.style.display = this.settings.format === '12h' ? 'inline-flex' : 'none';

        this.updateDateLine();
    },

    updateDateLine: function() {
        if (!this.elements.date) return;

        const now = new Date();

        const text = now.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        this.elements.date.innerText = text;
    },

    onSettingsChange: function(key, value) {
        this.settings[key] = value;
        this.applySettingsToCSS();

        if (key === 'format' && typeof Engine !== 'undefined' && Engine.tick) {
            Engine.tick();
        }
    },

    applySettingsToCSS: function() {
        const root = this.elements.root;
        if (!root) return;

        root.style.setProperty('--aurelia-zoom', this.settings.zoom / 100);
        root.style.setProperty('--aurelia-hue', this.settings.hue);
        root.style.setProperty('--aurelia-speed', this.settings.speed + 's');
        root.style.setProperty('--aurelia-glow', this.settings.glow / 100);
    },

    extractDefaults: function() {
        const defaults = {};

        for (let key in this.settingsConfig) {
            defaults[key] = this.settingsConfig[key].default;
        }

        return defaults;
    },

    destroy: function() {
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.container = null;
        this.elements = {};
        this.settings = {};
    }
};
