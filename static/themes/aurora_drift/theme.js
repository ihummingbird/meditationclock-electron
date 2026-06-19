window.ActiveTheme = {
    els: {},
    raf: null,

    settingsConfig: {
        size: {
            type: 'range',
            label: 'Clock Size',
            default: 14,
            min: 6,
            max: 28
        },
        hue: {
            type: 'palette',
            label: 'Aurora Tint',
            default: 200,
            options: [200, 280, 160, 330, 30, 0] // blue, violet, teal, pink, amber, multi(0)
        },
        speed: {
            type: 'range',
            label: 'Drift Speed',
            default: 40,
            min: 10,
            max: 100,
            displaySuffix: '%'
        }
    },

    init: function (stage, settings) {
        stage.innerHTML = `
            <div class="aurora-stage">
                <div class="aurora-bg">
                    <span class="aurora-blob blob-1"></span>
                    <span class="aurora-blob blob-2"></span>
                    <span class="aurora-blob blob-3"></span>
                </div>
                <div class="aurora-clock">
                    <span id="ad-h">00</span><span id="ad-sep">:</span><span id="ad-m">00</span>
                </div>
                <div class="aurora-seconds"><span id="ad-s">00</span></div>
            </div>
        `;

        this.els.stage = stage.querySelector('.aurora-stage');
        this.els.clock = stage.querySelector('.aurora-clock');
        this.els.h = document.getElementById('ad-h');
        this.els.m = document.getElementById('ad-m');
        this.els.s = document.getElementById('ad-s');
        this.els.sep = document.getElementById('ad-sep');

        this.applySize(settings.size || this.settingsConfig.size.default);
        this.applyHue(settings.hue ?? this.settingsConfig.hue.default);
        this.applySpeed(settings.speed || this.settingsConfig.speed.default);
    },

    applySize: function (val) {
        this.els.clock.style.fontSize = val + 'vw';
    },

    applyHue: function (val) {
        const h = Number(val);
        // hue 0 = "multi" rainbow mode
        if (h === 0) {
            this.els.stage.style.setProperty('--c1', 'hsl(280, 80%, 60%)');
            this.els.stage.style.setProperty('--c2', 'hsl(190, 85%, 55%)');
            this.els.stage.style.setProperty('--c3', 'hsl(330, 80%, 60%)');
            this.els.stage.style.setProperty('--glow', 'hsl(220, 90%, 75%)');
        } else {
            this.els.stage.style.setProperty('--c1', `hsl(${h}, 80%, 60%)`);
            this.els.stage.style.setProperty('--c2', `hsl(${(h + 40) % 360}, 75%, 55%)`);
            this.els.stage.style.setProperty('--c3', `hsl(${(h + 320) % 360}, 80%, 60%)`);
            this.els.stage.style.setProperty('--glow', `hsl(${h}, 90%, 78%)`);
        }
    },

    applySpeed: function (val) {
        // map 10-100 -> slow(40s) to fast(8s)
        const dur = 44 - (Number(val) / 100) * 36;
        this.els.stage.style.setProperty('--drift', dur.toFixed(1) + 's');
    },

    update: function (t) {
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        this.els.s.innerText = t.s;
        this.els.sep.style.opacity = (t.s % 2 === 0) ? '1' : '0.25';
    },

    onSettingsChange: function (key, val) {
        if (key === 'size') this.applySize(val);
        if (key === 'hue') this.applyHue(val);
        if (key === 'speed') this.applySpeed(val);
    },

    destroy: function () {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.els = {};
    }
};
