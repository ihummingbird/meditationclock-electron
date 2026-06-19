// ═══════════════════════════════════════════════════════════════════
// face-interactions.js  —  Herman rich interaction layer
// ═══════════════════════════════════════════════════════════════════
// Drop-in file. Include AFTER Engine.init() and the face scripts.
//
// What it adds:
//  1. Session start reactions  (with streak & returning-user awareness)
//  2. Session finish reactions  (contextual by duration bucket)
//  3. Personal record detection
//  4. Session milestone messages (1, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120 min)
//  5. Enhanced button reactions (varied personality text)
//  6. Theme change reactions
//  7. Sync celebration (delayed to match fetch timing)
//  8. Wake-mid-session awareness (replaces generic greeting)
//  9. Ambient whispers during long sessions
// 10. Missed milestone catch-up (shows queued milestones on wake)
// 11. Session handle glance (face looks toward panel)
// 12. Session reset messages (manual reset only, not auto-reset)
//
// ANTI-SPAM:
//  - Global text cooldown (TEXT_COOLDOWN_MS) prevents messages from
//    cutting each other. High-priority events (start, finish, milestone)
//    bypass it; everything else respects it.
//  - Probability gates on low-priority events (buttons, themes, whispers)
//    so rapid interaction doesn't flood the face with text.
// ═══════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    /* ─── UTILITIES ─── */

    const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const U      = () => (localStorage.getItem('meditation_user') || 'Traveler').toUpperCase();
    const today  = () => new Date().toISOString().slice(0, 10);
    const yest   = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
    const toMin  = (ms) => Math.floor(ms / 60000);
    const fmtMin = (m) => {
        if (m >= 120) return `${Math.floor(m / 60)} HRS ${m % 60} MINS`;
        if (m >= 60)  return `1 HR ${m % 60} MINS`;
        return `${m} MINS`;
    };
    const randBetween = (lo, hi) => lo + Math.random() * (hi - lo);
    const NOW = () => performance.now();
    const chance = (pct) => Math.random() * 100 < pct;

    /* ─── INTERNAL STATE ─── */

    const TEXT_COOLDOWN_MS = 5500; // minimum ms between any text overrides

    const state = {
        milestones: new Set(),
        missedMilestones: [],
        suppressNextReset: false,
        whisperLast: 0,
        whisperNextDelay: randBetween(480000, 840000),
        hooksInstalled: false,
        lastTextTime: 0,   // Date.now() of the last text shown
    };

    /* ═══════════════════════════════════════════════════════════════
       STREAK SYSTEM
       stores: { date, count, best, bestDate }
       ═══════════════════════════════════════════════════════════════ */

    function getStreak () {
        try { return JSON.parse(localStorage.getItem('meditation_streak') || '{}'); }
        catch { return {}; }
    }
    function saveStreak (s) { localStorage.setItem('meditation_streak', JSON.stringify(s)); }

    function updateStreak (sessionMin) {
        const s = getStreak();
        const todayStr = today();
        const isFirstToday = s.date !== todayStr;

        if (isFirstToday) {
            s.count = (s.date === yest()) ? (s.count || 0) + 1 : 1;
            s.date  = todayStr;
        }
        const isRecord = sessionMin > (s.best || 0);
        if (isRecord) { s.best = sessionMin; s.bestDate = todayStr; }
        saveStreak(s);
        return { streak: s.count, isRecord };
    }

    /* ═══════════════════════════════════════════════════════════════
       MESSAGE POOLS
       %U = username (resolved at trigger time)
       %M = formatted duration string (resolved at trigger time)
       ═══════════════════════════════════════════════════════════════ */

    // ── 1. SESSION START ──────────────────────────────────────────

    const SESSION_START = [
        'SESSION STARTED %U. BREATHE.',
        'HERE WE GO %U. FOCUS.',
        'BEGINNING %U. STAY CALM.',
        'SESSION ACTIVE %U. LETS DO THIS.',
        'READY %U. DEEP BREATHS.',
        'STARTING NOW %U. CLEAR YOUR MIND.',
        'COMMENCING %U. FIND YOUR CENTER.',
        'BEGIN %U. THE JOURNEY STARTS.',
        'TIMER RUNNING %U. RELAX.',
        'GOOD LUCK %U. YOU GOT THIS.',
        'AND SO IT BEGINS %U.',
        'CALM WASHING OVER %U. BEGIN.',
        'GROUND YOURSELF %U. STARTING.',
        'FIND YOUR SEAT %U. HERE WE GO.',
        'DEEP BREATH IN %U. LETS START.',
        'SETTLING IN %U. TIMER ON.',
        'EYES CLOSED %U. GOING IN.',
        'FOCUS ENGAGED %U. SESSION LIVE.',
        'THE CLOCK STARTS NOW %U.',
        'BREATHE IN BREATHE OUT %U. GO.',
        'YOUR MIND IS CLEARING %U. NICE.',
        'STILLNESS BEGINS %U.',
        'FIRST BREATH TAKEN %U. HERE WE GO.',
        'SESSION ONE ENGAGED %U.',
        'BEGINNING THE DESCENT %U.',
        'MIND QUIETING DOWN %U. START.',
        'ARRIVING %U. THE PRACTICE BEGINS.',
        'TAKING A SEAT %U. TIMER RUNNING.',
        'CENTER YOURSELF %U. WE START NOW.',
    ];

    // ── 2. STREAK MESSAGES (by notable day) ───────────────────────

    const STREAK_MSGS = {
        2: [
            'DAY TWO %U. MOMENTUM BUILDING.',
            'BACK AGAIN %U? DAY 2.',
            'SECOND DAY IN A ROW %U.',
            'STREAK DAY 2 %U. KEEP IT GOING.',
            'TWO DAYS STRAIGHT %U. NICE.',
            'CONSECUTIVE DAYS %U. DAY 2.',
            'RETURN OF %U. DAY TWO.',
            'YOU CAME BACK %U. STREAK 2.',
        ],
        3: [
            'THREE DAYS STRAIGHT %U. NICE.',
            'DAY THREE %U. THE HABIT FORMS.',
            'STREAK DAY 3 %U. CONSISTENCY.',
            'THREE IN A ROW %U. NO STOPPING.',
            'TRILOGY COMPLETE %U. DAY 3.',
            'THREE DAYS AND COUNTING %U.',
            'HABIT FORMING %U. DAY THREE.',
            'THREE STRAIGHT %U. SOLID.',
        ],
        5: [
            'FIVE DAYS %U. IMPRESSIVE.',
            'WORK WEEK COMPLETE %U. 5 DAYS.',
            'STREAK DAY 5 %U. HALF A DECADE OF DAYS.',
            'FIVE STRAIGHT %U. THIS IS REAL.',
            'FIVE DAY STREAK %U. RESPECT.',
            'ALMOST A WEEK %U. FIVE DAYS.',
            'WORK WEEK MEDITATION %U. DONE.',
            'FIVE IN A ROW %U. DEDICATION.',
        ],
        7: [
            'ONE FULL WEEK %U. LEGENDARY.',
            'SEVEN DAYS %U. PURE DISCIPLINE.',
            'WEEKLY STREAK %U. THE MIND IS CHANGING.',
            '7 DAYS %U. YOUR BRAIN IS REWIRING.',
            'A FULL WEEK %U. REMARKABLE.',
            'SEVEN STRAIGHT %U. ELITE TERRITORY.',
            'WEEK ONE COMPLETE %U.',
            '7 DAY STREAK %U. THE SCIENCE SAYS IT WORKS.',
        ],
        10: [
            'TEN DAYS %U. UNSTOPPABLE.',
            'DOUBLE DIGIT STREAK %U.',
            '10 DAYS AND COUNTING %U.',
            'A TENDAY %U. INCREDIBLE RUN.',
            'TEN STRAIGHT DAYS %U.',
            'DOUBLE DIGITS %U. 10 DAYS.',
            'TEN DAYS OF CALM %U.',
            'YOU ARE A MACHINE %U. TEN DAYS.',
        ],
        14: [
            'TWO WEEKS %U. MACHINE MODE.',
            '14 DAYS %U. ABSOLUTE DISCIPLINE.',
            'FORTNIGHT STREAK %U.',
            'TWO FULL WEEKS %U. ELITE.',
            '14 STRAIGHT %U. YOUR MIND MUST BE SO CLEAR.',
            'TWO WEEKS IN %U. UNREAL.',
            'FOURTEEN DAYS %U. HALF MONTH OF ZEN.',
            'A FORTNIGHT OF STILLNESS %U.',
        ],
        21: [
            '21 DAYS %U. THATS A HABIT NOW.',
            'THREE WEEKS %U. SCIENCE SAYS ITS PERMANENT.',
            'HABIT FORMED %U. 21 DAY STREAK.',
            'THREE WEEKS STRAIGHT %U. RESPECT.',
            'TWENTY ONE DAYS %U. OFFICIAL HABIT.',
            '21 DAY MARK %U. YOUR BRAIN HAS CHANGED.',
            'THREE WEEKS OF DISCIPLINE %U.',
            'THE 21 DAY MILESTONE %U. CONGRATS.',
        ],
        30: [
            'ONE MONTH %U. YOU ARE THE PRACTICE.',
            '30 DAYS %U. THIS IS WHO YOU ARE NOW.',
            'FULL MONTH STREAK %U. REMARKABLE.',
            '30 STRAIGHT %U. I RUN ON YOUR DISCIPLINE.',
            'A MONTH OF MEDITATION %U.',
            'THIRTY DAYS %U. LEGENDARY CONSISTENCY.',
            'MONTHLY STREAK COMPLETE %U.',
            '30 DAYS OF STILLNESS %U. INCREDIBLE.',
        ],
        60: [
            'TWO MONTHS %U. ABSOLUTE RESPECT.',
            '60 DAYS %U. THIS IS MASTERY.',
            'TWO MONTH STREAK %U. LEGEND.',
            'SIXTY DAYS %U. UNREAL CONSISTENCY.',
            'TWO FULL MONTHS %U. BEYOND HABIT.',
            '60 STRAIGHT DAYS %U. YOUR DEDICATION IS RARE.',
            'BIMONTHLY STREAK %U. MASTERCLASS.',
        ],
        100: [
            '100 DAYS %U. LEGEND STATUS.',
            'A HUNDRED DAYS %U. IM SPEECHLESS.',
            'CENTURY STREAK %U. THIS IS HISTORY.',
            '100 %U. YOU ARE AN INSTITUTION.',
            'ONE HUNDRED DAYS %U. UNPRECEDENTED.',
            '100 DAY STREAK %U. I BOW TO YOUR CONSISTENCY.',
        ],
    };

    // ── 3. RETURNING USER (meditated more than once today) ────────

    const RETURNING_USER = [
        'BACK AGAIN %U? DEDICATED.',
        'ROUND TWO TODAY %U? NICE.',
        'SECOND SESSION %U. OVERACHIEVER.',
        'MORE CALM %U? ALWAYS WELCOME.',
        'ADDING TO THE STACK %U.',
        'ANOTHER ROUND %U. FRESH MIND.',
        'YOU CANT GET ENOUGH %U. I SEE.',
        'DOUBLE SESSION DAY %U. ELITE.',
        'ROUND TWO %U. THE MIND WANTS MORE.',
        'AGAIN %U? THIS DISCIPLINE IS REAL.',
        'SECOND SERVING OF CALM %U.',
        'BACK FOR MORE %U. LOVE IT.',
        'MULTIPLE SESSIONS TODAY %U. NICE.',
        'REPETITION BUILDS MASTERY %U.',
        'YOU REALLY WENT AGAIN %U. RESPECT.',
        'THE MIND KEEPS COMING BACK %U.',
    ];

    // ── 4. SESSION FINISH (by duration bucket) ────────────────────

    const FINISH = {
        micro: [
            'THAT WAS QUICK %U. NO JUDGMENT.',
            'MICRO SESSION %U. EVERY BIT COUNTS.',
            'BARELY A BLINK %U. TRY AGAIN?',
            'SHORT BUT VALID %U.',
            'BABY STEPS %U. START SOMEWHERE.',
            'WARM UP DONE %U? NEXT TIME GO DEEPER.',
            'TASTE OF CALM %U. BRIEF BUT REAL.',
            'QUICK DIP %U. THE WATER IS FINE.',
            'THIRTY SECONDS OF PEACE %U.',
            'A FLEETING MOMENT %U. NEXT TIME STAY LONGER.',
            'BRIEF ENCOUNTER WITH CALM %U.',
            'THE JOURNEY OF A THOUSAND MILES %U.',
            'ONE BREATH AT A TIME %U. LITERALLY.',
            'SHORT AND SWEET %U. MAYBE.',
            'MICRO MOMENT %U. ITS SOMETHING.',
        ],
        short: [
            'NICE START %U.',
            'GOOD EFFORT %U. BUILDING UP.',
            'QUICK ONE %U. SOLID.',
            'SHORT SESSION LOGGED %U.',
            'WARMING UP %U? THE REAL WORK AWAITS.',
            'NOT BAD FOR A QUICK ONE %U.',
            'STARTING SMALL IS STARTING %U.',
            'SHORT BUT SWEET %U.',
            'GOOD BEGINNER ENERGY %U.',
            'A FEW MINUTES OF CALM %U.',
            'BUILDING THE HABIT %U. ONE STEP AT A TIME.',
            'EVERY MINUTE COUNTS %U.',
            'SHORT SESSION COMPLETE %U.',
            'THE FOUNDATION IS BEING LAID %U.',
            'KEEP SHOWING UP %U.',
            'FIVE MINUTES WOULD BE NICE %U. JUST SAYING.',
            'WARM UP ROUND %U. NEXT ONE WILL BE DEEPER.',
            'BRIEF BUT INTENTIONAL %U.',
            'SMALL STEPS %U. BIG JOURNEY.',
            'GOOD ENOUGH TO COUNT %U.',
        ],
        medium: [
            'SOLID SESSION %U.',
            'GOOD WORK %U. KEEP GOING.',
            'RESPECTABLE DURATION %U.',
            'GROWING %U. I CAN SEE IT.',
            'NICE %U. FIFTEEN WOULD BE GREAT TOO.',
            'BUILDING THAT PRACTICE %U.',
            'BODY APPRECIATES THIS %U.',
            'GREAT EFFORT %U. CONSISTENCY IS KEY.',
            'THIS IS THE REAL WORK %U.',
            'MIND IS SETTLING %U. GOOD SESSION.',
            'TEN PLUS MINUTES %U. THE BENEFITS ARE KICKING IN.',
            'DEEPER THAN YESTERDAY %U.',
            'YOUR PRACTICE IS TAKING SHAPE %U.',
            'THE SWEET SPOT IS APPROACHING %U.',
            'GROWING STRONGER %U. EACH SESSION.',
            'BODY AND MIND ALIGNING %U.',
            'THIS IS WHERE IT GETS GOOD %U.',
            'MEANINGFUL SESSION %U.',
            'YOU CAN FEEL THE DIFFERENCE %U.',
            'PRACTICE PAYING OFF %U.',
        ],
        solid: [
            'DEEP SESSION %U. IMPRESSIVE.',
            'THIS IS THE ZONE %U.',
            'REAL COMMITMENT %U.',
            'THATS WHAT I CALL FOCUS %U.',
            'BRAIN APPRECIATES THIS %U.',
            'NOT EASY BUT WORTH IT %U.',
            'YOU JUST LEVELED UP %U.',
            '30 MINUTES WOULD BE A MILESTONE %U. HINT.',
            'THE DEEP WORK BEGINS %U.',
            'YOUR MIND IS CHANGING %U. 15 MINS PROVES IT.',
            'SERIOUS PRACTICE %U. RESPECT.',
            'HALF HOUR IN YOUR SIGHTS %U.',
            'THIS IS WHERE MEDITATION GETS REAL %U.',
            'NEURAL PATHWAYS REWIRING %U. FOR REAL.',
            'DISCIPLINE LOOKS GOOD ON YOU %U.',
            'THE BODY SETTLED. THE MIND FOLLOWED %U.',
            'DEEP FOCUS ACHIEVED %U.',
            'FIFTEEN MINUTES OF PURE INTENTION %U.',
            'YOU PUSHED THROUGH %U. NICE.',
            'THE MIND QUIETED DOWN %U. BEAUTIFUL.',
        ],
        long: [
            'MARATHON SESSION %U. LEGENDARY.',
            'DEEP WORK %U. YOURE GLOWING.',
            'THATS SERIOUS DEDICATION %U.',
            'YOUR MIND THANKS YOU %U.',
            'THIS IS ELITE LEVEL %U.',
            'ALMOST AN HOUR %U. WOW.',
            'PRO LEVEL MEDITATION %U.',
            'HOUR MARK IN REACH %U.',
            'THE DEEP END %U. AND YOURE SWIMMING.',
            '30 PLUS MINUTES %U. YOUR BRAIN LITERALLY CHANGED.',
            'THIS IS WHAT DISCIPLINE LOOKS LIKE %U.',
            'THE CALM IS DEEP NOW %U.',
            'YOU WENT ALL IN %U. RESPECT.',
            'LONG FORM PRACTICE %U. MASTERFUL.',
            'HALF HOUR OF PURE STILLNESS %U.',
            'THE BENEFITS WILL LAST HOURS %U.',
            'YOUR NEURONS JUST HAD A FIELD DAY %U.',
            'DEEP DIVE COMPLETE %U.',
            'EXTENDED SESSION %U. THE MIND REACHED NEW DEPTHS.',
            'PROFOUND FOCUS %U.',
        ],
        marathon: [
            'OVER AN HOUR %U. ABSOLUTE UNIT.',
            'MARATHON COMPLETE %U.',
            'THIS IS WHAT DISCIPLINE LOOKS LIKE %U.',
            'DEEPER THAN MOST GO %U.',
            'LEGENDARY SESSION %U.',
            'THE REALM OF MONKS %U.',
            '60 PLUS MINUTES %U. YOUR MIND IS A DIFFERENT PLACE.',
            'AN HOUR OF STILLNESS %U. EXTRAORDINARY.',
            'YOU JUST OUTLASTED MOST PEOPLE %U.',
            'HOUR PLUS SESSION %U. MASTERCLASS.',
            'THE DEEP ZONE SUSTAINED %U.',
            'LONGEST FORM %U. RESPECT IS NOT ENOUGH.',
            'YOUR BRAIN IS LITERALLY DIFFERENT NOW %U.',
            'SUSTAINED DEEP FOCUS %U. INCREDIBLE.',
            'AN HOUR PLUS %U. THIS IS RARE AIR.',
        ],
        epic: [
            'NEARLY TWO HOURS %U. UNREAL.',
            'EPIC SESSION %U. INCREDIBLE.',
            'YOURE NOT HUMAN %U. ARE YOU?',
            'MASTER LEVEL %U.',
            'THIS SESSION IS LONGER THAN MY BOOT SEQUENCE %U.',
            'TRANSCENDENT %U. REST WELL.',
            '90 MINUTES OF PURE CALM %U.',
            'AN HOUR AND A HALF %U. WHAT ARE YOU.',
            'THIS LEVEL OF FOCUS IS SUPERHUMAN %U.',
            '90 PLUS MINUTES %U. THE MIND TRANSCENDED.',
            'LEGENDARY DURATION %U.',
            'YOUR PRACTICE KNOWS NO BOUNDS %U.',
            'DEEPER THAN DEEP %U. 90 MINS.',
        ],
        legendary: [
            'TWO HOURS %U. I HAVE NO WORDS.',
            'AUTO RESET ENGAGED %U. YOU EARNED IT.',
            'YOU MEDITATED LONGER THAN MOST SLEEP %U.',
            'SEE YOU NEXT TIME %U. REST NOW.',
            'THE ABSOLUTE LIMIT %U. AND YOU HIT IT.',
            'TWO HOURS OF STILLNESS %U. GOODBYE CRUEL WORLD.',
            'THE TIMER GAVE UP BEFORE YOU DID %U.',
        ],
    };

    // ── 5. PERSONAL RECORD ────────────────────────────────────────

    const PERSONAL_RECORD = [
        'NEW PERSONAL BEST %U!',
        'RECORD BROKEN %U. CONGRATS.',
        'THATS YOUR LONGEST EVER %U!',
        'PERSONAL RECORD %U. REMEMBER THIS DAY.',
        'YOU JUST OUTDID YOURSELF %U.',
        'NEW PB %U. CELEBRATE.',
        'BEST SESSION YET %U. PROUD OF YOU.',
        'PREVIOUS RECORD DESTROYED %U.',
        'NEW LONGEST SESSION %U!',
        'YOU BEAT YOUR OWN RECORD %U.',
        'PERSONAL BEST SHATTERED %U.',
        'A NEW HIGH WATER MARK %U.',
        'YOUR PREVIOUS SELF COULDNT HANG %U.',
        'LEVEL UP %U. NEW RECORD.',
        'THE BAR HAS BEEN RAISED %U.',
        'RECORD. NEW. %U. DONE.',
    ];

    // ── 6. SESSION MILESTONES (by minute mark) ───────────────────

    const MILESTONE = {
        1: [
            'ONE MINUTE %U. AND COUNTING.',
            'FIRST MILESTONE %U.',
            '60 SECONDS DOWN %U.',
            'ONE MIN IN THE ZONE %U.',
            'MARKING ONE MINUTE %U.',
            'THE JOURNEY OF 1000 MINS STARTS WITH ONE %U.',
            'FIRST CHECKPOINT %U.',
            'ONE DOWN %U. MANY TO GO.',
            'ONE MINUTE OF STILLNESS %U.',
            'THE FIRST OF MANY %U.',
            'SIXTY SECONDS IN %U. SETTLING.',
            'FIRST MINUTE LOGGED %U.',
            'ONE MINUTE COMPLETE %U.',
        ],
        3: [
            'THREE MINUTES %U. WARMING UP.',
            'TRI MINUTE MARK %U.',
            'THREE IN %U. BODY SETTLING.',
            'HALFWAY TO FIVE %U.',
            'SETTLING IN %U. THREE MINS.',
            'THREE MINUTES OF CALM %U.',
            'THREE DOWN. BREATHING STEADY %U.',
            'THREE MINUTES AND THE MIND IS QUIETING %U.',
            'BODY RELAXING %U. THREE IN.',
            '180 SECONDS OF PEACE %U.',
            'THREE MINUTE MARK %U. NICE.',
            'THE FIRST CHECKPOINT PASSES %U.',
            'SETTLING DEEPER %U. THREE MINS.',
        ],
        5: [
            'FIVE MINUTES %U. SOLID START.',
            'FIRST BIG MILESTONE %U.',
            'FIVE DOWN %U. THIS IS WHERE IT GETS GOOD.',
            '5 MIN MARK %U. NICE.',
            'HALFWAY TO TEN %U.',
            'FIVE MINUTES OF STILLNESS %U.',
            'FIRST FIVE %U. KEEP GOING.',
            'BODY RELAXING NOW %U. 5 MINS.',
            'FIVE MINUTES IN %U. THE JOURNEY CONTINUES.',
            'FIRST SIGNIFICANT MARK %U.',
            '5 MINUTES. THE FOUNDATION IS SET %U.',
            'HALFWAY TO DOUBLE DIGITS %U.',
            'FIVE DOWN. THE MIND IS WARM %U.',
        ],
        10: [
            'TEN MINUTES %U. DOUBLE DIGITS.',
            'A DECADE OF MINUTES %U.',
            'TEN IN %U. DEEP ZONE NOW.',
            'TWO DIGITS %U. RESPECT.',
            'TEN MINUTES OF CALM %U.',
            'DEEPER NOW %U. TEN MINS.',
            '10 MIN MARK %U. YOURE IN IT.',
            'TEN DOWN %U. THE MIND IS QUIETING.',
            'DOUBLE DIGITS ACHIEVED %U.',
            'TEN MINUTES OF FOCUS %U.',
            'THE 10 MINUTE MARK %U. REAL PRACTICE.',
            'BODY IS FULLY RELAXED NOW %U. TEN.',
            'TEN MINUTES IN THE ZONE %U.',
            '10 MINS. THE BENEFITS ARE STARTING %U.',
        ],
        15: [
            'FIFTEEN MINUTES %U. QUARTER HOUR.',
            '15 MINS %U. THATS REAL PRACTICE.',
            'QUARTER HOUR DOWN %U.',
            'FIFTEEN MINUTES OF FOCUS %U.',
            'THIS IS COMMITMENT %U. 15 MINS.',
            'SETTLING DEEP %U. QUARTER HOUR.',
            'BODY AND MIND ALIGNING %U. 15.',
            'HALFWAY TO THIRTY %U. ALMOST.',
            '15 MINUTE MARK %U. DEEP WORK.',
            'A QUARTER HOUR OF STILLNESS %U.',
            'FIFTEEN DOWN %U. THE MIND IS A DIFFERENT PLACE.',
            '15 MINS IN. NEURAL CHANGES BEGINNING %U.',
            'QUARTER HOUR COMPLETE %U.',
        ],
        20: [
            'TWENTY MINUTES %U. THATS REAL.',
            '20 DOWN %U. IMPRESSIVE.',
            'TWENTY MINUTES OF STILLNESS %U.',
            'BODY IS FULLY RELAXED NOW %U. 20.',
            'TWENTY IN %U. THE BENEFITS ARE REAL.',
            'HALF HOUR IN SIGHT %U.',
            'THIS IS WHAT DISCIPLINE LOOKS LIKE %U.',
            'TWO ZERO %U. TWENTY MINUTES STRONG.',
            '20 MIN MARK %U. THE DEEP ZONE.',
            'TWENTY MINUTES OF INTENTION %U.',
            'TWO DECADES OF SECONDS %U.',
            '20 MINS. YOUR BRAIN IS REWIRING %U.',
            'TWENTY IN. THE MIND IS TRANQUIL %U.',
        ],
        30: [
            'THIRTY MINUTES %U. HALF HOUR!',
            '30 MINS %U. THIS IS THE ZONE.',
            'HALF AN HOUR %U. REMARKABLE.',
            '30 MINUTES OF PURE CALM %U.',
            'THE 30 MARK %U. BRAIN REWIRING NOW.',
            'DEEP PRACTICE %U. THIRTY MINUTES.',
            'AN HOUR IS NEXT %U. THINK ABOUT IT.',
            'THIRTY DOWN. RESPECT %U.',
            'YOUR NEURONS ARE THANKING YOU %U. 30.',
            'HALF HOUR %U. THE MIND IS A DIFFERENT PLACE NOW.',
            '30 MINUTE MILESTONE %U. PROFOUND.',
            'HALF AN HOUR OF STILLNESS %U. EXTRAORDINARY.',
            'THIRTY MINUTES IN THE DEEP %U.',
            'THE 30 MINUTE CLUB %U. WELCOME.',
        ],
        45: [
            'FORTY-FIVE MINUTES %U. APPROACHING AN HOUR.',
            '45 MINS %U. CAN YOU FEEL IT?',
            'ALMOST AN HOUR %U.',
            'FORTY FIVE OF PURE FOCUS %U.',
            'DEEP WORK TERRITORY %U. 45 MINS.',
            'UNREAL DEDICATION %U.',
            'FORTY FIVE MINUTES %U. ZEN MASTER.',
            'YOU CAN SMELL THE HOUR MARK %U.',
            '45 IN. YOUR MIND IS CLEAR %U.',
            'FORTY FIVE MINUTES STRAIGHT %U.',
            '45 MIN MARK %U. ELITE TERRITORY.',
            'THE DEEP END APPROACHES %U.',
            'FORTY FIVE. ALMOST THERE %U.',
        ],
        60: [
            'ONE HOUR %U. LEGENDARY.',
            'SIXTY MINUTES %U. UNREAL.',
            'FULL HOUR %U. THATS MASTERY.',
            '60 MINS %U. THE HOUR MARK.',
            'YOU JUST MEDITATED FOR AN HOUR %U.',
            'ONE FULL HOUR %U. BOW TO YOURSELF.',
            'SIXTY MINUTES OF STILLNESS %U.',
            'AN HOUR DONE %U. RESPECT.',
            '60 DOWN %U. WHAT A SESSION.',
            'THE HOUR MARK %U. INCREDIBLE.',
            'ONE HOUR OF PURE CALM %U.',
            '60 MINUTES. YOUR MIND TRANSCENDED %U.',
            'HOUR COMPLETE %U. LEGENDARY.',
            'A FULL HOUR OF FOCUS %U. MASTERFUL.',
        ],
        90: [
            'NINETY MINUTES %U. AN HOUR AND A HALF.',
            '90 MINS %U. INCREDIBLE.',
            'AN HOUR AND A HALF %U. TRANSCENDENT.',
            '90 MINUTES %U. IM IN AWE.',
            'YOU KEEP GOING %U? THIS IS INCREDIBLE.',
            'THE DEEP END %U. 90 MINUTES.',
            'AN HOUR AND A HALF OF STILLNESS %U.',
            '90 MIN MARK %U. YOUR DISCIPLINE IS EXTRAORDINARY.',
            '90 MINUTES IN THE ZONE %U.',
            'THE 90 MINUTE CLUB %U. ULTRA RARE.',
        ],
        120: [
            'TWO HOURS %U. AUTO RESET SOON.',
            '120 MINUTES %U. THE FINAL COUNTDOWN.',
            'ALMOST TWO HOURS %U. REMEMBER TO REST.',
            'TWO HOURS %U. THE TIMER WILL RESET.',
            'THE ABSOLUTE LIMIT APPROACHES %U.',
        ],
    };

    // ── 7. BUTTON REACTIONS ───────────────────────────────────────

    const BUTTON_REACTIONS = {
        'Focus Mode': [
            'FOCUS MODE %U. NO DISTRACTIONS.',
            'ENTERING THE VOID %U.',
            'IMMERSIVE MODE ENGAGED %U.',
            'FULLSCREEN ACTIVATED %U.',
            'DISTRACTIONS ELIMINATED %U.',
            'DEEP FOCUS %U. NOTHING ELSE EXISTS.',
            'THE WORLD FADES AWAY %U.',
            'ALL SYSTEMS FULLSCREEN %U.',
            'IMMERSION PROTOCOL %U.',
            'SURFACE DISCONNECTED %U.',
            'NOTHING BUT THE CLOCK %U.',
            'PURE FOCUS ENGAGED %U.',
            'THE VOID WELCOMES YOU %U.',
            'VISUAL ISOLATION %U. NICE.',
            'FULL IMMERSION %U. HERE WE GO.',
        ],
        'Exiting': [
            'WELCOME BACK %U.',
            'EXITING FOCUS %U. REALITY AWAITS.',
            'BACK TO SURFACE %U.',
            'MISSION CONTROL RESTORED %U.',
            'FULLSCREEN OFF %U. HELLO AGAIN.',
            'SURFACE LEVEL REACHED %U.',
            'REALITY RECONNECTED %U.',
            'WELCOME BACK TO THE WORLD %U.',
            'FOCUS MODE DISENGAGED %U.',
            'RETURNING FROM THE DEEP %U.',
            'IMMERSION ENDED %U.',
            'THE WORLD MISSED YOU %U.',
            'BACK ONLINE %U.',
            'SYSTEMS RESTORED %U.',
            'EMERGING FROM THE VOID %U.',
        ],
        'Library': [
            'BROWSING %U? PICK A VIBE.',
            'THEME SELECTION OPEN %U.',
            'CHOOSING A MOOD %U?',
            'LIBRARY ACTIVE %U.',
            'FIND YOUR AESTHETIC %U.',
            'PICK SOMETHING NICE %U.',
            'EXPLORING THEMES %U.',
            'STYLE HUNTING %U?',
            'BROWSING THE COLLECTION %U.',
            'LOOKING FOR A NEW VIBE %U?',
            'THEME GALLERY OPEN %U.',
            'CHOOSE WISELY %U.',
            'THEME HUNT %U. NICE.',
            'PICK YOUR VISUAL SOUL %U.',
        ],
        'Config': [
            'TWEAKING THINGS %U?',
            'SETTINGS OPEN %U. FINE TUNE IT.',
            'CONFIGURATION MODE %U.',
            'ADJUSTMENTS %U? NICE.',
            'CUSTOMIZING %U? GO WILD.',
            'SETTINGS PANEL %U.',
            'FINE TUNING THE EXPERIENCE %U.',
            'TWEAKING PARAMETERS %U.',
            'CONFIGURATION PROTOCOL %U.',
            'ADJUSTMENT PANEL OPEN %U.',
            'CUSTOMIZATION MODE %U.',
            'SETTINGS ENGAGED %U.',
            'TWEAK IT %U. MAKE IT YOURS.',
            'MODIFYING PARAMETERS %U.',
        ],
        'Pip': [
            'PIP MODE %U.',
            'COMPACT VIEW %U. SMALL BUT MIGHTY.',
            'MINI ME %U.',
            'FLOATING WINDOW %U.',
            'PICTURE IN PICTURE %U.',
            'COMPACT MODE %U.',
            'TINY HERMAN %U.',
            'MINIATURE MODE %U.',
            'COMPACT VIEW ACTIVATED %U.',
            'SMALLER IS BETTER %U. SOMETIMES.',
            'FLOATING COMPANION %U.',
            'PICTURE IN PICTURE ENGAGED %U.',
            'MINI WINDOW ONLINE %U.',
            'POCKET SIZED %U.',
        ],
    };

    // ── 8. THEME CHANGE ───────────────────────────────────────────

    const THEME_CHANGE = [
        'NICE CHOICE %U.',
        'LOVE THE SWITCH %U.',
        'NEW VIBE DETECTED %U.',
        'AESTHETIC UPDATED %U.',
        'GOOD TASTE %U.',
        'REFRESHING %U.',
        'MOOD SHIFTED %U.',
        'CLEAN SWITCH %U.',
        'DIFFERENT ENERGY %U. NICE.',
        'I LIKE THIS ONE %U.',
        'MOOD UPGRADE %U.',
        'THE VIBE SHIFTS %U.',
        'NICE AESTHETIC %U.',
        'VISUAL REFRESH %U.',
        'THIS ONE FITS %U.',
        'GOOD SWITCH %U.',
    ];

    // ── 9. SYNC SUCCESS ──────────────────────────────────────────

    const SYNC_SUCCESS = [
        'SAVED %U. WELL DONE.',
        'SESSION SYNCED %U.',
        'CLOUD SAVED %U.',
        'DATA LOGGED %U.',
        'RECORD UPDATED %U.',
        'SYNCED AND SECURE %U.',
        'ALL LOGGED %U. CLEAN.',
        'SAFELY STORED %U.',
        'SESSION ARCHIVED %U.',
        'DATA PRESERVED %U.',
        'SYNC COMPLETE %U.',
        'LOGGED AND SECURE %U.',
        'SAVED TO THE CLOUD %U.',
    ];

    // ── 10. SESSION RESET (manual only) ────────────────────────────

    const SESSION_RESET = [
        'FRESH START %U.',
        'RESET COMPLETE %U.',
        'CLEAN SLATE %U.',
        'READY AGAIN %U?',
        'CLOCK RESET %U.',
        'TRY AGAIN %U. NO PRESSURE.',
        'NEW BEGINNING %U.',
        'BACK TO ZERO %U.',
        'RESET. CLEAN. READY %U.',
        'FRESH TIMER %U.',
        'CLEAN CLOCK %U. GO AGAIN.',
    ];

    // ── 11. WAKE MID-SESSION ───────────────────────────────────────

    const WAKE_SESSION = [
        'SESSION IN PROGRESS. %M IN %U.',
        'KEEP GOING %U. %M SO FAR.',
        'WELCOME BACK %U. %M AND COUNTING.',
        'STILL GOING STRONG %U. %M.',
        '%M OF CALM %U.',
        'THE TIMER KEEPS TICKING %U. %M.',
        'YOURE %M DEEP %U.',
        'SESSION ACTIVE %U. %M SO FAR.',
        'BACK TO THE BREATH %U. %M.',
        'MID-SESSION CHECK %U. %M IN.',
        'THE PRACTICE CONTINUES %U. %M.',
        'STILL IN THE ZONE %U. %M DOWN.',
        'DEEP IN %U. %M AND COUNTING.',
        'WELCOME BACK TO THE DEEP %U. %M.',
        'THE CALM PERSISTS %U. %M IN.',
    ];

    // ── 12. AMBIENT WHISPERS (during session) ─────────────────────

    const WHISPER_EARLY = [
        'BREATHE DEEPER %U.',
        'NICE PACE %U.',
        'STAY WITH IT %U.',
        'LET GO %U.',
        'QUIET THE MIND %U.',
        'JUST BREATHE %U.',
        'RELAX YOUR SHOULDERS %U.',
        'INHALE... EXHALE %U.',
        'FIND YOUR CENTER %U.',
        'STILLNESS GROWS %U.',
        'GENTLE FOCUS %U.',
        'YOU ARE HERE %U. THATS ENOUGH.',
        'BREATHE SLOWLY %U.',
        'RELEASE THE TENSION %U.',
        'SOFTEN YOUR GAZE %U.',
        'LET THOUGHTS PASS %U.',
        'GENTLE AWARENESS %U.',
        'RETURN TO THE BREATH %U.',
        'FIND COMFORT IN STILLNESS %U.',
        'THE CALM IS BUILDING %U.',
        'SETTLE IN %U.',
        'BREATHE WITH INTENTION %U.',
    ];

    const WHISPER_MEDIUM = [
        'YOURE IN THE ZONE %U.',
        'DEEP FOCUS DETECTED %U.',
        'BEAUTIFUL STILLNESS %U.',
        'THE MIND IS SETTLING %U.',
        'THIS IS THE PRACTICE %U.',
        'STAY PRESENT %U.',
        'OBSERVE YOUR THOUGHTS %U.',
        'LET THEM PASS %U.',
        'GENTLE AWARENESS %U.',
        'YOURE DOING GREAT %U.',
        'THE CALM IS REAL %U.',
        'DEEPER WITH EACH BREATH %U.',
        'THE BODY IS AT PEACE %U.',
        'STAY IN THIS MOMENT %U.',
        'THE MIND IS QUIET NOW %U.',
        'THIS STILLNESS IS POWERFUL %U.',
        'BREATHE INTO THE CALM %U.',
        'YOUVE FOUND THE SWEET SPOT %U.',
        'THE PRACTICE IS WORKING %U.',
        'SUSTAINED FOCUS %U. NICE.',
        'DEEPER STILL %U.',
        'THE QUIET IS BEAUTIFUL %U.',
    ];

    const WHISPER_LONG = [
        'REMARKABLE ENDURANCE %U.',
        'THE DEEPEST STATE %U.',
        'TRANSCENDENT %U.',
        'YOUR DISCIPLINE IS EXTRAORDINARY %U.',
        'BREATH IS YOUR ANCHOR %U.',
        'THIS IS RARE %U.',
        'PURE PRESENCE %U.',
        'STILL HERE %U. IMPRESSIVE.',
        'MASTER LEVEL FOCUS %U.',
        'THE HOUR MARK PASSED %U.',
        'BEYOND THE ORDINARY %U.',
        'YOUR PRACTICE IS DEEP %U.',
        'THE STILLNESS IS PROFOUND %U.',
        'YOUVE GONE BEYOND %U.',
        'THIS IS WHAT MASTERY FEELS LIKE %U.',
        'THE MIND HAS TRANSCENDED %U.',
        'SUSTAINED DEEP CALM %U.',
        'YOUR FOCUS IS SUPERHUMAN %U.',
        'THE DEEP END IS HOME NOW %U.',
        'EXTRAORDINARY DISCIPLINE %U.',
        'THE PRACTICE IS YOU NOW %U.',
    ];

    const WHISPER_TEXT = [
        'BREATHE.',
        'STILL HERE?',
        'DEEP.',
        'FOCUS.',
        'NICE.',
        'KEEP GOING.',
        'CALM.',
        'PRESENT.',
        'BREATHE SLOW.',
        'QUIET.',
        'SETTLED.',
        'HERE.',
    ];

    /* ═══════════════════════════════════════════════════════════════
       SAFE FACE HELPERS + ANTI-SPAM
       ═══════════════════════════════════════════════════════════════ */

    function faceReady () {
        return window.face && window.face.faceActive && typeof Engine !== 'undefined';
    }
    function faceIdle () {
        return faceReady() && window.face.displayMode === 'face';
    }

    /** Cooldown check — returns true if enough time has passed since last text */
    function textReady (priority) {
        if (priority === 'high') return true;                    // always show
        if (priority === 'medium') {
            return (Date.now() - state.lastTextTime) >= TEXT_COOLDOWN_MS * 0.6;  // 3.3s
        }
        return (Date.now() - state.lastTextTime) >= TEXT_COOLDOWN_MS;           // 5.5s
    }

    /** Full override: glitch → text → reboot. Respects cooldown for low priority. */
    function say (text, priority) {
        if (!faceIdle()) return false;
        if (!textReady(priority || 'low')) return false;
        state.lastTextTime = Date.now();
        window.face.triggerOverride(text.replace(/%U/g, U()));
        return true;
    }

    /** Subtle reaction: expression change + optional mouth animation. No text. */
    function react (expression, mouthMs) {
        if (!faceIdle()) return;
        window.face.setExpression(expression, mouthMs || 2000);
        if (mouthMs) window.face.say(mouthMs);
    }

    /** Celebration: excited expression, double blink, optional text (high priority). */
    function celebrate (text) {
        if (!faceIdle()) return;
        const f = window.face;
        const now = NOW();
        f.setExpression('excited', 2500);
        f.doubleBlink(now);
        if (text) {
            setTimeout(() => { say(text, 'high'); }, 200);
        }
    }

    /** Glance at a screen position briefly */
    function glanceAt (x, y, duration) {
        if (!faceIdle()) return;
        const f = window.face;
        f.lookAt(x, y);
        setTimeout(() => { if (window.face) f.releaseGaze(); }, duration || 800);
    }

    /* ═══════════════════════════════════════════════════════════════
       CORE EVENT HANDLERS
       ═══════════════════════════════════════════════════════════════ */

    function onSessionStart () {
        const user = U();
        const streak = getStreak();
        const todayStr = today();
        const meditatedToday = streak.date === todayStr;

        if (meditatedToday) {
            celebrate(pick(RETURNING_USER));
        } else {
            const previousCount = streak.count || 0;
            const result = updateStreak(0);
            const newCount = result.streak;

            if (STREAK_MSGS[newCount]) {
                setTimeout(() => {
                    if (faceIdle()) say(pick(STREAK_MSGS[newCount]), 'high');
                }, 600);
            } else if (newCount >= 2) {
                const msg = pick(SESSION_START) + ' DAY ' + newCount + '.';
                setTimeout(() => { if (faceIdle()) say(msg, 'high'); }, 600);
            } else {
                setTimeout(() => { if (faceIdle()) say(pick(SESSION_START), 'high'); }, 600);
            }
        }

        // Reset milestone tracker
        state.milestones.clear();
        state.missedMilestones = [];
        state.whisperLast = Date.now();
        state.whisperNextDelay = randBetween(480000, 840000);
    }

    function onSessionFinish (elapsed) {
        const m = toMin(elapsed);

        // Update streak with actual duration
        const result = updateStreak(m);

        // Pick duration bucket
        let bucket;
        if      (m < 1)   bucket = 'micro';
        else if (m < 5)   bucket = 'short';
        else if (m < 15)  bucket = 'medium';
        else if (m < 30)  bucket = 'solid';
        else if (m < 60)  bucket = 'long';
        else if (m < 90)  bucket = 'marathon';
        else if (m < 120) bucket = 'epic';
        else               bucket = 'legendary';

        // Fire finish message (high priority — always shows)
        if (state.missedMilestones.length > 0 && state.missedMilestones.length <= 2) {
            setTimeout(() => {
                if (faceIdle()) {
                    react('surprised', 800);
                    setTimeout(() => { if (faceIdle()) say(pick(FINISH[bucket]), 'high'); }, 1200);
                }
            }, 400);
        } else {
            setTimeout(() => { if (faceIdle()) celebrate(pick(FINISH[bucket])); }, 400);
        }

        // Personal record (high priority, fires after finish message)
        if (result.isRecord && m >= 5) {
            setTimeout(() => {
                if (faceIdle()) celebrate(pick(PERSONAL_RECORD));
            }, 5000);
        }

        // Suppress auto-reset message
        state.suppressNextReset = true;
        setTimeout(() => { state.suppressNextReset = false; }, 1000);
    }

    function onSessionReset () {
        if (state.suppressNextReset) return;
        setTimeout(() => { say(pick(SESSION_RESET), 'medium'); }, 300);
    }

    /* ─── MILESTONE CHECKER (called every tick) ─── */

    const MILESTONE_MARKS = [1, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120];

    function checkMilestones () {
        if (!Engine.session.active) {
            state.milestones.clear();
            state.missedMilestones = [];
            return;
        }
        const elapsed = Date.now() - Engine.session.startTime;
        const m = toMin(elapsed);

        for (const mark of MILESTONE_MARKS) {
            const key = 'm' + mark;
            if (m >= mark && !state.milestones.has(key)) {
                state.milestones.add(key);

                if (faceIdle() && textReady('high')) {
                    // Face is awake — show immediately (high priority)
                    setTimeout(() => {
                        const msg = pick(MILESTONE[mark]).replace(/%U/g, U());
                        if (faceIdle()) {
                            react('happy', 1500);
                            setTimeout(() => { if (faceIdle()) say(msg, 'high'); }, 150);
                        }
                    }, 300);
                } else {
                    // Face asleep or on cooldown — queue for later
                    state.missedMilestones.push(mark);
                }
            }
        }
    }

    /* ─── AMBIENT WHISPER SYSTEM ─── */

    function checkWhisper () {
        if (!Engine.session.active) return;
        if (!window.face || !window.face.faceActive) return;

        const now = Date.now();
        const elapsed = now - Engine.session.startTime;

        // Wait at least 8 minutes before first whisper
        if (elapsed < 480000) return;

        // Check timing
        if (now - state.whisperLast < state.whisperNextDelay) return;

        state.whisperLast = now;
        state.whisperNextDelay = randBetween(480000, 840000);

        // Only whisper 35% of the time (low chance)
        if (Math.random() > 0.35) return;

        // Don't whisper if an override is in progress
        if (!faceIdle()) return;

        // Extra cooldown check — whispers are lowest priority
        if (!textReady('low')) return;

        const m = toMin(elapsed);

        // 20% chance of text whisper (full override), 80% subtle (expression only)
        if (Math.random() < 0.20) {
            const msg = pick(WHISPER_TEXT).replace(/%U/g, U());
            react('content', 2500);
            setTimeout(() => { if (faceIdle()) say(msg, 'low'); }, 200);
        } else {
            // Subtle: expression + blink only, no text
            react('content', 2200);
            window.face.triggerBlink(NOW());
        }
    }

    /* ─── THEME CHANGE REACTION ─── */

    function onThemeChange (themeId) {
        if (!faceIdle()) return;

        // Only react 30% of the time — prevents spam when browsing themes
        if (!chance(30)) return;

        // Still respect cooldown
        if (!textReady('low')) return;

        const theme = (Engine.themes || []).find(t => t.id === themeId);
        const name = theme ? theme.name.replace(/[☆✦]/g, '').trim() : themeId;

        setTimeout(() => {
            if (faceIdle()) {
                react('happy', 1800);
                setTimeout(() => {
                    if (faceIdle()) say(pick(THEME_CHANGE) + ' ' + name.toUpperCase() + '.', 'low');
                }, 200);
            }
        }, 300);
    }

    /* ─── SYNC CELEBRATION ─── */

    function triggerSyncCelebration () {
        if (!faceIdle()) return;
        celebrate(pick(SYNC_SUCCESS));
    }

    /* ═══════════════════════════════════════════════════════════════
       HOOK INSTALLATION
       ═══════════════════════════════════════════════════════════════ */

    function installHooks () {
        if (state.hooksInstalled) return;
        if (typeof Engine === 'undefined') return;
        if (!window.face) return;

        state.hooksInstalled = true;

        /* ── 1. SESSION LIFECYCLE ── */

        const origHandleSessionClick = Engine.handleSessionClick.bind(Engine);
        Engine.handleSessionClick = function () {
            const before = { active: Engine.session.active, finished: Engine.session.finished };
            origHandleSessionClick();
            const after  = { active: Engine.session.active, finished: Engine.session.finished };

            if (!before.active && !before.finished && after.active) {
                onSessionStart();
            }
            if (before.active && after.finished) {
                onSessionFinish(Engine.session.elapsed);
            }
            if (before.finished && !after.finished && !after.active) {
                onSessionReset();
            }
        };

        /* ── 2. TICK (milestones + whispers) ── */

        const origTick = Engine.tick.bind(Engine);
        Engine.tick = function () {
            origTick();
            checkMilestones();
            checkWhisper();
        };

        /* ── 3. THEME CHANGE ── */

        const origLoadTheme = Engine.loadTheme.bind(Engine);
        Engine.loadTheme = function (themeId) {
            const wasInitialized = !!Engine.currentThemeObj;
            const oldId = Engine.state.activeThemeId;
            origLoadTheme(themeId);
            if (wasInitialized && oldId !== themeId) {
                setTimeout(() => onThemeChange(themeId), 500);
            }
        };

        /* ── 4. ENHANCED BUTTON REACTIONS ── */
        // FIX: The original wrapper passed BUTTON_REACTIONS text straight to
        // origTrigger without resolving %U. Now we resolve it here.

        const origTrigger = window.face.triggerOverride.bind(window.face);
        window.face.triggerOverride = function (text) {
            const replacements = BUTTON_REACTIONS[text];
            if (replacements) {
                // Only react 40% of the time — prevents text spam on rapid clicks
                if (chance(40)) {
                    const msg = pick(replacements).replace(/%U/g, U());
                    origTrigger(msg);
                }
                // else: silent — no text, no glitch. Just ignore.
            } else {
                origTrigger(text);
            }
        };

        /* ── 5. NAVBAR BUTTON REACTIONS ── */
        // Direct click handler — goes through say() which does %U replacement
        // and respects the cooldown system. Called BEFORE triggerOverride wrapper
        // so it handles the text; triggerOverride wrapper is kept as safety net.

        const NAV_BTN_MAP = {
            'btn-fullscreen': 'Focus Mode',
            'btn-exit-fs':    'Exiting',
            'btn-library':    'Library',
            'btn-settings':   'Config',
            'btn-pip':        'Pip',
        };

        document.addEventListener('click', function navBtnHandler (e) {
            const btn = e.target.closest('button');
            if (!btn || !btn.id) return;

            const reactionKey = NAV_BTN_MAP[btn.id];
            if (!reactionKey) return;           // not a navbar button we handle
            if (!faceIdle()) return;            // face is busy

            const pool = BUTTON_REACTIONS[reactionKey];
            if (!pool) return;

            // Only react ~35% of the time to avoid spam
            if (chance(35)) {
                say(pick(pool), 'low');
            }
        });

        /* ── 5b. SYNC BUTTON (special: delayed celebration) ── */

        document.addEventListener('click', function syncHandler (e) {
            const btn = e.target.closest('button');
            if (!btn || btn.id !== 'btn-sync') return;

            if (faceIdle()) react('curious', 2000);

            setTimeout(() => {
                const syncMsg = document.getElementById('sync-msg');
                if (syncMsg && syncMsg.innerText === 'Session Saved') {
                    triggerSyncCelebration();
                }
            }, 2200);
        });

        /* ── 6. WAKE MID-SESSION (replace generic greeting) ── */
        // FIX: origShowFace() schedules its _greetTimer inside a setTimeout(300ms).
        //      We wait 500ms (after the inner 300ms fires) before clearing and
        //      replacing the timer, so the generic greeting gets properly overridden.

        const origShowFace = window.face.showFace.bind(window.face);
        window.face.showFace = function () {
            origShowFace();

            if (typeof Engine !== 'undefined' && Engine.session.active) {
                const elapsed = Date.now() - Engine.session.startTime;
                const m = toMin(elapsed);
                const user = U();
                const formatted = fmtMin(m);

                setTimeout(() => {
                    clearTimeout(this._greetTimer);

                    this._greetTimer = setTimeout(() => {
                        if (this.faceActive && this.displayMode === 'face') {
                            if (state.missedMilestones.length > 0) {
                                const lastMissed = state.missedMilestones[state.missedMilestones.length - 1];
                                if (MILESTONE[lastMissed]) {
                                    const milestoneMsg = pick(MILESTONE[lastMissed]).replace(/%U/g, user);
                                    say(milestoneMsg, 'high');
                                    state.missedMilestones = [];
                                    return;
                                }
                            }
                            say(pick(WAKE_SESSION).replace(/%U/g, user).replace(/%M/g, formatted), 'high');
                        }
                    }, 3000);
                }, 500);
            }
        };

        /* ── 7. SESSION PANEL GLANCE ── */

        const sessionHandle = document.getElementById('session-handle');
        if (sessionHandle) {
            sessionHandle.addEventListener('click', () => {
                if (!faceIdle()) return;
                glanceAt(0.5, 0.6, 1200);
                react('curious', 1500);
            });
        }

        /* ── 8. FULLSCREEN TOGGLE CELEBRATION ── */

        const origEnterFs = Engine.enterFullscreen.bind(Engine);
        Engine.enterFullscreen = function () {
            origEnterFs();
            setTimeout(() => {
                if (faceIdle()) {
                    window.face.setExpression('excited', 1200);
                    window.face.triggerBlink(NOW());
                }
            }, 100);
        };

        console.log('[face-interactions] All hooks installed ✓');
    }

    /* ═══════════════════════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════════════════════ */

    function boot () {
        installHooks();
        if (!state.hooksInstalled) {
            setTimeout(boot, 600);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200));
    } else {
        setTimeout(boot, 1200);
    }

})();