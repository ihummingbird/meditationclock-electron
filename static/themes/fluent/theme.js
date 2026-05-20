window.ActiveTheme = {
    settingsConfig: {
        // Replace the old zoom line with this:
        zoom: { label: 'Card Scale', type: 'range', min: 50, max: 200, default: 100, displaySuffix: '%' },

        auraColor: { label: 'Bloom Palette', type: 'select', options: [
            { value: 'win11', text: 'Windows (Blue/Cyan)' },
            { value: 'surface', text: 'Surface Dawn (Peach/Violet)' },
            { value: 'xbox', text: 'The Box (Neon Green)' },
            { value: 'aurora', text: 'Midnight Aurora (Teal/Purple)' }
        ], default: 'win11' },
        acrylic: { label: 'Acrylic Frost', type: 'range', min: 10, max: 90, default: 45, displaySuffix: '%' },
        format: { label: 'Time Format', type: 'select', options: [
            { value: '24', text: '24-Hour Military' },
            { value: '12', text: '12-Hour AM/PM' }
        ], default: '24'}
    },

    settings: {},
    stage: null,
    elements: {},

    // Microsoft color palettes for the ambient background bloom
    palettes: {
        win11:   ['#0058d0', '#00d2ff', '#aa00ff', '#001144'],
        surface: ['#ff8c00', '#ff0080', '#7000ff', '#00a1ff'],
        xbox:    ['#10e15c', '#054b1a', '#0a2a12', '#10e15c'],
        aurora:  ['#00f2fe', '#4facfe', '#30cfd0', '#330867']
    },

    init: function(stageElement, savedSettings) {
        this.stage = stageElement;
        this.settings = { ...this.getDefaults(), ...savedSettings };

        // Construct the Fluent Design DOM
        this.stage.innerHTML = `
            <div id="fluent-wrapper">
                <!-- Ambient Light Bloom Background -->
                <div id="fluent-bloom">
                    <div class="bloom-orb orb-1"></div>
                    <div class="bloom-orb orb-2"></div>
                    <div class="bloom-orb orb-3"></div>
                    <div class="bloom-orb orb-4"></div>
                </div>

                <!-- Acrylic Glass Container -->
                <div id="fluent-acrylic-card">
                    <div class="clock-display">
                        <span id="fluent-h">00</span><span class="fluent-colon">:</span><span id="fluent-m">00</span>
                        <div class="clock-side">
                            <span id="fluent-s">00</span>
                            <span id="fluent-ampm">AM</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            wrapper: document.getElementById('fluent-wrapper'),
            h: document.getElementById('fluent-h'),
            m: document.getElementById('fluent-m'),
            s: document.getElementById('fluent-s'),
            ampm: document.getElementById('fluent-ampm')
        };

        this.applySettings(this.settings);
    },

    update: function(timeObj) {
        if (!this.elements.h) return;

        let hourNum = parseInt(timeObj.h, 10);
        let ampmStr = hourNum >= 12 ? 'PM' : 'AM';

        if (this.settings.format === '12') {
            hourNum = hourNum % 12 || 12; // Convert 0 to 12
            this.elements.h.innerText = String(hourNum).padStart(2, '0');
            this.elements.ampm.innerText = ampmStr;
            this.elements.ampm.style.display = 'block';
        } else {
            this.elements.h.innerText = timeObj.h;
            this.elements.ampm.style.display = 'none';
        }

        this.elements.m.innerText = timeObj.m;
        this.elements.s.innerText = timeObj.s;
    },

    onSettingsChange: function(key, value) {
        this.settings[key] = value;
        this.applySettings(this.settings);
    },

    applySettings: function(settings) {
        // 1. Apply Zoom (Divide by 100 to convert percentage to decimal scale)
        this.stage.style.setProperty('--card-zoom', settings.zoom / 100);

        // 2. Apply Acrylic Frost Density
        const alpha = settings.acrylic / 100;
        this.stage.style.setProperty('--acrylic-alpha', alpha);

        // 3. Apply Bloom Palette
        const colors = this.palettes[settings.auraColor] || this.palettes['win11'];
        this.stage.style.setProperty('--bloom-1', colors[0]);
        this.stage.style.setProperty('--bloom-2', colors[1]);
        this.stage.style.setProperty('--bloom-3', colors[2]);
        this.stage.style.setProperty('--bloom-4', colors[3]);
        
        // Trigger update to immediately reflect 12/24 hr toggle without waiting 1 sec
        const now = new Date();
        this.update({
            h: String(now.getHours()).padStart(2, '0'),
            m: String(now.getMinutes()).padStart(2, '0'),
            s: String(now.getSeconds()).padStart(2, '0')
        });
    },

    getDefaults: function() {
        const defs = {};
        for (const [k, v] of Object.entries(this.settingsConfig)) {
            defs[k] = v.default;
        }
        return defs;
    },

    destroy: function() {
        this.stage.innerHTML = '';
        this.stage.style.removeProperty('--card-zoom');
        this.stage.style.removeProperty('--acrylic-alpha');
        this.stage.style.removeProperty('--bloom-1');
        this.stage.style.removeProperty('--bloom-2');
        this.stage.style.removeProperty('--bloom-3');
        this.stage.style.removeProperty('--bloom-4');
    }
};
