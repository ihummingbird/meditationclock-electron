window.ActiveTheme = {
    els: {},
    gearAnimations: [],

    settingsConfig: {
        coreColor: {
            type: 'palette',
            label: 'Core Coolant',
            default: '#ff2a2a', // Brutal Red
            options: ['#ff2a2a', '#ff8c00', '#00ff33', '#00e5ff', '#ff00ff']
        },
        aggression: {
            type: 'range',
            label: 'Hydraulic Snap Force',
            default: 10,
            min: 1,
            max: 20
        }
    },

    init: function(stage, settings) {
        // Apply Settings
        this.glow = settings.coreColor || this.settingsConfig.coreColor.default;
        this.force = settings.aggression || this.settingsConfig.aggression.default;
        
        document.documentElement.style.setProperty('--titan-glow', this.glow);

        stage.innerHTML = `
            <div class="titan-stage">
                <!-- Background Mechanism -->
                <div class="titan-gear gear-primary" id="t-gear-1"></div>
                <div class="titan-gear gear-secondary" id="t-gear-2"></div>
                
                <!-- Foreground Vault -->
                <div class="titan-vault" id="t-vault">
                    <div class="titan-time">
                        <span id="t-h">00</span>
                        <span class="titan-separator">:</span>
                        <span id="t-m">00</span>
                        <div class="titan-sec-box" id="t-s">00</div>
                    </div>
                    <div class="titan-warning"></div>
                </div>
            </div>
        `;

        this.els.vault = document.getElementById('t-vault');
        this.els.gear1 = document.getElementById('t-gear-1');
        this.els.gear2 = document.getElementById('t-gear-2');
        this.els.h = document.getElementById('t-h');
        this.els.m = document.getElementById('t-m');
        this.els.s = document.getElementById('t-s');

        this.startEngine();
    },

    startEngine: function() {
        // Stop any existing GSAP tweens if re-initializing
        this.gearAnimations.forEach(t => t.kill());
        this.gearAnimations = [];

        // Gear Math calculation: 
        // Gear 1 is 800px (radius $r_1 = 400$). Gear 2 is 400px (radius $r_2 = 200$).
        // Equation: $\omega_2 = \omega_1 \cdot (\frac{r_1}{r_2})$ 
        // $ \omega_2 = \omega_1 \cdot (\frac{400}{200}) = \omega_1 \cdot 2 $
        // So gear 2 must spin exactly twice as fast in the opposite direction.
        
        const baseDuration = 60; // Base spin duration in seconds

        let g1 = gsap.to(this.els.gear1, {
            rotation: 360,
            duration: baseDuration,
            ease: "none",
            repeat: -1
        });

        let g2 = gsap.to(this.els.gear2, {
            rotation: -720, // 2x ratio in reverse
            duration: baseDuration,
            ease: "none",
            repeat: -1
        });

        this.gearAnimations.push(g1, g2);
    },

    update: function(t) {
        // Only update DOM if changed to save paint cycles
        if(this.els.h.innerText !== t.h) this.els.h.innerText = t.h;
        if(this.els.m.innerText !== t.m) {
            this.els.m.innerText = t.m;
            this.triggerMinuteHeavyImpact();
        }

        // Second update with Hydraulic Snap
        if(this.els.s.innerText !== t.s) {
            this.els.s.innerText = t.s;
            this.triggerSecondSnap();
        }
    },

    triggerSecondSnap: function() {
        // A brutal, mechanical snap using GSAP's elastic/stepped ease
        // Math force multiplier: $ F = \text{base} \times \text{aggression} $
        let impactY = this.force * 0.5;

        gsap.fromTo(this.els.s, 
            { y: -impactY, scale: 1.1, color: '#ffffff' },
            { 
                y: 0, 
                scale: 1, 
                color: this.glow,
                duration: 0.4, 
                ease: "bounce.out" 
            }
        );
    },

    triggerMinuteHeavyImpact: function() {
        // When the minute changes, simulate a massive gear shifting into place
        let shake = this.force * 1.5;
        
        gsap.fromTo(this.els.vault,
            { y: shake, rotationX: 10 },
            {
                y: 0,
                rotationX: 5,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)" // Heavy jolt
            }
        );
    },

    onSettingsChange: function(key, val) {
        if (key === 'coreColor') {
            this.glow = val;
            document.documentElement.style.setProperty('--titan-glow', val);
            // Flash the vault to acknowledge setting change
            gsap.fromTo(this.els.vault, {boxShadow: `0 0 100px ${val}`}, {boxShadow: `0 0 15px ${val}, 0 20px 50px #000`, duration: 1});
        }
        if (key === 'aggression') {
            this.force = parseInt(val);
        }
    },

    destroy: function() {
        this.gearAnimations.forEach(t => t.kill());
        this.gearAnimations = [];
        this.els = {};
    }
};
