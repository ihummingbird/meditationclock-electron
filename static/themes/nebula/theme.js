/* ═══════════════════════════════════════════════════════════════════
   DEEP NEBULA — Theme JS
   ═══════════════════════════════════════════════════════════════════
   
   Expected by Engine.loadTheme():
     window.ActiveTheme = {
       init(stageEl, savedSettings),
       update({ h, m, s }),
       destroy(),
       onSettingsChange(key, value),  // optional
       settingsConfig                 // optional
     }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─── STATE ─── */
    let stageEl = null;
    let bgContainer = null;
    let clockEl = null;
    let digitEls = [];
    let sepEls = [];
    let secArc = null;
    let labelEl = null;
    let prevTime = { h: '', m: '', s: '' };
    let parallaxRaf = null;
    let mouse = { x: 0.5, y: 0.5 };
    let smooth = { x: 0.5, y: 0.5 };
    let isMobile = false;

    const lerp = (a, b, t) => a + (b - a) * t;

    /* ─── Detect mobile/touch device ─── */
    function detectMobile() {
        isMobile = ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0) ||
                   (window.innerWidth < 768);
    }

    /* ─── Safe 2-digit padding ─── */
    function pad2(val) {
        const s = String(val);
        return s.length < 2 ? '0' + s : s;
    }

    /* ═══════════════════════════════════════════════════════════════
       BACKGROUND LAYER INJECTION
       ═══════════════════════════════════════════════════════════════ */

    function injectBackground () {
        if (document.getElementById('neb-bg')) return;

        bgContainer = document.createElement('div');
        bgContainer.id = 'neb-bg';
        bgContainer.className = 'nebula-wrap';
        bgContainer.innerHTML = `
            <!-- Nebula Clouds -->
            <div class="nebula-clouds" data-neb-px="far">
                <div class="neb-cloud"></div>
                <div class="neb-cloud"></div>
                <div class="neb-cloud"></div>
                <div class="neb-cloud"></div>
            </div>
            <!-- Stars -->
            <div class="neb-stars neb-stars-far"   data-neb-px="far"></div>
            <div class="neb-stars neb-stars-mid"   data-neb-px="mid"></div>
            <div class="neb-stars neb-stars-near"  data-neb-px="near"></div>
            <!-- Aurora -->
            <div class="neb-aurora" data-neb-px="far">
                <div class="neb-aurora-band"></div>
                <div class="neb-aurora-band"></div>
                <div class="neb-aurora-band"></div>
            </div>
            <!-- Pulse Rings -->
            <div class="neb-pulse-wrap">
                <div class="neb-pulse"></div>
                <div class="neb-pulse"></div>
                <div class="neb-pulse"></div>
                <div class="neb-pulse"></div>
            </div>
            <!-- Orbs -->
            <div class="neb-orbs" data-neb-px="mid">
                <div class="neb-orb"></div>
                <div class="neb-orb"></div>
                <div class="neb-orb"></div>
                <div class="neb-orb"></div>
                <div class="neb-orb"></div>
            </div>
            <!-- Shooting Stars -->
            <div class="neb-shooting"></div>
            <div class="neb-shooting"></div>
            <div class="neb-shooting"></div>
            <!-- Dust -->
            <div class="neb-dust-field" data-neb-px="far">
                ${Array.from({length: 20}, () => '<div class="neb-dust"></div>').join('')}
            </div>
            <!-- Sparkles -->
            <div class="neb-dust-field" data-neb-px="mid">
                ${Array.from({length: 12}, () => '<div class="neb-sparkle"></div>').join('')}
            </div>
            <!-- Vignette -->
            <div class="neb-vignette"></div>
        `;

        document.body.prepend(bgContainer);
    }

    /* ═══════════════════════════════════════════════════════════════
       CLOCK FACE — Built inside #stage
       ═══════════════════════════════════════════════════════════════ */

    function buildClock (stage) {
        stage.innerHTML = '';

        clockEl = document.createElement('div');
        clockEl.className = 'neb-clock';
        clockEl.innerHTML = `
            <div class="neb-clock-card">
                <div class="neb-ring"></div>
                <svg class="neb-seconds-svg" viewBox="0 0 200 200">
                    <circle class="neb-sec-track" cx="100" cy="100" r="95"/>
                    <circle class="neb-sec-arc" cx="100" cy="100" r="95"
                        stroke-dasharray="597"
                        stroke-dashoffset="597"
                        transform="rotate(-90 100 100)"/>
                </svg>
                <div class="neb-time">
                    <span class="neb-digit" data-d="h0">0</span><span class="neb-digit" data-d="h1">0</span>
                    <span class="neb-sep">:</span>
                    <span class="neb-digit" data-d="m0">0</span><span class="neb-digit" data-d="m1">0</span>
                    <span class="neb-sep">:</span>
                    <span class="neb-digit" data-d="s0">0</span><span class="neb-digit" data-d="s1">0</span>
                </div>
                <div class="neb-label">deep space standard time</div>
            </div>
        `;

        stage.appendChild(clockEl);

        // Cache references
        digitEls = clockEl.querySelectorAll('.neb-digit');
        sepEls = clockEl.querySelectorAll('.neb-sep');
        secArc = clockEl.querySelector('.neb-sec-arc');
        labelEl = clockEl.querySelector('.neb-label');
    }

    /* ═══════════════════════════════════════════════════════════════
       MOUSE / TOUCH PARALLAX
       ═══════════════════════════════════════════════════════════════ */

    const PX_STRENGTH = { far: -10, mid: -20, near: -30 };

    function onMove (e) {
        if (e.touches && e.touches.length > 0) {
            mouse.x = e.touches[0].clientX / window.innerWidth;
            mouse.y = e.touches[0].clientY / window.innerHeight;
        } else {
            mouse.x = e.clientX / window.innerWidth;
            mouse.y = e.clientY / window.innerHeight;
        }
    }

    function onOrientation (e) {
        // Use device orientation for subtle parallax on mobile (tilt effect)
        if (e.gamma !== null && e.beta !== null) {
            // gamma: left/right tilt (-90 to 90)
            // beta: front/back tilt (-180 to 180)
            mouse.x = 0.5 + (e.gamma / 90) * 0.5;
            mouse.y = 0.5 + ((e.beta - 45) / 90) * 0.5;
        }
    }

    function pxLoop () {
        smooth.x = lerp(smooth.x, mouse.x, 0.04);
        smooth.y = lerp(smooth.y, mouse.y, 0.04);
        const ox = (smooth.x - 0.5) * 2;
        const oy = (smooth.y - 0.5) * 2;

        document.querySelectorAll('[data-neb-px]').forEach(el => {
            const s = PX_STRENGTH[el.dataset.nebPx] || 0;
            el.style.transform = `translate3d(${ox * s}px, ${oy * s}px, 0)`;
        });

        parallaxRaf = requestAnimationFrame(pxLoop);
    }

    function startParallax () {
        if (!isMobile) {
            // Desktop: mouse movement
            document.addEventListener('mousemove', onMove, { passive: true });
        } else {
            // Mobile: touch movement
            document.addEventListener('touchmove', onMove, { passive: true });
            // Also try device orientation for tilt parallax
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', onOrientation, { passive: true });
            }
        }
        parallaxRaf = requestAnimationFrame(pxLoop);
    }

    function stopParallax () {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        if (window.DeviceOrientationEvent) {
            window.removeEventListener('deviceorientation', onOrientation);
        }
        cancelAnimationFrame(parallaxRaf);
        document.querySelectorAll('[data-neb-px]').forEach(el => { el.style.transform = ''; });
    }

    /* ═══════════════════════════════════════════════════════════════
       SESSION STATE HOOKS
       ═══════════════════════════════════════════════════════════════ */

    function hookSession () {
        if (typeof Engine === 'undefined') return;

        // Monkey-patch handleSessionClick to toggle body class
        const orig = Engine.handleSessionClick.bind(Engine);
        Engine.handleSessionClick = function () {
            const was = Engine.session && Engine.session.active;
            orig();
            const is = Engine.session && Engine.session.active;
            document.body.classList.toggle('session-neb-active', is);
        };
    }

    /* ═══════════════════════════════════════════════════════════════
       FACE COLOR
       ═══════════════════════════════════════════════════════════════ */

    function syncFace () {
        if (window.face) {
            window.face.color = '#a78bfa';
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       TIME UPDATE — Called every second by Engine.tick()
       ═══════════════════════════════════════════════════════════════ */

    function updateTime (time) {
        // Safely pad all values to 2-digit strings regardless of Engine input format
        const h = pad2(time.h);
        const m = pad2(time.m);
        const s = pad2(time.s);

        const digits = {
            h0: h[0], h1: h[1],
            m0: m[0], m1: m[1],
            s0: s[0], s1: s[1],
        };

        // Update digit elements with flip animation on change
        digitEls.forEach(el => {
            const key = el.dataset.d;
            if (digits[key] !== prevTime[key]) {
                el.textContent = digits[key];
                el.classList.add('flip');
                setTimeout(() => el.classList.remove('flip'), 300);
            }
        });

        prevTime = digits;

        // Seconds arc (0–59 → 0–100% of circle)
        if (secArc) {
            const sec = parseInt(s, 10);
            const circumference = 2 * Math.PI * 95; // ~597
            const offset = circumference - (sec / 60) * circumference;
            secArc.style.strokeDashoffset = offset;
        }

        // Update label with current date
        if (labelEl) {
            const now = new Date();
            const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
            labelEl.textContent = months[now.getMonth()] + ' ' + now.getDate() + ' — DEEP SPACE';
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       PUBLIC API — window.ActiveTheme
       ═══════════════════════════════════════════════════════════════ */

    window.ActiveTheme = {
        settingsConfig: null,  // No configurable settings for now

        init: function (stage, savedSettings) {
            stageEl = stage;
            detectMobile();
            injectBackground();
            buildClock(stage);
            startParallax();
            hookSession();
            syncFace();

            // Pause parallax when tab hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    cancelAnimationFrame(parallaxRaf);
                } else {
                    parallaxRaf = requestAnimationFrame(pxLoop);
                }
            });

            // Re-detect on resize (user may rotate phone)
            window.addEventListener('resize', () => {
                detectMobile();
            });
        },

        update: function (timeObj) {
            updateTime(timeObj);
        },

        onSettingsChange: function (key, value) {
            // Future: could control animation speed, color shifts, etc.
        },

        destroy: function () {
            stopParallax();

            // Remove background
            if (bgContainer) bgContainer.remove();
            bgContainer = null;

            // Clear stage
            if (stageEl) stageEl.innerHTML = '';
            stageEl = null;
            clockEl = null;
            digitEls = [];
            secArc = null;
            labelEl = null;
            prevTime = { h: '', m: '', s: '' };

            // Remove body class
            document.body.classList.remove('session-neb-active');
        }
    };

})();
