const Engine = {
    // *** CONFIGURATION ***

    // Oi! What are you looking at here? Are you looking for secrets? I know you can misuse this. Please don't. Kindly :*
    API_URL: 'https://script.google.com/macros/s/AKfycbwHCfHaBJFXXyvASFf5x5Iy0OCiQLD38hsW4_gOGiWdiJPIURBcFovTVvDN7qShd6R5AA/exec',

    // 1. REGISTRY
    themes: [
        { id: 'simple', name: 'Simple Digital' },
        { id: 'breathe', name: '☆ Deep Breathing' },
        { id: 'ios', name: '☆ Standby Mode' },
        { id: 'analog', name: '☆ Analog Standby' },
        { id: 'lcd', name: 'Retro LCD' },
        { id: 'industrial_digital_clock', name: 'Industrial Clock' },
        { id: 'cyberpunk_digital', name: '☆ Cyberpunk' },
        { id: 'ethereal_tides', name: '☆ Ethereal Tides' },
        { id: 'astral_tides', name: '☆ Astral Tides' },
        { id: 'mail', name: 'Nostalgia' },
        { id: 'circular', name: '☆ Circular' },
        { id: 'auroras_glass', name: '☆ Auroras Glass' },
        { id: 'zen_orbit', name: '☆ Zen Orbit' },
        { id: 'machinarium', name: '☆ Machinarium' },
        { id: 'solstice_prism', name: 'Solstice Prism' },
        { id: 'horizon_loom', name: 'Horizon Loom' },
        { id: 'chronos_gyre', name: 'Chronos Gyre' },
        { id: 'celestial_chronos', name: 'Celestial' },
        { id: 'the_board', name: '☆ The Board' }

    ],
    state: {
        activeThemeId: 'simple',
        themeSettings: {}
    },

    // Session State
    session: {
        active: false,
        finished: false,
        startTime: null,
        elapsed: 0
    },
    currentThemeObj: null,
    dom: {
        stage: document.getElementById('stage'),
        cssLink: document.getElementById('theme-stylesheet'),

        libraryDrawer: document.getElementById('library-drawer'),
        settingsDrawer: document.getElementById('settings-panel'),
        themeGrid: document.getElementById('theme-grid'),
        settingsContent: document.getElementById('settings-content'),

        btnFullscreen: document.getElementById('btn-fullscreen'),
        btnExitFs: document.getElementById('btn-exit-fs'),
        sessionHandle: document.getElementById('session-handle'),
        sessionPanel: document.getElementById('session-panel'),
        sessionTimer: document.getElementById('session-timer'),
        sessionBtn: document.getElementById('btn-session-toggle'),
        sessionText: document.getElementById('session-status-text'),

        // NEW ELEMENTS
        controlsRow: document.getElementById('controls-row'), // <--- ADDED THIS REFERENCE
        syncGroup: document.getElementById('sync-group'),
        userInput: document.getElementById('user-input'),
        syncBtn: document.getElementById('btn-sync'),
        syncMsg: document.getElementById('sync-msg')
    },

    init: function () {
        this.loadState();

        // Listeners
        document.getElementById('btn-library').addEventListener('click', () => this.toggleDrawer('library'));
        document.getElementById('btn-close-library').addEventListener('click', () => this.closeDrawers());
        document.getElementById('btn-settings').addEventListener('click', () => this.toggleDrawer('settings'));
        document.getElementById('btn-close-settings').addEventListener('click', () => this.closeDrawers());
        this.dom.btnFullscreen.addEventListener('click', () => this.enterFullscreen());
        this.dom.btnExitFs.addEventListener('click', () => this.exitFullscreen());

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
            eventType => document.addEventListener(eventType, () => this.handleFullscreenChange(), false)
        );

        this.dom.sessionHandle.addEventListener('click', () => {
            this.dom.sessionPanel.classList.toggle('active');
            this.closeDrawers();
        });

        this.dom.sessionBtn.addEventListener('click', () => {
            this.handleSessionClick();
        });

        // SYNC LISTENER
        this.dom.syncBtn.addEventListener('click', () => this.uploadSession());

        // Load cached username
        const savedUser = localStorage.getItem('meditation_user');
        if (savedUser) this.dom.userInput.value = savedUser;

        this.buildLibraryUI();
        this.loadTheme(this.state.activeThemeId);
        this.startClock();

        // Scroll fade indicator for theme library
        this.initScrollIndicators();

        // SECRET LISTENERS
        this.initSecretFeatures();
    },

    initScrollIndicators: function () {
        const grid = this.dom.themeGrid;
        const drawer = this.dom.libraryDrawer;

        if (!grid || !drawer) return;

        // Dynamic creation of scroll indicator if missing
        if (!this.dom.scrollIndicator) {
            let indicator = document.getElementById('library-scroll-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'library-scroll-indicator';
                indicator.className = 'scroll-indicator';
                // HTML Entity for a nice thin chevron down (⌄)
                indicator.innerHTML = '&#8964;';
                drawer.appendChild(indicator);
            }
            this.dom.scrollIndicator = indicator;
        }

        const updateScrollState = () => {
            const scrollTop = grid.scrollTop;
            const scrollHeight = grid.scrollHeight;
            const clientHeight = grid.clientHeight;
            const threshold = 10;

            // Remove all scroll state classes
            drawer.classList.remove('scroll-top', 'scroll-middle', 'scroll-bottom');

            if (scrollTop <= threshold) {
                // At top
                drawer.classList.add('scroll-top');
            } else if (scrollTop + clientHeight >= scrollHeight - threshold) {
                // At bottom
                drawer.classList.add('scroll-bottom');
                if (this.dom.scrollIndicator) this.dom.scrollIndicator.style.opacity = '0';
            } else {
                // In middle
                drawer.classList.add('scroll-middle');
                if (this.dom.scrollIndicator) this.dom.scrollIndicator.style.opacity = '1';
            }

            // Show indicator if at top and scrollable
            if (scrollTop <= threshold && scrollHeight > clientHeight) {
                if (this.dom.scrollIndicator) this.dom.scrollIndicator.style.opacity = '1';
            }
        };

        grid.addEventListener('scroll', updateScrollState);
        window.addEventListener('resize', updateScrollState);

        // Initial state check (with slight delay to ensure content is rendered)
        setTimeout(updateScrollState, 100);
    },

    handleSessionClick: function () {
        const s = this.session;

        // 1. START SESSION
        if (!s.active && !s.finished) {
            s.active = true;
            s.startTime = Date.now();

            // UI
            this.dom.sessionBtn.innerText = "Stop Session";
            this.dom.sessionBtn.classList.add('stop-mode');
            this.dom.sessionHandle.classList.add('meditating');
            this.dom.sessionText.innerText = "In Progress";
            this.dom.sessionTimer.classList.remove('finished');

            // ENSURE WE ARE IN BIG MODE (Remove class)
            this.dom.controlsRow.classList.remove('sync-layout');
            // Also ensure specific display style is cleared so CSS class handles it
            this.dom.syncGroup.style.display = '';

            this.dom.syncMsg.innerText = "";

            setTimeout(() => { this.dom.sessionPanel.classList.remove('active'); }, 500);
            return;
        }

        // 2. FINISH SESSION
        if (s.active) {
            s.active = false;
            s.finished = true;
            s.elapsed = Date.now() - s.startTime;

            // UI
            this.dom.sessionBtn.innerText = "New Session";
            this.dom.sessionBtn.classList.remove('stop-mode');
            this.dom.sessionHandle.classList.remove('meditating');
            this.dom.sessionText.innerText = "Session Complete";
            this.dom.sessionTimer.classList.add('finished');
            this.dom.sessionTimer.innerText = this.formatTime(s.elapsed);

            // ACTIVATE SHAPE SHIFT (Morph to Small Mode)
            this.dom.controlsRow.classList.add('sync-layout');

            return;
        }

        // 3. RESET (Start New)
        if (s.finished) {
            s.finished = false;
            s.elapsed = 0;
            s.startTime = null;

            this.dom.sessionBtn.innerText = "Begin Meditation";
            this.dom.sessionTimer.innerText = "00:00:00";
            this.dom.sessionTimer.classList.remove('finished');
            this.dom.sessionText.innerText = "Start Session";

            // RETURN TO BIG MODE (Morph back to Big)
            this.dom.controlsRow.classList.remove('sync-layout');

            this.dom.syncMsg.innerText = "";
            return;
        }
    },

    uploadSession: function () {
        const user = this.dom.userInput.value.trim() || 'ANONYMOUS';
        const durationSecs = Math.floor(this.session.elapsed / 1000);

        localStorage.setItem('meditation_user', user);

        this.dom.syncBtn.innerText = "...";
        this.dom.syncBtn.disabled = true;

        fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                username: user,
                duration: durationSecs
            })
        })
            .then(() => {
                this.dom.syncBtn.innerText = "✓";
                this.dom.syncMsg.innerText = `Saved ${this.formatTime(this.session.elapsed)}`;
                this.dom.syncMsg.style.color = '#4caf50';
                setTimeout(() => {
                    this.dom.syncBtn.innerText = "SYNC ☁️";
                    this.dom.syncBtn.disabled = false;
                }, 3000);
            })
            .catch(err => {
                console.error(err);
                this.dom.syncBtn.innerText = "Err";
                this.dom.syncBtn.disabled = false;
                this.dom.syncMsg.innerText = "Sync Failed";
                this.dom.syncMsg.style.color = 'red';
            });
    },


    enterFullscreen: function () {
        const elem = document.documentElement;
        const req = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
        document.body.classList.add('fullscreen-mode');
        this.closeDrawers();
        this.dom.sessionPanel.classList.remove('active');
        if (req) req.call(elem).catch(err => console.log("Fullscreen blocked:", err));
    },
    exitFullscreen: function () {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit) exit.call(document);
        document.body.classList.remove('fullscreen-mode');
    },
    handleFullscreenChange: function () {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!isFullscreen) document.body.classList.remove('fullscreen-mode');
        else document.body.classList.add('fullscreen-mode');
    },
    formatTime: function (ms) {
        const totalSecs = Math.floor(ms / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    },
    toggleDrawer: function (type) {
        if (type === 'library') {
            this.dom.libraryDrawer.classList.add('active');
            this.dom.settingsDrawer.classList.remove('active');
        } else {
            this.dom.settingsDrawer.classList.add('active');
            this.dom.libraryDrawer.classList.remove('active');
        }
        this.dom.sessionPanel.classList.remove('active');
    },
    closeDrawers: function () {
        this.dom.libraryDrawer.classList.remove('active');
        this.dom.settingsDrawer.classList.remove('active');
    },
    buildLibraryUI: function () {
        const container = this.dom.themeGrid;
        container.innerHTML = '';
        this.themes.forEach(theme => {
            const tile = document.createElement('div');
            tile.className = 'theme-tile';
            if (theme.id === this.state.activeThemeId) tile.classList.add('active');
            const text = document.createElement('span');
            text.className = 'tile-text';
            text.innerText = theme.name;
            const dot = document.createElement('div');
            dot.className = 'tile-dot';
            tile.appendChild(text);
            tile.appendChild(dot);
            tile.addEventListener('click', () => {
                this.loadTheme(theme.id);
                this.buildLibraryUI();
            });
            container.appendChild(tile);
        });
    },
    loadTheme: function (themeId) {
        if (this.currentThemeObj && this.currentThemeObj.destroy) this.currentThemeObj.destroy();
        this.state.activeThemeId = themeId;
        this.saveState();
        this.dom.cssLink.href = `../themes/${themeId}/theme.css`;
        const oldScript = document.getElementById('theme-script');
        if (oldScript) oldScript.remove();
        const script = document.createElement('script');
        script.src = `../themes/${themeId}/theme.js`;
        script.id = 'theme-script';
        script.onload = () => {
            if (window.ActiveTheme) {
                this.currentThemeObj = window.ActiveTheme;
                const saved = this.state.themeSettings[themeId] || {};
                this.currentThemeObj.init(this.dom.stage, saved);
                this.buildSettingsUI(themeId);
                this.tick();
            }
        };
        document.body.appendChild(script);
    },
    buildSettingsUI: function (themeId) {
        const container = this.dom.settingsContent;
        container.innerHTML = '';
        if (!this.currentThemeObj || !this.currentThemeObj.settingsConfig) {
            container.innerHTML = '<div style="color:#444; font-size:10px; text-transform:uppercase;">No Configuration</div>';
            return;
        }
        const config = this.currentThemeObj.settingsConfig;
        for (const [key, setting] of Object.entries(config)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'setting-item';
            if (setting.type === 'range') {
                const labelRow = document.createElement('div');
                labelRow.style.display = 'flex';
                labelRow.style.justifyContent = 'space-between';
                labelRow.style.marginBottom = '10px';
                const label = document.createElement('span');
                label.className = 'setting-label';
                label.style.marginBottom = '0';
                label.innerText = setting.label;
                const valIndicator = document.createElement('span');
                valIndicator.className = 'setting-label';
                valIndicator.style.color = 'white';
                const currentVal = this.state.themeSettings[themeId]?.[key] || setting.default;
                const suffix = setting.displaySuffix || '';
                valIndicator.innerText = `${currentVal}${suffix}`;
                labelRow.appendChild(label);
                labelRow.appendChild(valIndicator);
                wrapper.appendChild(labelRow);
                const slider = document.createElement('input');
                slider.type = 'range';
                slider.min = setting.min;
                slider.max = setting.max;
                slider.value = currentVal;
                slider.oninput = (e) => {
                    valIndicator.innerText = `${e.target.value}${suffix}`;
                    this.updateSetting(themeId, key, e.target.value);
                };
                wrapper.appendChild(slider);
            } else if (setting.type === 'palette') {
                const label = document.createElement('span');
                label.className = 'setting-label';
                label.innerText = setting.label;
                wrapper.appendChild(label);
                const grid = document.createElement('div');
                grid.className = 'palette-grid';
                setting.options.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch';
                    swatch.style.backgroundColor = color;
                    const currentVal = this.state.themeSettings[themeId]?.[key] || setting.default;
                    if (color === currentVal) swatch.classList.add('active');
                    swatch.onclick = () => {
                        this.updateSetting(themeId, key, color);
                        this.buildSettingsUI(themeId);
                    };
                    grid.appendChild(swatch);
                });
                wrapper.appendChild(grid);
            } else if (setting.type === 'select') {
                const label = document.createElement('span');
                label.className = 'setting-label';
                label.innerText = setting.label;
                wrapper.appendChild(label);
                const select = document.createElement('select');
                select.className = 'setting-select';
                setting.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.innerText = opt.text;
                    if (opt.value == (this.state.themeSettings[themeId]?.[key] || setting.default)) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                select.onchange = (e) => {
                    this.updateSetting(themeId, key, e.target.value);
                };
                wrapper.appendChild(select);
            }
            container.appendChild(wrapper);
        }
    },
    updateSetting: function (themeId, key, value) {
        if (!this.state.themeSettings[themeId]) this.state.themeSettings[themeId] = {};
        this.state.themeSettings[themeId][key] = value;
        this.saveState();
        if (this.currentThemeObj.onSettingsChange) this.currentThemeObj.onSettingsChange(key, value);
    },
    saveState: function () {
        localStorage.setItem('meditation_os_state', JSON.stringify(this.state));
    },
    loadState: function () {
        const saved = localStorage.getItem('meditation_os_state');
        if (saved) this.state = { ...this.state, ...JSON.parse(saved) };
    },
    startClock: function () { setInterval(() => this.tick(), 1000); },
    tick: function () {
        if (this.currentThemeObj) {
            const now = new Date();
            this.currentThemeObj.update({
                h: String(now.getHours()).padStart(2, '0'),
                m: String(now.getMinutes()).padStart(2, '0'),
                s: String(now.getSeconds()).padStart(2, '0')
            });
        }
        if (this.session.active) {
            const diff = Date.now() - this.session.startTime;
            this.dom.sessionTimer.innerText = this.formatTime(diff);
        }
    },
    initSecretFeatures: function () {
        // Elements
        const modal = document.getElementById('secret-modal');
        const btnClose = document.getElementById('btn-close-secret');
        const btnSubmit = document.getElementById('btn-secret-submit');
        const inputUser = document.getElementById('secret-username');
        const inputDuration = document.getElementById('secret-duration');
        const msg = document.getElementById('secret-msg');

        if (!modal) return;

        // 1. KEYBOARD TRIGGER (Ctrl + Alt + Shift + M)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                this.openSecretModal();
            }
        });

        // 2. INPUT TRIGGER (MANUALINPUT)
        if (this.dom.userInput) {
            this.dom.userInput.addEventListener('input', (e) => {
                const val = e.target.value.toUpperCase();
                if (val === 'MANUALINPUT' || val === 'MANUALNPUT') {
                    // Revert to last saved user instead of clearing
                    const savedUser = localStorage.getItem('meditation_user') || '';
                    e.target.value = savedUser;
                    this.openSecretModal();
                }
            });
        }

        // Close Logic
        btnClose.addEventListener('click', () => this.closeSecretModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeSecretModal();
        });

        // Submit Logic
        btnSubmit.addEventListener('click', () => {
            const user = inputUser.value.trim() || 'ANONYMOUS';
            const mins = parseInt(inputDuration.value);

            if (!mins || mins <= 0) {
                msg.innerText = "INVALID DURATION";
                msg.style.color = "#ff5f57";
                return;
            }

            // Reuse sync logic but manually
            msg.innerText = "UPLOADING...";
            msg.style.color = "white";
            btnSubmit.disabled = true;

            const durationSecs = mins * 60;

            fetch(this.API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    username: user,
                    duration: durationSecs
                })
            })
                .then(() => {
                    msg.innerText = "ENTRY SAVED ✓";
                    msg.style.color = "#50fa7b";
                    btnSubmit.innerText = "SUCCESS";
                    setTimeout(() => {
                        this.closeSecretModal();
                        // Reset button state
                        btnSubmit.disabled = false;
                        btnSubmit.innerText = "UPLOAD ENTRY";
                        msg.innerText = "";
                        inputDuration.value = "";
                    }, 1500);
                })
                .catch(err => {
                    console.error(err);
                    msg.innerText = "UPLOAD FAILED";
                    msg.style.color = "#ff5f57";
                    btnSubmit.disabled = false;
                });
        });
    },

    openSecretModal: function () {
        const modal = document.getElementById('secret-modal');
        const inputUser = document.getElementById('secret-username');
        if (modal) {
            modal.classList.add('active');
            // Pre-fill user if we have one stored
            const savedUser = localStorage.getItem('meditation_user');
            if (savedUser) inputUser.value = savedUser;
            inputUser.focus();
        }
    },

    closeSecretModal: function () {
        const modal = document.getElementById('secret-modal');
        if (modal) modal.classList.remove('active');
    }
};

Engine.init();