/* All onboarding, tutorial, and just-in-time guidance copy lives here for easy translation. */
(function (root) {
  'use strict';
  root.TC_TIPS = {
    en: {
      welcome: [
        { title: 'A heavy heart', text: 'A girl fell asleep with a heavy heart. Her feelings ran into the Night Side.' },
        { title: 'Bring them home', text: 'Help her cat bring them home. Catch Moodlings before sunrise; each feeling has its own way to be caught.' },
        { title: 'Every night grows something', text: 'Earn Glow, upgrade your cat, fill the Mood Book (17 feelings), complete 7 story nights, then take on 43 tougher moonlit routes.' }
      ],
      tutorial: [
        { title: 'Walk with me', text: 'Meow! Guide me toward the glowing paw circle. Move a few steps along the floor.', action: 'move' },
        { title: 'A little hop', text: 'Let’s jump! Press Jump, then land safely on a shelf or the floor.', action: 'jump' },
        { title: 'Soft paws', text: 'Now walk quietly for a few steps. Hold Shift while moving, or keep the joystick inside its inner ring.', action: 'sneak' },
        { title: 'Bring a light home', text: 'See our glowing practice friend? Move close and press Pounce to catch it. It cannot hurt us.', action: 'catch' }
      ],
      tutorialComplete: 'You did it! Now let’s bring the feelings home.',
      bossIntro: { title: 'Storm Frustrated', text: 'Dodge each charge. When the storm gets dizzy, pounce. Three good pounces open the moon door.', dodge: '↔ Dodge or jump', pounce: '✦ Pounce when dizzy', ready: 'Face the storm', warning: 'Storm Frustrated is winding up!', dizzy: 'It is dizzy! Pounce now!', hit: 'A stormy bump · {lives} lives left', defeated: 'The storm is calm. The moon door is open!', fail: 'Shwe ran out of lives in the storm challenge. The lights already safe in the Mood Book remain yours.' },
      success: 'Purrfect! You learned it by doing it.',
      skipTutorial: 'Skip tutorial',
      jitLabel: 'A little tip',
      catchClipHint: 'Replay its short clip in How to play.',
      struggleLabel: 'A gentle hint',
      struggleTitle: 'Take your time',
      mechanicTitles: { nervous: 'Nervous', jealous: 'Jealous', lonely: 'Lonely', shy: 'Shy', excited: 'Excited', buried: 'Buried', calm: 'Calm', combo: 'Combo', free: 'Free Play', wallJump: 'Wall jump & ledge grab' },
      weather: {
        titles: { rain: 'Light rain', wind: 'Soft wind', fog: 'Moon fog' },
        tips: { rain: 'Light rain makes the ground slippery. Ease off the controls to stop, and listen for Lonely’s chime.', wind: 'A soft wind nudges Shwe’s jumps a little higher or lower. Watch the breeze and adjust your landing.', fog: 'Moon fog hides distant details. Night Eyes now reaches farther, so look around for hidden glows.' }
      },
      puddleTip: 'Watch the puddles! Their splash can startle Nervous. Sneak across quietly.',
      pagodaBellTip: 'Brush a hanging bell to send a gentle chime through the hill and calm nearby Moodlings.',
      next: 'Next',
      finishWelcome: 'Choose your cat →',
      skipWelcome: 'Skip',
      welcomeLabel: 'Welcome to TideCatcher',
      tutorialLabel: 'Night 1 · Guided steps',
      nightPreview: { title: 'Tonight’s route · find the sunrise goal', skip: 'Press any key or tap to skip' },
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
        free: 'No clock, no score. Wander, catch for fun, and pause when you want to go home.',
        wallJump: 'Press Jump as you touch a wall to spring away. Reach a shelf edge and Shwe will grab it, then climb up after a moment.',
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
        moods: 'How to catch each Moodling',
        moodsNote: 'Meet a Moodling to unlock its catch clip. Shwe also shares a tip the first time each one appears.',
        glow: 'Glow & upgrades',
        glowText: 'Catches earn Glow; combos earn more. Spend Glow on upgrades, cats, and comfort items.',
        combos: 'Combos',
        comboText: 'Catch again within four seconds. Chains grow to ×5 for bigger rewards.',
        story: 'Replay the story',
        close: 'Back',
        unknown: 'Unknown feeling',
        unknownHint: 'Not met yet. Watch the clip to learn how to catch it.',
        catchClipButton: '▶ Watch catch clip',
        catchClipLabel: 'CATCH GUIDE',
        catchClipNoButton: 'No button — watch Shwe', catchClipGalleryLabel: 'Catch clip and steps', catchClipPlay: 'Play clip', catchClipPause: 'Pause clip', catchClipVideoLabel: 'Gameplay clip', catchClipStepsLabel: 'How to catch, step by step', catchClipControlsLabel: 'Control for this step',
        catchClipClose: 'Close clip',
        catchClipStep: 'Step',
        catchClipPrev: 'Previous picture', catchClipNext: 'Next picture',
        catchClipGlow: '+Glow',
        catchClipOr: 'or',
        catchClipActionLabels: { RUN: 'RUN', DODGE: 'DODGE', JUMP: 'JUMP', POUNCE: 'POUNCE', EYES: 'NIGHT EYES', SCRATCH: 'SCRATCH', HOLD: 'HOLD', RELEASE: 'LET GO', MOVE: 'MOVE', CHASE: 'CHASE', 'SLOW WALK': 'SLOW WALK', 'MOVE + POUNCE': 'MOVE, THEN POUNCE' },
        catchClipTouchLabels: { move: 'Move', sneak: 'Sneak', jump: 'Jump', pounce: 'Pounce', eyes: 'Eyes', scratch: 'Scratch', hold: 'Hold', release: 'Let go' },
        catchClipStages: ['NOTICE', 'TRY IT', 'BRING IT HOME'],
        catchClipSteps: {
          F: ['Watch for the rush. Frustrated is winding up.', 'Dodge to the side and let the charge pass.', 'Pounce while Frustrated is dizzy.'],
          N: ['Running paws scare Nervous. Watch for the ✕ too loud sign.', 'Hold Shift to sneak; the quiet ring keeps Nervous calm.', 'When Nervous relaxes, pounce to bring it home.'],
          L: ['Listen for Lonely’s chime. Press E for Night Eyes to reveal its glow.', 'Press S to scratch the glowing hiding spot.', 'Sit quietly beside Lonely while the ring fills.'],
          B: ['Press E for Night Eyes to reveal the marked place.', 'Press S to scratch and dig Buried out.', 'When Buried pops out, pounce to bring it home.'],
          E: ['Watch Excited bounce higher and higher.', 'Jump as it reaches the top of its bounce.', 'Pounce while you are close in the air.'],
          S: ['Shy peeks out and watches Shwe approach.', 'Let go of movement while Shy looks at you.', 'Move when Shy looks away, then pounce.'],
          J: ['Jealous steals a glowing light from your trail.', 'Chase after Jealous to get the light back.', 'Pounce when Jealous gets tired.'],
          C: ['Walk slowly through the reeds as fireflies appear.', 'Stop and sit still beside Calm.', 'Stay quietly together until the catch ring fills.'],
          C1: ['Hold S as the breathing ring grows.', 'Release S as the ring gently shrinks.', 'Match three slow breaths, then catch Calm.'],
          G: ['Watch Golden swoop in a quick arc.', 'Press Space to jump and meet it in the air.', 'Press J or X to pounce mid-air and catch it.']
        },
        paperStars: {
          label: 'Paper stars', progress: 'Paper stars · {count} / 3', diaryUnlocked: 'bonus diary page unlocked',
          diaryTitle: 'Paper-star diary', diaryPrompt: 'Find all 3 hidden paper stars in a night to unlock its bonus page.', diaryCount: '{count} / 50 pages', diaryEmpty: 'Your first page is waiting among the stars.',
          found: 'Paper star · {count}/3', allFound: 'All 3 paper stars found · bonus diary page unlocked!', pageFound: 'Bonus diary page!',
          pages: {
            1: 'I tucked three little stars away where the classroom moonlight could find them. Shwe waited beside me until my hands stopped shaking.',
            2: 'The wall felt taller at night. Shwe found the stars up high, and I remembered that being brave can be quiet.',
            3: 'Three paper stars rested near the park path. Shwe sat with Lonely until even the shadows felt friendly.',
            4: 'The festival lights looked like a sky brought down to earth. I folded three stars so Shwe could carry a little of it home.',
            5: 'On the hill, Shwe found stars caught between the stones. I think the wind had been saving them for us.',
            6: 'The lake held the moon in pieces. Shwe brought me three stars, and the water looked less lonely after that.',
            7: 'Morning came softly. Shwe placed the last three stars beside my drawing, where they can keep shining.'
          },
          endlessPage: 'On {chapter}, Shwe found three paper stars hidden around {place}. I pressed them into my diary so this little adventure would always have a place to rest.'
        },
        secretRooms: {
          wallPrompt: 'Scratch the cracked wall · {count}/3 · {key}', opened: 'A secret room!',
          pageFound: 'Secret diary page found!', pageTitle: 'Secret-room diary', pageCount: '{count} / 6 pages',
          pagePrompt: 'Find the cracked walls hidden across the maps.', pageEmpty: 'A little memory is waiting behind a cracked wall.',
          rareWaiting: 'A rare Moodling is hiding inside!', alreadyRead: 'You have already saved this memory.',
          pages: {
            school: 'I found this note tucked behind a loose classroom wall. Shwe waited while I read it twice.',
            festival: 'The lanterns made the hidden room feel warm. I want to remember how safe the quiet felt.',
            lake: 'The moon kept a little light for us behind the old wall. Shwe found it first.',
            market: 'Rain tapped above the hidden room. We sat together until the last drops softened.',
            pagoda: 'A quiet note beneath the hill reminded me to be gentle with every small thing.',
            free: 'Shwe found a little memory in the Night Side, safe from the wind and the dark.'
          }
        },
        catchGuides: {
          F: 'Let it charge, dodge the rush, then pounce while it is dizzy.',
          N: 'Sneak or walk slowly within range. Avoid running and jumping; pounce while it wanders calmly.',
          L: 'Listen for its chime or use Night Eyes to find its hiding spot. Scratch the mark, then sit still beside it.',
          B: 'Follow the chime and use Night Eyes to find the marked hiding place. Scratch it to reveal the feeling, then pounce.',
          E: 'Follow its bounce and pounce at the very top, when it slows in midair.',
          S: 'Freeze when it looks at you. When it looks away and starts walking, get close and pounce.',
          J: 'Let it steal a trail light, then pounce while it is tired to get the light back.',
          C: 'Walk slowly through three fireflies, then bring their light to Calm. For Breathing Calm, hold S as the bubble grows and release as it shrinks.',
          C1: 'Hold S as the bubble grows, then release as it shrinks. Match three slow breaths.',
          G: 'Golden Moodlings fly quickly and fade. Jump after one and pounce when you are close.'
        },
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
        { title: 'လေးလံသောနှလုံးသား', text: 'ကောင်မလေးတစ်ယောက် လေးလံသောနှလုံးသားဖြင့် အိပ်ပျော်သွားသည်။ သူမ၏ခံစားချက်များ ညဘက်ကမ္ဘာထဲသို့ ပြေးဝင်သွားသည်။' },
        { title: 'သူတို့ကို အိမ်ပြန်ပို့ပါ', text: 'သူမ၏ကြောင်ကို ကူညီပြီး သူတို့ကို အိမ်ပြန်ပို့ပါ။ နေမထွက်မီ Moodling များကိုဖမ်းပါ။ ခံစားချက်တိုင်းတွင် ဖမ်းနည်း မတူပါ။' },
        { title: 'ညတိုင်း တစ်စုံတစ်ရာ ကြီးထွားလာသည်', text: 'Glow ရယူပါ၊ ကြောင်ကို အဆင့်မြှင့်ပါ၊ Mood Book တွင် ခံစားချက် ၁၇ မျိုးစုပါ၊ ည ၇ ညနှင့် နေထွက်အဆုံးသတ်ကို ဖွင့်ပါ။' }
      ],
      tutorial: [
        { title: 'အတူလျှောက်ကြမယ်', text: 'ညောင်! တောက်ပတဲ့ စက်ဝိုင်းဘက်ကို ခြေလှမ်းအနည်းငယ် လျှောက်ကြမယ်။', action: 'move' },
        { title: 'နည်းနည်းခုန်ကြမယ်', text: 'Jump ကိုနှိပ်ပြီး ခုန်ပါ။ စင်ပေါ် ဒါမှမဟုတ် ကြမ်းပြင်ပေါ် ပြန်ဆင်းကြမယ်။', action: 'jump' },
        { title: 'တိတ်တိတ်လေးလျှောက်မယ်', text: 'ရွေ့ရင်း Shift ကိုဖိထားပါ။ ဖုန်းမှာ joystick အတွင်းစက်ဝိုင်းထဲကနေ ဖြည်းဖြည်းတွန်းပြီး ခြေလှမ်းအနည်းငယ် လျှောက်ပါ။', action: 'sneak' },
        { title: 'အလင်းလေးကိုဖမ်းမယ်', text: 'တောက်ပတဲ့ လေ့ကျင့်ဖော်လေးအနားကိုသွားပြီး Pounce ကိုနှိပ်ပါ။ သူက အန္တရာယ်မပေးပါဘူး။', action: 'catch' }
      ],
      tutorialComplete: 'တတ်သွားပြီ! ခံစားချက်လေးတွေကို အိမ်ပြန်ပို့ကြမယ်။',
      bossIntro: { title: 'မုန်တိုင်း Frustrated', text: 'ပြေးဝင်တိုက်လာချိန်မှာ ရှောင်ပါ။ မူးဝေသွားတဲ့အခါ Pounce လုပ်ပါ။ သုံးကြိမ်ထိမှန်ရင် လမင်းတံခါး ပွင့်လာမယ်။', dodge: '↔ ရှောင်ပါ သို့မဟုတ် ခုန်ပါ', pounce: '✦ မူးဝေချိန် Pounce လုပ်ပါ', ready: 'မုန်တိုင်းကို ရင်ဆိုင်မယ်', warning: 'မုန်တိုင်း Frustrated က အားယူနေသည်။', dizzy: 'မူးဝေနေပြီ! Pounce လုပ်ပါ။', hit: 'မုန်တိုင်းနဲ့ တိုက်မိသည် · အသက် {lives} ခု', defeated: 'မုန်တိုင်း ငြိမ်သက်သွားပြီ။ လမင်းတံခါး ပွင့်လာပြီ။', fail: 'မုန်တိုင်းတိုက်ပွဲတွင် Shwe အသက်ကုန်သွားသည်။ Mood Book ထဲ သိမ်းထားပြီးသား အလင်းများက သင့်အတွက် ကျန်ရှိနေမည်။' },
      success: 'ကောင်းလိုက်တာ! ကိုယ်တိုင်လုပ်ပြီး သင်ယူတတ်မြောက်သွားပြီ။',
      skipTutorial: 'သင်ခန်းစာ ကျော်မည်',
      jitLabel: 'အကြံပြုချက်လေး',
      catchClipHint: 'ဖမ်းနည်းကလစ်ကို How to play တွင် ပြန်ကြည့်နိုင်သည်။',
      struggleLabel: 'ညင်သာသော အကူအညီ',
      struggleTitle: 'အချိန်ယူပါ',
      mechanicTitles: { nervous: 'Nervous', jealous: 'Jealous', lonely: 'Lonely', shy: 'Shy', excited: 'Excited', buried: 'Buried', calm: 'Calm', combo: 'Combo', free: 'Free Play', wallJump: 'နံရံခုန်နှင့် အနားကိုင်တက်ခြင်း' },
      weather: {
        titles: { rain: 'မိုးဖွဲဖွဲ', wind: 'လေညင်း', fog: 'လမြူ' },
        tips: { rain: 'မိုးဖွဲဖွဲကြောင့် မြေပြင်ချော်နိုင်သည်။ ရပ်ရန် ထိန်းချုပ်မှုကို ဖြည်းဖြည်းလျှော့ပြီး Lonely ၏ ခေါင်းလောင်းသံကို နားထောင်ပါ။', wind: 'လေညင်းက Shwe ၏ ခုန်အားကို အနည်းငယ် မြှင့်နိုင်၊ လျှော့နိုင်သည်။ လေကိုကြည့်ပြီး ဆင်းမည့်နေရာကို ချိန်ပါ။', fog: 'လမြူကြောင့် အဝေးကအရာများ မှုန်ဝါးနေသည်။ Night Eyes က ပိုဝေးဝေးထိ မြင်နိုင်သဖြင့် ဝှက်ထားသောအလင်းများကို ရှာပါ။' }
      },
      puddleTip: 'ရေအိုင်တွေကို သတိထားပါ။ ရေဖျန်းသံကြောင့် Nervous လန့်သွားနိုင်သည်။ တိတ်တိတ်လေး ဖြတ်သွားပါ။',
      pagodaBellTip: 'တွဲလောင်းခေါင်းလောင်းလေးကို ထိလိုက်ပါ။ သာယာတဲ့အသံက အနီးက Moodling တွေကို ငြိမ်သက်စေမယ်။',
      next: 'ရှေ့သို့',
      finishWelcome: 'ကြောင်ကို ရွေးပါ →',
      skipWelcome: 'ကျော်မည်',
      welcomeLabel: 'TideCatcher မှ ကြိုဆိုပါသည်',
      tutorialLabel: 'ည ၁ · လမ်းညွှန်အဆင့်များ',
      nightPreview: { title: 'ဒီညသွားမည့်လမ်း · နေထွက်ပန်းတိုင်ကို ရှာပါ', skip: 'ကျော်ရန် ခလုတ်တစ်ခုခုနှိပ်ပါ သို့မဟုတ် တို့ပါ' },
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
        free: 'နာရီမရှိ၊ အမှတ်မရှိပါ။ Shwe နဲ့ လမ်းလျှောက်ရင်း ပျော်ပျော်ဖမ်းပါ၊ အိမ်ပြန်ချင်ရင် ခဏရပ်ပါ။',
        wallJump: 'နံရံနားရောက်ချိန် Jump ကိုနှိပ်ပြီး ပြန်ခုန်ပါ။ စင်အနားကိုရောက်လျှင် Shwe ကကိုင်ထားပြီး ခဏအကြာ အပေါ်တက်မည်။',
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
        moods: 'Moodling တစ်ကောင်ချင်းစီကို ဖမ်းနည်း',
        moodsNote: 'Moodling အသစ်တစ်ကောင်ကို တွေ့လျှင် ၎င်း၏ဖမ်းနည်းကလစ်ကို ဒီနေရာတွင် ဖွင့်ပြပေးမည်။ ပထမဆုံးပေါ်လာချိန်တွင် Shwe ကလည်း အကြံပြုချက်ပေးမည်။',
        glow: 'Glow နှင့် အဆင့်မြှင့်မှုများ',
        glowText: 'ဖမ်းယူမှုမှ Glow ရပြီး combo ဖြင့် ပိုရသည်။ Glow ကို အဆင့်မြှင့်မှု၊ ကြောင်နှင့် ပစ္စည်းများတွင် သုံးပါ။',
        combos: 'Combo များ',
        comboText: 'လေးစက္ကန့်အတွင်း ထပ်ဖမ်းပါ။ ပိုကြီးသောဆုအတွက် ×5 အထိ ဆက်ဖမ်းနိုင်သည်။',
        story: 'ဇာတ်လမ်း ပြန်ဖွင့်ပါ',
        close: 'ပြန်သွားမည်',
        unknown: 'မတွေ့ဖူးသေးသော ခံစားချက်',
        unknownHint: 'မတွေ့ရသေးပါ။ ဖမ်းနည်းကို ဗီဒီယိုတွင် ကြည့်ပါ။',
        catchClipButton: '▶ ဖမ်းနည်းကလစ် ကြည့်ရန်',
        catchClipLabel: 'ဖမ်းနည်းပုံလမ်းညွှန်',
        catchClipNoButton: 'ခလုတ်မလိုပါ — Shwe ကိုကြည့်ပါ', catchClipGalleryLabel: 'ဖမ်းနည်းကလစ်နှင့် အဆင့်များ', catchClipPlay: 'ကလစ် ဖွင့်ရန်', catchClipPause: 'ကလစ် ခဏရပ်ရန်', catchClipVideoLabel: 'ကစားပုံ ကလစ်', catchClipStepsLabel: 'ဖမ်းနည်း အဆင့်ဆင့်', catchClipControlsLabel: 'ဤအဆင့်အတွက် ထိန်းချုပ်မှု',
        catchClipClose: 'ကလစ်ပိတ်ရန်',
        catchClipStep: 'အဆင့်',
        catchClipPrev: 'ယခင်ပုံ', catchClipNext: 'နောက်ပုံ',
        catchClipGlow: '+အလင်း',
        catchClipOr: 'သို့မဟုတ်',
        catchClipActionLabels: { RUN: 'ပြေးသည်', DODGE: 'ရှောင်ပါ', JUMP: 'ခုန်ပါ', POUNCE: 'ခုန်တိုက်ပါ', EYES: 'Night Eyes', SCRATCH: 'ကုတ်ပါ', HOLD: 'ဖိထားပါ', RELEASE: 'လွှတ်ပါ', MOVE: 'ရွေ့ပါ', CHASE: 'လိုက်ပါ', 'SLOW WALK': 'ဖြည်းဖြည်းလျှောက်ပါ', 'MOVE + POUNCE': 'ရွေ့ပြီး ခုန်တိုက်ပါ' },
        catchClipTouchLabels: { move: 'ရွေ့ပါ', sneak: 'တိတ်တိတ်လျှောက်', jump: 'ခုန်ပါ', pounce: 'ခုန်တိုက်', eyes: 'Eyes', scratch: 'ကုတ်ပါ', hold: 'ဖိထား', release: 'လွှတ်ပါ' },
        catchClipStages: ['သတိပြုပါ', 'စမ်းကြည့်ပါ', 'အိမ်ပြန်ပို့ပါ'],
        catchClipSteps: {
          F: ['Frustrated တိုက်ခိုက်ရန် အားယူနေသည်ကို ကြည့်ပါ။', 'ဘေးသို့ရှောင်၍ တိုက်ခိုက်မှုကို လွတ်အောင်နေပါ။', 'မူးဝေနေချိန်တွင် ခုန်တိုက်ပါ။'],
          N: ['ပြေးသံကြောင့် Nervous လန့်သွားသည်။ ✕ too loud ကိုကြည့်ပါ။', 'Shift ဖိ၍ တိတ်တိတ်လေးသွားပါ။ အသံတိတ်ကွင်းက စိတ်အေးစေသည်။', 'Nervous အေးဆေးလာလျှင် ခုန်တိုက်၍ အိမ်ပြန်ပို့ပါ။'],
          L: ['Lonely ၏ခေါင်းလောင်းသံကို နားထောင်ပါ။ E နှိပ်၍ Night Eyes သုံးပါ။', 'တောက်ပသောပုန်းနေရာကို S နှိပ်၍ ကုတ်ပါ။', 'ကွင်းပြည့်လာသည်အထိ Lonely ဘေးတွင် ငြိမ်ငြိမ်ထိုင်ပါ။'],
          B: ['E နှိပ်၍ Night Eyes ဖြင့် အမှတ်အသားနေရာကို ဖော်ပါ။', 'S နှိပ်၍ ကုတ်ပြီး Buried ကို တူးဖော်ပါ။', 'Buried ပေါ်လာလျှင် ခုန်တိုက်၍ အိမ်ပြန်ပို့ပါ။'],
          E: ['Excited ပိုမြင့်မြင့်ခုန်လာသည်ကို စောင့်ကြည့်ပါ။', 'ခုန်တက်မှု အမြင့်ဆုံးရောက်ချိန်တွင် ခုန်ပါ။', 'လေထဲတွင် အနီးကပ်ရောက်ချိန် ခုန်တိုက်ပါ။'],
          S: ['Shy ပေါ်လာပြီး Shwe ချဉ်းကပ်လာသည်ကို ကြည့်နေသည်။', 'Shy ကြည့်နေချိန် ရွေ့လျားမှုကို လွှတ်ထားပါ။', 'Shy အခြားဘက်ကြည့်လျှင် ရွေ့ပြီး ခုန်တိုက်ပါ။'],
          J: ['Jealous က လမ်းကြောင်းရှိအလင်းလေးကို ခိုးယူသည်။', 'အလင်းပြန်ရရန် Jealous နောက်ကို လိုက်ပါ။', 'Jealous ပင်ပန်းလာလျှင် ခုန်တိုက်ပါ။'],
          C: ['ကျူပင်များကြား ပိုးစုန်းကြူးများနှင့်အတူ ဖြည်းဖြည်းလျှောက်ပါ။', 'Calm ဘေးတွင် ရပ်ပြီး ငြိမ်ငြိမ်ထိုင်ပါ။', 'ဖမ်းယူကွင်းပြည့်သည်အထိ အတူတူငြိမ်နေပါ။'],
          C1: ['အသက်ရှူကွင်းကြီးလာချိန် S ကိုဖိထားပါ။', 'ကွင်းကျုံ့လာချိန် S ကိုလွှတ်ပါ။', 'ဖြည်းဖြည်းအသက်ရှူမှု သုံးကြိမ်လိုက်လုပ်ပြီး ဖမ်းပါ။'],
          G: ['Golden ပျံဝဲသည့် အကွေးလမ်းကြောင်းကို ကြည့်ပါ။', 'Space နှိပ်၍ ခုန်ပြီး လေထဲတွင် ဆုံပါ။', 'လေထဲတွင် J သို့မဟုတ် X နှိပ်၍ ခုန်တိုက်ဖမ်းပါ။']
        },
        paperStars: {
          label: 'စက္ကူကြယ်များ', progress: 'စက္ကူကြယ်များ · {count} / 3', diaryUnlocked: 'အပိုဒိုင်ယာရီ စာမျက်နှာ ဖွင့်ပြီး',
          diaryTitle: 'စက္ကူကြယ် ဒိုင်ယာရီ', diaryPrompt: 'အပိုစာမျက်နှာဖွင့်ရန် ညတစ်ညတွင် ဝှက်ထားသော စက္ကူကြယ် ၃ ပွင့်လုံးကို ရှာပါ။', diaryCount: '{count} / ၅၀ စာမျက်နှာ', diaryEmpty: 'ပထမစာမျက်နှာလေးက ကြယ်တွေကြားမှာ စောင့်နေပါတယ်။',
          found: 'စက္ကူကြယ် · {count}/၃', allFound: 'စက္ကူကြယ် ၃ ပွင့်လုံး ရပြီ · အပိုဒိုင်ယာရီစာမျက်နှာ ဖွင့်ပြီး!', pageFound: 'အပိုဒိုင်ယာရီစာမျက်နှာ!',
          pages: {
            1: 'စာသင်ခန်းထဲက လရောင်အောက်မှာ ကြယ်လေးသုံးပွင့်ကို ကျွန်မ သိမ်းထားလိုက်တယ်။ ကျွန်မလက်တွေ တုန်မနေတော့တဲ့အထိ Shwe က ဘေးမှာ စောင့်ပေးခဲ့တယ်။',
            2: 'ညဘက်မှာ နံရံက ပိုမြင့်သလိုပဲ။ Shwe က အပေါ်ကကြယ်တွေကို ရှာတွေ့ခဲ့ပြီး ရဲရင့်ခြင်းဆိုတာ တိတ်ဆိတ်နေလည်း ဖြစ်နိုင်တယ်လို့ ကျွန်မ သတိရလာတယ်။',
            3: 'ပန်းခြံလမ်းဘေးမှာ စက္ကူကြယ်သုံးပွင့် ရှိနေတယ်။ အရိပ်တွေတောင် မကြောက်စရာ မဟုတ်တော့တဲ့အထိ Shwe က Lonely ဘေးမှာ ထိုင်နေခဲ့တယ်။',
            4: 'ပွဲတော်မီးရောင်တွေက ကောင်းကင်ကို မြေပြင်ပေါ် ချထားသလိုပဲ။ Shwe အိမ်ပြန်သယ်သွားနိုင်အောင် ကြယ်သုံးပွင့်ကို ကျွန်မ ခေါက်ပေးခဲ့တယ်။',
            5: 'တောင်ကုန်းပေါ်က ကျောက်တုံးတွေကြားမှာ Shwe ကြယ်တွေကို ရှာတွေ့ခဲ့တယ်။ လေက ကျွန်မတို့အတွက် သိမ်းထားပေးတာ ဖြစ်မယ်။',
            6: 'ရေကန်ထဲမှာ လရောင်က အပိုင်းပိုင်းဖြစ်နေတယ်။ Shwe က ကြယ်သုံးပွင့် ယူလာပေးပြီးနောက် ရေကန်ကြီးက အထီးကျန်မှု နည်းသွားသလိုပဲ။',
            7: 'မနက်ခင်းက နူးညံ့စွာ ရောက်လာတယ်။ Shwe က နောက်ဆုံးကြယ်သုံးပွင့်ကို ကျွန်မပုံဘေးမှာ ချထားခဲ့ပြီး အဲဒီမှာ ဆက်လက်တောက်ပနေတော့မယ်။'
          },
          endlessPage: '{chapter} မှာ Shwe က {place} အနီးက ဝှက်ထားတဲ့ စက္ကူကြယ်သုံးပွင့်ကို ရှာတွေ့ခဲ့တယ်။ ဒီစွန့်စားခန်းလေးမှာ အနားယူစရာနေရာ ရှိနေစေဖို့ ဒိုင်ယာရီထဲမှာ ထည့်သိမ်းလိုက်တယ်။'
        },
        secretRooms: {
          wallPrompt: 'အက်နေသောနံရံကို ကုတ်ပါ · {count}/၃ · {key}', opened: 'လျှို့ဝှက်အခန်း ပွင့်သွားပြီ!',
          pageFound: 'လျှို့ဝှက်ဒိုင်ယာရီစာမျက်နှာ ရပြီ!', pageTitle: 'လျှို့ဝှက်အခန်း ဒိုင်ယာရီ', pageCount: '{count} / ၆ စာမျက်နှာ',
          pagePrompt: 'မြေပုံများအနှံ့ ဝှက်ထားသော အက်နံရံများကို ရှာပါ။', pageEmpty: 'အက်နံရံနောက်မှာ အမှတ်တရလေးတစ်ခု စောင့်နေပါတယ်။',
          rareWaiting: 'အခန်းထဲမှာ ရှားပါး Moodling လေး ဝှက်နေပါတယ်!', alreadyRead: 'ဒီအမှတ်တရကို သိမ်းထားပြီးပါပြီ။',
          pages: {
            school: 'စာသင်ခန်းနံရံနောက်မှာ ဒီမှတ်စုလေးကို တွေ့ခဲ့တယ်။ ကျွန်မ နှစ်ခါဖတ်နေတုန်း Shwe က စောင့်ပေးခဲ့တယ်။',
            festival: 'မီးပုံးတွေကြောင့် လျှို့ဝှက်အခန်းလေးက နွေးထွေးနေတယ်။ အေးချမ်းလုံခြုံတဲ့ခံစားချက်ကို မှတ်မိနေချင်တယ်။',
            lake: 'နံရံဟောင်းနောက်မှာ လရောင်က ကျွန်မတို့အတွက် အလင်းလေးတစ်ခု သိမ်းထားတယ်။ Shwe က အရင်တွေ့ခဲ့တယ်။',
            market: 'လျှို့ဝှက်အခန်းပေါ်မှာ မိုးစက်တွေ တောက်တောက်ကျနေတယ်။ မိုးသံပျော့သွားတဲ့အထိ အတူထိုင်နေခဲ့ကြတယ်။',
            pagoda: 'တောင်ကုန်းအောက်က မှတ်စုလေးက သေးငယ်တဲ့အရာတိုင်းကို ညင်သာစွာ ဆက်ဆံဖို့ သတိပေးတယ်။',
            free: 'ညဘက်ကမ္ဘာထဲမှာ လေနဲ့အမှောင်ကင်းဝေးတဲ့ မှတ်ဉာဏ်လေးကို Shwe ရှာတွေ့ခဲ့တယ်။'
          }
        },
        catchGuides: {
          F: 'အနားသို့ ချဉ်းကပ်ပြီး တိုက်ခိုက်လာစေပါ။ ရှောင်ထွက်ပြီး မူးဝေနေချိန်တွင် ခုန်တိုက်ပါ။',
          N: 'အနားသို့ ဖြည်းဖြည်း သို့မဟုတ် တိတ်တိတ်လေး ချဉ်းကပ်ပါ။ ပြေးခြင်း၊ ခုန်ခြင်းကို ရှောင်ပြီး အေးဆေးသွားလာနေချိန်တွင် ခုန်တိုက်ပါ။',
          L: 'အသံလေးကို နားထောင်ပါ သို့မဟုတ် Night Eyes ဖြင့် ပုန်းနေရာကို ရှာပါ။ အမှတ်အသားကို ကုတ်ပြီး ဘေးတွင် ငြိမ်ငြိမ်ထိုင်ပါ။',
          B: 'အသံနောက်လိုက်၍ Night Eyes ဖြင့် အမှတ်အသားရှိသောနေရာကို ရှာပါ။ ခံစားချက်ကို ဖော်ထုတ်ရန် ကုတ်ပြီးနောက် ခုန်တိုက်ပါ။',
          E: 'ခုန်တက်နေမှုကို စောင့်ကြည့်ပြီး လေထဲတွင် အမြင့်ဆုံးရောက်၍ ခဏနှေးသွားချိန်တွင် ခုန်တိုက်ပါ။',
          S: 'Shy က ကြည့်နေချိန် ငြိမ်နေပါ။ အခြားဘက်လှည့်ပြီး လမ်းလျှောက်ချိန်တွင် အနားကပ်၍ ခုန်တိုက်ပါ။',
          J: 'မီးလင်းလေးကို ခိုးယူခွင့်ပေးပြီး ပင်ပန်းနေချိန်တွင် ခုန်တိုက်ပါ။ မီးလင်းလေး ပြန်ရမည်။',
          C: 'ပိုးစုန်းကြူး သုံးကောင်ကို ဖြည်းဖြည်းစု၍ အလင်းကို Calm ထံ ယူသွားပါ။ အသက်ရှူ Calm အတွက် ပူဖောင်းကြီးလာချိန် S ကိုဖိပြီး သေးလာချိန် လွှတ်ပါ။',
          C1: 'ပူဖောင်းကြီးလာချိန် S ကိုဖိထားပြီး သေးလာချိန် လွှတ်ပါ။ အသက်ရှူမှု သုံးကြိမ်ကို ဖြည်းဖြည်း လိုက်လုပ်ပါ။',
          G: 'Golden Moodling သည် မြန်မြန်ပျံပြီး ပျောက်ကွယ်တတ်သည်။ ခုန်လိုက်၍ အနားရောက်ချိန်တွင် ခုန်တိုက်ပါ။'
        },
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
