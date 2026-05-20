// themes/lumina/theme.js

window.ActiveTheme = {
    container: null,
    elements: {},
    settings: {},

    // Define the options the user can tweak in your Settings Drawer
    settingsConfig: {
        zoom: { 
            label: 'Size (Zoom)', 
            type: 'range', 
            min: 50, 
            max: 150, 
            default: 100, 
            displaySuffix: '%' 
        },
        hue: { 
            label: 'Aura Color', 
            type: 'palette', 
            // HSL values: Deep Blue, Purple, Crimson, Emerald, Gold
            options: [215, 275, 345, 150, 35], 
            default: 215 
        },
        format: { 
            label: 'Time Format', 
            type: 'select', 
            options: [
                { value: '24h', text: '24-Hour (Military)' },
                { value: '12h', text: '12-Hour (AM/PM)' }
            ], 
            default: '12h' 
        },
        speed: { 
            label: 'Aura Speed', 
            type: 'range', 
            min: 10, 
            max: 60, 
            default: 30, 
            displaySuffix: 's' 
        }
    },

    init: function(container, savedSettings) {
        this.container = container;
        // Merge defaults with saved settings
        this.settings = { ...this.extractDefaults(), ...savedSettings };

        // Construct the Apple-like UI
        this.container.innerHTML = `
            <div class="lumina-wrapper" id="lumina-wrap">
                
                <!-- Fluid Background -->
                <div class="lumina-aurora-container">
                    <div class="lumina-orb lumina-orb-1"></div>
                    <div class="lumina-orb lumina-orb-2"></div>
                    <div class="lumina-orb lumina-orb-3"></div>
                </div>

                <!-- Clock Stage -->
                <div class="lumina-clock-stage" id="lumina-stage">
                    <div class="lumina-time-row">
                        <span class="lumina-hours" id="lumina-h">00</span>
                        <span class="lumina-colon">:</span>
                        <span class="lumina-minutes" id="lumina-m">00</span>
                    </div>
                    
                    <div class="lumina-seconds-pill">
                        <span class="lumina-seconds" id="lumina-s">00</span>
                        <span class="lumina-am-pm" id="lumina-ampm"></span>
                    </div>
                </div>

            </div>
        `;

        // Cache DOM elements for quick updates
        this.elements = {
            wrap: document.getElementById('lumina-wrap'),
            stage: document.getElementById('lumina-stage'),
            h: document.getElementById('lumina-h'),
            m: document.getElementById('lumina-m'),
            s: document.getElementById('lumina-s'),
            ampm: document.getElementById('lumina-ampm')
        };

        // Apply initial settings
        this.applySettingsToCSS();
    },

    update: function(timeObj) {
        if (!this.elements.h) return; // Guard clause if destroyed

        let h = parseInt(timeObj.h, 10);
        let ampmStr = '';

        // Handle 12-hour format logic
        if (this.settings.format === '12h') {
            if (h >= 12) {
                ampmStr = 'PM';
                if (h > 12) h -= 12;
            } else {
                ampmStr = 'AM';
                if (h === 0) h = 12;
            }
        }

        // Apply Time
        this.elements.h.innerText = String(h).padStart(2, '0');
        this.elements.m.innerText = timeObj.m;
        this.elements.s.innerText = timeObj.s;
        
        // Hide AM/PM pill indicator if in 24h mode
        this.elements.ampm.innerText = ampmStr;
        this.elements.ampm.style.display = (this.settings.format === '12h') ? 'inline' : 'none';
    },

    onSettingsChange: function(key, value) {
        this.settings[key] = value;
        this.applySettingsToCSS();
        
        // If they change format, force an immediate update so they don't have to wait 1 second
        if (key === 'format' && Engine) {
            Engine.tick();
        }
    },

    applySettingsToCSS: function() {
        const wrap = this.elements.wrap;
        if (!wrap) return;

        // Apply to CSS Variables. 
        // Notice how Zoom is translated from a 50-150 range to a 0.5-1.5 scale
        wrap.style.setProperty('--lumina-zoom', this.settings.zoom / 100);
        wrap.style.setProperty('--lumina-hue', this.settings.hue);
        wrap.style.setProperty('--lumina-speed', this.settings.speed + 's');
    },

    extractDefaults: function() {
        const defaults = {};
        for (let key in this.settingsConfig) {
            defaults[key] = this.settingsConfig[key].default;
        }
        return defaults;
    },

    destroy: function() {
        this.container.innerHTML = '';
        this.elements = {};
    }
};
