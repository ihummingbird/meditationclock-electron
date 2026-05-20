window.ActiveTheme = {
    els: {},

    settingsConfig: {
        palette: {
            type: 'palette',
            label: 'Spectrum',
            default: 'neon',
            options: [
                'neon',   // Pink/Cyan/Gold
                'fire',   // Red/Orange/Yellow
                'ocean',  // Blue/Teal/White
                'forest', // Green/Lime/Yellow
                'mono'    // White/Grey/Black
            ]
        },
        smooth: {
            type: 'range', // Using range as toggle 0/1 for simplicity in this engine
            label: 'Smooth Motion',
            default: 1,
            min: 0,
            max: 1,
            displaySuffix: ''
        },
        scale: {
            type: 'range',
            label: 'Mandala Size',
            default: 100,
            min: 50,
            max: 150,
            displaySuffix: '%'
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="mandala-stage">
                <div class="markers">
                    <div class="marker-12">XII</div>
                    <div class="marker-3">III</div>
                    <div class="marker-6">VI</div>
                    <div class="marker-9">IX</div>
                </div>

                <div class="mandala-core">
                    <div class="center-dot"></div>
                    <div class="layer layer-hours"></div>
                    <div class="layer layer-minutes"></div>
                    <div class="layer layer-seconds smooth"></div>
                </div>
                
                <div class="digital-overlay">Radiant Mandala</div>
            </div>
        `;

        this.els = {
            h: stage.querySelector('.layer-hours'),
            m: stage.querySelector('.layer-minutes'),
            s: stage.querySelector('.layer-seconds'),
            label: stage.querySelector('.digital-overlay')
        };

        const sett = settings;
        this.applySettings(sett.palette ?? 'neon', sett.smooth ?? 1, sett.scale ?? 100);
    },

    update(time) {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds();
        const m = now.getMinutes();
        const h = now.getHours();

        // Calculate Angles
        // Smooth: include milliseconds
        const isSmooth = this.els.s.classList.contains('smooth');

        const sDeg = isSmooth ? ((s + ms / 1000) * 6) : (s * 6);
        const mDeg = (m * 6) + (s * 0.1);
        const hDeg = (h % 12 * 30) + (m * 0.5);

        // Apply Rotation
        // We use translate(-50%, -50%) to keep centered, then rotate
        this.els.s.style.transform = `translate(-50%, -50%) rotate(${sDeg}deg)`;
        this.els.m.style.transform = `translate(-50%, -50%) rotate(${mDeg}deg)`;
        this.els.h.style.transform = `translate(-50%, -50%) rotate(${hDeg}deg)`;
    },

    applySettings(palette, smooth, scale) {
        const r = document.documentElement;

        // Palettes
        const colors = {
            neon: ['#ff0055', '#00ffff', '#ffd700'],
            fire: ['#ff3300', '#ffaa00', '#ffff00'],
            ocean: ['#0033ff', '#00ffff', '#ffffff'],
            forest: ['#006600', '#00ff33', '#ccff00'],
            mono: ['#666666', '#aaaaaa', '#ffffff']
        };
        const c = colors[palette] || colors.neon;

        r.style.setProperty('--rm-color-1', c[0]);
        r.style.setProperty('--rm-color-2', c[1]);
        r.style.setProperty('--rm-color-3', c[2]);
        r.style.setProperty('--rm-scale', scale / 100);

        if (smooth > 0.5) this.els.s.classList.add('smooth');
        else this.els.s.classList.remove('smooth');
    },

    onSettingsChange(key, val) {
        if (key === 'palette') this.applySettings(val, 1, 100); // Hacky partial apply
        // Correct way matches applySettings logic
        const r = document.documentElement;
        if (key === 'scale') r.style.setProperty('--rm-scale', val / 100);
        if (key === 'smooth') {
            if (val > 0.5) this.els.s.classList.add('smooth');
            else this.els.s.classList.remove('smooth');
        }
        if (key === 'palette') {
            // Re-run color logic
            const colors = {
                neon: ['#ff0055', '#00ffff', '#ffd700'],
                fire: ['#ff3300', '#ffaa00', '#ffff00'],
                ocean: ['#0033ff', '#00ffff', '#ffffff'],
                forest: ['#006600', '#00ff33', '#ccff00'],
                mono: ['#666666', '#aaaaaa', '#ffffff']
            };
            const c = colors[val] || colors.neon;
            r.style.setProperty('--rm-color-1', c[0]);
            r.style.setProperty('--rm-color-2', c[1]);
            r.style.setProperty('--rm-color-3', c[2]);
        }
    },

    destroy() {
        this.els = {};
    }
};
