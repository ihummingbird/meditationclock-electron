// face-animation.js

/* ===========================================================
   Herman — expressions + scene-based personality engine.
   Content layer. logic.js is the engine.

   Scenes drive the face via the engine API:
     f.setExpression(name, dur)  f.lookAt(x, y)  f.releaseGaze()
     f.doubleBlink(now)  f.triggerBlink(now)  f.say(ms)

   NOTE: nod / shake / bounce (whole-face translation gestures)
   were removed — they caused the unnatural repetitive motion.
=========================================================== */


const GREETINGS = {
    morning: [
        "GOOD MORNING %U. ", "RISE AND SHINE %U. ", 
        "MORNING ROUTINE EYY? :D %U.", "MORNING %U. ", 
        "A FRESH START FOR %U TODAY :D", "WAKING UP SYSTEMS... JUST KIDDING HI %U.", 
        "MORNING FOG DETECTED. HOW YOU DOING %U?.", "HELLO %U. LETS GET TO IT.", 
        "EARLY BIRD %U? LETS BEGIN.", "DAYBREAK. READY TO FOCUS %U?", 
        "GOOD MORNING %U. LETS CLEAR DA MIND.", "WELCOME %U. A QUIET MORNING AWAITS.", 
        "HOPE YOU SLEPT WELL %U. BREATHE.", "MORNING BREEZE. LETS RELAX A BIT %U.", 
        "NEW DAY. NEW CALM %U.", "G MORNING %U. ", 
        "SYSTEM ONLINE. HI %U.", "STARTING THE DAY RIGHT %U.", 
        "AWAKE AND READY %U. BREATHE.", "MORNING SUNSHINE :D", 
        "GOOD MORNING %U. LETS GET TO IT.", "FOCUS MODE READY %U. BEGIN.", 
        "A GENTLE START FOR %U.", "MORNING PEACE. WELCOME %U.", 
        "WELCOME BACK %U. BREATHE DEEPLY.", "GOOD MORNING %U. LETS CENTER.", 
        "SUN IS UP. HI %U.", "MORNING CALM ACTIVATED %U.", 
        "HELLO %U. READY TO MEDITATE?", "DAYBREAK. BREATHE WITH ME %U."
    ],
    afternoon: [
        "GOOD AFTERNOON %U. ", "HALFWAY THROUGH THE DAY %U ?", 
        "AFTERNOON BREATHE? ", "GOOD AFTERNOON %U. LETS GET SOME M DONE!", 
        "WELCOME BACK %U. ", "MIDDAY RESET FOR %U.", 
        "LETS KEEP GOING %U. TAKE A BREATH.", "GOOD AFTERNOON. CALM %U.", 
        "AFTERNOON CLARITY FOR %U.", "SYSTEM SYNC. HI %U.", 
        "HEY DAY %U. HOW WAS YOUR MORNING?", "STRESS DETECTED. BREATHE INNNNNN %U.", 
        "GOOD DAY %U. LETS FIND ZE ZEN.", "AFTERNOON BREATHE: %U.", 
        "NEED A BREAK %U? BREATHE.", 
        "STAYING CENTERED IN ZE AFTERNOON %U", "AFTERNOON FOCUS READY %U.", 
        "HALF DAY COMPLETE. HI %U.", "GOOD AFTERNOON %U. LETS SLOW DOWN A BIT.", 
        "RECHARGING THROUGH MIDDAY %U.", "KEEP IT SLOW %U. ", 
        "AFTERNOON STRETCH %U? .", "G AFTERNOON %U.", 
        "WELCOME %U. HOPE YOU HAD A GOOD DAY.", "HELLO %U. LETS FIND STILLNESS NOW.", 
         "AFTERNOON %U. LETS RECENTER.", 
        "LETS TAKE A PAUSE %U AND BREATHE.", "AFTERNOON ZEN FOR %U."
    ],
    evening: [
        "GOOD EVENING %U. UNWIND.", "DAY COMPLETE. RELAX %U.", 
        "GOOD EVENING %U. LET GO.", "EVENING WIND-DOWN READY %U.", 
        "WELCOME TO THE EVENING %U.", "GOOD EVENING. BREATHE %U.", 
        "TIME TO UNWIND %U.", "SETTING SUN. CALM %U.", 
        "EVENING MODE ON %U.", "LET GO OF STRESS %U.", 
        "GOOD EVENING %U. FIND REST.", "SHIFTING TO REST %U.", 
        "EVENING TRANQUILITY FOR %U.", "HELLO %U. EVENING CALM.", 
        "GOOD EVENING %U. SLOW DOWN.", "DAY IS DONE. BREATHE %U.", 
        "EVENING BREEZE. RELAX %U.", "WINDING DOWN %U. GOOD.", 
        "GOOD EVENING. FIND PEACE %U.", "REST SOON %U. BREATHE NOW.", 
        "EVENING STILLNESS FOR %U.", "TWILIGHT MODE. HI %U.", 
        "GOOD EVENING %U. RELEASE TENSION.", "LEAVE STRESS BEHIND %U.", 
        "GOOD EVENING %U. BE CALM.", "SUN SETTING. BREATHE %U.", 
        "EVENING RESET FOR %U.", "HELLO %U. EVENING BREATHE.", 
        "GOOD EVENING %U. LET IT GO.", "DAY ENDS. CALM %U."
    ],
    night: [
        "LATE NIGHT SESSION %U? :P", "BURNING MIDNIGHT OIL %U?", 
        "GOOD NIGHT %U. HOW WAS YOUR DAY?", "LATE SESSION DETECTED %U :P", 
        "ITS LATE %U OR IS IT? :D ", "NIGHTTIME CALM FOR %U.", 
        "QUIET HOURS. WELCOME %U.", "HI THERE %U. CANT SLEEP?", 
        "LATE NIGHT FOCUS %U.", "GOOD NIGHT %U. HOW YA DOING :D", 
        "STILL AWAKE %U? ", "MIDNIGHT BREATHE %U.", 
        "STARLIGHT MODE. HI %U.", "DEEP NIGHT CALM FOR %U.", 
        "SLEEP WILL BE GOOD AFTER THIS WONT IT %U?", "LATE NIGHT %U. ", 
        "GOOD NIGHT %U.", "NIGHT OWL %U? ", 
        "SYSTEM QUIET. HI %U.", "LETS GET SOME LATE NIGHT STILLNESS %U.", 
        "GIGGITY", "MIDNIGHT FOCUS FOR %U.", 
        "GOOD NIGHT %U. ", "TRYING TO KEEP THE STREAK? :D", 
        "QUIET MIND %U. BREATHE.", "HELLO %U. NIGHT BREATHE.", 
        "GOOD NIGHT %U. LETS RELEASE ZE THOUGHTS.", "SLEEP MODE PENDING %U.", 
        "LATE NIGHT CALM %U.", "GOOD NIGHT %U. BREATHE SLOW.", 
        "YOURE GONNA HAVE A GOOD NIGHT SLEEP %U"
    ]
};

const PIXEL_FONT = {
    // Letters
    'A': [0b111,0b101,0b111,0b101,0b101], 'B': [0b110,0b101,0b110,0b101,0b110],
    'C': [0b111,0b100,0b100,0b100,0b111], 'D': [0b110,0b101,0b101,0b101,0b110],
    'E': [0b111,0b100,0b111,0b100,0b111], 'F': [0b111,0b100,0b111,0b100,0b100],
    'G': [0b111,0b100,0b101,0b101,0b111], 'H': [0b101,0b101,0b111,0b101,0b101],
    'I': [0b111,0b010,0b010,0b010,0b111], 'J': [0b001,0b001,0b001,0b101,0b010],
    'K': [0b101,0b110,0b100,0b110,0b101], 'L': [0b100,0b100,0b100,0b100,0b111],
    'M': [0b101,0b111,0b111,0b101,0b101], 'N': [0b101,0b111,0b111,0b111,0b101],
    'O': [0b111,0b101,0b101,0b101,0b111], 'P': [0b111,0b101,0b111,0b100,0b100],
    'Q': [0b111,0b101,0b101,0b111,0b011], 'R': [0b111,0b101,0b111,0b110,0b101],
    'S': [0b111,0b100,0b111,0b001,0b111], 'T': [0b111,0b010,0b010,0b010,0b010],
    'U': [0b101,0b101,0b101,0b101,0b111], 'V': [0b101,0b101,0b101,0b101,0b010],
    'W': [0b101,0b101,0b111,0b111,0b101], 'X': [0b101,0b101,0b010,0b101,0b101],
    'Y': [0b101,0b101,0b010,0b010,0b010], 'Z': [0b111,0b001,0b010,0b100,0b111],
    
    // Numbers
    '0': [0b111,0b101,0b101,0b101,0b111], '1': [0b010,0b110,0b010,0b010,0b111],
    '2': [0b110,0b001,0b010,0b100,0b111], '3': [0b110,0b001,0b010,0b001,0b110],
    '4': [0b101,0b101,0b111,0b001,0b001], '5': [0b111,0b100,0b110,0b001,0b110],
    '6': [0b111,0b100,0b111,0b101,0b111], '7': [0b111,0b001,0b010,0b010,0b010],
    '8': [0b111,0b101,0b111,0b101,0b111], '9': [0b111,0b101,0b111,0b001,0b111],
    
    // Punctuation & Symbols
    ' ': [0b000,0b000,0b000,0b000,0b000], '!': [0b010,0b010,0b010,0b000,0b010],
    '.': [0b000,0b000,0b000,0b000,0b010], ':': [0b000,0b010,0b000,0b010,0b000],
    '?': [0b110,0b001,0b010,0b000,0b010], '-': [0b000,0b000,0b111,0b000,0b000],
    ',': [0b000,0b000,0b000,0b001,0b010], '\'': [0b001,0b001,0b000,0b000,0b000],
    '(': [0b001,0b010,0b010,0b010,0b001], ')': [0b100,0b010,0b010,0b010,0b100],
    '/': [0b001,0b001,0b010,0b100,0b100], '+': [0b000,0b010,0b111,0b010,0b000],
    '=': [0b000,0b111,0b000,0b111,0b000], '#': [0b101,0b111,0b101,0b111,0b101],
    '%': [0b100,0b001,0b010,0b100,0b001], ';': [0b000,0b010,0b000,0b001,0b010],
    '*': [0b000,0b101,0b010,0b101,0b000], '_': [0b000,0b000,0b000,0b000,0b111]
};

const FACE_EXPRESSIONS = {
    neutral:    { eye: 'round',  mouth: 'line' },
    happy:      { eye: 'happy',  mouth: 'smile' },
    joy:        { eye: 'happy',  mouth: 'grin' },
    content:    { eye: 'happy',  mouth: 'cat' },
    excited:    { eye: 'wide',   mouth: 'grin' },
    curious:    { eye: 'wide',   mouth: 'small' },
    surprised:  { eye: 'wide',   mouth: 'o' },
    sad:        { eye: 'round',  mouth: 'frown', eyeScaleY: 0.8 },
    angry:      { eye: 'angry',  mouth: 'small' },
    sleepy:     { eye: 'sleepy', mouth: 'small' },
    suspicious: { eye: 'sleepy', mouth: 'flat' },
    wink:       { eye: 'wink',   mouth: 'smile' },
    dizzy:      { draw: (f, n) => drawDizzy(f, n) },
    yawn:       { draw: (f, n) => drawYawn(f, n) },
    love:       { draw: (f, n) => drawLove(f, n) },
    sleep:      { draw: (f, n) => drawSleep(f, n) },
};

/* ---------------- custom drawers ---------------- */

function drawDizzy(f, now) {
    const cy = f.ROWS * 0.40 + f.breath + f.gy;
    [f.COLS * 0.30, f.COLS * 0.70].forEach((cx) => {
        const rot = now * 0.005;
        for (let a = 0; a < Math.PI * 4; a += 0.4) {
            const r = a * 0.32;
            f.setPx(cx + Math.cos(a + rot) * r, cy + Math.sin(a + rot) * r * 0.8, 1);
        }
    });
    const my = f.ROWS * 0.74 + f.breath, cx = f.COLS * 0.5;
    for (let i = -3; i <= 3; i++) f.setPx(cx + i, my + Math.sin(i + now * 0.01), 0.8);
}

function drawYawn(f, now) {
    const p = Math.min(1, (now - f.exprStart) / 1600);
    const open = Math.sin(p * Math.PI);
    const cy = f.ROWS * 0.40 + f.breath + f.gy, ex = f.look.x * 2, ey = f.look.y * 1.3;
    [f.COLS * 0.30, f.COLS * 0.70].forEach((cx) => {
        for (let i = -2; i <= 2; i++) f.setPx(cx + ex + i, cy + ey, 0.9);
    });
    f.fillEllipse(f.COLS * 0.5, f.ROWS * 0.72 + f.breath, 2.2, 0.8 + open * 2.6);
}

function drawHeart(f, cx, cy) {
    f.setPx(cx - 1, cy - 1, 1); f.setPx(cx + 1, cy - 1, 1);
    for (let i = -2; i <= 2; i++) f.setPx(cx + i, cy, 1);
    for (let i = -1; i <= 1; i++) f.setPx(cx + i, cy + 1, 1);
    f.setPx(cx, cy + 2, 1);
}

function drawLove(f) {
    const cy = f.ROWS * 0.38 + f.breath + f.gy;
    drawHeart(f, f.COLS * 0.30 + f.gx, cy);
    drawHeart(f, f.COLS * 0.70 + f.gx, cy);
    f.drawMouth({ mouth: 'cat' });
}

function drawZ(f, x, y, a) {
    f.setPx(x, y, a); f.setPx(x + 1, y, a);
    f.setPx(x, y + 1, a);
    f.setPx(x, y + 2, a); f.setPx(x + 1, y + 2, a);
}

function drawSleep(f, now) {
    const cy = f.ROWS * 0.42 + f.breath + f.gy;
    [f.COLS * 0.30, f.COLS * 0.70].forEach((cx) => {
        for (let i = -2; i <= 2; i++) f.setPx(cx + i, cy + (Math.abs(i) === 2 ? 0.6 : 0), 0.85);
    });
    for (let i = -1; i <= 1; i++) f.setPx(f.COLS * 0.5 + i, f.ROWS * 0.72 + f.breath, 0.6);
    const t = now * 0.0018;
    for (let k = 0; k < 3; k++) {
        const p = (t + k * 0.7) % 3;
        drawZ(f, f.COLS * 0.76 + p * 1.7, f.ROWS * 0.34 - p * 2.4, Math.max(0, 1 - p / 3));
    }
}

/* ---------------- scene library ---------------- */
// E() holds a mood for the whole step; scheduler resets to neutral at the end.

const E = (f, n) => f.setExpression(n, 999999);
const NOW = () => performance.now();

const SCENES = {
    glanceAround: () => [
        [900,  (f) => f.lookAt(-0.7, -0.1)],
        [1000, (f) => f.lookAt(0.7, -0.1)],
        [900,  (f) => f.lookAt(0, -0.5)],
        [600,  (f) => { f.releaseGaze(); f.triggerBlink(NOW()); }],
    ],
    ponder: () => [
        [1000, (f) => { E(f, 'suspicious'); f.lookAt(0.45, -0.5); }],
        [1100, (f) => f.lookAt(-0.4, -0.45)],
        [700,  () => {}],
    ],
    doze: () => [
        [1200, (f) => E(f, 'sleepy')],
        [2000, (f) => E(f, 'sleep')],
        [3000, () => {}],
        [600,  (f) => E(f, 'surprised')],
        [800,  (f) => E(f, 'happy')],
    ],
    yawnStretch: () => [
        [1600, (f) => E(f, 'yawn')],
        [1000, (f) => E(f, 'sleepy')],
        [500,  () => {}],
    ],
    delighted: () => [
        [400,  (f) => E(f, 'excited')],
        [800,  (f) => f.doubleBlink(NOW())],
        [1000, (f) => E(f, 'joy')],
    ],
    content: () => [
        [1600, (f) => E(f, 'content')],
        [1400, (f) => E(f, 'happy')],
    ],
    sneeze: () => [
        [700, (f) => { E(f, 'sleepy'); f.lookAt(0.1, -0.6); }],
        [400, (f) => E(f, 'surprised')],
        [500, (f) => { E(f, 'dizzy'); f.releaseGaze(); }],
        [700, (f) => E(f, 'sleepy')],
        [400, () => {}],
    ],
    doubleTake: () => [
        [700, (f) => f.lookAt(-0.8, 0)],
        [400, (f) => { f.lookAt(0, 0); E(f, 'surprised'); }],
        [900, (f) => E(f, 'happy')],
    ],
    dizzySpin: () => [
        [1800, (f) => E(f, 'dizzy')],
        [600,  (f) => E(f, 'surprised')],
        [600,  (f) => E(f, 'happy')],
    ],
    inLove: () => [
        [1600, (f) => E(f, 'love')],
        [1000, (f) => E(f, 'content')],
    ],
    peekShy: () => [
        [900, (f) => { E(f, 'sleepy'); f.lookAt(0, 0.55); }],
        [600, (f) => f.lookAt(0, 0.55)],
        [400, (f) => { E(f, 'surprised'); f.releaseGaze(); }],
        [900, (f) => E(f, 'happy')],
    ],
};

/* ---------------- personality scheduler ---------------- */

class FaceBehaviors {
    constructor() {
        this.queue = [];
        this.stepEnd = 0;
        this.next = 0;
        this.sleepy = 0; // grows the longer he's left alone -> more likely to doze
        this.weights = {
            glanceAround: 4, ponder: 3, yawnStretch: 2, delighted: 2, content: 3,
            sneeze: 1, doubleTake: 2, dizzySpin: 1, inLove: 1, peekShy: 2,
        };
    }

    pick() {
        const w = { ...this.weights, doze: 1 + this.sleepy };
        const names = Object.keys(w);
        const total = names.reduce((s, n) => s + w[n], 0);
        let r = Math.random() * total;
        for (const n of names) { r -= w[n]; if (r <= 0) return n; }
        return 'glanceAround';
    }

    update(f, now) {
        // a scene is running
        if (this.queue.length) {
            if (now >= this.stepEnd) {
                const step = this.queue.shift();
                step[1](f);
                this.stepEnd = now + step[0];
                if (!this.queue.length) {
                    f.releaseGaze();
                    f.setExpression('neutral', 1);
                    this.next = now + 2500 + Math.random() * 4500;
                }
            }
            return;
        }
        // idle -> maybe start a routine
        if (now < this.next) return;
        if (f.expression !== 'neutral' || f.talkUntil > now) { this.next = now + 1500; return; }

        const name = this.pick();
        if (name === 'doze') this.sleepy = 0;
        else this.sleepy = Math.min(6, this.sleepy + 1);
        this.queue = SCENES[name]().slice();
        this.stepEnd = now;
    }
}


