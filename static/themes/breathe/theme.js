window.ActiveTheme = {
    els: {},
    cycleTimer: null,
    currentPhase: 'inhale',

    // --- CONFIGURATION ---
    settingsConfig: {
        tintColor: {
            type: 'palette',
            label: 'Zen Color',
            default: '#ffffff',
            options: [
                '#ffffff', // Pure White
                '#9ce89d', // Standby Green
                '#ffe629', // Daffodil Yellow
                '#ff453a', // System Red
                '#64d2ff'  // Cyan Blue
            ]
        },
        inhaleTime: {
            type: 'range',
            label: 'Inhale',
            default: 4,
            min: 2,
            max: 10,
            displaySuffix: 's' 
        },
        holdTime: {
            type: 'range',
            label: 'Hold',
            default: 7,
            min: 0,
            max: 10,
            displaySuffix: 's'
        },
        exhaleTime: {
            type: 'range',
            label: 'Exhale',
            default: 8,
            min: 2,
            max: 12,
            displaySuffix: 's'
        }
    },
    
    config: {
        inhale: 4,
        hold: 7,
        exhale: 8
    },

    init: function(stage, savedSettings) {
        stage.innerHTML = `
            <div class="breathe-container">
                <div id="breathe-circle"></div>
                <div id="breathe-text">READY</div>
                <div class="tiny-clock" id="tiny-time">00:00</div>
            </div>
        `;

        this.els.container = stage.querySelector('.breathe-container');
        this.els.circle = document.getElementById('breathe-circle');
        this.els.text = document.getElementById('breathe-text');
        this.els.time = document.getElementById('tiny-time');

        // Apply Timings
        if (savedSettings.inhaleTime) this.config.inhale = parseInt(savedSettings.inhaleTime);
        if (savedSettings.holdTime) this.config.hold = parseInt(savedSettings.holdTime);
        if (savedSettings.exhaleTime) this.config.exhale = parseInt(savedSettings.exhaleTime);

        // Apply Color
        const color = savedSettings.tintColor || '#ffffff';
        this.applyColor(color);

        this.runCycle();
    },

    runCycle: function() {
        const nextStep = (phase, duration, text, cssClass) => {
            this.els.text.innerText = text;
            this.els.circle.style.transitionDuration = `${duration}s`;
            
            this.els.circle.classList.remove('state-inhale', 'state-exhale', 'state-hold');
            if(cssClass) this.els.circle.classList.add(cssClass);

            this.cycleTimer = setTimeout(() => {
                this.advancePhase(phase);
            }, duration * 1000);
        };

        switch(this.currentPhase) {
            case 'inhale':
                nextStep('inhale', this.config.inhale, "INHALE", "state-inhale");
                break;
            case 'hold':
                nextStep('hold', this.config.hold, "HOLD", "state-hold");
                break;
            case 'exhale':
                nextStep('exhale', this.config.exhale, "EXHALE", "state-exhale");
                break;
        }
    },

    advancePhase: function(current) {
        if (current === 'inhale') {
            this.currentPhase = (this.config.hold > 0) ? 'hold' : 'exhale';
        } else if (current === 'hold') {
            this.currentPhase = 'exhale';
        } else if (current === 'exhale') {
            this.currentPhase = 'inhale';
        }
        this.runCycle();
    },

    update: function(t) {
        this.els.time.innerText = `${t.h}:${t.m}`;
    },

    onSettingsChange: function(key, val) {
        if (key === 'tintColor') {
            this.applyColor(val);
        } else {
            const intVal = parseInt(val);
            if (key === 'inhaleTime') this.config.inhale = intVal;
            if (key === 'holdTime') this.config.hold = intVal;
            if (key === 'exhaleTime') this.config.exhale = intVal;
        }
    },

    // --- HELPER: CONVERT HEX TO RGB ---
    // This allows us to use RGBA in CSS with the custom color
    applyColor: function(hex) {
        const rgb = this.hexToRgb(hex);
        // We set two variables: one for solid color, one for the RGB numbers
        this.els.container.style.setProperty('--breathe-color', hex);
        this.els.container.style.setProperty('--breathe-rgb', rgb);
    },

    hexToRgb: function(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
            : '255, 255, 255';
    },

    destroy: function() {
        if (this.cycleTimer) clearTimeout(this.cycleTimer);
        this.els = {};
    }
};