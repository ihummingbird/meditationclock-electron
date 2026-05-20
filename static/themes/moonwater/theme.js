window.ActiveTheme = (() => {
    let stage, root;
    let timeEl, dateHintEl;
    let moonEl, glowEl, reflectionEl;
    let starsLayer, mistLayer;
    let rafId = null;
    let currentSettings = {};
    let stars = [];

    const DEFAULTS = {
        zoom: 100,
        hue: 215,
        glow: 72,
        mist: 45,
        ripple: 50,
        stars: 24,
        mood: 'nocturne'
    };

    const settingsConfig = {
        zoom: {
            type: 'range',
            label: 'Scale',
            min: 80,
            max: 140,
            default: 100,
            displaySuffix: '%'
        },
        hue: {
            type: 'palette',
            label: 'Moon Tint',
            default: 215,
            options: [200, 215, 235, 260, 300, 35, 150]
        },
        glow: {
            type: 'range',
            label: 'Moon Glow',
            min: 15,
            max: 100,
            default: 72,
            displaySuffix: '%'
        },
        mist: {
            type: 'range',
            label: 'Mist',
            min: 0,
            max: 100,
            default: 45,
            displaySuffix: '%'
        },
        ripple: {
            type: 'range',
            label: 'Water Motion',
            min: 0,
            max: 100,
            default: 50,
            displaySuffix: '%'
        },
        stars: {
            type: 'range',
            label: 'Stars',
            min: 0,
            max: 50,
            default: 24,
            displaySuffix: ''
        },
        mood: {
            type: 'select',
            label: 'Mood',
            default: 'nocturne',
            options: [
                { value: 'nocturne', text: 'Nocturne' },
                { value: 'violet', text: 'Violet Tide' },
                { value: 'teal', text: 'Teal Silence' },
                { value: 'ember', text: 'Ember Night' }
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
            <div class="mw-root">
                <div class="mw-sky-gradient"></div>
                <div class="mw-stars"></div>
                <div class="mw-mist mw-mist-back"></div>

                <div class="mw-moon-wrap">
                    <div class="mw-moon-glow"></div>
                    <div class="mw-moon"></div>
                </div>

                <div class="mw-time-wrap">
                    <div class="mw-time">00:00:00</div>
                    <div class="mw-date-hint">BE STILL</div>
                </div>

                <div class="mw-horizon-glow"></div>
                <div class="mw-water">
                    <div class="mw-reflection"></div>
                    <div class="mw-ripples"></div>
                </div>

                <div class="mw-mist mw-mist-front"></div>
                <div class="mw-vignette"></div>
            </div>
        `;

        root = stage.querySelector('.mw-root');
        timeEl = stage.querySelector('.mw-time');
        dateHintEl = stage.querySelector('.mw-date-hint');
        moonEl = stage.querySelector('.mw-moon');
        glowEl = stage.querySelector('.mw-moon-glow');
        reflectionEl = stage.querySelector('.mw-reflection');
        starsLayer = stage.querySelector('.mw-stars');
        mistLayer = stage.querySelector('.mw-mist-front');

        buildStars();
        applySettings();
        startAnimation();
    }

    function getMoodPreset(mood) {
        switch (mood) {
            case 'violet':
                return {
                    skyTop: 'hsl(255, 42%, 10%)',
                    skyMid: 'hsl(275, 34%, 14%)',
                    skyLow: 'hsl(315, 30%, 12%)',
                    waterTop: 'hsla(270, 45%, 18%, 0.92)',
                    waterLow: 'hsla(290, 35%, 7%, 0.98)',
                    text: 'rgba(250,245,255,0.96)',
                    dim: 'rgba(230,210,255,0.72)'
                };
            case 'teal':
                return {
                    skyTop: 'hsl(190, 45%, 10%)',
                    skyMid: 'hsl(205, 38%, 13%)',
                    skyLow: 'hsl(220, 30%, 11%)',
                    waterTop: 'hsla(195, 50%, 16%, 0.92)',
                    waterLow: 'hsla(220, 35%, 7%, 0.98)',
                    text: 'rgba(240,255,252,0.96)',
                    dim: 'rgba(185,240,230,0.72)'
                };
            case 'ember':
                return {
                    skyTop: 'hsl(220, 34%, 10%)',
                    skyMid: 'hsl(255, 20%, 12%)',
                    skyLow: 'hsl(12, 38%, 13%)',
                    waterTop: 'hsla(12, 42%, 16%, 0.92)',
                    waterLow: 'hsla(230, 35%, 6%, 0.98)',
                    text: 'rgba(255,245,238,0.96)',
                    dim: 'rgba(255,210,190,0.74)'
                };
            case 'nocturne':
            default:
                return {
                    skyTop: 'hsl(220, 42%, 10%)',
                    skyMid: 'hsl(230, 34%, 14%)',
                    skyLow: 'hsl(245, 24%, 12%)',
                    waterTop: 'hsla(220, 45%, 16%, 0.92)',
                    waterLow: 'hsla(240, 38%, 7%, 0.98)',
                    text: 'rgba(245,250,255,0.97)',
                    dim: 'rgba(195,215,240,0.72)'
                };
        }
    }

    function buildStars() {
        if (!starsLayer) return;

        starsLayer.innerHTML = '';
        stars = [];

        const count = Number(currentSettings.stars) || 0;

        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'mw-star';

            const size = 1 + Math.random() * 2.8;
            const x = Math.random() * 100;
            const y = Math.random() * 52;
            const delay = Math.random() * 8;
            const duration = 4 + Math.random() * 8;
            const op = 0.2 + Math.random() * 0.8;

            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.opacity = op;
            star.style.animationDelay = `${delay}s`;
            star.style.animationDuration = `${duration}s`;

            starsLayer.appendChild(star);
            stars.push(star);
        }
    }

    function applySettings() {
        if (!root) return;

        const s = currentSettings;
        const mood = getMoodPreset(s.mood);
        const hue = Number(s.hue);
        const glow = Number(s.glow) / 100;
        const mist = Number(s.mist) / 100;
        const ripple = Number(s.ripple) / 100;
        const zoom = Number(s.zoom) / 100;

        root.style.setProperty('--mw-zoom', zoom);
        root.style.setProperty('--mw-hue', hue);
        root.style.setProperty('--mw-glow', glow);
        root.style.setProperty('--mw-mist', mist);
        root.style.setProperty('--mw-ripple', ripple);

        root.style.setProperty('--mw-sky-top', mood.skyTop);
        root.style.setProperty('--mw-sky-mid', mood.skyMid);
        root.style.setProperty('--mw-sky-low', mood.skyLow);
        root.style.setProperty('--mw-water-top', mood.waterTop);
        root.style.setProperty('--mw-water-low', mood.waterLow);
        root.style.setProperty('--mw-text', mood.text);
        root.style.setProperty('--mw-dim', mood.dim);

        root.style.setProperty('--mw-accent', `hsl(${hue}, 80%, 76%)`);
        root.style.setProperty('--mw-accent-soft', `hsla(${hue}, 90%, 76%, 0.34)`);
        root.style.setProperty('--mw-accent-faint', `hsla(${hue}, 90%, 76%, 0.12)`);

        if (moonEl) {
            moonEl.style.boxShadow = `
                inset -18px -18px 30px rgba(255,255,255,0.18),
                0 0 ${40 + glow * 70}px hsla(${hue}, 90%, 75%, ${0.14 + glow * 0.2}),
                0 0 ${80 + glow * 120}px hsla(${hue}, 90%, 75%, ${0.06 + glow * 0.12})
            `;
        }

        if (glowEl) {
            glowEl.style.opacity = `${0.35 + glow * 0.5}`;
        }

        if (reflectionEl) {
            reflectionEl.style.opacity = `${0.22 + glow * 0.32}`;
        }

        buildStars();
    }

    function update(timeObj) {
        if (!timeEl || !root) return;

        const hh = Number(timeObj.h);
        const mm = Number(timeObj.m);
        const ss = Number(timeObj.s);

        timeEl.textContent = `${timeObj.h}:${timeObj.m}:${timeObj.s}`;

        const dayPhase =
            hh < 5 ? 'DEEP NIGHT' :
            hh < 12 ? 'EARLY QUIET' :
            hh < 18 ? 'GENTLE LIGHT' :
            'MOONLIT CALM';

        dateHintEl.textContent = `${dayPhase} · EXHALE`;

        const moonX = ((mm / 59) - 0.5) * 10;
        const moonY = Math.sin((ss / 60) * Math.PI * 2) * 2.5;
        root.style.setProperty('--mw-moon-drift-x', `${moonX}px`);
        root.style.setProperty('--mw-moon-drift-y', `${moonY}px`);

        const shimmer = 1 + Math.sin((ss / 60) * Math.PI * 2) * 0.04;
        root.style.setProperty('--mw-reflection-scale', shimmer);
    }

    function startAnimation() {
        stopAnimation();

        const animate = () => {
            if (!root) return;

            const t = Date.now() * 0.001;
            const mist = Number(currentSettings.mist) / 100;
            const ripple = Number(currentSettings.ripple) / 100;

            root.style.setProperty('--mw-sky-shift-x', `${Math.sin(t * 0.08) * 12}px`);
            root.style.setProperty('--mw-sky-shift-y', `${Math.cos(t * 0.06) * 8}px`);
            root.style.setProperty('--mw-mist-shift', `${Math.sin(t * 0.16) * (8 + mist * 22)}px`);
            root.style.setProperty('--mw-water-shimmer', `${Math.sin(t * (1.2 + ripple * 1.5)) * (1.5 + ripple * 2.5)}px`);

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

        if (key === 'stars') {
            buildStars();
        }

        applySettings();
    }

    function destroy() {
        stopAnimation();
        if (stage) stage.innerHTML = '';
        stage = null;
        root = null;
        timeEl = null;
        dateHintEl = null;
        moonEl = null;
        glowEl = null;
        reflectionEl = null;
        starsLayer = null;
        mistLayer = null;
        stars = [];
    }

    return {
        settingsConfig,
        init,
        update,
        onSettingsChange,
        destroy
    };
})();
