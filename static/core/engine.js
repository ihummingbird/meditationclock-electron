const Engine = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwHCfHaBJFXXyvASFf5x5Iy0OCiQLD38hsW4_gOGiWdiJPIURBcFovTVvDN7qShd6R5AA/exec',

    themes: [
        { id: 'simple', name: 'Simple Digital' },
        { id: 'ios', name: '☆ Standby Mode' },
        { id: 'cyberpunk_digital', name: '☆ Cyberpunk' },
        { id: 'ethereal_tides', name: '☆ Ethereal Tides' },
        { id: 'astral_tides', name: '☆ Astral Tides' },
        { id: 'zen_orbit', name: '☆ Zen Orbit' },
        { id: 'chronos_gyre', name: 'Chronos Gyre' },
        { id: 'the_board', name: '☆ The Board' },
        { id: 'breathe', name: '☆ Deep Breathing' },
        { id: 'breatheReborn', name: '☆ Deep Breathing Reborn' },
        { id: 'circularReborn', name: '☆ Circular Reborn' },
        { id: 'harmonic_orbits', name: '☆ Harmonic Orbits' },
        { id: 'fluent', name: '☆ Fluent' },
        { id: 'machina_core', name: '☆ Machina Core' },
        { id: 'luminous_orbit', name: '☆ Luminous Orbit' },
        { id: 'moonwater', name: '☆ Moonwater' },
        { id: 'auroras_glass_reborn', name: '☆ Auroras Glass Reborn' },
        { id: 'vision_os_reborn', name: '☆ Vision OS Reborn' },
        { id: 'spatial_aura_reborn', name: '☆ Spatial Aura Reborn' },
        { id: 'vision_os', name: '☆ Vision OS' },
        


        

        { id: 'machinarium', name: '☆ Machinarium' },
        { id: 'zenenso', name: '☆ Zen Enso' },
        { id: 'lumen_bloom', name: '☆ Lumen Bloom' },
        { id: 'etherial_bloom', name: 'Etherial Bloom' },

        { id: 'lcd', name: 'Retro LCD' },
        { id: 'vision_glass', name: 'Vision Glass' },
        
       
        
        { id: 'analog', name: 'Analog Standby' },
        { id: 'horizon_loom', name: 'Horizon Loom' },
        

        
        
        
  

        { id: 'spatial_aura', name: 'Spatial Aura' },
        


        { id: 'circular', name: '☆ Circular' },
        { id: 'something_google_would_create', name: 'Material Theme' },
        
        { id: 'astral_geometry', name: 'Astral Geometry' },
        
        
        
        

        //{ id: 'seven_segment_2', name: 'Digital Display' },  --deprecated
        { id: 'astral_mandala', name: 'Astral Mandala' },
        { id: 'aether_dial', name: 'Aether Dial' },
        { id: 'celestial_vault', name: 'Celestial Vault' },
        { id: 'titan_mechanism', name: 'Titan Mechanism' },
        { id: 'analogigity', name: 'Machina Astra' },
        { id: 'analog_chronograph', name: 'Analog Chronograph' },
        { id: 'aurora_drift', name: 'Aurora Drift' },
        { id: 'particle_constellation', name: '✦ Particle Constellation' },
        { id: 'orrery', name: 'Orrery' },
        { id: 'tesseract', name: 'Tesseract' },
        { id: 'prismatic_lotus', name: '✦ Prismatic Lotus' },
        { id: 'plasma_ring', name: '✦ Plasma Ring' },
        { id: 'crystal_chrono', name: '✦ Crystal Chrono' },
        { id: 'light_weave', name: '✦ Light Weave' },
        { id: 'void_cathedral', name: '✦ Void Cathedral' },
        { id: 'data_stream', name: '✦ Data Stream' },
        { id: 'nebula', name: 'Nebula' },


        
        

        { id: 'circlulartry', name: 'Circlular Drop' },
        

        
        { id: 'auroras_glass', name: '☆ Auroras Glass' },
        
        { id: 'solstice_prism', name: 'Solstice Prism' },
        { id: 'celestial_chronos', name: 'Celestial' },
        { id: 'mail', name: 'Mail' },
        { id: 'industrial_digital_clock', name: 'Industrial Clock' }
        
        
        
    ],
    state: { activeThemeId: 'simple', themeSettings: {}, stopwatchMode: false },
    session: { active: false, finished: false, startTime: null, elapsed: 0 },
    currentThemeObj: null,
    idleTimer: null,


    dom: {
        
        // The pip part:
        btnPip: document.getElementById('btn-pip'),
        stage: document.getElementById('stage'),

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
        
        controlsRow: document.getElementById('controls-row'),
        syncGroup: document.getElementById('sync-group'),
        userInput: document.getElementById('user-input'),
        syncBtn: document.getElementById('btn-sync'),
        syncMsg: document.getElementById('sync-msg')
    },

    init: function () {
        this.loadState();
        this.initListeners();
        this.buildLibraryUI();
        this.loadTheme(this.state.activeThemeId);

        // NEW LINE: Restore the session UI and memory before the clock starts ticking
        this.restoreSession(); 

        this.startClock();
        
        const savedUser = localStorage.getItem('meditation_user');
        if (savedUser) this.dom.userInput.value = savedUser;

        this.initSecretFeatures();
        this.initScrollIndicators(); // <--- Added this back
    },

    initListeners: function () {

        // PIP Part:
        if (this.dom.btnPip) this.dom.btnPip.onclick = () => this.togglePiP();

        document.getElementById('btn-library').onclick = () => this.toggleDrawer('library');
        document.getElementById('btn-close-library').onclick = () => this.closeDrawers();
        document.getElementById('btn-settings').onclick = () => this.toggleDrawer('settings');
        document.getElementById('btn-close-settings').onclick = () => this.closeDrawers();
        
        // Fullscreen Buttons
        this.dom.btnFullscreen.onclick = () => this.enterFullscreen();
        this.dom.btnExitFs.onclick = () => this.exitFullscreen();

        // FIX: Listen for browser fullscreen changes (Escape key, etc.)
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
            eventType => document.addEventListener(eventType, () => this.handleFullscreenChange(), false)
        );

        this.dom.sessionHandle.onclick = () => {
            this.dom.sessionPanel.classList.toggle('active');
            this.closeDrawers();
        };

        this.dom.sessionBtn.onclick = () => this.handleSessionClick();
        this.dom.syncBtn.onclick = () => this.uploadSession();

        // --- NEW: Track user activity for auto-hiding fullscreen button ---
        const activityEvents = ['mousemove', 'touchstart', 'keydown', 'click'];
        activityEvents.forEach(eventType => {
            document.addEventListener(eventType, () => this.resetIdleTimer());
        });


        // --- NEW: Close drawers when clicking outside of them ---
        document.addEventListener('click', (event) => {
            const lib = this.dom.libraryDrawer;
            const set = this.dom.settingsDrawer;
            
            // Only do this if one of the drawers is actually open
            if (lib.classList.contains('active') || set.classList.contains('active')) {
                
                // Check if the click was inside the drawers or on the buttons that open them
                const clickedInLib = lib.contains(event.target);
                const clickedInSet = set.contains(event.target);
                const clickedLibBtn = document.getElementById('btn-library').contains(event.target);
                const clickedSetBtn = document.getElementById('btn-settings').contains(event.target);

                // If they clicked outside of everything related to the menus, close them
                if (!clickedInLib && !clickedInSet && !clickedLibBtn && !clickedSetBtn) {
                    this.closeDrawers();
                }
            }
        });

    },

        restoreSession: function () {
        const savedData = localStorage.getItem('meditation_session');
        if (!savedData) return; // Nothing saved, do nothing

        try {
            const data = JSON.parse(savedData);
            const s = this.session;

            if (data.active && data.startTime) {
                // Restore Running State
                s.active = true;
                s.startTime = data.startTime;

                // Force UI to "Start" mode
                this.dom.sessionBtn.innerText = "STOP SESSION";
                this.dom.sessionBtn.classList.add('stop-mode');
                this.dom.sessionHandle.classList.add('meditating');
                this.dom.sessionText.innerText = "IN PROGRESS";
                this.dom.controlsRow.classList.remove('sync-layout'); 
                this.dom.sessionTimer.classList.remove('finished');
            } 
            else if (data.finished && data.elapsed) {
                // Restore Finished/Sync State
                s.finished = true;
                s.elapsed = data.elapsed;

                // Force UI to "Finished" mode
                this.dom.sessionBtn.innerText = "NEW SESSION";
                this.dom.sessionBtn.classList.remove('stop-mode');
                this.dom.sessionText.innerText = "SESSION FINISHED";
                this.dom.sessionTimer.classList.add('finished');
                this.dom.controlsRow.classList.add('sync-layout'); 
                this.dom.sessionTimer.innerText = this.formatTime(s.elapsed);
            }
        } catch (e) {
            // If data gets corrupted somehow, clear it
            localStorage.removeItem('meditation_session');
        }
    },


    // FIX: Add this function to handle the class removal
    handleFullscreenChange: function () {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!isFullscreen) {
            document.body.classList.remove('fullscreen-mode');
        } else {
            document.body.classList.add('fullscreen-mode');
        }
    },

    // --- SCROLL INDICATOR LOGIC ---
    initScrollIndicators: function () {
        const grid = this.dom.themeGrid;
        const drawer = this.dom.libraryDrawer;

        if (!grid || !drawer) return;

        // Create the element if it doesn't exist
        let indicator = document.getElementById('lib-scroll-ind');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'lib-scroll-ind';
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '&#8964;'; // Chevron Down
            drawer.appendChild(indicator);
        }

        // The update function
        this.updateScrollIndicator = () => {
            const scrollTop = grid.scrollTop;
            const scrollHeight = grid.scrollHeight;
            const clientHeight = grid.clientHeight;
            
            // Show if content is taller than container AND we aren't at the bottom
            const isScrollable = scrollHeight > clientHeight;
            const notAtBottom = scrollTop + clientHeight < scrollHeight - 10;

            if (isScrollable && notAtBottom) {
                indicator.style.opacity = '1';
            } else {
                indicator.style.opacity = '0';
            }
        };

        grid.onscroll = this.updateScrollIndicator;
        window.addEventListener('resize', this.updateScrollIndicator);
        
        // Initial check
        setTimeout(this.updateScrollIndicator, 200);
    },

        handleSessionClick: function () {
        const s = this.session;
        if (!s.active && !s.finished) {
            // --- 1. START SESSION ---
            s.active = true; s.startTime = Date.now();
            
            // NEW: Save "Active" state
            localStorage.setItem('meditation_session', JSON.stringify({ active: true, startTime: s.startTime }));
            
            // UI Updates
            this.dom.sessionBtn.innerText = "STOP SESSION";
            this.dom.sessionBtn.classList.add('stop-mode');
            this.dom.sessionHandle.classList.add('meditating');
            this.dom.sessionText.innerText = "IN PROGRESS";
            
            this.dom.controlsRow.classList.remove('sync-layout'); 
            this.dom.sessionTimer.classList.remove('finished');
            
            setTimeout(() => this.dom.sessionPanel.classList.remove('active'), 500);
            return;
        }
        
        if (s.active) {
            // --- 2. FINISH SESSION ---
            s.active = false; s.finished = true;
            s.elapsed = Date.now() - s.startTime;
            
            // NEW: Save "Finished" state
            localStorage.setItem('meditation_session', JSON.stringify({ finished: true, elapsed: s.elapsed }));
            
            // UI Updates
            this.dom.sessionBtn.innerText = "NEW SESSION";
            this.dom.sessionBtn.classList.remove('stop-mode');
            this.dom.sessionHandle.classList.remove('meditating');
            this.dom.sessionText.innerText = "SESSION FINISHED";
            this.dom.sessionTimer.classList.add('finished');
            
            this.dom.controlsRow.classList.add('sync-layout'); 
            return;
        }
        
        if (s.finished) {
            // --- 3. RESET ---
            s.finished = false; s.elapsed = 0; s.startTime = null;
            
            // NEW: Clear memory
            localStorage.removeItem('meditation_session');
            
            // UI Updates
            this.dom.sessionBtn.innerText = "BEGIN MEDITATION";
            this.dom.sessionTimer.innerText = "00:00:00";
            this.dom.sessionTimer.classList.remove('finished');
            this.dom.sessionText.innerText = "START SESSION";
            
            this.dom.controlsRow.classList.remove('sync-layout');
            return;
        }
    },


        uploadSession: function () {
        const user = this.dom.userInput.value.trim() || 'ANONYMOUS';
        localStorage.setItem('meditation_user', user);
        this.dom.syncBtn.innerText = "...";
        
        fetch(this.API_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify({ username: user, duration: Math.floor(this.session.elapsed / 1000) })
        }).then(() => {
            this.dom.syncBtn.innerText = "✓";
            this.dom.syncMsg.innerText = "Session Saved";
            this.dom.syncMsg.style.color = "var(--success)";

            // Add the animation class
            this.dom.syncMsg.classList.add("msg-pop-in");
            
            // --- NEW: Track submission count and auto-reset ---
            let submitCount = parseInt(localStorage.getItem('meditation_submit_count') || '0', 10);
            submitCount++;
            localStorage.setItem('meditation_submit_count', submitCount);

            // If this is the 2nd submission (or more), and we are in the finished state, reset the UI
            if (submitCount >= 2 && this.session.finished) {
                // This clears the finished session and resets the clock to 00:00:00
                this.handleSessionClick(); 
                
                // Optional: If you want it to instantly START counting the next session automatically 
                // without the user clicking "BEGIN MEDITATION", uncomment the line below:
                // this.handleSessionClick(); 
            }
            // --------------------------------------------------

            setTimeout(() => {
                this.dom.syncBtn.innerText = "SYNC ☁";
                this.dom.syncMsg.innerText = "";
                // Remove the animation class so it can play again next time
                this.dom.syncMsg.classList.remove("msg-pop-in"); 
            }, 10000); 
        });
    },


    loadTheme: function (themeId) {
        if (this.currentThemeObj?.destroy) this.currentThemeObj.destroy();
        this.state.activeThemeId = themeId;
        this.saveState();
        this.dom.cssLink.href = `themes/${themeId}/theme.css`;
        const old = document.getElementById('theme-script');
        if (old) old.remove();
        const sc = document.createElement('script');
        sc.src = `themes/${themeId}/theme.js`; sc.id = 'theme-script';
        sc.onload = () => {
            if (window.ActiveTheme) {
                this.currentThemeObj = window.ActiveTheme;
                const saved = this.state.themeSettings[themeId] || {};
                this.currentThemeObj.init(this.dom.stage, saved);
                this.buildSettingsUI(themeId);
            }
        };
        document.body.appendChild(sc);
    },

    buildSettingsUI: function (themeId) {
        const container = this.dom.settingsContent;
        container.innerHTML = '';

        // --- 1. SYSTEM SECTION ---
        const sysBox = document.createElement('div');
        sysBox.className = 'system-section';

        // Header
        const sysHeader = document.createElement('div');
        sysHeader.className = 'setting-label';
        sysHeader.style.marginBottom = '15px';
        sysHeader.style.color = 'var(--text-dim)';
        sysHeader.innerText = "SYSTEM CONTROL";
        sysBox.appendChild(sysHeader);

        // Stopwatch Toggle Row
        const toggleRow = document.createElement('div');
        toggleRow.className = 'toggle-row';
        
        const label = document.createElement('div');
        label.className = 'toggle-label';
        label.innerText = "Stopwatch Sync";
        toggleRow.appendChild(label);

        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.state.stopwatchMode;
        
        checkbox.onchange = (e) => {
            this.state.stopwatchMode = e.target.checked;
            this.saveState();
            // Show/Hide warning based on state
            warningBox.style.display = e.target.checked ? 'block' : 'none';
            this.tick(); 
        };

        const slider = document.createElement('span');
        slider.className = 'slider';

        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(slider);
        toggleRow.appendChild(switchLabel);
        sysBox.appendChild(toggleRow);

        // --- DISCLAIMER BOX ---
        const warningBox = document.createElement('div');
        warningBox.style.marginTop = '12px';
        warningBox.style.marginBottom = '12px';
        warningBox.style.padding = '10px';
        warningBox.style.background = 'rgba(255, 59, 48, 0.1)'; // Red tint
        warningBox.style.border = '1px solid rgba(255, 59, 48, 0.2)';
        warningBox.style.borderRadius = '8px';
        warningBox.style.fontSize = '11px';
        warningBox.style.lineHeight = '1.4';
        warningBox.style.color = '#ff6b6b';
        warningBox.style.display = this.state.stopwatchMode ? 'block' : 'none'; // Only show if ON
        warningBox.innerHTML = `
            <strong>⚠ EXPERIMENTAL</strong><br>
            Some themes may not animate correctly in stopwatch mode. Recommended setting is <strong>OFF</strong>.
        `;
        sysBox.appendChild(warningBox);

        container.appendChild(sysBox);
        // -----------------------------------------

        // --- 2. THEME SETTINGS (Existing Logic) ---
        const config = this.currentThemeObj?.settingsConfig;
        
        // Header for Theme Settings
        if (config) {
            const themeHeader = document.createElement('div');
            themeHeader.className = 'setting-label'; 
            themeHeader.style.marginTop = '10px';
            themeHeader.innerText = "VISUAL SETTINGS";
            container.appendChild(themeHeader);
        }

        if (!config) {
            const msg = document.createElement('div');
            msg.innerHTML = '<div style="opacity:0.3; font-size:10px; margin-top:20px;">NO CONFIGURATION</div>';
            container.appendChild(msg);
            return;
        }

        for (const [key, setting] of Object.entries(config)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'setting-item';
            const currentVal = this.state.themeSettings[themeId]?.[key] || setting.default;

            // ... (Your existing Label/Slider/Palette/Select logic goes here) ...
            // Just copy/paste the rest of the loop from the previous code
            
            // --- RE-INSERTING YOUR LOGIC FOR CONTEXT ---
            const labelRow = document.createElement('div');
            labelRow.className = 'setting-label';
            labelRow.innerHTML = `<span>${setting.label}</span> <span style="color:white">${currentVal}${setting.displaySuffix || ''}</span>`;
            wrapper.appendChild(labelRow);

            if (setting.type === 'range') {
                const slider = document.createElement('input');
                slider.type = 'range'; slider.min = setting.min; slider.max = setting.max;
                slider.value = currentVal;
                slider.oninput = (e) => {
                    labelRow.children[1].innerText = `${e.target.value}${setting.displaySuffix || ''}`;
                    this.updateSetting(themeId, key, e.target.value);
                };
                wrapper.appendChild(slider);
            } else if (setting.type === 'palette') {
                const grid = document.createElement('div');
                grid.className = 'palette-grid';
                setting.options.forEach(colorVal => {
                    const swatch = document.createElement('div');
                    swatch.className = `color-swatch ${colorVal === currentVal ? 'active' : ''}`;
                    // Handle raw numbers or hex
                    swatch.style.backgroundColor = !isNaN(colorVal) ? `hsl(${colorVal}, 70%, 60%)` : colorVal;
                    swatch.onclick = () => {
                        this.updateSetting(themeId, key, colorVal);
                        this.buildSettingsUI(themeId);
                    };
                    grid.appendChild(swatch);
                });
                wrapper.appendChild(grid);
            } else if (setting.type === 'select') {
                const select = document.createElement('select');
                select.className = 'setting-select';
                setting.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.innerText = opt.text;
                    if (opt.value == currentVal) option.selected = true;
                    select.appendChild(option);
                });
                select.onchange = (e) => this.updateSetting(themeId, key, e.target.value);
                wrapper.appendChild(select);
            }
            container.appendChild(wrapper);
            // -------------------------------------------
        }
    },

    buildLibraryUI: function () {
        const container = this.dom.themeGrid; container.innerHTML = '';
        this.themes.forEach(t => {
            const tile = document.createElement('div');
            tile.className = `theme-tile ${t.id === this.state.activeThemeId ? 'active' : ''}`;
            tile.innerHTML = `<span>${t.name}</span>`;
            tile.onclick = () => { this.loadTheme(t.id); this.buildLibraryUI(); };
            container.appendChild(tile);
        });
        
        // Trigger scroll update after building so the arrow appears if needed
        setTimeout(() => {
            if(this.updateScrollIndicator) this.updateScrollIndicator();
        }, 100);
    },

    updateSetting: function (themeId, key, value) {
        if (!this.state.themeSettings[themeId]) this.state.themeSettings[themeId] = {};
        this.state.themeSettings[themeId][key] = value;
        this.saveState();
        if (this.currentThemeObj.onSettingsChange) {
            this.currentThemeObj.onSettingsChange(key, value);
        }
    },

    toggleDrawer: function (type) {
        const lib = this.dom.libraryDrawer, set = this.dom.settingsDrawer;
        if (type === 'library') { lib.classList.add('active'); set.classList.remove('active'); }
        else { set.classList.add('active'); lib.classList.remove('active'); }
        this.dom.sessionPanel.classList.remove('active');

        // ---  Scroll to active theme when library opens ---
        if (type === 'library' && this.dom.libraryDrawer.classList.contains('active')) {
            // Slight timeout ensures the drawer is visible before calculating scroll position
            setTimeout(() => {
                const activeTile = this.dom.themeGrid.querySelector('.theme-tile.active');
                if (activeTile) {
                    activeTile.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150); 
        }
        

    },

    closeDrawers: function () {
        this.dom.libraryDrawer.classList.remove('active');
        this.dom.settingsDrawer.classList.remove('active');
    },

    // IMPORTANT NOTE, DO NOT DELETE THIS NOTE, THE REASON FOR TWO SET OF FUNCTIONS IN FULLSCREEN 
    // AND EXIT FULL SCREEN FUNCTION IS TO MAKE SURE IT WORKS BOTH ON MOBILE AND DESKTOP, 
    // IT DIDN'T BEFORE I HAD TO DO THIS, THE MINOR ERROR IT CAUSES IS OK DO NOT TOUCH THIS FUNCTION
    enterFullscreen: function () {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen-mode');
        this.closeDrawers();
        // Just apply the CSS, no browser API call
        document.body.classList.add('fullscreen-mode');
        this.closeDrawers();

        // --- NEW: Start the idle timer immediately ---
        this.resetIdleTimer();
    },

    exitFullscreen: function () { 
        // Just remove the CSS, no browser API call
        if (document.exitFullscreen) document.exitFullscreen();
        document.body.classList.remove('fullscreen-mode'); 

        // --- NEW: Clean up timer and ensure button is visible ---
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.dom.btnExitFs.classList.remove('idle-hidden');

    },



        //The PIP function


           togglePiP: async function () {
        // 1. ELECTRON NATIVE PIP (Preserved)
        if (typeof require !== 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('toggle-pip');
            return;
        }

        // 2. MODERN DOCUMENT PIP API (Replaces old Canvas hack)
        
        // If PiP is already open, close it
        if (window.documentPictureInPicture && window.documentPictureInPicture.window) {
            window.documentPictureInPicture.window.close();
            return;
        }

        // Check if the browser supports Document PiP
        if (!('documentPictureInPicture' in window)) {
            alert("Your browser doesn't support Document PiP. Try a modern Chromium browser like Chrome/Edge 116+ on Desktop.");
            return;
        }

        try {
            // Request the PiP window
            const pipWindow = await documentPictureInPicture.requestWindow({
                width: 350,
                height: 250,
            });

            // Copy all CSS styles and fonts from the main window to the PiP window
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    // For local stylesheets
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    // For external stylesheets (like Google Fonts) that have CORS restrictions
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            // Move the main stage into the PiP window
            const stageElement = this.dom.stage;
            const originalParent = stageElement.parentNode;
            
            // Add a class to the body so you can apply PiP-specific CSS if needed
            pipWindow.document.body.classList.add('is-pip-mode');
            
            // Move the element
            pipWindow.document.body.appendChild(stageElement);

            // When the PiP window is closed, move the stage back to the main window
            pipWindow.addEventListener('pagehide', () => {
                originalParent.appendChild(stageElement);
            });

        } catch (error) {
            console.error("Failed to open Document PiP:", error);
        }
    },




    formatTime: function (ms) {
        const s = Math.floor(ms / 1000);
        return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(v => String(v).padStart(2,'0')).join(':');
    },

    startClock: function () { setInterval(() => this.tick(), 1000); },

    tick: function () {
        let h, m, s;

        // MODE 1: STOPWATCH MODE (And Session is Active)
        if (this.state.stopwatchMode && this.session.active) {
            const elapsed = Date.now() - this.session.startTime;
            const totalSeconds = Math.floor(elapsed / 1000);
            
            h = Math.floor(totalSeconds / 3600);
            m = Math.floor((totalSeconds % 3600) / 60);
            s = totalSeconds % 60;
        } 
        // MODE 2: STOPWATCH MODE (But Session is Paused/Stopped)
        else if (this.state.stopwatchMode && !this.session.active) {
            h = 0; m = 0; s = 0;
        }
        // MODE 3: STANDARD CLOCK MODE
        else {
            const now = new Date();
            h = now.getHours();
            m = now.getMinutes();
            s = now.getSeconds();
        }

        // Format strings (00, 01, etc.)
        const timeObj = {
            h: String(h).padStart(2, '0'),
            m: String(m).padStart(2, '0'),
            s: String(s).padStart(2, '0')
        };

        // Send to Theme
        this.currentThemeObj?.update(timeObj);

                // Always update the footer timer separately (logic remains same)
        if (this.session.active) {
            const currentElapsed = Date.now() - this.session.startTime;
            this.dom.sessionTimer.innerText = this.formatTime(currentElapsed);

            // --- NEW: 2-Hour Auto-Reset Check ---
            if (currentElapsed >= 7200000) { 
                this.handleSessionClick(); // 1st call: Stops the session and saves to 'Finished' state
                this.handleSessionClick(); // 2nd call: Completely wipes and resets back to 00:00:00
            }
        }

    },

    saveState: function () { localStorage.setItem('meditation_os_state', JSON.stringify(this.state)); },
    loadState: function () {
        const s = localStorage.getItem('meditation_os_state');
        if (s) this.state = { ...this.state, ...JSON.parse(s) };
    },

    initSecretFeatures: function () {
        const modal = document.getElementById('secret-modal');
        const btnClose = document.getElementById('btn-close-secret');
        const btnSubmit = document.getElementById('btn-secret-submit');
        const inputUser = document.getElementById('secret-username');
        const inputDuration = document.getElementById('secret-duration');
        const msg = document.getElementById('secret-msg');

        if (!modal) return;

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'm' || e.key === 'M')) {
                e.preventDefault();
                this.openSecretModal();
            }
        });

        if (this.dom.userInput) {
            this.dom.userInput.addEventListener('input', (e) => {
                if (e.target.value.toUpperCase() === 'MANUALINPUT') {
                    e.target.value = localStorage.getItem('meditation_user') || '';
                    this.openSecretModal();
                }
            });
        }

        btnClose.onclick = () => modal.classList.remove('active');
        btnSubmit.onclick = () => {
            const user = inputUser.value.trim() || 'ANONYMOUS';
            const mins = parseInt(inputDuration.value);
            if (!mins || mins <= 0) { msg.innerText = "INVALID DURATION"; return; }
            
            msg.innerText = "UPLOADING...";
            fetch(this.API_URL, {
                method: 'POST', mode: 'no-cors',
                body: JSON.stringify({ username: user, duration: (mins * 60) + 1 })
            }).then(() => {
                msg.innerText = "SAVED ✓";
                setTimeout(() => modal.classList.remove('active'), 1000);
            });
        };
    },

    openSecretModal: function () {
        const modal = document.getElementById('secret-modal');
        if (modal) {
            modal.classList.add('active');
            const savedUser = localStorage.getItem('meditation_user');
            if (savedUser) document.getElementById('secret-username').value = savedUser;
        }
    },


    resetIdleTimer: function () {
        const exitBtn = this.dom.btnExitFs; 
        if (!exitBtn) return;

        // 1. Instantly show the button when user interacts
        exitBtn.classList.remove('idle-hidden');

        // 2. Clear the old timer
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }

        // 3. If we are in fullscreen, start the countdown to hide it again
        if (document.body.classList.contains('fullscreen-mode')) {
            this.idleTimer = setTimeout(() => {
                exitBtn.classList.add('idle-hidden');
            }, 2500);
        }
    },


    

};


Engine.init();
