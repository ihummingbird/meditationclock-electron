window.ActiveTheme = {
    els: {},
    startTime: Date.now(),
    batteryAPI: null,
    systemInfo: {},
    streamIntervals: [],

    settingsConfig: {
        hue: {
            type: 'palette',
            label: 'Color',
            default: 195,
            options: [195, 220, 170, 280, 30, 340]
        },
        scale: {
            type: 'range',
            label: 'Size',
            default: 100,
            min: 65,
            max: 120,
            displaySuffix: '%'
        },
        glitch: {
            type: 'select',
            label: 'Glitch FX',
            default: 'on',
            options: [
                { value: 'on', text: 'Enabled' },
                { value: 'off', text: 'Disabled' }
            ]
        }
    },

    init: function (stage, settings) {
        const s = settings || {};
        this.collectSystemInfo();
        this.isMobile = window.innerWidth <= 750 || ('ontouchstart' in window && window.innerWidth <= 1024);

        stage.innerHTML = `
            <div class="ds-stage" id="ds-root">
                <div class="ds-grid-bg"></div>
                <div class="ds-stream ds-stream-left" id="ds-stream-l"></div>
                <div class="ds-stream ds-stream-right" id="ds-stream-r"></div>

                <div class="ds-hud" id="ds-hud">
                    <!-- CENTER CLOCK -->
                    <div class="ds-panel ds-clock-panel">
                        <div class="ds-glitch-wrap" id="ds-glitch" data-text="00:00">
                            <div class="ds-time-huge" id="ds-time">00:00</div>
                        </div>
                        <div class="ds-time-ms" id="ds-ms">.000</div>
                        <div class="ds-date-row" id="ds-date">---</div>
                    </div>

                    <!-- 4 COL INFO GRID -->
                    <div class="ds-info-grid">
                        <!-- SYSTEM -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">System <span class="ds-live"></span></div>
                            <div id="ds-p-sys"></div>
                        </div>
                        <!-- DISPLAY -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Display <span class="ds-live"></span></div>
                            <div id="ds-p-disp"></div>
                        </div>
                        <!-- NETWORK -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Network <span class="ds-live"></span></div>
                            <div id="ds-p-net"></div>
                        </div>
                        <!-- POWER -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Power <span class="ds-live"></span></div>
                            <div id="ds-p-bat"></div>
                            <div class="ds-battery-bar"><div class="ds-battery-fill" id="ds-bat-fill" style="width:0%"></div></div>
                        </div>
                    </div>

                    <!-- 4 COL INFO GRID ROW 2 -->
                    <div class="ds-info-grid">
                        <!-- PERFORMANCE -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Performance</div>
                            <div id="ds-p-perf"></div>
                        </div>
                        <!-- CLIENT -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Client</div>
                            <div id="ds-p-client"></div>
                        </div>
                        <!-- TIMEZONE -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Timezone</div>
                            <div id="ds-p-tz"></div>
                        </div>
                        <!-- SECURITY -->
                        <div class="ds-panel">
                            <div class="ds-panel-label">Security</div>
                            <div id="ds-p-sec"></div>
                        </div>
                    </div>

                    <!-- STATUS BAR -->
                    <div class="ds-panel ds-status-bar" id="ds-status-bar"></div>

                    <!-- BOTTOM BAR -->
                    <div class="ds-panel ds-bottom-bar">
                        <div>
                            <span class="ds-label">SESSION </span>
                            <span class="ds-val" id="ds-session">00:00:00</span>
                        </div>
                        <div>
                            <span class="ds-label">UPTIME </span>
                            <span class="ds-val" id="ds-uptime">00:00:00</span>
                        </div>
                        <div>
                            <span class="ds-label">FPS </span>
                            <span class="ds-val" id="ds-fps">--</span>
                        </div>
                        <div>
                            <span class="ds-label">TICKS </span>
                            <span class="ds-val" id="ds-ticks">0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.els = {
            stage: stage.querySelector('.ds-stage'),
            hud: document.getElementById('ds-hud'),
            glitch: document.getElementById('ds-glitch'),
            time: document.getElementById('ds-time'),
            ms: document.getElementById('ds-ms'),
            date: document.getElementById('ds-date'),
            pSys: document.getElementById('ds-p-sys'),
            pDisp: document.getElementById('ds-p-disp'),
            pNet: document.getElementById('ds-p-net'),
            pBat: document.getElementById('ds-p-bat'),
            batFill: document.getElementById('ds-bat-fill'),
            pPerf: document.getElementById('ds-p-perf'),
            pClient: document.getElementById('ds-p-client'),
            pTz: document.getElementById('ds-p-tz'),
            pSec: document.getElementById('ds-p-sec'),
            statusBar: document.getElementById('ds-status-bar'),
            session: document.getElementById('ds-session'),
            uptime: document.getElementById('ds-uptime'),
            fps: document.getElementById('ds-fps'),
            ticks: document.getElementById('ds-ticks'),
            streamL: document.getElementById('ds-stream-l'),
            streamR: document.getElementById('ds-stream-r')
        };

        this.applyHue(s.hue ?? this.settingsConfig.hue.default);
        this.applyScale(s.scale ?? (this.isMobile ? 80 : this.settingsConfig.scale.default));
        const glitchVal = s.glitch ?? this.settingsConfig.glitch.default;
        this.applyGlitch(this.isMobile ? 'off' : glitchVal);

        this.renderAllPanels();
        this.renderStatusBar();
        this.startStreams();
        this.startTick();
        this.initBattery();
        this.startFPS();
    },

    collectSystemInfo: function () {
        const nav = window.navigator;
        const scr = window.screen;
        const info = {};

        info.resolution = scr.width + 'x' + scr.height;
        info.availRes = scr.availWidth + 'x' + scr.availHeight;
        info.dpr = window.devicePixelRatio || 1;
        info.colorDepth = scr.colorDepth + 'bit';
        info.orientation = scr.orientation ? scr.orientation.type : 'N/A';

        info.cores = nav.hardwareConcurrency || 'N/A';
        info.memory = nav.deviceMemory ? nav.deviceMemory + ' GB' : 'N/A';
        info.touch = nav.maxTouchPoints > 0 ? 'Yes (' + nav.maxTouchPoints + ')' : 'No';

        info.language = nav.language || 'N/A';
        info.languages = nav.languages ? nav.languages.slice(0, 3).join(', ') : 'N/A';
        info.cookies = nav.cookieEnabled;
        info.doNotTrack = nav.doNotTrack;
        info.javaEnabled = typeof nav.javaEnabled === 'function' ? nav.javaEnabled() : false;
        info.maxPointers = nav.maxTouchPoints || 0;

        if (nav.connection) {
            info.netType = nav.connection.effectiveType || nav.connection.type || 'N/A';
            info.netDown = nav.connection.downlink ? nav.connection.downlink + ' Mbps' : 'N/A';
            info.netUp = nav.connection.uplink ? nav.connection.uplink + ' Mbps' : 'N/A';
            info.netRtt = nav.connection.rtt != null ? nav.connection.rtt + 'ms' : 'N/A';
            info.netSave = nav.connection.saveData;
        }

        info.platform = nav.platform || 'N/A';
        info.product = nav.product || 'N/A';
        info.vendor = nav.vendor || 'N/A';
        info.online = nav.onLine;
        info.secureContext = window.isSecureContext;

        // User agent parsing
        const ua = nav.userAgent || '';
        info.browser = this.parseBrowser(ua);
        info.os = this.parseOS(ua);

        // Memory
        if (performance.memory) {
            info.jsHeapUsed = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
            info.jsHeapTotal = (performance.memory.totalJSHeapSize / 1048576).toFixed(1);
            info.jsHeapLimit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0);
        }

        // Timezone
        info.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A';
        info.tzOffset = new Date().getTimezoneOffset();
        const offsetH = Math.abs(Math.floor(info.tzOffset / 60));
        const offsetM = Math.abs(info.tzOffset % 60);
        info.tzStr = (info.tzOffset <= 0 ? '+' : '-') + String(offsetH).padStart(2, '0') + ':' + String(offsetM).padStart(2, '0');

        // Storage estimate
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(est => {
                this.systemInfo.storageUsed = (est.usage / 1048576).toFixed(1);
                this.systemInfo.storageQuota = (est.quota / 1048576).toFixed(0);
                this.updatePanel('perf');
            });
        }

        this.systemInfo = info;
    },

    parseBrowser: function (ua) {
        if (ua.includes('Firefox/')) return 'Firefox ' + ua.split('Firefox/')[1].split(' ')[0];
        if (ua.includes('Edg/')) return 'Edge ' + ua.split('Edg/')[1].split(' ')[0];
        if (ua.includes('OPR/')) return 'Opera ' + ua.split('OPR/')[1].split(' ')[0];
        if (ua.includes('Chrome/')) return 'Chrome ' + ua.split('Chrome/')[1].split(' ')[0];
        if (ua.includes('Safari/') && ua.includes('Version/')) return 'Safari ' + ua.split('Version/')[1].split(' ')[0];
        return 'Unknown';
    },

    parseOS: function (ua) {
        if (ua.includes('Windows NT 10')) return 'Windows 10/11';
        if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac OS X')) return 'macOS ' + (ua.split('Mac OS X ')[1] || '').split(';')[0].replace(/_/g, '.');
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android ' + (ua.split('Android ')[1] || '').split(';')[0];
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        return 'Unknown';
    },

    renderAllPanels: function () {
        const i = this.systemInfo;
        const rows = (arr) => arr.map(r =>
            `<div class="ds-info-row"><span class="ds-info-key">${r[0]}</span><span class="ds-info-val${r[2] ? ' ' + r[2] : ''}">${r[1]}</span></div>`
        ).join('');

        if (this.els.pSys) this.els.pSys.innerHTML = rows([
            ['CPU', i.cores + ' cores'],
            ['RAM', i.memory],
            ['GPU', i.dpr + 'x DPR'],
            ['Platform', i.platform.substring(0, 14)],
            ['Touch', i.touch]
        ]);

        if (this.els.pDisp) this.els.pDisp.innerHTML = rows([
            ['Res', i.resolution],
            ['Avail', i.availRes],
            ['Depth', i.colorDepth],
            ['Orient', i.orientation],
            ['DPR', i.dpr + 'x']
        ]);

        if (this.els.pNet) this.els.pNet.innerHTML = rows([
            ['Status', i.online ? '● ONLINE' : '○ OFFLINE', i.online ? 'good' : 'bad'],
            ['Type', i.netType || 'N/A'],
            ['↓ Down', i.netDown || 'N/A'],
            ['↑ Up', i.netUp || 'N/A'],
            ['RTT', i.netRtt || 'N/A']
        ]);

        if (this.els.pClient) this.els.pClient.innerHTML = rows([
            ['Browser', i.browser],
            ['OS', i.os],
            ['Lang', i.language],
            ['Vendor', i.vendor.substring(0, 12)]
        ]);

        if (this.els.pTz) this.els.pTz.innerHTML = rows([
            ['Zone', i.tz.split('/').pop().replace(/_/g, ' ')],
            ['Full', i.tz.substring(0, 18)],
            ['Offset', 'UTC' + i.tzStr],
            ['DST', i.tzOffset !== new Date(i.tz).getTimezoneOffset() ? 'Yes' : 'No']
        ]);

        if (this.els.pSec) this.els.pSec.innerHTML = rows([
            ['Secure', i.secureContext ? 'Yes' : 'No', i.secureContext ? 'good' : 'warn'],
            ['Cookies', i.cookies ? 'On' : 'Off'],
            ['DNT', i.doNotTrack || 'Off'],
            ['Java', i.javaEnabled ? 'Yes' : 'No']
        ]);

        this.updatePanel('perf');
        this.updatePanel('bat');
    },

    updatePanel: function (name) {
        const i = this.systemInfo;
        const rows = (arr) => arr.map(r =>
            `<div class="ds-info-row"><span class="ds-info-key">${r[0]}</span><span class="ds-info-val${r[2] ? ' ' + r[2] : ''}">${r[1]}</span></div>`
        ).join('');

        if (name === 'perf' && this.els.pPerf) {
            const rows2 = [['Heap', (i.jsHeapUsed || '--') + ' / ' + (i.jsHeapTotal || '--') + ' MB']];
            if (i.storageUsed) rows2.push(['Storage', i.storageUsed + ' / ' + i.storageQuota + ' MB']);
            if (i.jsHeapLimit) rows2.push(['Limit', i.jsHeapLimit + ' MB']);
            rows2.push(['DOM', document.querySelectorAll('*').length + ' nodes']);
            this.els.pPerf.innerHTML = rows(rows2);
        }

        if (name === 'bat' && this.els.pBat) {
            this.els.pBat.innerHTML = rows([
                ['Status', 'Detecting...'],
                ['Level', '--'],
                ['Est.', '--']
            ]);
        }
    },

    updateBatteryUI: function (b) {
        if (!this.els.pBat) return;
        const lvl = Math.round(b.level * 100);
        const ch = b.charging;
        let eta = '--';

        if (ch && b.chargingTime && b.chargingTime < Infinity) {
            eta = Math.floor(b.chargingTime / 3600) + 'h ' + Math.floor((b.chargingTime % 3600) / 60) + 'm';
        } else if (!ch && b.dischargingTime && b.dischargingTime < Infinity) {
            eta = Math.floor(b.dischargingTime / 3600) + 'h ' + Math.floor((b.dischargingTime % 3600) / 60) + 'm';
        }

        const rows = (arr) => arr.map(r =>
            `<div class="ds-info-row"><span class="ds-info-key">${r[0]}</span><span class="ds-info-val${r[2] ? ' ' + r[2] : ''}">${r[1]}</span></div>`
        ).join('');

        this.els.pBat.innerHTML = rows([
            ['Status', ch ? '⚡ CHARGING' : 'BATTERY', ch ? 'good' : ''],
            ['Level', lvl + '%'],
            ['Est', eta]
        ]);

        this.els.batFill.style.width = lvl + '%';
        this.els.batFill.className = 'ds-battery-fill' + (lvl < 20 ? ' low' : '');
    },

    initBattery: function () {
        if (!('getBattery' in navigator)) return;
        navigator.getBattery().then(b => {
            this.batteryAPI = b;
            this.updateBatteryUI(b);
            b.addEventListener('levelchange', () => this.updateBatteryUI(b));
            b.addEventListener('chargingchange', () => this.updateBatteryUI(b));
        }).catch(() => {});
    },

    renderStatusBar: function () {
        if (!this.els.statusBar) return;
        const i = this.systemInfo;
        const items = this.isMobile
            ? [i.resolution, i.dpr + 'x DPR', i.netType.toUpperCase(), i.secureContext ? 'HTTPS' : 'HTTP']
            : [i.resolution, i.colorDepth, i.dpr + 'x DPR', i.cores + ' CORES', i.netType.toUpperCase(), i.cookies ? 'COOKIES' : 'NO COOKIES', i.secureContext ? 'HTTPS' : 'HTTP'];
        this.els.statusBar.innerHTML = items.map(t =>
            `<span class="ds-status-item"><span class="ds-dot"></span>${t}</span>`
        ).join('');
    },

    startStreams: function () {
        const chars = '01アイウエオカキクケコサシスセソタチツテト';
        const isMobile = this.isMobile;
        [this.els.streamL, this.els.streamR].forEach(el => {
            if (!el) return;
            const count = isMobile ? 6 : 14;
            for (let c = 0; c < count; c++) {
                const sp = document.createElement('span');
                sp.className = 'ds-stream-char';
                sp.textContent = chars[Math.floor(Math.random() * chars.length)];
                sp.style.left = (c * 1.2) + 'px';
                sp.style.animationDuration = (4 + Math.random() * 6) + 's';
                sp.style.animationDelay = -(Math.random() * 10) + 's';
                sp.style.fontSize = (7 + Math.random() * 3) + 'px';
                el.appendChild(sp);
            }
            const cycleMs = isMobile ? 400 : 200;
            const iv = setInterval(() => {
                el.querySelectorAll('.ds-stream-char').forEach(s => {
                    if (Math.random() > 0.7) {
                        s.textContent = chars[Math.floor(Math.random() * chars.length)];
                    }
                });
            }, cycleMs);
            this.streamIntervals.push(iv);
        });
    },

    startTick: function () {
        this._tickCount = 0;
        const tickMs = this.isMobile ? 50 : 33;
        this._interval = setInterval(() => this.tick(), tickMs);
        this.tick();
    },

    stopTick: function () {
        if (this._interval) { clearInterval(this._interval); this._interval = null; }
        this.streamIntervals.forEach(iv => clearInterval(iv));
        this.streamIntervals = [];
    },

    tick: function () {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        this._tickCount++;

        if (this.els.time) {
            const timeStr = h + ':' + m;
            this.els.time.textContent = timeStr;
            if (this.els.glitch) this.els.glitch.setAttribute('data-text', timeStr);
        }
        if (this.els.ms) this.els.ms.textContent = ':' + s + '.' + ms;

        if (this.els.date) {
            const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const yr = now.getFullYear();
            const wk = this.getWeekNumber(now);
            this.els.date.innerHTML =
                `<span class="ds-day">${days[now.getDay()]}</span> · ${months[now.getMonth()]} ${now.getDate()}, ${yr} · WK ${wk}`;
        }

        if (this.els.uptime) {
            const t = Math.floor((Date.now() - this.startTime) / 1000);
            this.els.uptime.textContent = this.fmt(t);
        }

        if (this.els.session && typeof Engine !== 'undefined') {
            const se = Engine.session;
            if (se.active) {
                this.els.session.textContent = this.fmt(Math.floor((Date.now() - se.startTime) / 1000));
                this.els.session.classList.add('ds-session-active');
            } else if (se.finished && se.elapsed) {
                this.els.session.textContent = this.fmt(Math.floor(se.elapsed / 1000));
                this.els.session.classList.remove('ds-session-active');
            } else {
                this.els.session.textContent = '00:00:00';
                this.els.session.classList.remove('ds-session-active');
            }
        }

        if (this.els.ticks) this.els.ticks.textContent = this._tickCount.toLocaleString();
    },

    fmt: function (sec) {
        return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
            .map(v => String(v).padStart(2, '0')).join(':');
    },

    getWeekNumber: function (d) {
        const onejan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    },

    startFPS: function () {
        let frames = 0;
        let last = performance.now();
        const loop = () => {
            frames++;
            const now = performance.now();
            if (now - last >= 1000) {
                if (this.els.fps) this.els.fps.textContent = frames;
                frames = 0;
                last = now;
            }
            this._fpsRAF = requestAnimationFrame(loop);
        };
        this._fpsRAF = requestAnimationFrame(loop);
    },

    update: function () {},

    applyHue: function (val) {
        const h = Number(val);
        const el = this.els.stage;
        if (!el) return;
        el.style.setProperty('--ds-hue', h);
        el.style.setProperty('--ds-blue', `hsl(${h}, 100%, 60%)`);
        el.style.setProperty('--ds-blue-dim', `hsla(${h}, 100%, 60%, 0.4)`);
        el.style.setProperty('--ds-blue-glow', `hsla(${h}, 100%, 60%, 0.15)`);
        el.style.setProperty('--ds-border', `hsla(${h}, 100%, 60%, 0.2)`);
        el.style.setProperty('--ds-bg', `hsla(${h}, 80%, 4%, 0.7)`);
    },

    applyScale: function (val) {
        let v = Number(val);
        if (this.isMobile && v > 100) v = 100;
        if (this.els.hud) this.els.hud.style.transform = `scale(${v / 100})`;
    },

    applyGlitch: function (val) {
        if (this.els.glitch) {
            this.els.glitch.style.setProperty('--ds-glitch', val === 'on' ? '1' : '0');
            const before = this.els.glitch.querySelector('.ds-time-huge');
            if (before) {
                before.style.textShadow = val === 'on'
                    ? '0 0 20px var(--ds-blue-glow), 0 0 60px var(--ds-blue-glow), 0 0 120px rgba(0,212,255,0.08)'
                    : '0 0 30px var(--ds-blue-glow)';
            }
            // Toggle pseudo-elements visibility
            this.els.glitch.style.animation = val === 'on' ? '' : 'none';
        }
        // Override the glitch pseudo-element animations
        const styleId = 'ds-glitch-disable';
        let styleEl = document.getElementById(styleId);
        if (val === 'off') {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = '.ds-glitch-wrap::before, .ds-glitch-wrap::after { animation: none !important; opacity: 0 !important; }';
        } else if (styleEl) {
            styleEl.remove();
        }
    },

    onSettingsChange: function (key, val) {
        if (key === 'hue') this.applyHue(val);
        if (key === 'scale') this.applyScale(val);
        if (key === 'glitch') this.applyGlitch(val);
    },

    destroy: function () {
        this.stopTick();
        if (this._fpsRAF) cancelAnimationFrame(this._fpsRAF);
        const styleEl = document.getElementById('ds-glitch-disable');
        if (styleEl) styleEl.remove();
        if (this.batteryAPI) this.batteryAPI = null;
        this.els = {};
        this.isMobile = false;
    }
};
