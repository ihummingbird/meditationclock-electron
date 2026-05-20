// theme.js - Vision Glass

window.ActiveTheme = {
    els: {
        orbSec: null, orbMin: null, orbHour: null,
        h: null, m: null, s: null,
        date: null, panel: null
    },
    rafId: null,
    currentSettings: {}, 

    settingsConfig: {
        scale: {
            type: 'range',
            label: 'Widget Size',
            default: 100,
            min: 70,
            max: 140,
            displaySuffix: '%'
        },
                material: {
            type: 'select',
            label: 'Material',
            default: 'alpine',
            options: [
                { value: 'alpine', text: 'Alpine Blue' },
                { value: 'aurora', text: 'Aurora Green' },
                { value: 'crimson', text: 'Crimson Red' },
                { value: 'midnight', text: 'Midnight Purple' },
                { value: 'starlight', text: 'Starlight Gold' },
                { value: 'titanium', text: 'Natural Titanium' }
            ]
        },
        format: {
            type: 'select',
            label: 'Display',
            default: 'hybrid',
            options: [
                { value: 'hybrid', text: 'Hybrid (Both)' },
                { value: 'analog', text: 'Analog Orbital' },
                { value: 'digital', text: 'Digital Focus' }
            ]
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="vision-stage">
                <div class="vision-ambient-orb"></div>
                
                <div class="vision-glass-panel" id="v-panel">
                    <!-- ANALOG DIAL -->
                    <div class="vision-dial">
                        <div class="vg-ring vg-ring-hour">
                            <div class="vg-orbit" id="v-orb-hour"><div class="vg-dot"></div></div>
                        </div>
                        <div class="vg-ring vg-ring-min">
                            <div class="vg-orbit" id="v-orb-min"><div class="vg-dot"></div></div>
                        </div>
                        <div class="vg-ring vg-ring-sec">
                            <div class="vg-orbit" id="v-orb-sec"><div class="vg-dot"></div></div>
                        </div>
                    </div>

                    <!-- DIGITAL TIME -->
                    <div class="vision-digital">
                        <div class="vg-time-stack">
                            <span id="v-h">12</span>:<span id="v-m">00</span>
                            <span id="v-s" class="vg-s">00</span>
                        </div>
                        <div class="vg-date" id="v-date">MON 1</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            orbSec: document.getElementById('v-orb-sec'),
            orbMin: document.getElementById('v-orb-min'),
            orbHour: document.getElementById('v-orb-hour'),
            h: document.getElementById('v-h'),
            m: document.getElementById('v-m'),
            s: document.getElementById('v-s'),
            date: document.getElementById('v-date'),
            panel: document.getElementById('v-panel')
        };

        // Load settings into memory 
        this.currentSettings = settings || {}; 
        this.applySettings(); 

        this.loop();
    },

    loop() {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds();
        const m = now.getMinutes();
        const h = now.getHours();

        // Ultra-smooth continuous sweeps
        const secDeg = (s + ms / 1000) * 6;
        const minDeg = (m + s / 60) * 6;
        const hourDeg = ((h % 12) + m / 60) * 30; // 360deg / 12 hours = 30

        if(this.els.orbSec) this.els.orbSec.style.transform = `rotate(${secDeg}deg)`;
        if(this.els.orbMin) this.els.orbMin.style.transform = `rotate(${minDeg}deg)`;
        if(this.els.orbHour) this.els.orbHour.style.transform = `rotate(${hourDeg}deg)`;

        this.rafId = requestAnimationFrame(() => this.loop());
    },

    update(timeData) {
        if (!this.els.h) return;
        
        // Update digital clock
        this.els.h.textContent = timeData.h;
        this.els.m.textContent = timeData.m;
        this.els.s.textContent = timeData.s;

        // Apple style date: "WED 14 OCT"
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            weekday: 'short', 
            day: 'numeric',
            month: 'short'
        }).toUpperCase();
        
        this.els.date.textContent = dateStr;
    },

    applySettings() {
        const s = this.currentSettings; 
        const r = document.documentElement;
        
        // 1. Scale
        r.style.setProperty('--vg-scale', (s.scale || 100) / 100);
        
        // 2. Display Format Toggle
        if(this.els.panel) {
            this.els.panel.dataset.format = s.format || 'hybrid';
        }

                // 3. Apple-inspired Materials (Ambient Gradient Glows)
        const materials = {
            'alpine':    ['#00D1FF', '#0A84FF'], // Bright Cyan to Deep Blue
            'aurora':    ['#30DB5B', '#00D1FF'], // Vibrant Green to Cyan
            'crimson':   ['#FF3B30', '#FF2D55'], // Product Red to Deep Pink
            'midnight':  ['#BF5AF2', '#5E5CE6'], // Neon Purple to Indigo
            'starlight': ['#F4E8D4', '#D4AF37'], // Champagne to Gold
            'titanium':  ['#8E8E93', '#1C1C1E']  // Silver to Dark Charcoal
        };


        const colors = materials[s.material] || materials['alpine'];
        r.style.setProperty('--vg-orb-1', colors[0]);
        r.style.setProperty('--vg-orb-2', colors[1]);
        
        // Make the glass darker for Titanium to simulate physical metal
        if(s.material === 'titanium') {
            r.style.setProperty('--vg-glass-opacity', '0.15');
        } else {
            r.style.setProperty('--vg-glass-opacity', '0.05');
        }
    },

    onSettingsChange(key, val) {
        this.currentSettings[key] = val;
        this.applySettings(); 
    },

    destroy() {
        cancelAnimationFrame(this.rafId);
        const r = document.documentElement;
        ['--vg-scale', '--vg-orb-1', '--vg-orb-2', '--vg-glass-opacity'].forEach(v => r.style.removeProperty(v));
    }
};
