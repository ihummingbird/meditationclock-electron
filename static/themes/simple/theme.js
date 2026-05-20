window.ActiveTheme = {
    els: {},

    // Only Zoom allowed now. Pure B&W.
    settingsConfig: {
        size: {
            type: 'range',
            label: 'Zoom Level',
            default: 15,
            min: 5,
            max: 30
        }
    },

    init: function(stage, settings) {
        stage.innerHTML = `
            <div class="simple-clock-container">
                <span id="s-h">00</span><span id="s-d">:</span><span id="s-m">00</span>
            </div>
        `;

        this.els.container = stage.querySelector('.simple-clock-container');
        this.els.h = document.getElementById('s-h');
        this.els.m = document.getElementById('s-m');
        this.els.d = document.getElementById('s-d');

        const size = settings.size || this.settingsConfig.size.default;
        
        // Locked to White color
        this.els.container.style.color = '#ffffff';
        this.els.container.style.fontSize = size + 'vw';
    },

    update: function(t) {
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        
        if (t.s % 2 === 0) {
            this.els.d.style.opacity = 1;
        } else {
            this.els.d.style.opacity = 0.2;
        }
    },

    onSettingsChange: function(key, val) {
        if (key === 'size') this.els.container.style.fontSize = val + 'vw';
    },

    destroy: function() {
        this.els = {};
    }
};