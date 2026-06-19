window.ActiveTheme = {
    els: {},
    animInstances: [],
    mouse: { x: 0, y: 0 },
    timeAngles: { h: 0, m: 0, s: 0 },
    lastT: null,
    
    // Settings configuration injected into your Engine's Settings panel
    settingsConfig: {
        accent: {
            type: 'palette',
            label: 'Laser Core Color',
            default: '#ff4b4b',
            options: ['#ff4b4b', '#00e5ff', '#39ff14', '#ff00ff', '#fdda0d', '#ffffff']
        },
        parallax: {
            type: 'range',
            label: '3D Gyro/Mouse Intensity',
            default: 25,
            min: 0,
            max: 50
        }
    },

    init: function(stage, settings) {
        this.parallaxIntensity = settings.parallax !== undefined ? settings.parallax : this.settingsConfig.parallax.default;
        
        // 1. Generate 60 ticks procedurally
        let ticksHtml = '';
        for(let i = 0; i < 60; i++) {
            let isHour = i % 5 === 0;
            // Store the target angle in a data attribute for the intro animation to use
            ticksHtml += `<div class="mech-tick ${isHour ? 'hour-tick' : ''}" data-angle="${i * 6}"></div>`;
        }

        // 2. Build the DOM structure
        stage.innerHTML = `
            <div class="mech-stage" id="m-stage">
                <div class="mech-grid" id="m-grid"></div>
                <div class="mech-assembly" id="m-assembly">
                    <!-- Concentric Rings -->
                    <div class="mech-ring ring-1" id="r-outer"></div>
                    <div class="mech-ring ring-2" id="r-dashed"></div>
                    <div class="mech-ring ring-3" id="r-core"></div>
                    
                    <!-- Tick Marks -->
                    <div class="mech-ticks-container" id="m-ticks">
                        ${ticksHtml}
                    </div>
                    
                    <!-- 3D Hands -->
                    <div class="mech-hands">
                        <div class="m-hand m-hand-h" id="h-hour" data-length="110"></div>
                        <div class="m-hand m-hand-m" id="h-minute" data-length="160"></div>
                        <div class="m-hand m-hand-s" id="h-second" data-length="180"></div>
                        <div class="mech-pivot"></div>
                        <div class="mech-pivot-core"></div>
                    </div>
                    
                    <!-- Digital Readout -->
                    <div class="mech-readout" id="m-readout">00:00:00</div>
                </div>
            </div>
        `;

        // 3. Cache Elements
        this.els.stage = document.getElementById('m-stage');
        this.els.assembly = document.getElementById('m-assembly');
        this.els.grid = document.getElementById('m-grid');
        this.els.hHour = document.getElementById('h-hour');
        this.els.hMinute = document.getElementById('h-minute');
        this.els.hSecond = document.getElementById('h-second');
        this.els.readout = document.getElementById('m-readout');

        // Apply visual settings
        if(settings.accent) this.onSettingsChange('accent', settings.accent);

        // 4. Initialize Core Behaviors
        this.bindInteractiveParallax();
        this.playTechDemoIntro();
        this.startBackgroundLoops();
        
        this.initializedTime = false;
    },

    update: function(t) {
        // Digital Readout Update
        const pad = (n) => n < 10 ? '0'+n : n;
        this.els.readout.innerText = `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`;

        // --- Continuous Additive Angle Math ---
        // Instead of calculating absolute degrees like (t.s * 6) which causes the hand
        // to snap backward from 359deg to 0deg, we accumulate the differences.
        
        if (!this.initializedTime) {
            // Initial angle setup
            this.timeAngles.h = (t.h % 12) * 30 + t.m * 0.5;
            this.timeAngles.m = t.m * 6 + t.s * 0.1;
            this.timeAngles.s = t.s * 6;
            this.lastT = { h: t.h, m: t.m, s: t.s };
            this.initializedTime = true;
            return; // Skip animation on the exact frame it boots up to let the intro finish
        }

        // Calculate delta (change in time) to add to our running angles
        let ds = t.s - this.lastT.s;
        if (ds < 0) ds += 60; // Second hand wrap around
        this.timeAngles.s += ds * 6; // $ds \times 6^\circ$ per second

        let dm = t.m - this.lastT.m;
        if (dm < 0) dm += 60;
        this.timeAngles.m += dm * 6 + (ds * 0.1);

        let dh = (t.h % 12) - (this.lastT.h % 12);
        if (dh < 0) dh += 12;
        this.timeAngles.h += dh * 30 + (dm * 0.5);

        this.lastT = { h: t.h, m: t.m, s: t.s };

        // 5. Anime.js Physics Application for the Hands
        
        // Second hand gets a satisfying mechanical spring
        anime({
            targets: this.els.hSecond,
            rotateZ: this.timeAngles.s,
            duration: 800,
            easing: 'spring(1, 100, 12, 0)' // (mass, stiffness, damping, velocity)
        });

        // Minute and Hour hands use smooth elastic eases
        anime({
            targets: this.els.hMinute,
            rotateZ: this.timeAngles.m,
            duration: 1200,
            easing: 'easeOutElastic(1, 1)'
        });

        anime({
            targets: this.els.hHour,
            rotateZ: this.timeAngles.h,
            duration: 1200,
            easing: 'easeOutElastic(1, 1)'
        });
    },

    playTechDemoIntro: function() {
        // This is where the Anime.js magic happens. A beautifully sequenced intro timeline.
        let tl = anime.timeline({
            easing: 'easeOutExpo'
        });

        // 1. Rings expand and fade in while rotating
        tl.add({
            targets: '.mech-ring',
            scale: [0.2, 1],
            opacity: [0, 1],
            rotateZ: [-90, 0],
            duration: 2000,
            delay: anime.stagger(150, {direction: 'reverse'})
        })
        // 2. The 60 tick marks shoot outwards from the center in a staggered wave
        .add({
            targets: '.mech-tick',
            rotateZ: (el) => el.getAttribute('data-angle'), // Position radially
            translateY: [100, 0], // Shoot from inside out
            opacity: [0, 1],
            duration: 1200,
            delay: anime.stagger(15, {from: 'center'}), // Ripple outward from 12 o'clock and 6 o'clock
            easing: 'easeOutElastic(1, .6)'
        }, '-=1200')
        // 3. Hands grow upward from the center pivot
        .add({
            targets: '.m-hand',
            height: [0, (el) => el.getAttribute('data-length') + 'px'],
            opacity: [0, 1],
            duration: 1500,
            delay: anime.stagger(200),
            easing: 'spring(1, 80, 10, 0)'
        }, '-=800')
        // 4. Digital Readout fades up
        .add({
            targets: this.els.readout,
            translateY: [20, 0],
            translateZ: 80,
            opacity: [0, 1],
            duration: 1000
        }, '-=1000');

        this.animInstances.push(tl);
    },

    startBackgroundLoops: function() {
        // Continuous, infinitely rotating gears for the mechanic feel
        let a1 = anime({
            targets: '#r-dashed',
            rotateZ: [0, 360],
            duration: 30000,
            loop: true,
            easing: 'linear'
        });
        
        let a2 = anime({
            targets: '#r-outer',
            rotateZ: [0, -360],
            duration: 60000,
            loop: true,
            easing: 'linear'
        });

        // Gentle pulsing of the background grid
        let a3 = anime({
            targets: '#m-grid',
            translateZ: [-300, -250],
            direction: 'alternate',
            loop: true,
            duration: 4000,
            easing: 'easeInOutSine'
        });

        this.animInstances.push(a1, a2, a3);
    },

    bindInteractiveParallax: function() {
        this.handleMove = (e) => {
            if (this.parallaxIntensity === 0) return;
            
            // Normalize screen coordinates from -1 to 1
            let x, y;
            if (e.touches && e.touches.length > 0) {
                x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
            } else {
                x = (e.clientX / window.innerWidth) * 2 - 1;
                y = (e.clientY / window.innerHeight) * 2 - 1;
            }
            
            // Map to rotation degrees based on intensity setting
            // Base isometric tilt is X: 25deg, Y: -20deg
            let rotX = 25 - (y * this.parallaxIntensity); 
            let rotY = -20 + (x * this.parallaxIntensity);

            // Animate the parent assembly with a smooth easing to trail the cursor
            anime({
                targets: this.els.assembly,
                rotateX: rotX,
                rotateY: rotY,
                duration: 800,
                easing: 'easeOutQuad'
            });

            // Inverse parallax for the background grid to enhance depth illusion
            anime({
                targets: this.els.grid,
                translateX: (x * -50),
                translateY: (y * -50),
                duration: 800,
                easing: 'easeOutQuad'
            });
        };
        
        window.addEventListener('mousemove', this.handleMove);
        window.addEventListener('touchmove', this.handleMove);
    },

    onSettingsChange: function(key, val) {
        if (key === 'accent') {
            this.els.stage.style.setProperty('--theme-accent', val);
        }
        if (key === 'parallax') {
            this.parallaxIntensity = val;
            if (val === 0) {
                // Snap back to default isometric view if user turns off parallax
                anime({
                    targets: this.els.assembly,
                    rotateX: 25,
                    rotateY: -20,
                    duration: 1000,
                    easing: 'spring(1, 80, 10, 0)'
                });
            }
        }
    },

    destroy: function() {
        // 1. Remove global listeners
        window.removeEventListener('mousemove', this.handleMove);
        window.removeEventListener('touchmove', this.handleMove);
        
        // 2. Halt all Anime.js timelines and loops to prevent memory/CPU leaks
        this.animInstances.forEach(anim => anim.pause());
        this.animInstances = [];
        
        // 3. Purge target element references from Anime's internal engine
        anime.remove('.mech-stage *');
        
        this.els = {};
    }
};
