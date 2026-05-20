window.ActiveTheme = {
    els: {},

    // --- CONFIGURATION ---
    settingsConfig: {
        ensoColor: {
            type: 'palette',
            label: 'Accent Color',
            default: '#E1E1E6', // Starlight
            options: [
                '#E1E1E6', // Starlight
                '#64D2FF', // Sierra Blue
                '#9ce89d', // Zen Green
                '#DFD5C6', // Sandstone
                '#3B3A3F'  // Graphite
            ]
        },
        zoomLevel: {
            type: 'range',
            label: 'Dial Scale',
            default: 100,
            min: 50,
            max: 150,
            displaySuffix: '%' 
        },
        glowIntensity: {
            type: 'range',
            label: 'Glow Intensity',
            default: 40,
            min: 0,
            max: 100,
            displaySuffix: '%'
        }
    },

    init: function(stage, savedSettings) {
        stage.innerHTML = `
            <div class="zen-container">
                <div class="zen-glow"></div>
                <div class="zen-enso-ring">
                    <div class="zen-time-display">
                        <div id="zen-time">00:00</div>
                        <div id="zen-seconds">00</div>
                    </div>
                </div>
            </div>
        `;

        this.els.container = stage.querySelector('.zen-container');
        this.els.ring = stage.querySelector('.zen-enso-ring');
        this.els.glow = stage.querySelector('.zen-glow');
        this.els.time = document.getElementById('zen-time');
        this.els.seconds = document.getElementById('zen-seconds');

        // Apply saved settings or defaults
        this.applyColor(savedSettings.ensoColor || this.settingsConfig.ensoColor.default);
        this.applyZoom(savedSettings.zoomLevel || this.settingsConfig.zoomLevel.default);
        this.applyGlow(savedSettings.glowIntensity || this.settingsConfig.glowIntensity.default);
    },

    update: function(t) {
        this.els.time.innerText = `${t.h}:${t.m}`;
        this.els.seconds.innerText = t.s;
    },

    onSettingsChange: function(key, val) {
        if (key === 'ensoColor') this.applyColor(val);
        if (key === 'zoomLevel') this.applyZoom(val);
        if (key === 'glowIntensity') this.applyGlow(val);
    },

    applyColor: function(hex) {
        const rgb = this.hexToRgb(hex);
        this.els.container.style.setProperty('--zen-color-hex', hex);
        this.els.container.style.setProperty('--zen-color-rgb', rgb);
    },

    applyZoom: function(val) {
        const scale = val / 100;
        this.els.ring.style.transform = `scale(${scale})`;
    },

    applyGlow: function(val) {
        const opacity = val / 200; // Keep the glow subtle even at 100%
        this.els.glow.style.opacity = opacity;
    },

    hexToRgb: function(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
            : '255, 255, 255';
    },

    destroy: function() {
        this.els = {};
    }
};
