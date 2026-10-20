/* All onboarding, tutorial, and just-in-time guidance copy lives here for easy translation. */
(function (root) {
  'use strict';
  root.TC_TIPS = {
    en: {
      welcome: [
        { title: 'A heavy heart', text: 'Thiri fell asleep with a heavy heart. Her feelings ran into the Night Side.' },
        { title: 'Bring them home', text: 'Help Shwe bring them home. Catch Moodlings before sunrise; each feeling has its own way to be caught.' },
        { title: 'Every night grows something', text: 'Earn Glow, upgrade Shwe, fill the Mood Book (17 feelings), unlock 7 nights and the sunrise ending.' }
      ],
      tutorial: [
        { title: 'Move', text: 'Walk a little to guide Shwe.', action: 'move' },
        { title: 'Jump', text: 'Hop once to learn the jump.', action: 'jump' },
        { title: 'Sneak', text: 'Hold Shift or nudge the stick halfway.', action: 'sneak' },
        { title: 'Catch a Moodling', text: 'Pounce the glowing practice Moodling.', action: 'catch' },
        { title: 'Dodge Frustrated', text: 'Step aside when Frustrated charges.', action: 'dodge' },
        { title: 'Pounce while dizzy', text: 'Pounce again while Frustrated is dizzy.', action: 'dizzy-pounce' },
        { title: 'Night Eyes', text: 'Night Eyes reveal nearby hiding places.', action: 'eyes' },
        { title: 'Scratch a hiding spot', text: 'Scratch the glowing practice spot nearby.', action: 'scratch' },
        { title: 'Bring the lights home', text: 'Bring each required light home before sunrise.', action: 'home' }
      ],
      success: 'Lovely! Another little step learned.',
      skipTutorial: 'Skip tutorial',
      jitLabel: 'A little tip',
      struggleLabel: 'A gentle hint',
      struggleTitle: 'Take your time',
      mechanicTitles: { nervous: 'Nervous', jealous: 'Jealous', lonely: 'Lonely', shy: 'Shy', excited: 'Excited', buried: 'Buried', calm: 'Calm', combo: 'Combo', free: 'Free Play' },
      next: 'Next',
      finishWelcome: 'Choose your cat →',
      skipWelcome: 'Skip',
      welcomeLabel: 'Welcome to TideCatcher',
      tutorialLabel: 'Night 1 · Guided steps',
      controlLabels: {
        move: { keyboard: 'A / D or ← / →', touch: 'Left joystick' },
        jump: { keyboard: 'Space or ↑', touch: 'JUMP button' },
        sneak: { keyboard: 'Hold Shift while moving', touch: 'Hold the stick halfway' },
        catch: { keyboard: 'J or X', touch: 'POUNCE button' },
        dodge: { keyboard: 'A / D or ← / →', touch: 'Left joystick' },
        'dizzy-pounce': { keyboard: 'J or X', touch: 'POUNCE button' },
        eyes: { keyboard: 'E', touch: 'EYES button' },
        scratch: { keyboard: 'S', touch: 'SCRATCH button' },
        purr: { keyboard: 'K (if unlocked)', touch: 'Purr button (if unlocked)' },
        pause: { keyboard: 'Esc or P', touch: 'Pause button' },
        home: { keyboard: 'Move, then pounce', touch: 'Joystick, then POUNCE' }
      },
      mechanics: {
        nervous: 'Nervous hears running. Sneak close, then pounce.',
        jealous: 'Jealous steals trail lights. Catch it when tired.',
        lonely: 'Walk slowly. Sit still beside Lonely.',
        shy: 'Freeze while Shy looks. Move when it hides.',
        excited: 'Jump, then pounce at the very top of its bounce.',
        buried: 'Use Night Eyes; scratch the marked place to reveal it.',
        calm: 'Gather three fireflies slowly, then bring their light to Calm.',
        combo: 'Catch within four seconds; chains grow up to ×5.',
        free: 'Every catch adds two seconds; hits cost three seconds.',
        struggleHits: 'You’re doing fine. Wait for charges; pounce only when dizzy.',
        struggleQuiet: 'Try moving slowly; each feeling has its own way home.'
      },
      sky: {
        A: 'A feeling is falling. Wait for it to land, then pounce.',
        B: 'Pounce it mid-air while it is falling.',
        C: 'Pounce mid-air, then scratch before it escapes.'
      },
      help: {
        title: 'How to play',
        subtitle: 'A small guide for the Night Side.',
        controls: 'Controls',
        keyboard: 'Keyboard',
        touch: 'Touch controls',
        moods: 'Moodlings',
        moodsNote: 'Unknown feelings stay hidden until you meet them.',
        glow: 'Glow & upgrades',
        glowText: 'Catches earn Glow; combos earn more. Spend Glow on upgrades, cats, and comfort items.',
        combos: 'Combos',
        comboText: 'Catch again within four seconds. Chains grow to ×5 for bigger rewards.',
        story: 'Replay the story',
        close: 'Back',
        unknown: 'Unknown feeling',
        unknownHint: 'Catch one to reveal its name and how it returns home.',
        controlNames: { move: 'Move', jump: 'Jump', sneak: 'Sneak', catch: 'Pounce / catch', eyes: 'Night Eyes', scratch: 'Scratch', purr: 'Purr (upgrade)', pause: 'Pause' },
        nextNight: 'Next night',
        bookGoal: 'Mood Book',
        upgradeGoal: 'Next upgrade',
        allUpgrades: 'All upgrades are ready!',
        noAffordable: 'Save Glow for',
        tutorialReplayMessage: 'Choose Night 1 on the map to replay the guided steps.'
      }
    },
    my: {
      welcome: [
        { title: 'လေးလံသောနှလုံးသား', text: 'သီရိ လေးလံသောနှလုံးသားဖြင့် အိပ်ပျော်သွားသည်။ သူမ၏ခံစားချက်များ ညဘက်ကမ္ဘာထဲသို့ ပြေးဝင်သွားသည်။' },
        { title: 'သူတို့ကို အိမ်ပြန်ပို့ပါ', text: 'Shwe ကိုကူညီပြီး သူတို့ကို အိမ်ပြန်ပို့ပါ။ နေမထွက်မီ Moodling များကိုဖမ်းပါ။ ခံစားချက်တိုင်းတွင် ဖမ်းနည်း မတူပါ။' },
        { title: 'ညတိုင်း တစ်စုံတစ်ရာ ကြီးထွားလာသည်', text: 'Glow ရယူပါ၊ Shwe ကို အဆင့်မြှင့်ပါ၊ Mood Book တွင် ခံစားချက် ၁၇ မျိုးစုပါ၊ ည ၇ ညနှင့် နေထွက်အဆုံးသတ်ကို ဖွင့်ပါ။' }
      ],
      tutorial: [
        { title: 'ရွေ့ပါ', text: 'Shwe ကို လမ်းညွှန်ရန် အနည်းငယ် လျှောက်ပါ။', action: 'move' },
        { title: 'ခုန်ပါ', text: 'ခုန်ခြင်းကို လေ့လာရန် တစ်ကြိမ် ခုန်ပါ။', action: 'jump' },
        { title: 'တိတ်တိတ်လေး သွားပါ', text: 'Shift ကိုဖိထားပါ၊ သို့မဟုတ် joystick ကို တစ်ဝက်တွန်းပါ။', action: 'sneak' },
        { title: 'Moodling ဖမ်းပါ', text: 'တောက်ပသော လေ့ကျင့် Moodling ကို ခုန်တိုက်ပါ။', action: 'catch' },
        { title: 'Frustrated ကို ရှောင်ပါ', text: 'Frustrated ပြေးဝင်လာချိန် ဘေးသို့ ရွေ့ပါ။', action: 'dodge' },
        { title: 'မူးနေချိန် ခုန်တိုက်ပါ', text: 'Frustrated မူးဝေနေချိန်တွင် ထပ်ခုန်တိုက်ပါ။', action: 'dizzy-pounce' },
        { title: 'Night Eyes', text: 'အနီးရှိ ပုန်းကွယ်ရာများကို Night Eyes ဖြင့် ရှာပါ။', action: 'eyes' },
        { title: 'ပုန်းရာကို ကုတ်ပါ', text: 'တောက်ပနေသော လေ့ကျင့်ရာနေရာကို ကုတ်ပါ။', action: 'scratch' },
        { title: 'အလင်းများကို အိမ်ပြန်ပို့ပါ', text: 'နေမထွက်မီ လိုအပ်သော အလင်းတိုင်းကို အိမ်ပြန်ပို့ပါ။', action: 'home' }
      ],
      success: 'ကောင်းလိုက်တာ! အဆင့်ငယ်လေးတစ်ခု ထပ်သင်ယူပြီးပါပြီ။',
      skipTutorial: 'သင်ခန်းစာ ကျော်မည်',
      jitLabel: 'အကြံပြုချက်လေး',
      struggleLabel: 'ညင်သာသော အကူအညီ',
      struggleTitle: 'အချိန်ယူပါ',
      mechanicTitles: { nervous: 'Nervous', jealous: 'Jealous', lonely: 'Lonely', shy: 'Shy', excited: 'Excited', buried: 'Buried', calm: 'Calm', combo: 'Combo', free: 'Free Play' },
      next: 'ရှေ့သို့',
      finishWelcome: 'ကြောင်ကို ရွေးပါ →',
      skipWelcome: 'ကျော်မည်',
      welcomeLabel: 'TideCatcher မှ ကြိုဆိုပါသည်',
      tutorialLabel: 'ည ၁ · လမ်းညွှန်အဆင့်များ',
      controlLabels: {
        move: { keyboard: 'A / D သို့မဟုတ် ← / →', touch: 'ဘယ်ဘက် joystick' },
        jump: { keyboard: 'Space သို့မဟုတ် ↑', touch: 'JUMP ခလုတ်' },
        sneak: { keyboard: 'ရွေ့လျားစဉ် Shift ဖိထားပါ', touch: 'joystick ကို တစ်ဝက်တွန်းဖိထားပါ' },
        catch: { keyboard: 'J သို့မဟုတ် X', touch: 'POUNCE ခလုတ်' },
        dodge: { keyboard: 'A / D သို့မဟုတ် ← / →', touch: 'ဘယ်ဘက် joystick' },
        'dizzy-pounce': { keyboard: 'J သို့မဟုတ် X', touch: 'POUNCE ခလုတ်' },
        eyes: { keyboard: 'E', touch: 'EYES ခလုတ်' },
        scratch: { keyboard: 'S', touch: 'SCRATCH ခလုတ်' },
        purr: { keyboard: 'K (ဖွင့်ထားလျှင်)', touch: 'Purr ခလုတ် (ဖွင့်ထားလျှင်)' },
        pause: { keyboard: 'Esc သို့မဟုတ် P', touch: 'Pause ခလုတ်' },
        home: { keyboard: 'ရွေ့ပြီး ခုန်တိုက်ပါ', touch: 'joystick နှင့် POUNCE' }
      },
      mechanics: {
        nervous: 'Nervous သည် ပြေးသံကြားသည်။ တိတ်တိတ်လေး ချဉ်းကပ်ပြီး ခုန်တိုက်ပါ။',
        jealous: 'Jealous သည် အလင်းများကို ခိုးယူသည်။ မောပန်းချိန်တွင် ဖမ်းပါ။',
        lonely: 'ဖြည်းဖြည်းသွားပါ။ Lonely ဘေးတွင် ငြိမ်သက်စွာ ထိုင်ပါ။',
        shy: 'Shy ကြည့်နေချိန် ငြိမ်နေပါ။ မျက်နှာလွှဲချိန် ရွေ့ပါ။',
        excited: 'ခုန်တက်ပြီး အမြင့်ဆုံးရောက်ချိန်တွင် ခုန်တိုက်ပါ။',
        buried: 'Night Eyes ဖြင့်ရှာပြီး အမှတ်အသားရှိရာကို ကုတ်ဖော်ပါ။',
        calm: 'ပိုးစုန်းကြူး သုံးကောင်ကို ဖြည်းဖြည်းစု၍ Calm ထံ အလင်းပို့ပါ။',
        combo: 'လေးစက္ကန့်အတွင်း ထပ်ဖမ်းပါ။ ဆက်တိုက်ဖမ်းမှုသည် ×5 အထိ တိုးသည်။',
        free: 'တစ်ခါဖမ်းတိုင်း နှစ်စက္ကန့်တိုးသည်။ ထိမိလျှင် သုံးစက္ကန့်လျော့သည်။',
        struggleHits: 'စိတ်မပူပါနှင့်။ ပြေးဝင်မှုကို စောင့်ပြီး မူးဝေချိန်မှ ခုန်တိုက်ပါ။',
        struggleQuiet: 'ဖြည်းဖြည်းရွေ့ကြည့်ပါ။ ခံစားချက်တိုင်းတွင် အိမ်ပြန်နည်း မတူပါ။'
      },
      sky: {
        A: 'ခံစားချက်တစ်ခု ကျလာနေသည်။ ဆင်းလာသည်အထိစောင့်ပြီး ခုန်တိုက်ပါ။',
        B: 'ကျလာနေချိန် လေထဲတွင် ခုန်တိုက်ပါ။',
        C: 'လေထဲတွင် ခုန်တိုက်ပြီး မလွတ်ခင် ကုတ်ပါ။'
      },
      help: {
        title: 'ကစားနည်း',
        subtitle: 'ညဘက်ကမ္ဘာအတွက် လမ်းညွှန်အကျဉ်း။',
        controls: 'ထိန်းချုပ်မှုများ',
        keyboard: 'ကီးဘုတ်',
        touch: 'ထိတွေ့ထိန်းချုပ်မှု',
        moods: 'Moodling များ',
        moodsNote: 'မတွေ့ဖူးသေးသော ခံစားချက်များကို မတွေ့မချင်း ဖုံးကွယ်ထားသည်။',
        glow: 'Glow နှင့် အဆင့်မြှင့်မှုများ',
        glowText: 'ဖမ်းယူမှုမှ Glow ရပြီး combo ဖြင့် ပိုရသည်။ Glow ကို အဆင့်မြှင့်မှု၊ ကြောင်နှင့် ပစ္စည်းများတွင် သုံးပါ။',
        combos: 'Combo များ',
        comboText: 'လေးစက္ကန့်အတွင်း ထပ်ဖမ်းပါ။ ပိုကြီးသောဆုအတွက် ×5 အထိ ဆက်ဖမ်းနိုင်သည်။',
        story: 'ဇာတ်လမ်း ပြန်ဖွင့်ပါ',
        close: 'ပြန်သွားမည်',
        unknown: 'မတွေ့ဖူးသေးသော ခံစားချက်',
        unknownHint: 'အမည်နှင့် အိမ်ပြန်နည်းကို သိရန် တစ်ကောင်ဖမ်းပါ။',
        controlNames: { move: 'ရွေ့ပါ', jump: 'ခုန်ပါ', sneak: 'တိတ်တိတ်လေးသွားပါ', catch: 'ခုန်တိုက် / ဖမ်းပါ', eyes: 'Night Eyes', scratch: 'ကုတ်ပါ', purr: 'Purr (အဆင့်မြှင့်မှု)', pause: 'ခေတ္တရပ်ပါ' },
        nextNight: 'နောက်ည',
        bookGoal: 'Mood Book',
        upgradeGoal: 'နောက်တစ်ဆင့်မြှင့်မှု',
        allUpgrades: 'အဆင့်မြှင့်မှုအားလုံး ပြီးပါပြီ။',
        noAffordable: 'Glow စုဆောင်းရန်',
        tutorialReplayMessage: 'လမ်းညွှန်ကို ပြန်ကစားရန် မြေပုံမှ ည ၁ ကို ရွေးပါ။'
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
