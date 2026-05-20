window.ActiveTheme = {
    els: {},

    settingsConfig: {
        palette: {
            type: 'palette',
            label: 'Atmosphere',
            default: '220', // Blue
            options: [
                '220', // Ocean (Blue)
                '280', // Nebula (Purple)
                '340', // Rose (Pink)
                '160', // Teal (Green)
                '30'   // Magma (Orange)
            ]
        },
        speed: {
            type: 'range',
            label: 'Flow Speed',
            default: 20,
            min: 5,
            max: 40,
            displaySuffix: 's'
        },
        scale: {
            type: 'range',
            label: 'Text Size',
            default: 100,
            min: 70,
            max: 130,
            displaySuffix: '%'
        }
    },

    init(stage, settings) {
        // Inject SVG Filter for Gooey Effect
        // The color matrix increases the alpha contrast, turning blurry blobs into sharp merged shapes
        stage.innerHTML = `
            <div class="tides-stage">
                <!-- SVG Filter Definition -->
                <svg class="svg-filter">
                    <defs>
                        <filter id="et-goo">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
                            <feColorMatrix in="blur" mode="matrix" values="
                                1 0 0 0 0  
                                0 1 0 0 0  
                                0 0 1 0 0  
                                0 0 0 18 -7" result="goo" />
                            <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                    </defs>
                </svg>

                <div class="liquid-container">
                    <div class="orb"></div>
                    <div class="orb"></div>
                    <div class="orb"></div>
                    <div class="orb"></div>
                    <div class="orb"></div>
                </div>

                <div class="tides-content">
                    <div class="time-wrapper">
                        <div class="main-time">00:00</div>
                    </div>
                    <div class="meta-row">
                        <span class="date">LOADING</span>
                        <div class="orb-pill"></div>
                        <span class="seconds">00</span>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            time: stage.querySelector('.main-time'),
            date: stage.querySelector('.date'),
            sec: stage.querySelector('.seconds')
        };

        const s = settings;
        this.applySettings(s.palette ?? '220', s.speed ?? 20, s.scale ?? 100);
    },

    update(time) {
        this.els.time.textContent = `${time.h}:${time.m}`;
        this.els.sec.textContent = time.s;

        const now = new Date();
        const str = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        this.els.date.textContent = str;
    },

    applySettings(hue, speed, scale) {
        const r = document.documentElement;
        r.style.setProperty('--et-hue', hue);
        r.style.setProperty('--et-speed', `${speed}s`);
        r.style.setProperty('--et-scale', scale / 100);
    },

    onSettingsChange(key, val) {
        // Need to grab current other values or store state.
        // Simplified: Since engine passes single key, we rely on CSS vars mostly.
        const r = document.documentElement;
        if (key === 'palette') r.style.setProperty('--et-hue', val);
        if (key === 'speed') r.style.setProperty('--et-speed', `${val}s`);
        if (key === 'scale') r.style.setProperty('--et-scale', val / 100);
    },

    destroy() {
        this.els = {};
    }
};