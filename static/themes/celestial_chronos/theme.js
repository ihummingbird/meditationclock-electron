window.ActiveTheme = {
    els: {},
    animationFrame: null,

    settingsConfig: {
        zoom: {
            type: 'range',
            label: 'Clock Size',
            default: 100,
            min: 70,
            max: 130,
            displaySuffix: '%'
        },
        accentColor: {
            type: 'palette',
            label: 'Accent Color',
            default: '#d4af37',
            options: ['#d4af37', '#c0c0c0', '#b76e79', '#50c878', '#e6e6fa', '#87ceeb']
        },
        smoothSeconds: {
            type: 'select',
            label: 'Second Hand',
            default: 'tick',
            options: [
                { value: 'tick', text: 'Classic Tick' },
                { value: 'smooth', text: 'Smooth Sweep' }
            ]
        }
    },

    init(stage, savedSettings = {}) {
        this.destroy();

        // Inject font
        this.injectLink('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Cinzel:wght@400;500&display=swap');

        stage.innerHTML = this.template();
        this.cache(stage);

        // Apply saved settings
        const zoom = savedSettings.zoom || 100;
        const accent = savedSettings.accentColor || '#d4af37';
        const smoothMode = savedSettings.smoothSeconds || 'tick';

        this.applyZoom(zoom);
        this.applyAccent(accent);
        this.applySmoothMode(smoothMode);

        // Start smooth animation if needed
        if (smoothMode === 'smooth') {
            this.startSmoothAnimation();
        }
    },

    update() {
        if (!this.els.hourHand) return;

        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Calculate rotation angles
        // Hour hand: 360° / 12 hours = 30° per hour, plus minute contribution
        const hourAngle = (hours * 30) + (minutes * 0.5);

        // Minute hand: 360° / 60 minutes = 6° per minute
        const minuteAngle = (minutes * 6) + (seconds * 0.1);

        // Second hand: 360° / 60 seconds = 6° per second
        let secondAngle;
        if (this.smoothMode === 'smooth') {
            secondAngle = (seconds * 6) + (milliseconds * 0.006);
        } else {
            secondAngle = seconds * 6;
        }

        // Apply rotations
        this.els.hourHand.style.transform = `rotate(${hourAngle}deg)`;
        this.els.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        this.els.secondHand.style.transform = `rotate(${secondAngle}deg)`;

        // Update date display
        if (this.els.dateText) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

            this.els.dateText.textContent = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
        }

        if (this.els.timeText) {
            const h = now.getHours();
            const period = h >= 12 ? 'PM' : 'AM';
            const displayHour = h % 12 || 12;
            this.els.timeText.textContent = `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
        }
    },

    startSmoothAnimation() {
        const animate = () => {
            this.update();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    },

    stopSmoothAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },

    onSettingsChange(key, val) {
        if (key === 'zoom') this.applyZoom(val);
        if (key === 'accentColor') this.applyAccent(val);
        if (key === 'smoothSeconds') this.applySmoothMode(val);
    },

    applyZoom(val) {
        if (this.els.wrapper) {
            const scale = val / 100;
            this.els.wrapper.style.transform = `scale(${scale})`;
        }
    },

    applyAccent(color) {
        if (!this.els.root) return;

        // Calculate lighter version
        const lightColor = this.lightenColor(color, 30);
        const glowColor = color + '80'; // 50% opacity

        this.els.root.style.setProperty('--gold', color);
        this.els.root.style.setProperty('--gold-light', lightColor);
        this.els.root.style.setProperty('--gold-glow', glowColor);
    },

    applySmoothMode(mode) {
        this.smoothMode = mode;

        if (this.els.secondHand) {
            if (mode === 'smooth') {
                this.els.secondHand.classList.add('smooth');
                this.startSmoothAnimation();
            } else {
                this.els.secondHand.classList.remove('smooth');
                this.stopSmoothAnimation();
            }
        }
    },

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    },

    destroy() {
        this.stopSmoothAnimation();
        document.getElementById('theme-font-link')?.remove();
        this.els = {};
    },

    injectLink(href) {
        if (document.getElementById('theme-font-link')) return;
        const link = document.createElement('link');
        link.id = 'theme-font-link';
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    },

    cache(stage) {
        this.els = {
            root: stage.querySelector('#clock-root'),
            wrapper: stage.querySelector('.clock-wrapper'),
            hourHand: stage.querySelector('.hour-hand'),
            minuteHand: stage.querySelector('.minute-hand'),
            secondHand: stage.querySelector('.second-hand'),
            dateText: stage.querySelector('.date-text'),
            timeText: stage.querySelector('.time-text')
        };
    },

    template() {
        // Generate hour markers and numerals
        const markers = [];
        const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

        for (let i = 0; i < 60; i++) {
            const angle = i * 6;
            const isMajor = i % 5 === 0;
            markers.push(`<div class="marker ${isMajor ? 'major' : ''}" style="transform: translateX(-50%) rotate(${angle}deg)"></div>`);
        }

        // Position numerals
        const numeralHTML = numerals.map((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const radius = 38; // % from center
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return `<div class="numeral" style="left: ${x}%; top: ${y}%">${num}</div>`;
        }).join('');

        return `
            <!-- Background Layer -->
            <div id="celestial-bg">
                <div class="stars-layer"></div>
                <div class="stars-layer-2"></div>
                <div class="aurora"></div>
            </div>
            
            <!-- Clock Layer -->
            <div id="clock-root">
                <div class="clock-wrapper">
                    <div class="clock-face">
                        <!-- Hour Markers -->
                        <div class="markers">
                            ${markers.join('')}
                        </div>
                        
                        <!-- Roman Numerals -->
                        ${numeralHTML}
                        
                        <!-- Moon Phase (Decorative) -->
                        <div class="moon-phase"></div>
                        
                        <!-- Clock Hands -->
                        <div class="hands-container">
                            <div class="hand hour-hand"></div>
                            <div class="hand minute-hand"></div>
                            <div class="hand second-hand"></div>
                            <div class="center-cap"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Date Display -->
                <div class="date-display">
                    <div class="date-text">Loading...</div>
                    <div class="time-text"></div>
                </div>
            </div>
        `;
    }
};
