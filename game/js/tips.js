/* All onboarding, tutorial, and just-in-time guidance copy lives here for easy translation. */
(function (root) {
  'use strict';
  root.TC_TIPS = {
    en: {
      welcome: [
        { title: 'A heavy heart', text: 'A girl fell asleep with a heavy heart. Her feelings ran into the Night Side.' },
        { title: 'Bring them home', text: 'Help her cat bring them home. Catch Moodlings before sunrise; each feeling has its own way to be caught.' },
        { title: 'Every level grows something', text: 'Earn Glow, upgrade your cat, fill the Mood Book (17 feelings), complete 7 story levels, then take on 43 tougher Endless Levels.' }
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
      tutorialLabel: 'Level 1 · Guided steps',
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
        unknownHint: 'Not met yet. Its catch clip unlocks when you meet it.',
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
          diaryTitle: 'Paper-star diary', diaryPrompt: 'Find all 3 hidden paper stars in a level to unlock its bonus page.', diaryCount: '{count} / 50 pages', diaryEmpty: 'Your first page is waiting among the stars.',
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
        nextNight: 'Next level',
        bookGoal: 'Mood Book',
        upgradeGoal: 'Next upgrade',
        allUpgrades: 'All upgrades are ready!',
        noAffordable: 'Save Glow for',
        tutorialReplayMessage: 'Choose Level 1 on the map to replay the guided steps.'
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
