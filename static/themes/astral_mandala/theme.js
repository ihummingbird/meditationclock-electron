window.ActiveTheme = {
    els: {},
    animations: [],
    lastSecond: -1,

    // FIX: Updated to match your Engine's exact requirements ('select' type and 'text' key)
    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Ring Scale (vmin)',
            default: 85,
            min: 50,
            max: 100
        },
        palette: {
            type: 'select', 
            label: 'Aura Palette',
            default: 'cyber',
            options: [
                { value: 'cyber', text: 'Cyberpunk (Blue/Red)' },
                { value: 'ghost', text: 'Ghost (Pure White)' },
                { value: 'solar', text: 'Solar Flare (Gold/Orange)' },
                { value: 'neon',  text: 'Neon Tokyo (Green/Purple)' },
                { value: 'abyss', text: 'Ocean Abyss (Cyan/Deep Blue)' },
                { value: 'synth', text: 'Synthwave (Pink/Teal)' }
            ]
        },
        intensity: {
            type: 'range',
            label: 'Pulse Intensity',
            default: 1.5,
            min: 0.5,
            max: 3.0
        }
    },

    // NEW: Expanded beautiful palettes
    palettes: {
        cyber: { c1: '#00f2fe', c2: '#ff0844', c3: '#ffffff', glow: 'rgba(0, 242, 254, 0.3)' },
        ghost: { c1: '#ffffff', c2: '#aaaaaa', c3: '#555555', glow: 'rgba(255, 255, 255, 0.1)' },
        solar: { c1: '#ffcf54', c2: '#ff4b1f', c3: '#ffffff', glow: 'rgba(255, 75, 31, 0.4)' },
        neon:  { c1: '#39ff14', c2: '#bc13fe', c3: '#ffffff', glow: 'rgba(57, 255, 20, 0.3)' },
        abyss: { c1: '#00b4db', c2: '#000046', c3: '#ffffff', glow: 'rgba(0, 180, 219, 0.3)' },
        synth: { c1: '#ff00c8', c2: '#00e5ff', c3: '#ffffff', glow: 'rgba(255, 0, 200, 0.4)' }
    },

    init: function(stage, settings) {
        stage.innerHTML = `
            <div class="nova-container" id="nova-wrap">
                <svg class="nova-stage" id="nova-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
                    <g id="nova-master" transform="translate(500, 500)">
                        <g id="layer-ambient"></g>
                        <g id="layer-hours"></g>
                        <g id="layer-seconds"></g>
                        <text id="n-h" class="n-text-h" y="-30">00</text>
                        <text id="n-m" class="n-text-m" y="80">00</text>
                    </g>
                </svg>
            </div>
        `;

        this.els.wrap = document.getElementById('nova-wrap');
        this.els.svg = document.getElementById('nova-svg');
        this.els.h = document.getElementById('n-h');
        this.els.m = document.getElementById('n-m');
        this.els.layerSec = document.getElementById('layer-seconds');
        this.els.layerHrs = document.getElementById('layer-hours');
        this.els.layerAmb = document.getElementById('layer-ambient');

        const zoom = settings.zoom || this.settingsConfig.zoom.default;
        const pal = settings.palette || this.settingsConfig.palette.default;
        this.intensity = settings.intensity || this.settingsConfig.intensity.default;
        
        this.onSettingsChange('zoom', zoom);
        this.onSettingsChange('palette', pal);

        this.generateGeometry();
        this.playIntro();
    },

    generateGeometry: function() {
        const svgNS = 'http://www.w3.org/2000/svg';
        this.secNodes = [];

        for(let i = 0; i < 60; i++) {
            let angle = (i * 6) - 90;
            let rad = angle * (Math.PI / 180);
            let x = Math.cos(rad) * 350;
            let y = Math.sin(rad) * 350;

            let circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('class', 'n-particle n-sec-node');
            circle.setAttribute('stroke-width', 4);
            
            this.secNodes.push(circle);
            this.els.layerSec.appendChild(circle);
        }

        for(let i = 0; i < 12; i++) {
            let angle = (i * 30) - 90;
            let rad = angle * (Math.PI / 180);
            let x1 = Math.cos(rad) * 260;
            let y1 = Math.sin(rad) * 260;
            let x2 = Math.cos(rad) * 290;
            let y2 = Math.sin(rad) * 290;

            let line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'n-hour-mark');
            this.els.layerHrs.appendChild(line);
        }

        for(let i = 0; i < 120; i++) {
            let angle = Math.random() * 360;
            let rad = angle * (Math.PI / 180);
            let distance = 150 + Math.random() * 300;
            let x = Math.cos(rad) * distance;
            let y = Math.sin(rad) * distance;

            let dust = document.createElementNS(svgNS, 'circle');
            dust.setAttribute('cx', x);
            dust.setAttribute('cy', y);
            dust.setAttribute('r', Math.random() * 2.5);
            dust.setAttribute('class', 'n-ambient');
            this.els.layerAmb.appendChild(dust);
        }
    },

    playIntro: function() {
        if (typeof anime === 'undefined') return;

        this.animations.forEach(a => a.pause());
        this.animations = [];

        let tl = anime.timeline({ easing: 'easeOutExpo' });

        tl.add({
            targets: ['.n-text-h', '.n-text-m'],
            opacity: [0, 1, 0.7],
            scale: [1.5, 1],
            duration: 1500,
            delay: anime.stagger(200)
        })
        .add({
            targets: '.n-hour-mark',
            strokeDashoffset: [anime.setDashoffset, 0],
            opacity: [0, 1],
            duration: 1000,
            delay: anime.stagger(50, {from: 'center'})
        }, '-=1000')
        .add({
            targets: '.n-sec-node',
            r: [0, 4],
            opacity: [0, 1],
            duration: 800,
            easing: 'spring(1, 80, 10, 0)',
            delay: anime.stagger(15)
        }, '-=800');

        this.animations.push(tl);

        let ambRot = anime({
            targets: '#layer-ambient',
            rotate: '360deg',
            duration: 120000,
            easing: 'linear',
            loop: true
        });
        this.animations.push(ambRot);
    },

    update: function(t) {
        // FIX: SVGs require textContent. innerText fails silently in many engine environments.
        this.els.h.textContent = t.h;
        this.els.m.textContent = t.m;
        
        let s = parseInt(t.s, 10);

        if (this.lastSecond !== s && this.secNodes[s]) {
            this.lastSecond = s;
            let targetNode = this.secNodes[s];

            if (typeof anime !== 'undefined') {
                anime({
                    targets: targetNode,
                    r: [
                        { value: 12 * this.intensity, duration: 200, easing: 'easeOutQuad' },
                        { value: 4, duration: 600, easing: 'easeInQuad' }
                    ],
                    strokeWidth: [
                        { value: 8, duration: 200 },
                        { value: 4, duration: 600 }
                    ],
                    opacity: [
                        { value: 1, duration: 200 },
                        { value: 0.3, duration: 600 }
                    ]
                });

                if (s === 0) {
                    anime({
                        targets: '.n-sec-node',
                        translateY: [
                            { value: -15 * this.intensity, duration: 300 },
                            { value: 0, duration: 800 }
                        ],
                        delay: anime.stagger(20, {from: 'start'}),
                        easing: 'spring(1, 80, 10, 0)'
                    });
                }
            }
        }
    },

    onSettingsChange: function(key, val) {
        if (key === 'zoom') {
            this.els.svg.style.width = val + 'vmin';
            this.els.svg.style.height = val + 'vmin';
        }
        if (key === 'palette') {
            const p = this.palettes[val] || this.palettes['cyber'];
            this.els.wrap.style.setProperty('--nova-color-1', p.c1);
            this.els.wrap.style.setProperty('--nova-color-2', p.c2);
            this.els.wrap.style.setProperty('--nova-color-3', p.c3);
            this.els.wrap.style.setProperty('--nova-glow', p.glow);
        }
        if (key === 'intensity') {
            this.intensity = parseFloat(val);
        }
    },

    destroy: function() {
        this.animations.forEach(anim => anim.pause());
        if (typeof anime !== 'undefined') {
            anime.remove('.n-sec-node, .n-hour-mark, .n-text-h, .n-text-m, #layer-ambient');
        }
        this.els = {};
        this.secNodes = [];
    }
};
