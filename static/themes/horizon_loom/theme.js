window.ActiveTheme = {
    els: {},
    scale: 1,

    settingsConfig: {
        scale: {
            type: 'range',
            label: 'Size',
            default: 100,
            min: 70,
            max: 130,
            displaySuffix: '%'
        },
        palette: {
            type: 'palette',
            label: 'Bloom Color',
            default: '#7cd7ff',
            options: ['#7cd7ff', '#ff9ed1', '#ffd479', '#8dd4ff', '#9dffda', '#ffb4ff']
        }
    },

    init(stage, settings) {
        // Redesigned "Ethereal Radiance" Structure
        stage.innerHTML = `
            <div class="bloom-stage">
                <div class="bloom-bg"></div>
                <div class="bloom-core"></div>
                <div class="bloom-content">
                    <div class="time-display">
                        <span class="hh">00</span><span class="colon">:</span><span class="mm">00</span>
                    </div>
                    <div class="date-display">loading...</div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.bloom-stage'),
            core: stage.querySelector('.bloom-core'),
            hh: stage.querySelector('.hh'),
            mm: stage.querySelector('.mm'),
            colon: stage.querySelector('.colon'),
            date: stage.querySelector('.date-display')
        };

        const scale = settings.scale ?? 100;
        const palette = settings.palette ?? '#7cd7ff';

        this.applyScale(scale);
        this.applyPalette(palette);
    },

    update(time) {
        this.els.hh.textContent = time.h;
        this.els.mm.textContent = time.m;

        // Soft pulsing colon
        this.els.colon.style.opacity = (parseInt(time.s) % 2 === 0) ? 1 : 0.5;

        const now = new Date();
        // Format: Monday, January 1
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        this.els.date.textContent = dateStr;
    },

    applyScale(val) {
        document.documentElement.style.setProperty('--hb-scale', val / 100);
    },

    applyPalette(hex) {
        document.documentElement.style.setProperty('--hb-accent', hex);

        // Generate a complementary secondary color for the gradient
        const secondary = this.shiftHue(hex, 40);
        document.documentElement.style.setProperty('--hb-accent-2', secondary);
    },

    onSettingsChange(key, val) {
        if (key === 'scale') this.applyScale(val);
        if (key === 'palette') this.applyPalette(val);
    },

    destroy() {
        this.els = {};
    },

    // Helper: Simple Hue Shift
    shiftHue(hex, degree) {
        // Very basic mock shift or just return a contrasting color if complex mapping is needed.
        // For simplicity in a single file, let's just rotate roughly.
        // Actually, CSS color-mix is better handled in CSS, let's just pass the main color 
        // and let CSS handle the gradients using variations.
        // But the user wants distinct variations. Let's return a hardcoded pair map.
        const map = {
            '#7cd7ff': '#d77cff', // Blue -> Purple
            '#ff9ed1': '#9effce', // Pink -> Mint
            '#ffd479': '#ff7979', // Yellow -> Red
            '#8dd4ff': '#8dff9f', // Light Blue -> Green
            '#9dffda': '#9dcbff', // Mint -> Blue
            '#ffb4ff': '#b4ffff'  // Purple -> Cyan
        };
        return map[hex] || '#ffffff';
    }
};