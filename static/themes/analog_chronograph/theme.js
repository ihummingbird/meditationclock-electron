window.ActiveTheme = {
    els: {},
    anims: [], // Array to hold anime.js instances for clean destruction
    
    // Engine-compatible settings configuration
    settingsConfig: {
        color: {
            type: 'palette',
            label: 'Aura Color',
            default: '#0071e3', // Apple Blue
            options: [
                '#0071e3', // Cupertino Blue
                '#ff2d55', // Coral Pink
                '#34c759', // Mint Green
                '#bf5af2', // Deep Violet
                '#f5c243', // Golden Sunrise
                '#ffffff'  // Titanium White
            ]
        },
        zoom: {
            type: 'range',
            label: 'Structure Scale',
            default: 10,
            min: 5,
            max: 20
        }
    },

    init: function(stage, settings) {
        // 1. Procedurally generate nested 3D Glass Rings
        const ringCount = 7;
        let ringsHtml = '';
        
        for(let i = 0; i < ringCount; i++) {
            // Calculate descending sizes to create a nested sphere/gyroscope
            // Math: size = 100% - (i * 12%)
            let size = 100 - (i * 12); 
            // Negative margins center the absolutely positioned rings
            ringsHtml += `<div class="aether-ring" style="width: ${size}%; height: ${size}%; margin: -${size/2}% 0 0 -${size/2}%;"></div>`;
        }

        // 2. Inject DOM Structure
        stage.innerHTML = `
            <div class="aether-stage" id="ae-stage">
                <div class="aether-scene" id="ae-scene">
                    <div class="aether-core"></div>
                    <div class="aether-rings-container" id="ae-rings">
                        ${ringsHtml}
                    </div>
                    <div class="aether-clock-ui">
                        <div class="aether-time">
                            <span id="ae-h">00</span>
                            <span class="aether-colon" id="ae-c">:</span>
                            <span id="ae-m">00</span>
                        </div>
                        <div class="aether-sec-container" id="ae-s">00</div>
                    </div>
                </div>
            </div>
        `;

        // 3. Cache Elements for rapid updates
        this.els.stage = document.getElementById('ae-stage');
        this.els.scene = document.getElementById('ae-scene');
        this.els.h = document.getElementById('ae-h');
        this.els.m = document.getElementById('ae-m');
        this.els.s = document.getElementById('ae-s');
        this.els.c = document.getElementById('ae-c');
        this.els.rings = document.querySelectorAll('.aether-ring');

        // 4. Apply Engine Settings
        if (settings.color) this.onSettingsChange('color', settings.color);
        if (settings.zoom) this.onSettingsChange('zoom', settings.zoom);

        // 5. Trigger anime.js Kinematics
        this.playIntro();
        this.startGyroscope();
    },

    update: function(t) {
        // Pad numbers to ensure double digits (e.g., 09 instead of 9)
        this.els.h.innerText = String(t.h).padStart(2, '0');
        this.els.m.innerText = String(t.m).padStart(2, '0');
        this.els.s.innerText = String(t.s).padStart(2, '0');

        // Subtle colon pulse matching the seconds
        this.els.c.style.opacity = t.s % 2 === 0 ? '0.8' : '0.2';
    },

    playIntro: function() {
        // Magnificent staggered intro animation
        let introAnim = anime({
            targets: this.els.rings,
            opacity: [0, 1],
            scale: [0.3, 1],
            rotateX: () => anime.random(-90, 90),
            rotateY: () => anime.random(-90, 90),
            translateZ: () => anime.random(-50, 50),
            delay: anime.stagger(150, {start: 200}),
            duration: 3000,
            easing: 'easeOutExpo'
        });
        this.anims.push(introAnim);
        
        // Clock fade-in
        let clockAnim = anime({
            targets: '.aether-clock-ui',
            opacity: [0, 1],
            translateZ: [0, 80],
            duration: 2500,
            delay: 1000,
            easing: 'easeOutQuart'
        });
        this.anims.push(clockAnim);
    },

    startGyroscope: function() {
        // Continuous, complex multi-axis rotation for each ring
        this.els.rings.forEach((ring, index) => {
            // Outer rings move slightly faster than inner rings
            let speed = 18000 + (index * 2500); 
            // Alternate rotation direction
            let dir = index % 2 === 0 ? 1 : -1;

            let loopAnim = anime({
                targets: ring,
                rotateX: `+=${360 * dir}deg`,
                rotateY: `+=${180 * dir}deg`,
                rotateZ: `+=${360 * dir}deg`,
                duration: speed,
                loop: true,
                easing: 'linear'
            });
            this.anims.push(loopAnim);
        });

        // "Breathing" ambient hover for the entire structure
        let hoverAnim = anime({
            targets: '#ae-scene',
            translateY: [-15, 15],
            rotateX: [-3, 3],
            rotateY: [-3, 3],
            duration: 7000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
        this.anims.push(hoverAnim);
    },

    onSettingsChange: function(key, val) {
        if (key === 'color') {
            // Update CSS Custom Property for the glow and shadows
            this.els.stage.style.setProperty('--aether-color', val);
        }
        if (key === 'zoom') {
            // Engine range is 5-20. We map this to a scale multiplier (0.5x to 2.0x)
            let scaleVal = val / 10;
            this.els.stage.style.setProperty('--aether-zoom', scaleVal);
        }
    },

    destroy: function() {
        // 1. Pause and clean up all anime.js instances to prevent memory leaks
        this.anims.forEach(anim => anim.pause());
        this.anims = [];
        
        // 2. Remove any remaining active animations attached to these elements
        anime.remove('.aether-stage *');
        anime.remove('#ae-scene');
        
        // 3. Clear DOM references
        this.els = {};
    }
};
