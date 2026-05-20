window.ActiveTheme = {
    els: {},

    // CONFIGURATION
    settingsConfig: {
        // 1. Color Palette (Visual Circles)
        tintColor: {
            type: 'palette',
            label: 'Standby Color',
            default: '#9ce89d',
            options: [
                '#9ce89d', // Standby Green
                '#ffe629', // Daffodil Yellow
                '#ff453a', // System Red
                '#64d2ff', // Cyan Blue
                '#ffffff'  // Pure White
            ]
        },
        // 2. Font Style (Slider 1-5)
        fontStyle: {
            type: 'range',
            label: 'Typeface (Round / Sans / Serif / Mono / Slab)',
            default: 1,
            min: 1,
            max: 5
        },
        // 3. Weight Adjustment
        weight: {
            type: 'range',
            label: 'Thickness',
            default: 700,
            min: 100,
            max: 900
        }
    },

    init: function (stage, savedSettings) {
        // Layout
        stage.innerHTML = `
            <div class="ios-container font-sans">
                <div class="ios-clock-group">
                    <span id="ios-h">09</span>
                    <span id="ios-dots" class="blink-on">:</span>
                    <span id="ios-m">41</span>
                </div>

                <div class="ios-widgets">
                    <div class="widget widget-date">
                        <div id="ios-day" class="widget-day">MON</div>
                        <div id="ios-date-num">5</div>
                    </div>
                </div>
            </div>
        `;

        this.els.container = stage.querySelector('.ios-container');
        this.els.h = document.getElementById('ios-h');
        this.els.m = document.getElementById('ios-m');
        this.els.dots = document.getElementById('ios-dots');
        this.els.day = document.getElementById('ios-day');
        this.els.dateNum = document.getElementById('ios-date-num');

        // Initial Apply
        const color = savedSettings.tintColor || '#9ce89d';
        const fontStyle = savedSettings.fontStyle || 1;
        const weight = savedSettings.weight || 700;

        this.applyVisuals(color, fontStyle, weight);
        this.updateDate();
    },

    update: function (t) {
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;

        // Blink dots every second
        if (t.s % 2 === 0) {
            this.els.dots.style.opacity = 1;
        } else {
            this.els.dots.style.opacity = 0.3; // Dim, don't hide completely
        }

        if (t.s === "00") this.updateDate();
    },

    updateDate: function () {
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        this.els.day.innerText = days[now.getDay()];
        this.els.dateNum.innerText = now.getDate();
    },

    onSettingsChange: function (key, val) {
        if (key === 'tintColor') {
            this.els.container.style.color = val;
        }
        if (key === 'weight') {
            this.els.container.style.fontWeight = val;
        }
        if (key === 'fontStyle') {
            this.setFontClass(parseInt(val));
        }
    },

    applyVisuals: function (color, fontStyle, weight) {
        this.els.container.style.color = color;
        this.els.container.style.fontWeight = weight;
        this.setFontClass(parseInt(fontStyle));
    },

    setFontClass: function (val) {
        // Clear all font classes
        const classes = [ 'font-rounded', 'font-sans', 'font-serif', 'font-mono', 'font-slab'];
        this.els.container.classList.remove(...classes);

        // Apply new one based on index 1-5
        // 1: System Sans (San Francisco)
        // 2: System Rounded (SF Rounded)
        // 3: System Serif (New York)
        // 4: Monospace (SF Mono)
        // 5: Slab Serif (Rockwell/Georgia)
        const map = { 1: 'font-sans', 2: 'font-rounded', 3: 'font-serif', 4: 'font-mono', 5: 'font-slab' };
        this.els.container.classList.add(map[val] || 'font-sans');
    },

    destroy: function () {
        this.els = {};
    }

};
