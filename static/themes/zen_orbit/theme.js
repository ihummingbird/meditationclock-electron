window.ActiveTheme = {
    els: {
        outerHand: null,
        innerHand: null,
        h: null, m: null, s: null,
        date: null, zone: null,
        shell: null
    },
    rafId: null,
    currentSettings: {}, // <--- NEW: Memory state for the theme

    settingsConfig: {
        scale: {
            type: 'range',
            label: 'Size',
            default: 100,
            min: 60,
            max: 120,
            displaySuffix: '%'
        },
        // Renamed to "Palette" but controls gradient presets
        palette: {
            type: 'select',
            label: 'Vibe',
            default: 'california',
            options: [
                { value: 'california', text: 'California (Pink/Purp)' },
                { value: 'aurora', text: 'Aurora (Green/Blue)' },
                { value: 'midnight', text: 'Midnight (Dark)' },
                { value: 'volcano', text: 'Volcano (Red/Orange)' }
            ]
        },
        layout: {
            type: 'select',
            label: 'Mode',
            default: 'full',
            options: [
                { value: 'full', text: 'Standard' },
                { value: 'minimal', text: 'Focus' }
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="zen-stage">
                <div class="zen-aurora"></div>
                
                <div class="zen-shell" id="z-shell">
                    
                    <!-- RINGS -->
                    <div class="ring-container ring-outer">
                        <div class="track"></div>
                        <div class="hand" id="z-hand-sec">
                            <div class="dot"></div>
                        </div>
                    </div>

                    <div class="ring-container ring-inner">
                        <div class="track"></div>
                        <div class="hand" id="z-hand-min">
                            <div class="dot"></div>
                        </div>
                    </div>

                    <!-- GLASS CAPSULE -->
                    <div class="glass-capsule">
                        <div class="time-stack">
                            <div class="ts-hours" id="z-h">12</div>
                            <div class="ts-minutes" id="z-m">00</div>
                            <div class="ts-seconds" id="z-s">00</div>
                        </div>
                        <div class="meta-info">
                            <span id="z-date">MON 1</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            outerHand: document.getElementById('z-hand-sec'),
            innerHand: document.getElementById('z-hand-min'),
            h: document.getElementById('z-h'),
            m: document.getElementById('z-m'),
            s: document.getElementById('z-s'),
            date: document.getElementById('z-date'),
            shell: document.getElementById('z-shell')
        };

        this.currentSettings = settings || {}; 
        this.applySettings();

        this.loop();
    },

    loop() {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds();
        const m = now.getMinutes();

        // Apple Watch Style smoothness (6 degrees per unit)
        const secDeg = (s + ms / 1000) * 6;
        const minDeg = (m + s / 60) * 6;

        if(this.els.outerHand) this.els.outerHand.style.transform = `rotate(${secDeg}deg)`;
        if(this.els.innerHand) this.els.innerHand.style.transform = `rotate(${minDeg}deg)`;

        this.rafId = requestAnimationFrame(() => this.loop());
    },

    update(timeData) {
        if (!this.els.h) return;
        this.els.h.textContent = timeData.h;
        this.els.m.textContent = timeData.m;
        this.els.s.textContent = timeData.s;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        this.els.date.textContent = dateStr;
    },

        applySettings() { // <-- Remove argument here
        const s = this.currentSettings; 
        const r = document.documentElement;
        
        // Size
        r.style.setProperty('--zo-scale', (s.scale || 100) / 100);
        
        // Mode
        if(this.els.shell) this.els.shell.dataset.mode = s.layout || 'full';

        // Palette Logic (Gradients)
        const palettes = {
            'california': ['#FF2D55', '#5856D6', '#007AFF'], 
            'aurora':     ['#30DB5B', '#00D1FF', '#0A84FF'], 
            'midnight':   ['#BF5AF2', '#5E5CE6', '#0A84FF'], 
            'volcano':    ['#FF9500', '#FF3B30', '#FF2D55']  
        };

        const colors = palettes[s.palette] || palettes['california'];
        
        // Apply to CSS Variables for the Gradient Mesh
        r.style.setProperty('--zo-p1', colors[0]);
        r.style.setProperty('--zo-p2', colors[1]);
        r.style.setProperty('--zo-p3', colors[2]);
    },


    onSettingsChange(key, val) {
    this.currentSettings[key] = val;
    this.applySettings(); // <-- Remove 's' from inside the parenthesis
    },


    destroy() {
        cancelAnimationFrame(this.rafId);
        const r = document.documentElement;
        ['--zo-scale', '--zo-p1', '--zo-p2', '--zo-p3'].forEach(v => r.style.removeProperty(v));
    }
};