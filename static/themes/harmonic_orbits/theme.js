window.ActiveTheme = {
    settingsConfig: {
        zoom: {
            label: "Size Scale",
            type: "range",
            min: 0.6,
            max: 1.4,
            step: 0.1,
            default: 1.0,
            displaySuffix: "x"
        },
        hue: {
            label: "Theme Color",
            type: "palette",
            options: [200, 225, 260, 290, 330, 35, 150],
            default: 225
        },
        glow: {
            label: "Glow Intensity",
            type: "range",
            min: 8,
            max: 36,
            step: 4,
            default: 20
        },
        showText: {
            label: "Center Digital Clock",
            type: "select",
            options: [
                { value: "0", text: "Hidden" },
                { value: "1", text: "Visible" }
            ],
            default: "1"
        }
    },

    elements: {},

    init: function (stage, savedSettings) {
        this.stage = stage;
        this.stage.innerHTML = `
            <div id="aurora-halo">
                <div class="ah-bg-glow ah-bg-glow-1"></div>
                <div class="ah-bg-glow ah-bg-glow-2"></div>

                <div class="ah-ring ah-ring-hours">
                    <div class="ah-rotator" id="ah-rot-h">
                        <div class="ah-marker ah-marker-hours"></div>
                    </div>
                </div>

                <div class="ah-ring ah-ring-minutes">
                    <div class="ah-rotator" id="ah-rot-m">
                        <div class="ah-marker ah-marker-minutes"></div>
                    </div>
                </div>

                <div class="ah-ring ah-ring-seconds">
                    <div class="ah-rotator" id="ah-rot-s">
                        <div class="ah-marker ah-marker-seconds"></div>
                    </div>
                </div>

                <div class="ah-core">
                    <div class="ah-core-inner">
                        <div class="ah-time" id="ah-time">00:00</div>
                        <div class="ah-subtext" id="ah-subtext">AURORA HALO</div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            container: document.getElementById('aurora-halo'),
            rotH: document.getElementById('ah-rot-h'),
            rotM: document.getElementById('ah-rot-m'),
            rotS: document.getElementById('ah-rot-s'),
            time: document.getElementById('ah-time'),
            subtext: document.getElementById('ah-subtext')
        };

        const config = this.settingsConfig;
        this.onSettingsChange('zoom', savedSettings.zoom ?? config.zoom.default);
        this.onSettingsChange('hue', savedSettings.hue ?? config.hue.default);
        this.onSettingsChange('glow', savedSettings.glow ?? config.glow.default);
        this.onSettingsChange('showText', savedSettings.showText ?? config.showText.default);
    },

    update: function (time) {
        const h = parseInt(time.h, 10);
        const m = parseInt(time.m, 10);
        const s = parseInt(time.s, 10);

        const degS = s * 6;
        const degM = (m * 6) + (s * 0.1);
        const degH = ((h % 12) * 30) + (m * 0.5);

        this.elements.rotH.style.transform = `rotate(${degH}deg)`;
        this.elements.rotM.style.transform = `rotate(${degM}deg)`;
        this.elements.rotS.style.transform = `rotate(${degS}deg)`;

        this.elements.time.innerText = `${time.h}:${time.m}`;
    },

    onSettingsChange: function (key, value) {
        if (!this.elements.container) return;

        if (key === 'zoom') {
            this.elements.container.style.setProperty('--ah-zoom', value);
        } else if (key === 'hue') {
            document.body.style.setProperty('--ah-hue', value);
            this.elements.container.style.setProperty('--ah-hue', value);
        } else if (key === 'glow') {
            this.elements.container.style.setProperty('--ah-glow', value);
        } else if (key === 'showText') {
            this.elements.container.style.setProperty('--ah-text-opacity', value);
        }
    },

    destroy: function () {
        this.stage.innerHTML = '';
        document.body.style.removeProperty('--ah-hue');
    }
};
