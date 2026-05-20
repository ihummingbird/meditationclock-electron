window.ActiveTheme = {
    container: null,
    timeDisplay: null,
    auraOrb: null,

    settingsConfig: {
        scale: { 
            label: 'Clock Zoom', 
            type: 'range', 
            min: 50, 
            max: 200, 
            default: 100, 
            displaySuffix: '%' 
        },
        themeColor: { 
            label: 'Aura Color', 
            type: 'palette', 
            options: [
                '#4285F4', // Google Blue
                '#EA4335', // Google Red
                '#FBBC05', // Google Yellow
                '#34A853', // Google Green
                '#A142F4', // Soft Purple
                '#FFFFFF'  // Minimal White
            ], 
            default: '#4285F4' 
        },
        glowIntensity: {
            label: 'Aura Glow',
            type: 'range',
            min: 0,
            max: 100,
            default: 60,
            displaySuffix: '%'
        }
    },

    init: function (stageElement, savedSettings) {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'material-aura-container';

        // Create the glowing background orb
        this.auraOrb = document.createElement('div');
        this.auraOrb.id = 'material-aura-orb';

        // Create the time display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.id = 'material-aura-time';
        this.timeDisplay.innerText = "00:00:00";

        this.container.appendChild(this.auraOrb);
        this.container.appendChild(this.timeDisplay);
        stageElement.appendChild(this.container);

        // Apply initial settings
        const currentScale = savedSettings.scale || this.settingsConfig.scale.default;
        const currentColor = savedSettings.themeColor || this.settingsConfig.themeColor.default;
        const currentGlow = savedSettings.glowIntensity || this.settingsConfig.glowIntensity.default;

        this.onSettingsChange('scale', currentScale);
        this.onSettingsChange('themeColor', currentColor);
        this.onSettingsChange('glowIntensity', currentGlow);
    },

    update: function (timeObj) {
        if (!this.timeDisplay) return;
        // Update the time, formatted beautifully
        this.timeDisplay.innerHTML = `${timeObj.h}<span class="colon">:</span>${timeObj.m}<span class="colon">:</span>${timeObj.s}`;
    },

    onSettingsChange: function (key, value) {
        if (!this.container) return;
        
        const rootStyle = this.container.style;

        if (key === 'scale') {
            // Convert percentage to a decimal scale (e.g., 100% -> 1.0)
            const scaleValue = parseInt(value) / 100;
            rootStyle.setProperty('--clock-scale', scaleValue);
        } 
        else if (key === 'themeColor') {
            rootStyle.setProperty('--aura-color', value);
        }
        else if (key === 'glowIntensity') {
            // Map 0-100 to a pixel blur range ($0$ to $200$px)
            const blurPixels = (parseInt(value) / 100) * 200;
            const opacity = 0.2 + ((parseInt(value) / 100) * 0.6); // $0.2$ to $0.8$
            rootStyle.setProperty('--aura-blur', `${blurPixels}px`);
            rootStyle.setProperty('--aura-opacity', opacity);
        }
    },

    destroy: function () {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
};
