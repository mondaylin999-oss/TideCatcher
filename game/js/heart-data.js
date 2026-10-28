/* Handmade recipes and durable progress for Heart Workshop and Lantern Town. */
(function (root) {
  'use strict';
  const bases = [
    ['F', 'Frustrated', '#ff727d'], ['N', 'Nervous', '#b59aff'], ['L', 'Lonely', '#79c7ff'],
    ['S', 'Shy', '#ff91c5'], ['E', 'Excited', '#ffdc68'], ['J', 'Jealous', '#ffa569'],
    ['B', 'Buried', '#c5a17a'], ['C', 'Calm', '#83deb0'], ['G', 'Golden', '#ffe99a']
  ].map(([id, name, color], i) => ({ id, name, color, tier: 0, line: [
    'My anger says I really care.', 'My heart races before I begin.', 'I wish someone would sit beside me.',
    'I have something to say, in a tiny voice.', 'I can hardly wait!', 'I wish my drawing had won, too.',
    'I tucked my feelings somewhere deep.', 'Breathe in, breathe out. There is time.', 'One small good thing shines today.'
  ][i] }));
  // Every recipe is unordered; no two recipes use the same pair.
  const rows = [
    ['Anticipation','N','E',1,'Butterflies before something big.'],
    ['Peaceful','L','C',1,'Quiet can feel like company.'],
    ['Determined','F','C',1,'I can try one small step again.'],
    ['Brave','S','E',1,'My voice can be small and still be heard.'],
    ['Admiration','J','C',1,'Your beautiful work helps me dream.'],
    ['Relief','N','C',1,'My shoulders can rest now.'],
    ['Embarrassed','S','N',1,'Warm cheeks do not mean I did something wrong.'],
    ['Grumpy','F','J',1,'I need a little space today.'],
    ['Nostalgia','L','G',1,'An old memory feels warm again.'],
    ['Hopeful','B','G',1,'A tiny light can reach a buried wish.'],
    ['Curious','E','C',1,'What is waiting around the corner?'],
    ['Tender','S','C',1,'Some feelings need gentle hands.'],
    ['Restless','N','F',1,'My feet want to go before I am ready.'],
    ['Wistful','L','S',1,'I wish we could sit together again.'],
    ['Vulnerable','B','S',1,'I can let someone see a little of me.'],
    ['Inspired','E','G',1,'A new drawing is beginning in my mind.'],
    ['Patient','B','C',1,'Some seeds need a little longer.'],
    ['Playful','E','J',1,'We can turn a contest into a game.'],
    ['Confident','Brave','Determined',2,'I trust myself to keep learning.'],
    ['Grateful','Peaceful','Admiration',2,'Thank you for sitting beside me.'],
    ['Joy','Relief','E',2,'A laugh finds its way out.'],
    ['Friendship','L','Brave',2,'May I sit next to you?'],
    ['Kindness','C','Embarrassed',2,'You do not have to hide your face.'],
    ['Courage','Anticipation','Brave',2,'I am nervous, and I can still begin.'],
    ['Trust','Vulnerable','Tender',2,'You kept my little secret safe.'],
    ['Belonging','Wistful','Peaceful',2,'There is a place for me here.'],
    ['Forgiveness','Grumpy','Patient',2,'We can begin again when we are ready.'],
    ['Empathy','Tender','L',2,'I can listen without fixing everything.'],
    ['Creativity','Curious','Inspired',2,'Two small ideas make a new world.'],
    ['Resilience','Determined','Relief',2,'Rest is part of trying again.'],
    ['Delight','Playful','E',2,'A small surprise makes today brighter.'],
    ['Acceptance','Vulnerable','C',2,'Every part of my heart has a place.'],
    ['Aspiration','Hopeful','Inspired',2,'I can dream without rushing.'],
    ['Happiness','Joy','Grateful',3,'There is warmth in this ordinary moment.'],
    ['Love','Friendship','Kindness',3,'I am glad you are here.'],
    ['Pride','Confident','Hopeful',3,'Look how far my little steps have taken me.'],
    ['Wonder','Courage','Nostalgia',3,'The familiar world is full of new light.'],
    ['Compassion','Empathy','Forgiveness',3,'A gentle heart has room for mistakes.'],
    ['Harmony','Trust','Belonging',3,'Different voices can make one song.'],
    ['Fulfilled','Creativity','Aspiration',3,'I made something that feels like me.'],
    ['Whole Heart','Happiness','Love',4,'I can feel everything again. Every feeling belongs.']
  ];
  const feelings = [...bases, ...rows.map(([id,a,b,tier,line], i) => ({
    id, name:id, ingredients:[a,b], tier, line, color:['#ffd77a','#8ee0cd','#ff9fbf','#aabaff'][i % 4]
  }))];
  const byId = Object.fromEntries(feelings.map(f => [f.id,f]));
  // Lantern Town: 50 places, one for every Moodling. The first ten story places keep their old ids, so
  // saved progress carries over. Art: assets/town/<art>.webp (the designer's sheet, cut out one by one).
  const STORY_PLACES = ['lamps','school','wall','swings','hnin','festival','art','home','tree','bridge'];
  const places = [
    ["forge", "Blacksmith forge", {"F": 3, "C": 1}, "The smith lets the fire roar, then cools the iron slowly. Anger can make something strong.", null, "b01"],
    ["clock", "Clock tower", {"N": 3, "C": 1}, "The big clock ticks on. There is still time, even when your heart races.", null, "b02"],
    ["lighthouse", "Lighthouse", {"L": 3, "G": 1}, "One light on the water tells every boat: you are not alone out here.", null, "b03"],
    ["teahouse", "Curtain tea house", {"S": 3, "C": 1}, "Behind the curtain, two cups wait. Small voices are welcome inside.", null, "b04"],
    ["toys", "Toy & firework stall", {"E": 3, "G": 1}, "Rockets, balloons and a stall that hums with \"almost!\"", null, "b05"],
    ["mirrors", "Mirror shop", {"J": 3, "C": 1}, "Every mirror shows someone different, and every one of them is enough.", null, "b06"],
    ["cellar", "Seed cellar", {"B": 3, "G": 1}, "Seeds sleep under the hill until it is their time.", null, "b07"],
    ["lamps", "Lantern lamps", {"C": 3}, "Shwe follows the first warm lights home.", "mint", "b08"],
    ["pagoda", "Bell pagoda", {"G": 3, "C": 1}, "The little bell rings once for every small good thing today.", null, "b09"],
    ["station", "Train station", {"Anticipation": 1, "E": 1}, "A train is coming. Thiri waits on the bench, butterflies and all.", null, "b10"],
    ["library", "Reading library", {"Peaceful": 1, "L": 1}, "Quiet pages, a warm lamp, and nobody minds you sitting alone.", null, "b11"],
    ["workshop", "Builder's workshop", {"Determined": 1, "F": 1}, "Half a bridge is still a bridge being built.", null, "b12"],
    ["firestation", "Fire station", {"Brave": 1, "N": 1}, "The bravest helpers still feel scared. They go anyway.", null, "b13"],
    ["gallery", "Art gallery", {"Admiration": 1, "J": 1}, "Someone else's beautiful painting can teach you a new colour.", null, "b14"],
    ["bathhouse", "Bathhouse", {"Relief": 1, "C": 1}, "Steam rises. Shoulders drop. Breathe out.", null, "b15"],
    ["hats", "Hat shop", {"Embarrassed": 1, "S": 1}, "Pink cheeks under a big hat. Nobody is laughing.", null, "b16"],
    ["umbrellas", "Umbrella shop", {"Grumpy": 1, "C": 1}, "On grumpy days, a little shelter helps.", null, "b17"],
    ["photos", "Photo studio", {"Nostalgia": 1, "L": 1}, "Old photos of good days, kept warm on the wall.", null, "b18"],
    ["greenhouse", "Greenhouse", {"Hopeful": 1, "B": 1}, "Under the glass, tiny shoots reach for the light.", null, "b19"],
    ["observatory", "Little observatory", {"Curious": 1, "G": 1}, "The telescope finds a star nobody has named yet.", null, "b20"],
    ["clinic", "Animal clinic", {"Tender": 1, "C": 1}, "Gentle hands and a warm cat bed for anyone who is hurting.", null, "b21"],
    ["bikes", "Bicycle shop", {"Restless": 1, "E": 1}, "Wheels for feet that want to go, go, go.", null, "b22"],
    ["post", "Post office", {"Wistful": 1, "L": 1}, "A letter to a friend Thiri misses, with a little drawing inside.", null, "b23"],
    ["mending", "Mending shop", {"Vulnerable": 1, "C": 1}, "A patch is not a mistake. It shows where you were cared for.", null, "b24"],
    ["paint", "Paint shop", {"Inspired": 1, "E": 1}, "Pots of every colour, waiting for a new idea.", null, "b25"],
    ["bonsai", "Bonsai garden", {"Patient": 1, "B": 1}, "The smallest trees take the longest care.", null, "b26"],
    ["puppets", "Puppet theatre", {"Playful": 1, "S": 1}, "A tiny stage where shy puppets say big things.", null, "b27"],
    ["stage", "Open-air stage", {"Confident": 1, "Brave": 1}, "Spotlights on. Thiri's knees shake, and she sings anyway.", null, "b28"],
    ["flowers", "Flower stall", {"Grateful": 1, "Admiration": 1}, "A thank-you note tucked into every bunch.", null, "b29"],
    ["swings", "Park swings", {"Joy": 1, "Playful": 1}, "Two swings move together. Hnin leaves the other seat for Thiri.", "bell", "b30"],
    ["picnic", "Picnic pavilion", {"Friendship": 1, "Peaceful": 1}, "A long table with room for one more.", null, "b31"],
    ["noodles", "Noodle stall", {"Kindness": 1, "Tender": 1}, "A warm bowl for anyone who looks cold tonight.", null, "b32"],
    ["watchtower", "Watchtower", {"Courage": 1, "Determined": 1}, "From up here, the scary things look small.", null, "b33"],
    ["ferry", "Ferry dock", {"Trust": 1, "Relief": 1}, "The boat waits for you, rope tied tight. You can trust it.", null, "b34"],
    ["hall", "Community hall", {"Belonging": 1, "Wistful": 1}, "Many windows, one big door, and a seat with your name.", null, "b35"],
    ["wishbridge", "Wishing bridge", {"Forgiveness": 1, "Hopeful": 1}, "Tie a ribbon, say sorry, begin again.", null, "b36"],
    ["music", "Music teacher's house", {"Empathy": 1, "Tender": 1}, "The teacher listens before she plays.", null, "b37"],
    ["art", "Art club", {"Creativity": 1, "Inspired": 1}, "A fresh page waits. This time, drawing does not have to be a contest.", "lilac", "b38"],
    ["windmill", "Windmill", {"Resilience": 1, "Patient": 1}, "Wind pushes, the sails turn, the flowers keep growing.", null, "b39"],
    ["icecream", "Ice-cream boat", {"Delight": 1, "Playful": 1}, "Ice cream on a boat. Of course!", null, "b40"],
    ["quilt", "Quilt shop", {"Acceptance": 1, "Vulnerable": 1}, "Every patch is different and every patch belongs.", null, "b41"],
    ["kites", "Kite shop", {"Aspiration": 1, "Curious": 1}, "Kites climb slowly, one gust at a time.", null, "b42"],
    ["festival", "Festival gate", {"Happiness": 1, "Courage": 1, "Anticipation": 1}, "Under the paper lanterns, Thiri remembers being loved.", "sand", "b43"],
    ["home", "Thiri’s home", {"Love": 1, "Tender": 1, "Peaceful": 1}, "A hand finds Shwe in the dark. Tonight the room feels warm.", "jar", "b44"],
    ["school", "School", {"Pride": 1, "Confident": 1, "Determined": 1}, "The room where Thiri lost becomes the room where she tries again.", "scarf", "b45"],
    ["tree", "Hilltop tree", {"Wonder": 1, "Aspiration": 1, "Hopeful": 1}, "Thiri ties a small wish to a branch: keep making things.", "rainbow", "b46"],
    ["hnin", "Hnin's house", {"Compassion": 1, "Friendship": 1, "Brave": 1}, "Thiri finally shows Hnin her drawing. Hnin smiles and makes room.", "sky", "b47"],
    ["bridge", "Lake bridge", {"Harmony": 1, "Belonging": 1, "Peaceful": 1}, "The water holds every lantern. There is room for every feeling.", "starlight", "b48"],
    ["wall", "Winners' Wall", {"Fulfilled": 1, "Creativity": 1, "Admiration": 1}, "Thiri looks at the winning drawing and finds something new to learn.", "rose", "b49"],
    ["sky", "Great Sky Lantern tower", {"Whole Heart": 1, "G": 3}, "The Great Sky Lantern rises. Every feeling in the town glows at once.", null, "b50"]
  ].map(([id,name,needs,memory,reward,art]) => ({id,name,needs,memory,reward,art,story:STORY_PLACES.includes(id)}));
  // The true ending: the ten story places glow and the Great Sky Lantern (which needs Whole Heart) is lit.
  const endingReady = d => STORY_PLACES.every(id => d.lit.includes(id)) && d.lit.includes('sky') && d.discovered.includes('Whole Heart');
  const key = 'mk-heart-v1';
  function create(storage) {
    let raw = {};
    try { raw = JSON.parse(storage.getItem(key) || '{}') || {}; } catch (_) {}
    let data = {stock:{}, discovered:[], lit:[], ending:false};
    for (const f of feelings) {
      const n = Number(raw.stock?.[f.id]);
      data.stock[f.id] = Number.isSafeInteger(n) && n > 0 ? Math.min(n,99999) : 0;
      if (data.stock[f.id] || (Array.isArray(raw.discovered) && raw.discovered.includes(f.id))) data.discovered.push(f.id);
    }
    data.lit = places.filter(p => Array.isArray(raw.lit) && raw.lit.includes(p.id)).map(p => p.id);
    data.ending = !!raw.ending && endingReady(data);
    const counts = ids => ids.reduce((out,id) => {out[id]=(out[id]||0)+1;return out;},{});
    const can = needs => Object.entries(needs).every(([id,n]) => (data.stock[id] || 0) >= n);
    function commit(next) {
      // Do not consume anything if storage is full or disabled.
      try { storage.setItem(key, JSON.stringify(next)); data=next; return true; } catch (_) { return false; }
    }
    const copy = () => JSON.parse(JSON.stringify(data));
    function bank(ids) {
      const next=copy();
      for (const id of ids) if (byId[id]?.tier === 0) {
        next.stock[id]=Math.min(99999,next.stock[id]+1);
        if (!next.discovered.includes(id)) next.discovered.push(id);
      }
      return commit(next);
    }
    function mix(a,b) {
      const recipe=feelings.find(f => f.ingredients && [...f.ingredients].sort().join('|') === [a,b].sort().join('|'));
      if (!recipe) return {error:'These two need a little more time together. No lights used.'};
      const needs=counts([a,b]);
      if (!can(needs)) return {error:'Bring home more of these lights first. No lights used.'};
      // The final heart asks for the whole upper layer to be understood, not consumed.
      if (recipe.tier === 4 && feelings.some(f => f.tier === 3 && !data.discovered.includes(f.id)))
        return {error:'Discover all seven deep feelings first: Happiness, Love, Pride, Wonder, Compassion, Harmony and Fulfilled.'};
      const next=copy(), fresh=!next.discovered.includes(recipe.id);
      for (const [id,n] of Object.entries(needs)) next.stock[id]-=n;
      next.stock[recipe.id]++;
      if (fresh) next.discovered.push(recipe.id);
      if (!commit(next)) return {error:'Progress could not be saved. Free some browser storage and try again. No lights used.'};
      return {recipe,fresh};
    }
    function light(id) {
      const p=places.find(p=>p.id===id);
      if (!p || data.lit.includes(id) || !can(p.needs)) return false;
      const next=copy();
      for (const [id,n] of Object.entries(p.needs)) next.stock[id]-=n;
      next.lit.push(id);
      return commit(next);
    }
    const ready = () => endingReady(data);
    return {snapshot:copy, can, bank, mix, light, ready,
      end:()=> ready() && commit({...copy(),ending:true}),
      hint:()=>feelings.find(f=>f.ingredients && f.tier<4 && !data.discovered.includes(f.id) && f.ingredients.every(id=>data.discovered.includes(id)))
    };
  }
  root.TCHeartData = {feelings,byId,bases,places,create};
})(typeof window !== 'undefined' ? window : globalThis);
