window.ActiveTheme = {
    settingsConfig: {
        zoom: {
            label: "Clock Zoom",
            type: "range",
            min: 0.6,
            max: 1.4,
            step: 0.01,
            default: 1
        },
        palette: {
            label: "Color Theme",
            type: "palette",
            options: ["aurora", "midnight", "golden", "onyx"],
            default: "aurora"
        }
    },

    init(stage, savedSettings = {}) {
        this.settings = {
            zoom: savedSettings.zoom || 1,
            palette: savedSettings.palette || "aurora"
        };

        stage.innerHTML = `
            <div id="flipclock-container" class="flipclock ${this.settings.palette}">
                <div class="flip-card" id="h">00</div>
                <div class="flip-card" id="m">00</div>
                <div class="flip-card" id="s">00</div>
            </div>
        `;

        this.container = stage.querySelector("#flipclock-container");
        this.cards = {
            h: stage.querySelector("#h"),
            m: stage.querySelector("#m"),
            s: stage.querySelector("#s"),
        };

        this.applyZoom();
    },

    update(time) {
        // Simple text update – optionally can add a small animation
        for (const [unit, value] of Object.entries(time)) {
            const card = this.cards[unit];
            if (card.innerText !== value) {
                card.classList.add("flip");
                setTimeout(() => {
                    card.innerText = value;
                    card.classList.remove("flip");
                }, 300);
            }
        }
    },

    onSettingsChange(key, value) {
        this.settings[key] = value;
        if (key === "zoom") this.applyZoom();
        if (key === "palette") this.updatePalette();
    },

    applyZoom() {
        this.container.style.transform = `scale(${this.settings.zoom})`;
    },

    updatePalette() {
        this.container.className = `flipclock ${this.settings.palette}`;
    },

    destroy() {
        // nothing special yet
    }
};
