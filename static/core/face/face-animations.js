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
