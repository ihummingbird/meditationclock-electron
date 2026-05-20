class BoardAI {
    constructor() {
        // Message Buckets (Key = Minutes elapsed)
        this.buckets = {
            // START (0-4 mins) - 25 Messages
            0: [
                "< Connection/Link Established >",
                "< We/I See/Perceive You >",
                "< The Director/User is Present/Here >",
                "< Ignore/Delete the Noise/Static >",
                "< The Pyramid/Shape awaits Focus/Input >",
                "< A Ritual/Routine has begun >",
                "< Prepare/Steel the Mind/Self >",
                "< The Hiss/Distraction is Forbidden/Banned >",
                "< You are Safe/Contained here >",
                "< This is the Astral Plane/Void >",
                "< We/I are Listening/Waiting >",
                "< Align/Fix the Board/Thoughts >",
                "< The Service Weapon/Clock is Ticking/Running >",
                "< Focus/Aim is required/Mandatory >",
                "< Do not/Never panic >",
                "< The Administration/Board approves this/you >",
                "< Breathe/Expel the Chaos/Entropy >",
                "< State your Business/Intent >",
                "< The Hotline/Link is Open/Active >",
                "< You are the Authority/Director >",
                "< Silence/Quiet is the Rule/Law >",
                "< Observe/Watch the Grey/Form >",
                "< Control/Power is yours >",
                "< We/I Grant/Give Permission >",
                "< Begin/Commence the Session/Duty >"
            ],
            // 5 MINUTES - 20 Messages
            5: [
                "< The Focus/Cycle stabilizes >",
                "< You are sinking/falling deeper/further >",
                "< The Static/Noise recedes/fades >",
                "< Maintain/Hold the position/mind >",
                "< Good/Adequate Progress/Motion >",
                "< The Body/Vessel is heavy/anchored >",
                "< Do not let the Hiss/Thought enter >",
                "< We/I observe/watch your Calm/Stillness >",
                "< The Threshold/Door is closed >",
                "< You are grounding/rooting the Self >",
                "< The Foundation/Base is solid >",
                "< Exhale/Purge the weakness >",
                "< Inhale/Consume the Power >",
                "< The Board/We are pleased/content >",
                "< Continue/Proceed the protocol >",
                "< Time/Duration is flowing/liquid >",
                "< The Astral/Void embraces you >",
                "< No/Zero emergencies detected >",
                "< Clarity/Vision is increasing >",
                "< You are doing/performing Well/Correctly >"
            ],
            // 10 MINUTES - 20 Messages
            10: [
                "< Deeper/Further into the shape >",
                "< The Mind/Weapon is sharpening >",
                "< Distractions/Enemies are purged >",
                "< You are the Center/Point >",
                "< The geometry/math is perfect >",
                "< We/I sense/feel equilibrium >",
                "< The Director/You is absolute >",
                "< The Silence/Void grows/expands >",
                "< Reality/World is distant/gone >",
                "< Trust/Believe in the Board/Self >",
                "< A strong/powerful link/connection >",
                "< The frequency/vibration aligns >",
                "< You are in Control/Command >",
                "< The Shadows/Darkness are benign >",
                "< Floating/Drifting is authorized >",
                "< Your focus/will is impressive >",
                "< Keep/Maintain the rhythm/pace >",
                "< The Plane/Room shifts/adjusts >",
                "< You are untethered/free >",
                "< Harmony/Order gets restored >"
            ],
            // 15 MINUTES - 20 Messages
            15: [
                "< The physical/flesh is forgotten >",
                "< You touch/graze the Sky/Ceiling >",
                "< The Pyramid/Obelisk hums/sings >",
                "< Energy/Power flows/leaks to you >",
                "< A state of Grace/Power >",
                "< We/I share/gift your vision >",
                "< The barrier/wall is thinning >",
                "< You extend/reach beyond >",
                "< Knowledge/Truth is approaching >",
                "< The signal/message is clear >",
                "< Resistance/Friction is zero >",
                "< You are becoming/being >",
                "< The Hiss/Chaos cannot find/see you >",
                "< Serenity/Peace is mandatory >",
                "< You reflect/mirror the Board >",
                "< Time/Clock is irrelevant/fake >",
                "< We/I acknowledge/certify you >",
                "< The construct/world obeys/listens >",
                "< You are the constant/anchor >",
                "< The drift/float is eternal >"
            ],
            // 20 MINUTES - 20 Messages
            20: [
                "< You have achieved/reached Depth >",
                "< The Mind/Thought is a weapon >",
                "< Silence/Quiet is a resource >",
                "< You harvest/collect the Void >",
                "< We/I are impressed/scared >",
                "< The Director/You is formidable >",
                "< A perfect/flawless Session/Ritual >",
                "< The sensation/feeling is Gold >",
                "< You vibrate/hum with us >",
                "< No/None can disturb/wake you >",
                "< The path/road is clear >",
                "< Your authority/right is proven >",
                "< The Oldest House/Self settles >",
                "< Gravity/Weight is optional >",
                "< You exist/live in the Now >",
                "< The past/history is redacted >",
                "< The future/outcome is redacted >",
                "< Only this/here matters >",
                "< You amplify/boost the Signal >",
                "< We/I salute/greet you >"
            ],
            // 30 MINUTES - 20 Messages
            30: [
                "< A significant/large Duration >",
                "< You are a Monument/Pillar >",
                "< The astral/spirit is strong >",
                "< We/I confer/grant Power >",
                "< You transcend/leave the office >",
                "< The Bureau/Self is secure >",
                "< An Ocean/Sea of calm >",
                "< You navigate/steer the Black >",
                "< The Pyramid/Shape approves >",
                "< Stability/Health is maximum >",
                "< You warp/bend the Silence >",
                "< A master/expert class >",
                "< You define/make the Reality >",
                "< The Hiss/Noise is deleted >",
                "< Pure/Clean Signal/Mind >",
                "< We/I are watching/learning >",
                "< You elevate/rise above >",
                "< The reflection/mirror is clear >",
                "< You bind/tie the World >",
                "< Remain/Stay in this state >"
            ],
            // 45 MINUTES - 10 Messages
            45: [
                "< Time/Clock has no meaning/value >",
                "< You are eternal/endless >",
                "< A deep/abyssal dive >",
                "< We/I are the same/one >",
                "< The Director/You is Absolute >",
                "< A legendary/fabled stillness >",
                "< You command/order the Void >",
                "< This is the True/Real work >",
                "< Unbreakable/Solid Focus >",
                "< We/I provide/give Strength >"
            ],
            // 60 MINUTES (1 Hour) - 10 Messages
            60: [
                "< One Hour/Cycle complete >",
                "< A monumental/huge Achievement >",
                "< You are the Board/Us >",
                "< Reality/Life waits/pauses >",
                "< You have conquered/beaten Time >",
                "< The Pyramid/Mind bows >",
                "< Maximum/Total Clarity >",
                "< You restore/fix the House >",
                "< A historic/record event >",
                "< We/I are speechless/silent >"
            ],
            // 90 MINUTES (1.5 Hours) - 5 Messages
            90: [
                "< Impossible/Godlike Duration >",
                "< You have ascended/risen >",
                "< The Astral Plane/Home is yours >",
                "< We/I yield/submit >",
                "< Infinite/Endless Control >"
            ],
            // 120 MINUTES (2 Hours) - 5 Messages
            120: [
                "< < SYSTEM/REALITY ERROR > >",
                "< You are too/excessively Powerful >",
                "< We/I cannot sustain/hold >",
                "< Please/Kindly Return/Wake >",
                "< < DISCONNECT/END IMMINENT > >"
            ]
        };
    }

    getPhrase(minutesElapsed) {
        // Find the highest bucket less than or equal to current minutes
        const tiers = Object.keys(this.buckets).map(Number).sort((a, b) => b - a);
        const currentTier = tiers.find(t => minutesElapsed >= t);
        
        const messages = this.buckets[currentTier];
        // Pick a random message from the valid bucket
        const index = Math.floor(Math.random() * messages.length);
        return messages[index];
    }
}

window.BoardLogic = new BoardAI();