window.ActiveTheme = {
    els: {},
    animations: [], // Store anime instances for cleanup

    settingsConfig: {
        colorOne: {
            type: 'palette',
            label: 'Primary Energy',
            default: '#00f0ff',
            options: ['#00f0ff', '#ff00aa', '#00ffaa', '#ffd700', '#ffffff']
        },
        colorTwo: {
            type: 'palette',
            label: 'Secondary Energy',
            default: '#ff0055',
            options: ['#ff0055', '#7000ff', '#ffaa00', '#0055ff', '#ff0000']
        },
        speed: {
            type: 'range',
            label: 'Orbital Speed',
            default: 15,
            min: 5,
            max: 30
        }
    },

    init: function(stage, settings) {
        // Apply Settings
        this.primary = settings.colorOne || this.settingsConfig.colorOne.default;
        this.secondary = settings.colorTwo || this.settingsConfig.colorTwo.default;
        this.speedBase = settings.speed || this.settingsConfig.speed.default;

        document.documentElement.style.setProperty('--astral-primary', this.primary);
        document.documentElement.style.setProperty('--astral-secondary', this.secondary);

        // Build DOM
        stage.innerHTML = `
            <div class="astral-stage">
                <div class="astral-scene" id="a-scene">
                    <!-- Rings injected via JS -->
                </div>
                <div class="astral-clock">
                    <div class="astral-time">
                        <span id="a-h">00</span>
                        <span class="astral-pulse" style="margin: 0 5px;">:</span>
                        <span id="a-m">00</span>
                        <span id="a-s" class="astral-sec">00</span>
                    </div>
                </div>
            </div>
        `;

        this.els.scene = document.getElementById('a-scene');
        this.els.h = document.getElementById('a-h');
        this.els.m = document.getElementById('a-m');
        this.els.s = document.getElementById('a-s');

        this.buildRings();
        this.startAnimations();
    },

    buildRings: function() {
        const ringCount = 4;
        const particlesPerRing = 36;
        const radius = 180; // Distance from center

        for (let i = 0; i < ringCount; i++) {
            let ring = document.createElement('div');
            ring.className = 'astral-ring';
            ring.classList.add(`ring-${i}`);
            
            // Math generation for perfect circular distribution
            // $$ x = r \times \cos(\theta) $$, $$ y = r \times \sin(\theta) $$
            for (let j = 0; j < particlesPerRing; j++) {
                let particle = document.createElement('div');
                particle.className = 'astral-particle';
                
                let angle = (j / particlesPerRing) * Math.PI * 2;
                let x = Math.cos(angle) * radius;
                let y = Math.sin(angle) * radius;
                
                // Color mapping: Alternate colors
                if (j % 3 === 0) particle.style.background = 'var(--astral-secondary)';
                if (j % 3 === 0) particle.style.boxShadow = '0 0 15px var(--astral-secondary)';

                // Position in 3D space
                particle.style.transform = `translate3d(${x}px, ${y}px, 0px) rotateZ(${angle}rad)`;
                ring.appendChild(particle);
            }
            this.els.scene.appendChild(ring);
        }
    },

    startAnimations: function() {
        // Clear old animations if re-initializing
        this.animations.forEach(anim => anim.pause());
        this.animations = [];

        const durationCalc = 500000 / this.speedBase;

        // 1. Complex Multidimensional Rotation
        let rings = document.querySelectorAll('.astral-ring');
        
        rings.forEach((ring, index) => {
            // Give each ring a unique orbital path
            let rotX = (index % 2 === 0) ? 360 : -360;
            let rotY = (index % 3 === 0) ? -360 : 360;

            let anim = anime({
                targets: ring,
                rotateX: [0, rotX],
                rotateY: [0, rotY],
                rotateZ: [0, 360 + (index * 90)],
                duration: durationCalc + (index * 2000),
                easing: 'linear',
                loop: true,
                direction: index % 2 === 0 ? 'normal' : 'reverse'
            });
            this.animations.push(anim);
        });

        // 2. Breathing / Throbbing effect of the particles
        let particleAnim = anime({
            targets: '.astral-particle',
            scale: [0.5, 1.5, 0.5],
            opacity: [0.4, 1, 0.4],
            duration: 4000,
            delay: anime.stagger(100, {grid: [4, 36], from: 'center'}),
            easing: 'easeInOutSine',
            loop: true
        });
        this.animations.push(particleAnim);

        // 3. Floating Clock Effect
        let floatAnim = anime({
            targets: '.astral-clock',
            translateY: [-10, 10],
            translateZ: [40, 60],
            duration: 3000,
            easing: 'easeInOutSine',
            direction: 'alternate',
            loop: true
        });
        this.animations.push(floatAnim);
    },

    update: function(t) {
        this.els.h.innerText = t.h;
        this.els.m.innerText = t.m;
        this.els.s.innerText = t.s;
        
        // Trigger a rapid pulse wave in anime.js right on the turn of the minute
        if (t.s === '00') {
            anime({
                targets: '.astral-particle',
                scale: 3,
                duration: 500,
                easing: 'easeOutExpo',
                direction: 'alternate'
            });
        }
    },

    onSettingsChange: function(key, val) {
        if (key === 'colorOne') {
            document.documentElement.style.setProperty('--astral-primary', val);
        }
        if (key === 'colorTwo') {
            document.documentElement.style.setProperty('--astral-secondary', val);
        }
        if (key === 'speed') {
            this.speedBase = val;
            this.startAnimations(); // Restart to apply new speed
        }
    },

    destroy: function() {
        this.animations.forEach(anim => anim.pause());
        this.animations = [];
        this.els = {};
    }
};
