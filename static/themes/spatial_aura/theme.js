window.ActiveTheme = {
    stage: null,
    els: {},
    
    // Configurations exposed to the Engine
    settingsConfig: {
        zoom: { type: 'range', label: 'Lens Zoom', min: 40, max: 160, default: 100, displaySuffix: '%' },
        glassBlur: { type: 'range', label: 'Frosted Depth', min: 5, max: 60, default: 30, displaySuffix: 'px' },
        themeHue: { type: 'range', label: 'Aura Hue', min: 0, max: 360, default: 210, displaySuffix: '°' },
        saturation: { type: 'range', label: 'Aura Saturation', min: 0, max: 100, default: 80, displaySuffix: '%' }
    },

    init: function (stageElement, savedSettings) {
        this.stage = stageElement;
        
        // Build DOM
        this.stage.innerHTML = `
            <div id="aura-stage">
                <div class="aura-blob" id="blob1"></div>
                <div class="aura-blob" id="blob2"></div>
                <div class="aura-blob" id="blob3"></div>
                
                <div id="aura-zoom-wrapper">
                    <div class="aura-lens" id="aura-lens">
                        <div class="aura-time">
                            <div class="aura-hm">
                                <span id="aura-h">00</span>
                                <span class="aura-colon">:</span>
                                <span id="aura-m">00</span>
                            </div>
                            <div class="aura-sec" id="aura-s">00</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cache elements
        this.els = {
            wrapper: document.getElementById('aura-zoom-wrapper'),
            lens: document.getElementById('aura-lens'),
            h: document.getElementById('aura-h'),
            m: document.getElementById('aura-m'),
            s: document.getElementById('aura-s'),
            stageContainer: document.getElementById('aura-stage')
        };

        // Apply initial settings
        for (const [key, config] of Object.entries(this.settingsConfig)) {
            const val = savedSettings[key] !== undefined ? savedSettings[key] : config.default;
            this.onSettingsChange(key, val);
        }
    },

    update: function (timeObj) {
        if (!this.els.h) return;
        this.els.h.innerText = timeObj.h;
        this.els.m.innerText = timeObj.m;
        this.els.s.innerText = timeObj.s;
    },

    onSettingsChange: function (key, value) {
        const root = this.els.stageContainer;
        if (!root) return;

        // Current Hue and Saturation state tracking for the gradient logic
        if (!this.state) this.state = { hue: 210, sat: 80 };

        if (key === 'zoom') {
            this.els.wrapper.style.transform = `scale(${value / 100})`;
        } 
        else if (key === 'glassBlur') {
            this.els.lens.style.backdropFilter = `blur(${value}px)`;
            this.els.lens.style.webkitBackdropFilter = `blur(${value}px)`; // For iOS Safari
        }
        else if (key === 'themeHue' || key === 'saturation') {
            if (key === 'themeHue') this.state.hue = parseInt(value);
            if (key === 'saturation') this.state.sat = parseInt(value);
            
            // Generate analog color palette based on base hue
            const h = this.state.hue;
            const s = this.state.sat;
            
            // Set CSS variables for the 3 blobs (analogous colors + slightly offset)
            root.style.setProperty('--theme-color-1', `hsla(${h}, ${s}%, 50%, 0.8)`);
            root.style.setProperty('--theme-color-2', `hsla(${(h + 40) % 360}, ${s}%, 60%, 0.8)`);
            root.style.setProperty('--theme-color-3', `hsla(${(h - 30 + 360) % 360}, ${s}%, 40%, 0.8)`);
        }
    },

    destroy: function () {
        this.stage.innerHTML = '';
        this.els = {};
    }
};
