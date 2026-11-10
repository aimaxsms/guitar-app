const MAYER_TECHNIQUES = [
  {
    name: 'Hybrid Picking',
    description:
      'Holding the pick between thumb and index finger while using the middle and ring fingers ' +
      'to pluck other strings — lets you combine a strong pick attack on bass notes with soft, ' +
      'fingerstyle-like plucks on the higher strings, all in the same pattern.',
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
    name: 'Chord Embellishments',
    description:
      'Taking a plain open or barre chord and adding one extra note — a 9th, a major 7th, a ' +
      'suspended 2nd or 4th — to make it sound richer and more "vocal" without changing the ' +
      'underlying chord function.',
    tip:
      'Pick any basic open chord you know and try lifting or adding one finger at a time. Listen ' +
      'for which added notes sound good sustained vs. only in passing.',
    listenFor: ['Daughters', 'Stop This Train', 'Dear Marie'],
    exampleTab: null,
  },
  {
    name: 'Blues-Rock Phrasing',
    description:
      'Mixing major and minor pentatonic scales over the same chord, with wide bends, fast ' +
      'vibrato, and call-and-response phrasing — a vocabulary rooted in SRV/Hendrix/BB King-style ' +
      'blues playing.',
    tip:
      'Practice bending up to pitch accurately (check against a fretted note), then add vibrato ' +
      'only after the bend settles, not during it.',
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
    name: 'Percussive Muting / Funk Comping',
    description:
      'Resting the picking hand lightly on the strings to deaden them, then strumming through for ' +
      'a percussive "chk" sound mixed in with real chord hits — gives a rhythm part a funky, ' +
      'syncopated feel even on just one chord.',
    tip:
      'Loop a single chord and alternate between a real strum and a muted "chk" on the off-beats. ' +
      'Keep the strumming hand moving in even eighth notes the whole time, muting with the fretting ' +
      'hand rather than stopping the strum.',
    listenFor: ['Belief', 'Who You Love', "Waiting on the World to Change"],
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
    name: 'Capo for Open Voicings',
    description:
      'Using a capo to play open-chord shapes in keys that would otherwise require barre chords — ' +
      'keeps the ringing, open-string sound even when the song is in a higher key.',
    tip:
      'If a song feels locked into awkward barre chords, try capoing up a few frets and finding the ' +
      'open-shape equivalent instead — same sound, easier to play expressively.',
    listenFor: ['Your Body Is a Wonderland', '3x5'],
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
