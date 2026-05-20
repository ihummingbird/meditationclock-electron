window.ActiveTheme = {
    els: {},
    // Store current state for animation loop
    state: { h: 0, m: 0, s: 0, ms: 0 },
    
    settingsConfig: {
        scale: {
            type: 'range', label: 'Scale', default: 100, min: 70, max: 120, displaySuffix: '%'
        },
        palette: {
            type: 'palette', label: 'Accent', default: '#7fe0d5',
            options: ['#7fe0d5', '#ff7eb6', '#ffd966', '#829dff', '#8df6c5', '#ffffff']
        },
        glow: {
            type: 'range', label: 'Intensity', default: 40, min: 10, max: 80, displaySuffix: '%'
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="zen-stage">
                <div class="zen-atmosphere"></div>
                
                <div class="zen-shell">
                    <div class="zen-core">
                        <!-- RINGS -->
                        <div class="orbit-track primary">
                            <div class="orbit-head"></div>
                        </div>
                        <div class="orbit-track secondary">
                            <div class="orbit-head"></div>
                        </div>

                        <!-- CONTENT -->
                        <div class="zen-content">
                            <div class="time-group">
                                <div class="hh">00</div>
                                <div class="mm">00</div>
                            </div>
                            <div class="ss-pill">00</div>
                            <div class="meta-info">LOADING</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            shell: stage.querySelector('.zen-shell'),
            ringS: stage.querySelector('.orbit-track.primary'),
            ringM: stage.querySelector('.orbit-track.secondary'),
            hh: stage.querySelector('.hh'),
            mm: stage.querySelector('.mm'),
            ss: stage.querySelector('.ss-pill'),
            meta: stage.querySelector('.meta-info'),
            root: document.documentElement
        };

        const s = settings || {};
        this.applySettings(s.scale ?? 100, s.palette ?? '#7fe0d5', s.glow ?? 40);

        // Start Animation Loop
        this.animate();
    },

    applySettings(scale, palette, glow) {
        this.els.root.style.setProperty('--zo-scale', scale / 100);
        this.els.root.style.setProperty('--zo-accent', palette);
        this.els.root.style.setProperty('--zo-glow', glow + '%');

        // Automatically derive secondary color
        const map = {
            '#7fe0d5': '#b385ff', // Cyan -> Purple
            '#ff7eb6': '#7fe0d5', // Pink -> Cyan
            '#ffd966': '#ff8e53', // Yellow -> Orange
            '#829dff': '#f082ff', // Blue -> Pink
            '#8df6c5': '#67c5ff', // Green -> Blue
            '#ffffff': '#888888'  // White -> Grey
        };
        this.els.root.style.setProperty('--zo-secondary', map[palette] || '#b385ff');
    },

    // Called by Engine every second (for text)
    update(time) {
        if(!this.els.hh) return;
        this.els.hh.textContent = time.h;
        this.els.mm.textContent = time.m;
        this.els.ss.textContent = time.s;

        // Update Date
        const now = new Date();
        const str = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        this.els.meta.textContent = str.toUpperCase();
    },

    // Called by requestAnimationFrame (60fps) for smooth rings
    animate() {
        if (!this.els.ringS) return; // Stop if destroyed

        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds();
        const m = now.getMinutes();

        // Calculate smooth degrees
        // Seconds: (s + ms/1000) / 60 * 360
        const degS = (s + ms / 1000) * 6;
        
        // Minutes: (m + s/60) / 60 * 360
        const degM = (m + s / 60) * 6;

        this.els.ringS.style.transform = `rotate(${degS}deg)`;
        this.els.ringM.style.transform = `rotate(${degM}deg)`;

        requestAnimationFrame(() => this.animate());
    },

    onSettingsChange(key, val) {
        const root = document.documentElement;
        // Grab current values to re-apply
        const currentScale = parseFloat(root.style.getPropertyValue('--zo-scale')) * 100 || 100;
        const currentPal = getComputedStyle(root).getPropertyValue('--zo-accent').trim() || '#7fe0d5';
        const currentGlow = parseFloat(root.style.getPropertyValue('--zo-glow')) || 40;

        if (key === 'scale') this.applySettings(val, currentPal, currentGlow);
        if (key === 'palette') this.applySettings(currentScale, val, currentGlow);
        if (key === 'glow') this.applySettings(currentScale, currentPal, val);
    },

    destroy() {
        this.els = {};
    }
};