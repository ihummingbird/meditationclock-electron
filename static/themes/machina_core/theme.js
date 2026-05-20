window.ActiveTheme = {
    stage: null,
    settings: {},
    elements: {},

    // Settings exposed to your right drawer
    settingsConfig: {
        palette: {
            label: "Aura Color",
            type: "select",
            options: [
                { value: "intelligence", text: "The Intelligence" },
                { value: "music", text: "Ambient Music" },
                { value: "midnight", text: "Midnight Ocean" },
                { value: "dawn", text: "Morning Dawn" },
                { value: "titanium", text: "Natural Titanium" },
                { value: "aurora", text: "Boreal Aurora" },
                { value: "purple", text: "Deep Purple" },
                { value: "sunset", text: "Sunset Glass" }
            ],
            default: "intelligence"
        },
        glass: {
            label: "Frosted Glass Panel",
            type: "range",
            min: 0, max: 100,
            default: 60,
            displaySuffix: "%"
        },
        format: {
            label: "Time Format",
            type: "select",
            options: [
                { value: "24", text: "24 Hour" },
                { value: "12", text: "12 Hour" }
            ],
            default: "24"
        }
    },

    init: function(stage, savedSettings) {
        this.stage = stage;
        this.settings = {
            palette: savedSettings.palette || this.settingsConfig.palette.default,
            glass: savedSettings.glass !== undefined ? savedSettings.glass : this.settingsConfig.glass.default,
            format: savedSettings.format || this.settingsConfig.format.default
        };

        stage.innerHTML = `
            <div class="apple-aura-bg">
                <div class="aura-orb orb-1"></div>
                <div class="aura-orb orb-2"></div>
                <div class="aura-orb orb-3"></div>
            </div>
            <div class="apple-aura-glass" id="aura-glass">
                <div class="apple-aura-time">
                    <span id="aura-hm">00:00</span>
                    <span id="aura-s">00</span>
                    <span id="aura-ampm"></span>
                </div>
                <div class="apple-aura-date" id="aura-date"></div>
            </div>
        `;

        this.elements = {
            bg: stage.querySelector('.apple-aura-bg'),
            glass: document.getElementById('aura-glass'),
            hm: document.getElementById('aura-hm'),
            s: document.getElementById('aura-s'),
            ampm: document.getElementById('aura-ampm'),
            date: document.getElementById('aura-date')
        };

        this.applySettings();
    },

    update: function(timeObj) {
        let h = parseInt(timeObj.h);
        let ampmStr = "";

        if (this.settings.format === "12") {
            ampmStr = h >= 12 ? "PM" : "AM";
            h = h % 12 || 12;
        }

        const hStr = String(h).padStart(2, '0');
        const newHm = `${hStr}:${timeObj.m}`;
        
        if (this.elements.hm.innerText !== newHm) {
            this.elements.hm.innerText = newHm;
        }
        this.elements.s.innerText = timeObj.s;
        this.elements.ampm.innerText = ampmStr;

        const now = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        this.elements.date.innerText = now.toLocaleDateString(undefined, options);
    },

    onSettingsChange: function(key, value) {
        this.settings[key] = value;
        this.applySettings();
    },

    applySettings: function() {
        this.elements.bg.dataset.theme = this.settings.palette;

        const opacity = this.settings.glass / 100;
        
        if (this.settings.glass == 0) {
            this.elements.glass.style.background = 'transparent';
            this.elements.glass.style.border = 'none';
            this.elements.glass.style.backdropFilter = 'none';
            this.elements.glass.style.webkitBackdropFilter = 'none';
            this.elements.glass.style.boxShadow = 'none';
        } else {
            this.elements.glass.style.background = `rgba(255, 255, 255, ${opacity * 0.08})`;
            this.elements.glass.style.border = `1px solid rgba(255, 255, 255, ${opacity * 0.2})`;
            this.elements.glass.style.boxShadow = `0 25px 50px -12px rgba(0, 0, 0, ${opacity * 0.5})`;
            
            const blurAmount = opacity * 50; 
            this.elements.glass.style.backdropFilter = `blur(${blurAmount}px) saturate(180%)`;
            this.elements.glass.style.webkitBackdropFilter = `blur(${blurAmount}px) saturate(180%)`;
        }
    },

    destroy: function() {
        if (this.stage) this.stage.innerHTML = '';
    }
};
