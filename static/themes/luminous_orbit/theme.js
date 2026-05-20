window.ActiveTheme = (() => {
    let stage, root;
    let timeEl, subEl;
    let ring1, ring2, ring3;
    let particleField;
    let currentSettings = {};
    let particles = [];
    let rafId = null;
    let tickCount = 0;

    const DEFAULTS = {
        zoom: 100,
        hue: 210,
        glow: 70,
        ambient: 35,
        ringSpeed: 40,
        particleDensity: 28,
        style: 'aurora'
    };

    const settingsConfig = {
        zoom: {
            type: 'range',
            label: 'Scale',
            min: 75,
            max: 140,
            default: 100,
            displaySuffix: '%'
        },
        hue: {
            type: 'palette',
            label: 'Color Tone',
            default: 210,
            options: [190, 210, 240, 280, 320, 35, 120]
        },
        glow: {
            type: 'range',
            label: 'Glow Strength',
            min: 20,
            max: 100,
            default: 70,
            displaySuffix: '%'
        },
        ambient: {
            type: 'range',
            label: 'Ambient Light',
            min: 0,
            max: 100,
            default: 35,
            displaySuffix: '%'
        },
        ringSpeed: {
            type: 'range',
            label: 'Orbit Motion',
            min: 0,
            max: 100,
            default: 40,
            displaySuffix: '%'
        },
        particleDensity: {
            type: 'range',
            label: 'Particles',
            min: 0,
            max: 60,
            default: 28,
            displaySuffix: ''
        },
        style: {
            type: 'select',
            label: 'Mood',
            default: 'aurora',
            options: [
                { value: 'aurora', text: 'Aurora' },
                { value: 'dusk', text: 'Dusk Bloom' },
                { value: 'jade', text: 'Jade Dream' },
                { value: 'rose', text: 'Rose Ether' }
            ]
        }
    };

    function withDefaults(settings = {}) {
        return { ...DEFAULTS, ...settings };
    }

    function init(container, settings = {}) {
        stage = container;
        currentSettings = withDefaults(settings);

        stage.innerHTML = `
            <div class="lo-root">
                <div class="lo-bg"></div>
                <div class="lo-vignette"></div>
                <div class="lo-particles"></div>

                <div class="lo-center">
                    <div class="lo-orbit lo-orbit-1"></div>
                    <div class="lo-orbit lo-orbit-2"></div>
                    <div class="lo-orbit lo-orbit-3"></div>

                    <div class="lo-core-glow"></div>

                    <div class="lo-time-wrap">
                        <div class="lo-time">00:00:00</div>
                        <div class="lo-sub">PRESENT MOMENT</div>
                    </div>
                </div>
            </div>
        `;

        root = stage.querySelector('.lo-root');
        timeEl = stage.querySelector('.lo-time');
        subEl = stage.querySelector('.lo-sub');
        ring1 = stage.querySelector('.lo-orbit-1');
        ring2 = stage.querySelector('.lo-orbit-2');
        ring3 = stage.querySelector('.lo-orbit-3');
        particleField = stage.querySelector('.lo-particles');

        buildParticles();
        applySettings();
        startAnimation();
    }

    function buildParticles() {
        particles = [];
        particleField.innerHTML = '';

        const count = Number(currentSettings.particleDensity) || 0;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('span');
            p.className = 'lo-particle';

            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = 2 + Math.random() * 5;
            const delay = Math.random() * 6;
            const duration = 8 + Math.random() * 12;
            const drift = (Math.random() * 16 - 8).toFixed(2);
            const opacity = 0.12 + Math.random() * 0.45;

            p.style.left = `${x}%`;
            p.style.top = `${y}%`;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.opacity = opacity;
            p.style.animationDelay = `${delay}s`;
            p.style.animationDuration = `${duration}s`;
            p.style.setProperty('--drift-x', `${drift}px`);

            particleField.appendChild(p);
            particles.push(p);
        }
    }

    function getStylePreset(style) {
        switch (style) {
            case 'dusk':
                return {
                    bg1: 'hsla(260, 70%, 10%, 1)',
                    bg2: 'hsla(320, 70%, 14%, 1)',
                    bg3: 'hsla(25, 80%, 16%, 1)',
                    text: 'rgba(255,245,250,0.96)',
                    sub: 'rgba(255,220,230,0.72)'
                };
            case 'jade':
                return {
                    bg1: 'hsla(160, 55%, 10%, 1)',
                    bg2: 'hsla(185, 55%, 12%, 1)',
                    bg3: 'hsla(210, 45%, 10%, 1)',
                    text: 'rgba(235,255,250,0.96)',
                    sub: 'rgba(190,255,235,0.72)'
                };
            case 'rose':
                return {
                    bg1: 'hsla(315, 60%, 11%, 1)',
                    bg2: 'hsla(280, 52%, 14%, 1)',
                    bg3: 'hsla(350, 65%, 12%, 1)',
                    text: 'rgba(255,245,248,0.96)',
                    sub: 'rgba(255,210,225,0.72)'
                };
            case 'aurora':
            default:
                return {
                    bg1: 'hsla(215, 60%, 10%, 1)',
                    bg2: 'hsla(245, 65%, 13%, 1)',
                    bg3: 'hsla(185, 65%, 12%, 1)',
                    text: 'rgba(245,250,255,0.97)',
                    sub: 'rgba(190,220,255,0.72)'
                };
        }
    }

    function applySettings() {
        if (!root) return;

        const s = currentSettings;
        const preset = getStylePreset(s.style);
        const hue = Number(s.hue);
        const glow = Number(s.glow);
        const ambient = Number(s.ambient);
        const zoom = Number(s.zoom);
        const speed = Number(s.ringSpeed);

        root.style.setProperty('--lo-zoom', zoom / 100);
        root.style.setProperty('--lo-hue', hue);
        root.style.setProperty('--lo-glow', glow / 100);
        root.style.setProperty('--lo-ambient', ambient / 100);
        root.style.setProperty('--lo-speed-mult', Math.max(0, speed) / 40);

        root.style.setProperty('--lo-bg1', preset.bg1);
        root.style.setProperty('--lo-bg2', preset.bg2);
        root.style.setProperty('--lo-bg3', preset.bg3);
        root.style.setProperty('--lo-text', preset.text);
        root.style.setProperty('--lo-sub', preset.sub);

        root.style.setProperty('--lo-accent', `hsl(${hue}, 85%, 68%)`);
        root.style.setProperty('--lo-accent-soft', `hsla(${hue}, 90%, 70%, 0.35)`);
        root.style.setProperty('--lo-accent-faint', `hsla(${hue}, 90%, 70%, 0.12)`);

        const dur1 = Math.max(18, 58 - speed * 0.28);
        const dur2 = Math.max(24, 84 - speed * 0.32);
        const dur3 = Math.max(30, 120 - speed * 0.4);

        ring1.style.animationDuration = `${dur1}s`;
        ring2.style.animationDuration = `${dur2}s`;
        ring3.style.animationDuration = `${dur3}s`;

        buildParticles();
    }

    function update(timeObj) {
        if (!timeEl) return;

        const full = `${timeObj.h}:${timeObj.m}:${timeObj.s}`;
        timeEl.textContent = full;

        const h = Number(timeObj.h);
        const m = Number(timeObj.m);
        const s = Number(timeObj.s);

        const hourAngle = ((h % 12) + m / 60) * 30;
        const minuteAngle = (m + s / 60) * 6;
        const secondAngle = s * 6;

        ring1.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
        ring2.style.transform = `translate(-50%, -50%) rotate(${-minuteAngle}deg)`;
        ring3.style.transform = `translate(-50%, -50%) rotate(${secondAngle}deg)`;

        tickCount++;
        if (tickCount % 2 === 0) {
            const hourText = h < 12 ? 'MORNING' : h < 18 ? 'AFTERNOON' : 'NIGHT';
            subEl.textContent = `${hourText} · BREATHE`;
        }
    }

    function startAnimation() {
        stopAnimation();

        const animate = () => {
            if (root) {
                const t = Date.now() * 0.001;
                const ambient = Number(currentSettings.ambient) / 100;
                const glow = Number(currentSettings.glow) / 100;

                root.style.setProperty('--lo-shift-x', `${Math.sin(t * 0.18) * (8 + ambient * 20)}px`);
                root.style.setProperty('--lo-shift-y', `${Math.cos(t * 0.14) * (6 + ambient * 16)}px`);
                root.style.setProperty('--lo-pulse', `${1 + Math.sin(t * 1.2) * (0.008 + glow * 0.012)}`);
            }

            rafId = requestAnimationFrame(animate);
        };

        animate();
    }

    function stopAnimation() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function onSettingsChange(key, value) {
        currentSettings[key] = value;

        if (key === 'particleDensity') {
            buildParticles();
        }

        applySettings();
    }

    function destroy() {
        stopAnimation();
        if (stage) stage.innerHTML = '';
        stage = null;
        root = null;
        timeEl = null;
        subEl = null;
        ring1 = null;
        ring2 = null;
        ring3 = null;
        particleField = null;
        particles = [];
    }

    return {
        settingsConfig,
        init,
        update,
        onSettingsChange,
        destroy
    };
})();
