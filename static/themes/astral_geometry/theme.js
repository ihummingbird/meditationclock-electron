window.ActiveTheme = {
    settingsConfig: {
        zoom: { label: "Scale Dimension", type: "range", min: 40, max: 200, default: 90, displaySuffix: "%" },
        hue: { label: "Aura Base Hue", type: "range", min: 0, max: 360, default: 220, displaySuffix: "°" },
        amplitude: { label: "Wave Height", type: "range", min: 10, max: 200, default: 120, displaySuffix: "px" },
        sharpness: { label: "Wave Sharpness", type: "range", min: 1, max: 40, default: 15, displaySuffix: "" },
        fontStyle: { label: "Core Font", type: "select", options: [
            {value: "'JetBrains Mono', monospace", text: "Technical"},
            {value: "'Inter', sans-serif", text: "Modern"},
            {value: "'Cinzel', serif", text: "Elegant"}
        ], default: "'Inter', sans-serif" },
        showDigital: { label: "Digital Core", type: "select", options: [{value:'1', text:'Visible'}, {value:'0', text:'Hidden'}], default: '1' }
    },

    state: { h: 0, m: 0, s: 0 },
    lastTimeObj: { h: 0, m: 0, s: 0 },

    init: function (container, savedSettings) {
        this.container = container;
        this.settings = { ...this.extractDefaults(), ...savedSettings };
        
        this.container.innerHTML = `
            <div id="et-wrapper">
                <svg id="et-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <!-- Glow Filters -->
                        <filter id="glow-h" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="12" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="glow-m" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="glow-s" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>

                    <!-- The 3 Fluid Waves -->
                    <path id="wave-h" class="et-wave" filter="url(#glow-h)"></path>
                    <path id="wave-m" class="et-wave" filter="url(#glow-m)"></path>
                    <path id="wave-s" class="et-wave" filter="url(#glow-s)"></path>
                    
                    <!-- Digital Readout -->
                    <text id="et-digital" x="500" y="520" text-anchor="middle">00:00:00</text>
                </svg>
            </div>
        `;

        this.dom = {
            wrapper: document.getElementById('et-wrapper'),
            svg: document.getElementById('et-svg'),
            waveH: document.getElementById('wave-h'),
            waveM: document.getElementById('wave-m'),
            waveS: document.getElementById('wave-s'),
            digital: document.getElementById('et-digital')
        };

        this.applySettings();
        
        // Start high-precision animation loop
        this.reqAnim = requestAnimationFrame(() => this.animate());
    },

    extractDefaults: function() {
        let defs = {};
        for(let key in this.settingsConfig) defs[key] = this.settingsConfig[key].default;
        return defs;
    },

    update: function (timeObj) {
        // We only save this to handle standard clock strings properly 
        // We calculate smooth time locally in animate() to eliminate jitter.
        this.lastTimeObj = timeObj;
    },

    animate: function () {
        let h, m, s, s_exact, m_exact, h_exact;
        
        // 1. Calculate Jitter-Free Exact Time
        // We check if the global Engine exists and if it's running a stopwatch
        if (typeof Engine !== 'undefined' && Engine.state.stopwatchMode) {
            if (Engine.session.active && Engine.session.startTime) {
                const elapsed = Date.now() - Engine.session.startTime;
                const totalSec = elapsed / 1000;
                h_exact = totalSec / 3600;
                m_exact = (totalSec % 3600) / 60;
                s_exact = totalSec % 60;
            } else {
                h_exact = parseInt(this.lastTimeObj.h) || 0;
                m_exact = parseInt(this.lastTimeObj.m) || 0;
                s_exact = parseInt(this.lastTimeObj.s) || 0;
            }
        } else {
            // Standard Clock - Use raw system time for perfect 60fps smoothness
            const d = new Date();
            const ms = d.getMilliseconds();
            s_exact = d.getSeconds() + (ms / 1000);
            m_exact = d.getMinutes() + (s_exact / 60);
            h_exact = (d.getHours() % 12) + (m_exact / 60);
        }

        // 2. Map Time to Angles (Top is 12 o'clock, so subtract 90 deg / PI/2)
        const angleH = (h_exact / 12) * Math.PI * 2 - (Math.PI / 2);
        const angleM = (m_exact / 60) * Math.PI * 2 - (Math.PI / 2);
        const angleS = (s_exact / 60) * Math.PI * 2 - (Math.PI / 2);

        // 3. Generate Fluid Paths
        const amp = parseInt(this.settings.amplitude);
        const sharp = parseInt(this.settings.sharpness);

        // Base Radii: They are close together so they beautifully overlap when passing
        this.dom.waveH.setAttribute('d', this.generateWavePath(500, 500, 200, amp * 0.7, angleH, sharp * 0.3));
        this.dom.waveM.setAttribute('d', this.generateWavePath(500, 500, 220, amp * 0.9, angleM, sharp * 0.7));
        this.dom.waveS.setAttribute('d', this.generateWavePath(500, 500, 240, amp * 1.2, angleS, sharp * 1.5));

        // 4. Update Digital Core
        if(this.settings.showDigital === '1') {
            const dh = String(Math.floor(h_exact)).padStart(2, '0');
            const dm = String(Math.floor(m_exact)).padStart(2, '0');
            const ds = String(Math.floor(s_exact)).padStart(2, '0');
            this.dom.digital.textContent = `${this.lastTimeObj.h || dh}:${this.lastTimeObj.m || dm}:${this.lastTimeObj.s || ds}`;
        }

        this.reqAnim = requestAnimationFrame(() => this.animate());
    },

    // The Magic Formula for perfectly smooth polar bulges
    generateWavePath: function(cx, cy, baseR, peakAmp, targetAngle, sharpness, points = 120) {
        let path = "";
        for (let i = 0; i <= points; i++) {
            let angle = (i / points) * Math.PI * 2;
            
            // Shortest angular distance
            let diff = angle - targetAngle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            // Bell curve calculation: ((cos(diff) + 1) / 2) ^ sharpness
            // This ensures exactly 1 at the target angle, and tapers smoothly to 0.
            let intensity = Math.pow((Math.cos(diff) + 1) / 2, sharpness);
            
            let r = baseR + (peakAmp * intensity);
            let x = cx + r * Math.cos(angle);
            let y = cy + r * Math.sin(angle);

            if (i === 0) path += `M ${x} ${y} `;
            else path += `L ${x} ${y} `;
        }
        return path + "Z";
    },

    onSettingsChange: function (key, value) {
        this.settings[key] = value;
        this.applySettings();
    },

        applySettings: function () {
        const hue = parseInt(this.settings.hue);
        
        // Setup overlapping color palette based on base hue
        this.dom.wrapper.style.setProperty('--color-h', `hsl(${hue}, 80%, 50%)`);
        this.dom.wrapper.style.setProperty('--color-m', `hsl(${(hue + 35) % 360}, 90%, 60%)`);
        this.dom.wrapper.style.setProperty('--color-s', `hsl(${(hue + 70) % 360}, 100%, 75%)`);

        // Handle Zoom
        const scale = this.settings.zoom / 100;
        this.dom.svg.style.transform = `scale(${scale})`;

        // Handle Typography
        this.dom.digital.style.fontFamily = this.settings.fontStyle;
        
        // FIX: Use 'display' instead of 'opacity' so the CSS animation doesn't override it
        this.dom.digital.style.display = (this.settings.showDigital == 1) ? '' : 'none';
        
        // Font adjustments based on family
        if(this.settings.fontStyle.includes('Cinzel')) {
            this.dom.digital.style.fontWeight = '400';
            this.dom.digital.style.letterSpacing = '0.1em';
        } else if(this.settings.fontStyle.includes('Inter')) {
            this.dom.digital.style.fontWeight = '200';
            this.dom.digital.style.letterSpacing = '0.3em';
        } else {
            this.dom.digital.style.fontWeight = '700';
            this.dom.digital.style.letterSpacing = '0.05em';
        }
    },


    destroy: function () {
        cancelAnimationFrame(this.reqAnim);
        if (this.container) this.container.innerHTML = '';
    }
};
