window.ActiveTheme = {
    els: {
        time: null,
        date: null,
        sys: null
    },

    settingsConfig: {
        color: {
            type: 'palette',
            label: 'Reactor Core',
            default: '210', // Blue
            options: [
                '210', // Cyan/Blue
                '45',  // Gold/Amber
                '0',   // Red/Crimson
                '130', // Matrix Green
                '280'  // Void Purple
            ]
        },
        speed: {
            type: 'range',
            label: 'Gyro Speed',
            default: 30,
            min: 5,
            max: 60,
            displaySuffix: 's'
        },
        scale: {
            type: 'range',
            label: 'System Scale',
            default: 100,
            min: 50,
            max: 150,
            displaySuffix: '%'
        }
    },

    init(stage, settings) {
        stage.innerHTML = `
            <div class="gyre-stage">
                <div class="void-stars"></div>
                
                <div class="gyro-assembly">
                    <!-- Layer 1: Outer Data Track -->
                    <div class="ring r-outer"></div>
                    
                    <!-- Layer 2: Segmented Plate -->
                    <div class="ring r-sectors"></div>
                    
                    <!-- Layer 3: The 3D Gimbal -->
                    <div class="ring r-gimbal"></div>
                    
                    <!-- Layer 4: Reactor Shield -->
                    <div class="ring r-reactor"></div>
                    
                    <!-- Layer 5: The Singularity -->
                    <div class="core-singularity"></div>
                    
                    <!-- HUD Overlay (Pinned to Center) -->
                    <div class="hud-layer">
                        <div class="time-display">00:00:00</div>
                        <div class="date-display">CHRONOS</div>
                        <div class="sys-status">SYSTEM NORMAL</div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            time: stage.querySelector('.time-display'),
            date: stage.querySelector('.date-display'),
            sys: stage.querySelector('.sys-status')
        };

        const s = settings;
        this.applySettings(s.color ?? '210', s.speed ?? 30, s.scale ?? 100);
    },

    update(time) {
        if (!this.els.time) return;
        
        // Precise Time
        this.els.time.textContent = `${time.h}:${time.m}:${time.s}`;

        // Tech Date Format
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        
        this.els.date.textContent = `CYCLE // ${y}.${m}.${d}`;
        
        // Random "System" numbers for effect (updated every second)
        const load = Math.floor(Math.random() * (98 - 92) + 92);
        this.els.sys.textContent = `CORE STABILITY: ${load}%`;
    },

    applySettings(hue, speed, scale) {
        const r = document.documentElement;
        
        // Apply Hue to the HSL variables
        r.style.setProperty('--cg-hue', hue);
        
        // Speed (Inverse logic: lower number = faster, but user expects slider right = faster?)
        // Actually for CSS animation-duration, lower is faster. 
        // Let's keep it direct: Slider 10s = fast, 60s = slow.
        // Or if the slider is "Speed", we might want to invert. 
        // Let's stick to Duration for simplicity.
        r.style.setProperty('--cg-speed', `${speed}s`);
        
        r.style.setProperty('--cg-scale', scale / 100);
    },

    onSettingsChange(key, val) {
        const r = document.documentElement;
        if (key === 'color') r.style.setProperty('--cg-hue', val);
        if (key === 'speed') r.style.setProperty('--cg-speed', `${val}s`);
        if (key === 'scale') r.style.setProperty('--cg-scale', val / 100);
    },

    destroy() {
        this.els = {};
        // Cleanup vars
        const r = document.documentElement;
        ['--cg-hue', '--cg-speed', '--cg-scale'].forEach(v => r.style.removeProperty(v));
    }
};