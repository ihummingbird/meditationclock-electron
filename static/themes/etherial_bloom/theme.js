window.ActiveTheme = {
    container: null,
    elements: {},

    // We now use whole numbers to bypass the HTML slider default step of 1
    settingsConfig: {
        zoom: {
            label: "Size / Zoom",
            type: "range",
            min: 50,   // represents 0.5x
            max: 180,  // represents 1.8x
            default: 100, // represents 1.0x
            displaySuffix: "%"
        },
        glow: {
            label: "Ethereal Glow",
            type: "range",
            min: 10,   // represents 0.1x
            max: 200,  // represents 2.0x
            default: 100, // represents 1.0x
            displaySuffix: "%"
        },
        palette: {
            label: "Color Vibe",
            type: "select",
            options: [
                { value: "amethyst", text: "Amethyst Dream" },
                { value: "rose", text: "Rose Petal" },
                { value: "sakura", text: "Sakura Blossom" }
            ],
            default: "amethyst"
        }
    },

    palettes: {
        amethyst: { bg: "#130f1a", h: "#9b59b6", m: "#ff7675", s: "#fd79a8" },
        rose:     { bg: "#1a0b12", h: "#e84393", m: "#d63031", s: "#fab1a0" },
        sakura:   { bg: "#1a131a", h: "#fdcb6e", m: "#e84393", s: "#ffeaa7" }
    },

    init: function (stageElement, savedSettings) {
        this.container = stageElement;
        
        this.container.innerHTML = `
            <div id="bloom-container">
                <div id="blob-hour" class="bloom-blob"></div>
                <div id="blob-min" class="bloom-blob"></div>
                <div id="blob-sec" class="bloom-blob"></div>
                
                <div id="bloom-glass">
                    <div id="bloom-time">00:00</div>
                    <div id="bloom-seconds">00</div>
                </div>
            </div>
        `;

        this.elements.time = document.getElementById('bloom-time');
        this.elements.seconds = document.getElementById('bloom-seconds');
        
        const currentZoom = savedSettings.zoom !== undefined ? savedSettings.zoom : this.settingsConfig.zoom.default;
        const currentGlow = savedSettings.glow !== undefined ? savedSettings.glow : this.settingsConfig.glow.default;
        const currentPalette = savedSettings.palette || this.settingsConfig.palette.default;
        
        this.onSettingsChange('zoom', currentZoom);
        this.onSettingsChange('glow', currentGlow);
        this.onSettingsChange('palette', currentPalette);
    },

    update: function (timeObj) {
        this.elements.time.innerText = `${timeObj.h}:${timeObj.m}`;
        this.elements.seconds.innerText = timeObj.s;
    },

    onSettingsChange: function (key, value) {
        const root = document.documentElement;
        
        if (key === 'zoom') {
            // Convert the integer (e.g., 150) back to a decimal (1.5) for the CSS scale
            root.style.setProperty('--bloom-zoom', value / 100);
        } 
        else if (key === 'glow') {
            // Convert the integer (e.g., 50) back to a decimal (0.5) for the CSS filter
            root.style.setProperty('--bloom-glow', value / 100);
        }
        else if (key === 'palette') {
            const colors = this.palettes[value];
            if (colors) {
                root.style.setProperty('--color-bg', colors.bg);
                root.style.setProperty('--color-blob-h', colors.h);
                root.style.setProperty('--color-blob-m', colors.m);
                root.style.setProperty('--color-blob-s', colors.s);
            }
        }
    },

    destroy: function () {
        this.container.innerHTML = '';
        const root = document.documentElement;
        root.style.removeProperty('--bloom-zoom');
        root.style.removeProperty('--bloom-glow');
        root.style.removeProperty('--color-bg');
        root.style.removeProperty('--color-blob-h');
        root.style.removeProperty('--color-blob-m');
        root.style.removeProperty('--color-blob-s');
    }
};
