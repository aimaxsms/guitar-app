const MAYER_TECHNIQUES = [
  {
    name: 'Chord Embellishments',
    description:
      'Taking a plain open or barre chord and adding one extra note — a 9th, a major 7th, a ' +
      'suspended 2nd or 4th — to make it sound richer and more "vocal" without changing the ' +
      'underlying chord function. This is one of the clearest fingerprints of his acoustic/pop ' +
      'rhythm playing: a I-IV-V progression starts sounding like his the moment you start ' +
      'embellishing the I and IV chords instead of leaving them plain.',
    tip:
      'Pick any basic open chord you know and try lifting or adding one finger at a time. Listen ' +
      'for which added notes sound good sustained (a maj7 or 9th you can hold through the whole ' +
      'chord) vs. ones that only work as a brief passing note.',
    listenFor: ['Daughters', 'Stop This Train', 'Dear Marie'],
    exampleTab: {
      label: 'C major vs. Cmaj7 (original example — just lift one finger)',
      tab:
        'C major      Cmaj7\n' +
        'e|--0--      e|--0--\n' +
        'B|--1--      B|--0--\n' +
        'G|--0--      G|--0--\n' +
        'D|--2--      D|--2--\n' +
        'A|--3--      A|--3--\n' +
        'E|--x--      E|--x--',
    },
  },
  {
    name: 'Capo for Open Voicings',
    description:
      'Using a capo to play open-chord shapes in keys that would otherwise require barre chords — ' +
      'keeps the ringing, open-string sound (and makes room for embellishments and fingerpicking ' +
      'patterns) even when the song itself is in a higher key.',
    tip:
      'If a song feels locked into awkward barre chords, try capoing up a few frets and finding the ' +
      'open-shape equivalent instead — same sound, easier to play expressively, and embellishments ' +
      'become much easier to add.',
    listenFor: ['Your Body Is a Wonderland', '3x5'],
    exampleTab: null,
  },
  {
    name: 'Travis-Style Fingerpicking',
    description:
      'A pure fingerstyle pattern (no pick) where the thumb alternates between bass notes on the low ' +
      'strings while the fingers pick out melody or chord tones on top — different from hybrid ' +
      'picking, which still uses a pick for the bass notes. Travis picking gives a rolling, ' +
      'continuous feel under a chord progression, common in his quieter acoustic material.',
    tip:
      'Get the thumb pattern locked in first — alternating bass notes with no fingers at all — ' +
      'before adding the top-string picking. Most people rush this and the whole pattern falls apart.',
    listenFor: ['Stop This Train', 'Daughters'],
    exampleTab: {
      label: 'Travis picking pattern (original example, no pick — thumb + 2 fingers)',
      tab:
        'e|------0-----------0------|\n' +
        'B|---1-----1-----1-----1---|\n' +
        'G|------------------------0|\n' +
        'D|--------------------------|\n' +
        'A|--0-----------2-----------|\n' +
        'E|------3-----------3-------|',
    },
  },
  {
    name: 'Hybrid Picking',
    description:
      'Holding the pick between thumb and index finger while using the middle and ring fingers ' +
      'to pluck other strings — lets you combine a strong pick attack on bass notes with soft, ' +
      'fingerstyle-like plucks on the higher strings, all in the same pattern. Think of it as a ' +
      'middle ground between flatpicking and Travis picking.',
    tip:
      'Start slow: pick the low string, then pluck the next two strings with middle/ring fingers ' +
      'in a steady loop. Keep the picked note louder than the plucked ones at first.',
    listenFor: ['Neon', 'Who Says', 'Slow Dancing in a Burning Room'],
    exampleTab: {
      label: 'Hybrid picking pattern (original example, A chord shape)',
      tab:
        'e|--------0-----------0------|\n' +
        'B|-----2-----2-----2-----2---|\n' +
        'G|--2-----------2-------------|\n' +
        'D|-----------------------------|\n' +
        'A|--0--------------------------|\n' +
        'E|-----------------------------|',
    },
  },
  {
    name: 'Percussive Muting / Funk Comping',
    description:
      'Resting the picking hand lightly on the strings to deaden them, then strumming through for ' +
      'a percussive "chk" sound mixed in with real chord hits — gives a rhythm part a funky, ' +
      'syncopated feel even on just one chord.',
    tip:
      'Loop a single chord and alternate between a real strum and a muted "chk" on the off-beats. ' +
      'Keep the strumming hand moving in even eighth notes the whole time, muting with the fretting ' +
      'hand rather than stopping the strum.',
    listenFor: ['Belief', 'Who You Love', 'Waiting on the World to Change'],
    exampleTab: {
      label: 'Percussive strum pattern (original example, x = muted hit)',
      tab:
        'e|--x-0-x-0-x-0-x-0--|\n' +
        'B|--x-1-x-1-x-1-x-1--|\n' +
        'G|--x-0-x-0-x-0-x-0--|\n' +
        'D|--x-2-x-2-x-2-x-2--|\n' +
        'A|--x---x---x---x----|\n' +
        'E|--x---x---x---x----|',
    },
  },
  {
    name: 'Slash Chords & Smooth Bass Movement',
    description:
      'Playing a chord with a bass note other than its root (written like "C/E" — a C chord with ' +
      'an E in the bass) so the lowest note steps smoothly between chords instead of jumping around. ' +
      'This is what makes some of his chord progressions feel like they\'re gently descending or ' +
      'climbing rather than just changing.',
    tip:
      'Take a simple progression you know (like C–Am–F–G) and find a bass note for each chord that ' +
      'moves by step (C, B, A, G) instead of jumping — you can fret that note on the low E or A ' +
      'string under the same chord shape.',
    listenFor: ['Stop This Train', 'Dear Marie'],
    exampleTab: null,
  },
  {
    name: 'Blues-Rock Phrasing',
    description:
      'Mixing major and minor pentatonic scales over the same chord — minor pentatonic for darker, ' +
      'grittier moments, major pentatonic or added 6ths for brighter, more major-key-happy phrases — ' +
      'plus wide bends and fast vibrato. The vocabulary is rooted in SRV/Hendrix/BB King-style blues ' +
      'playing, but used in a pop-song context rather than a straight 12-bar blues.',
    tip:
      'Practice bending up to pitch accurately (check against a fretted note), then add vibrato ' +
      'only after the bend settles, not during it. Try switching between the minor and major ' +
      'pentatonic shapes over the exact same backing chord to hear the color difference.',
    listenFor: ['Gravity', 'Vultures', 'Wildfire'],
    exampleTab: {
      label: 'Pentatonic blues lick (original example, A minor pentatonic box 1)',
      tab:
        'e|------------------5b7--5----|\n' +
        'B|-----------5-8--------------|\n' +
        'G|------5-7--------------------|\n' +
        'D|--7---------------------------|\n' +
        'A|------------------------------|\n' +
        'E|------------------------------|',
    },
  },
  {
    name: 'Bending Techniques',
    description:
      'Beyond a basic full-step bend: pre-bends (bend silently before picking, then release), ' +
      'bend-and-release in one motion, and unison bends (bending a note on one string up to match ' +
      'the pitch of a note already fretted on the string above it) — all classic SRV-lineage blues ' +
      'techniques that add vocal-like inflection to a lead line.',
    tip:
      'Practice unison bends by fretting both notes first to check the bend target is in tune, then ' +
      'remove the higher fretted note and bend up to match it by ear alone.',
    listenFor: ['Vultures', 'Wildfire'],
    exampleTab: {
      label: 'Pre-bend/release and unison bend (original example)',
      tab:
        'e|------------------|\n' +
        'B|--8b(10)r8--------|\n' +
        'G|----------7b(9)---|',
    },
  },
  {
    name: 'Double Stops',
    description:
      'Playing two notes at once, usually on adjacent strings, often bent or sustained together — ' +
      'a staple of blues lead playing that fills out a lick without needing a full chord.',
    tip:
      'Pick two adjacent strings together with a single downstroke and bend both evenly. Start with ' +
      'unison-feeling intervals (a 3rd apart) before trying wider ones.',
    listenFor: ['Good Love Is on the Way', "I Don't Trust Myself"],
    exampleTab: {
      label: 'Double stop example (original)',
      tab:
        'B|----7-7----|\n' +
        'G|----8-8----|',
    },
  },
  {
    name: 'Call-and-Response Phrasing',
    description:
      'Structuring a solo like a conversation: play a short phrase, leave space, then answer it with ' +
      'a variation — rather than running scales continuously. This is one of the biggest things that ' +
      'separates "blues phrasing" from just "knowing the pentatonic scale."',
    tip:
      'Play a 2-bar phrase, then rest for 2 bars before answering it. Force yourself to leave the ' +
      'space — the silence is doing as much work as the notes.',
    listenFor: ['Gravity (live versions especially)', 'Wildfire'],
    exampleTab: null,
  },
  {
    name: 'Target-Note Resolution',
    description:
      'Instead of running a scale shape up and down, aiming lead phrases to land on a chord tone ' +
      '(usually the 3rd or 5th) right when the underlying chord changes — it\'s what makes a solo ' +
      'sound melodic and "composed" rather than like a scale exercise.',
    tip:
      'Pick a simple two-chord vamp. Before soloing, work out which note is the 3rd of each chord, ' +
      'then build short phrases that land on that note exactly as the chord changes.',
    listenFor: ['Gravity', 'Wildfire'],
    exampleTab: null,
  },
  {
    name: 'Behind-the-Beat Timing ("The Pocket")',
    description:
      'Playing blues lead phrases very slightly behind the literal beat — relaxed rather than ' +
      'rushed — while rhythm parts stay locked tight to the click. This contrast between a loose ' +
      'lead feel and a tight rhythm section is a huge part of what makes blues-rock soloing feel ' +
      '"soulful" instead of mechanical.',
    tip:
      'Practice with a metronome on beats 2 and 4 only (not every beat) — it forces you to feel the ' +
      'pocket instead of anchoring to a click on every subdivision.',
    listenFor: ['Gravity', 'Georgia'],
    exampleTab: null,
  },
  {
    name: 'Tone & Touch Philosophy',
    description:
      'The playing style leans on dynamics more than effects: a clean-to-slightly-overdriven tone, ' +
      'single-coil-style pickups, moderate compression for an even attack, and restrained reverb/' +
      'delay rather than heavy effects. Most of the expression comes from picking-hand dynamics and ' +
      'volume-knob swells, not pedals.',
    tip:
      'Practice playing the same lick at three different volumes using only your picking hand ' +
      '(not the guitar\'s volume knob) — quiet/ghosted, medium, and full attack — without changing ' +
      'your fretting.',
    listenFor: null,
    exampleTab: null,
  },
  {
    name: 'Suggested Practice Order',
    description:
      'If you want to work through this roughly in order of difficulty: start with chord ' +
      'embellishments and capo voicings (easiest, immediately useful), then add hybrid/Travis ' +
      'picking patterns to your rhythm playing, then build pentatonic blues vocabulary with proper ' +
      'bending technique, then layer in call-and-response phrasing and target-note resolution once ' +
      'the vocabulary feels natural, and finally work on touch/dynamics and pocket timing — those ' +
      'last two are what take the longest but matter the most.',
    tip:
      'Don\'t try to combine all of these at once. Pick one technique per week and apply it to songs ' +
      'you already know before moving to the next.',
    listenFor: null,
    exampleTab: null,
  },
];

function renderMayerTechniques() {
  const container = document.getElementById('mayerTechniques');
  container.innerHTML = MAYER_TECHNIQUES.map(
    (t) => `
      <div class="mayer-card">
        <h2 class="mayer-card-title">${t.name}</h2>
        <p class="mayer-card-desc">${t.description}</p>
        <p class="mayer-card-tip"><strong>Practice tip:</strong> ${t.tip}</p>
        ${t.listenFor ? `<p class="mayer-card-listen"><strong>Listen for it in:</strong> ${t.listenFor.join(', ')}</p>` : ''}
        ${
          t.exampleTab
            ? `
              <div class="tab-section">
                <div class="tab-section-label">${t.exampleTab.label}</div>
                <pre class="tab-block">${t.exampleTab.tab}</pre>
              </div>
            `
            : ''
        }
      </div>
    `
  ).join('');
}

renderMayerTechniques();
