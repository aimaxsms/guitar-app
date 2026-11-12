const TECHNIQUE_GROUPS = {
  readtab: {
    label: 'How to Read Tab',
    intro:
      'Guitar tablature ("tab") is a quick way to write down exactly which string and fret to ' +
      'play, without needing to read standard music notation. Every tab example on this site ' +
      'uses the symbols explained here, so it\'s worth going through this once before the ' +
      'artist-specific sections.',
    items: [
      {
        name: 'Strings & Frets',
        description:
          'A tab is six horizontal lines, one per guitar string. The top line is the thinnest ' +
          'string (high e) and the bottom line is the thickest (low E) — the same top-to-bottom ' +
          'order as looking down at the guitar in playing position. A number on a line tells you ' +
          'which fret to press on that string; "0" means play the string open (no finger pressed ' +
          'down).',
        tip:
          'Say the string names out loud in order top to bottom a few times — e, B, G, D, A, E — ' +
          'until reading which line is which becomes automatic.',
        listenFor: null,
        exampleTab: {
          label: 'Single notes read left to right (open E, then 3rd fret G string, then open B)',
          tab:
            'e|------|\n' +
            'B|----0-|\n' +
            'G|--3---|\n' +
            'D|------|\n' +
            'A|------|\n' +
            'E|0-----|',
        },
      },
      {
        name: 'Chords: Numbers Stacked Vertically',
        description:
          'When two or more numbers line up directly above/below each other (in the same vertical ' +
          'position), that means play all of those notes at the same time — it\'s how tab shows a ' +
          'chord instead of a single melody note. An "x" on a line means mute or don\'t play that ' +
          'string at all.',
        tip:
          'Scan a tab column by column rather than line by line — if you only read one string at ' +
          'a time you\'ll miss that several notes were meant to ring together as a chord.',
        listenFor: null,
        exampleTab: {
          label: 'An open C chord written in tab (compare to the chord diagram version)',
          tab:
            'e|--0--\n' +
            'B|--1--\n' +
            'G|--0--\n' +
            'D|--2--\n' +
            'A|--3--\n' +
            'E|--x--',
        },
      },
      {
        name: 'Hammer-Ons & Pull-Offs (h / p)',
        description:
          'A hammer-on ("h") means pick one note, then without picking again, quickly press down a ' +
          'finger on a higher fret on the same string to sound the second note. A pull-off ("p") is ' +
          'the reverse: pick a fretted note, then lift that finger off (sometimes flicking it) to ' +
          'let a lower note or the open string ring out — both let you play two notes with only one ' +
          'pick stroke.',
        tip:
          'Practice hammer-ons and pull-offs with no pick at all first (just the fretting hand) to ' +
          'make sure the second note is loud and clear on its own before adding the pick back in.',
        listenFor: null,
        exampleTab: {
          label: 'Hammer-on from open to 2nd fret, then pull-off back to open (G string)',
          tab: 'G|--0h2p0--|',
        },
      },
      {
        name: 'Slides (/ and \\)',
        description:
          'A forward slash ("/") between two numbers means slide up from the first fret to the ' +
          'second while the note keeps ringing; a backslash ("\\") means slide down. Only the first ' +
          'note is usually picked — the slide itself produces the second note.',
        tip:
          'Keep steady pressure on the string as you slide so the note doesn\'t die out partway — ' +
          'the pitch should glide smoothly from one fret to the other, not stop and restart.',
        listenFor: null,
        exampleTab: {
          label: 'Slide up from 2nd to 5th fret, then down from 5th to 2nd (D string)',
          tab: 'D|--2/5--5\\2--|',
        },
      },
      {
        name: 'Bends & Releases (b / r)',
        description:
          'A "b" after a number means bend that fretted note up in pitch by pushing or pulling the ' +
          'string sideways — the number after the "b" (sometimes in parentheses) shows the target ' +
          'pitch as if it were fretted normally, e.g. "7b9" means fret the 7th fret and bend it up ' +
          'until it sounds like the 9th fret. An "r" means release the bend back down.',
        tip:
          'Check your bend target by first fretting that note normally and listening to it, then ' +
          'practice bending up to match that exact pitch by ear from the lower fret.',
        listenFor: null,
        exampleTab: {
          label: 'Bend 7th fret up to sound like 9th fret, then release back down (B string)',
          tab: 'B|--7b9r7--|',
        },
      },
      {
        name: 'Vibrato (~) & Palm Muting (PM)',
        description:
          'A tilde ("~") after a note means add vibrato — a slight, repeated wavering of pitch, ' +
          'usually done by small fast bends or finger shaking. "PM" with a dashed line under a ' +
          'passage means palm-mute those notes by resting the picking-hand palm lightly on the ' +
          'strings near the bridge for a muted, percussive tone.',
        tip:
          'Add vibrato only after a note has already settled at the right pitch — vibrato added too ' +
          'early just sounds like an out-of-tune bend.',
        listenFor: null,
        exampleTab: {
          label: 'Sustained note with vibrato, then a palm-muted phrase',
          tab:
            'e|--5~-----------|\n' +
            'PM: ------|--|--|--|',
        },
      },
      {
        name: 'Rhythm Notation Used on This Site',
        description:
          'Plain tab shows pitch but not timing. For strumming patterns, this site uses a simple ' +
          'letter shorthand instead of music notation: "D" for a downstroke, "U" for an upstroke, ' +
          'and "x" for a muted/ghosted stroke where the hand keeps moving but doesn\'t sound the ' +
          'strings — read left to right as one strum per letter.',
        tip:
          'Say the pattern out loud as a rhythm ("down... down-up... down") before trying to play ' +
          'it — getting the rhythm into your voice first makes it much easier to get into your ' +
          'hand.',
        listenFor: null,
        exampleTab: {
          label: 'A common strum pattern read as: down, down-up, up-down-up',
          tab: 'D   DU   UDU',
        },
      },
    ],
  },

  mayer: {
    label: 'John Mayer',
    intro:
      'A full breakdown of the techniques, phrasing habits, and tone philosophy behind his ' +
      'playing — not transcriptions of his songs, but the building blocks (picking hands, chord ' +
      'embellishments, blues vocabulary, timing feel) you can practice and apply to anything you ' +
      'play. Ordered roughly easiest-to-hardest, with a suggested practice path at the end.',
    items: [
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
          'Using a capo to play open-chord shapes in keys that would otherwise require barre ' +
          'chords — keeps the ringing, open-string sound (and makes room for embellishments and ' +
          'fingerpicking patterns) even when the song itself is in a higher key.',
        tip:
          'If a song feels locked into awkward barre chords, try capoing up a few frets and finding ' +
          'the open-shape equivalent instead — same sound, easier to play expressively, and ' +
          'embellishments become much easier to add.',
        listenFor: ['Your Body Is a Wonderland', '3x5'],
        exampleTab: null,
      },
      {
        name: 'Travis-Style Fingerpicking',
        description:
          'A pure fingerstyle pattern (no pick) where the thumb alternates between bass notes on ' +
          'the low strings while the fingers pick out melody or chord tones on top — different ' +
          'from hybrid picking, which still uses a pick for the bass notes. Travis picking gives a ' +
          'rolling, continuous feel under a chord progression, common in his quieter acoustic ' +
          'material.',
        tip:
          'Get the thumb pattern locked in first — alternating bass notes with no fingers at all — ' +
          'before adding the top-string picking. Most people rush this and the whole pattern falls ' +
          'apart.',
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
          'Holding the pick between thumb and index finger while using the middle and ring ' +
          'fingers to pluck other strings — lets you combine a strong pick attack on bass notes ' +
          'with soft, fingerstyle-like plucks on the higher strings, all in the same pattern. ' +
          'Think of it as a middle ground between flatpicking and Travis picking.',
        tip:
          'Start slow: pick the low string, then pluck the next two strings with middle/ring ' +
          'fingers in a steady loop. Keep the picked note louder than the plucked ones at first.',
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
          'Resting the picking hand lightly on the strings to deaden them, then strumming through ' +
          'for a percussive "chk" sound mixed in with real chord hits — gives a rhythm part a ' +
          'funky, syncopated feel even on just one chord.',
        tip:
          'Loop a single chord and alternate between a real strum and a muted "chk" on the ' +
          'off-beats. Keep the strumming hand moving in even eighth notes the whole time, muting ' +
          'with the fretting hand rather than stopping the strum.',
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
          'Playing a chord with a bass note other than its root (written like "C/E" — a C chord ' +
          'with an E in the bass) so the lowest note steps smoothly between chords instead of ' +
          'jumping around. This is what makes some of his chord progressions feel like they\'re ' +
          'gently descending or climbing rather than just changing.',
        tip:
          'Take a simple progression you know (like C–Am–F–G) and find a bass note for each chord ' +
          'that moves by step (C, B, A, G) instead of jumping — you can fret that note on the low ' +
          'E or A string under the same chord shape.',
        listenFor: ['Stop This Train', 'Dear Marie'],
        exampleTab: null,
      },
      {
        name: 'Blues-Rock Phrasing',
        description:
          'Mixing major and minor pentatonic scales over the same chord — minor pentatonic for ' +
          'darker, grittier moments, major pentatonic or added 6ths for brighter, more ' +
          'major-key-happy phrases — plus wide bends and fast vibrato. The vocabulary is rooted in ' +
          'SRV/Hendrix/BB King-style blues playing, but used in a pop-song context rather than a ' +
          'straight 12-bar blues.',
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
          'bend-and-release in one motion, and unison bends (bending a note on one string up to ' +
          'match the pitch of a note already fretted on the string above it) — all classic ' +
          'SRV-lineage blues techniques that add vocal-like inflection to a lead line.',
        tip:
          'Practice unison bends by fretting both notes first to check the bend target is in tune, ' +
          'then remove the higher fretted note and bend up to match it by ear alone.',
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
          'Playing two notes at once, usually on adjacent strings, often bent or sustained ' +
          'together — a staple of blues lead playing that fills out a lick without needing a full ' +
          'chord.',
        tip:
          'Pick two adjacent strings together with a single downstroke and bend both evenly. Start ' +
          'with unison-feeling intervals (a 3rd apart) before trying wider ones.',
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
          'Structuring a solo like a conversation: play a short phrase, leave space, then answer ' +
          'it with a variation — rather than running scales continuously. This is one of the ' +
          'biggest things that separates "blues phrasing" from just "knowing the pentatonic scale."',
        tip:
          'Play a 2-bar phrase, then rest for 2 bars before answering it. Force yourself to leave ' +
          'the space — the silence is doing as much work as the notes.',
        listenFor: ['Gravity (live versions especially)', 'Wildfire'],
        exampleTab: null,
      },
      {
        name: 'Target-Note Resolution',
        description:
          'Instead of running a scale shape up and down, aiming lead phrases to land on a chord ' +
          'tone (usually the 3rd or 5th) right when the underlying chord changes — it\'s what makes ' +
          'a solo sound melodic and "composed" rather than like a scale exercise.',
        tip:
          'Pick a simple two-chord vamp. Before soloing, work out which note is the 3rd of each ' +
          'chord, then build short phrases that land on that note exactly as the chord changes.',
        listenFor: ['Gravity', 'Wildfire'],
        exampleTab: null,
      },
      {
        name: 'Behind-the-Beat Timing ("The Pocket")',
        description:
          'Playing blues lead phrases very slightly behind the literal beat — relaxed rather than ' +
          'rushed — while rhythm parts stay locked tight to the click. This contrast between a ' +
          'loose lead feel and a tight rhythm section is a huge part of what makes blues-rock ' +
          'soloing feel "soulful" instead of mechanical.',
        tip:
          'Practice with a metronome on beats 2 and 4 only (not every beat) — it forces you to feel ' +
          'the pocket instead of anchoring to a click on every subdivision.',
        listenFor: ['Gravity', 'Georgia'],
        exampleTab: null,
      },
      {
        name: 'Tone & Touch Philosophy',
        description:
          'The playing style leans on dynamics more than effects: a clean-to-slightly-overdriven ' +
          'tone, single-coil-style pickups, moderate compression for an even attack, and ' +
          'restrained reverb/delay rather than heavy effects. Most of the expression comes from ' +
          'picking-hand dynamics and volume-knob swells, not pedals.',
        tip:
          'Practice playing the same lick at three different volumes using only your picking hand ' +
          '(not the guitar\'s volume knob) — quiet/ghosted, medium, and full attack — without ' +
          'changing your fretting.',
        listenFor: null,
        exampleTab: null,
      },
      {
        name: 'Signature-Style Riff (Original Composition)',
        description:
          'A full riff written in the muted, syncopated funk-pop groove style heard in his ' +
          'rhythm playing — ghosted muted hits mixed with open chord tones over an A chord, not a ' +
          'transcription of any specific song, but built from the same vocabulary.',
        tip:
          'Keep the picking hand moving in strict eighth notes the whole way through, even on the ' +
          'muted (x) hits — the groove comes from the hand never stopping, only the strings ' +
          'changing between muted and open.',
        listenFor: ['Waiting on the World to Change', 'Who You Love', 'Belief'],
        exampleTab: {
          label: 'Signature-style funk riff in A (original composition)',
          tab:
            'e|--0-------0-----0---|\n' +
            'B|-----2--x----2-x----|\n' +
            'G|--2-----x-2-----x---|\n' +
            'D|--2-----x-2-----x---|\n' +
            'A|--0-----------------|\n' +
            'E|---------------------|',
        },
      },
      {
        name: 'Signature-Style Guitar Solo (Original Composition)',
        description:
          'A short lead phrase written in A minor pentatonic that strings together several of the ' +
          'techniques above — a pre-bend/release, a double stop, and a call-and-response pause — ' +
          'into one original 2-bar solo idea, giving you a template to build your own phrases from.',
        tip:
          'Play it through slowly first to get the bend targets and timing right, then try writing ' +
          'your own "answer" phrase for the second bar instead of using the one given, using the ' +
          'same call-and-response idea.',
        listenFor: ['Gravity', 'Wildfire', 'Vultures'],
        exampleTab: {
          label: 'Signature-style A minor pentatonic solo phrase (original composition)',
          tab:
            'e|------------------5b7r5---------5--|\n' +
            'B|----5---8p5------------8-8----------|\n' +
            'G|--5---------------------------------|\n' +
            'D|-------------------------------------|\n' +
            'A|-------------------------------------|\n' +
            'E|-------------------------------------|',
        },
      },
      {
        name: 'John Mayer Jam, Step 1: Pick a Key (C# Minor)',
        description:
          'This jam is a simple loop you can improvise over for as long as you like, in the style of ' +
          'his slow blues-rock playing. It starts in C# minor, the key of "Slow Dancing in a Burning ' +
          'Room". To find your starting point, look for C# on the low E string: counting up the ' +
          'frets it goes F, F#, G, G#, A, A#, B, C, then C# at the 9th fret. Everything in the next ' +
          'steps is built around that 9th-fret root.',
        tip:
          'Say the note names out loud as you walk up the low E string. Once you can find any root ' +
          'this way, you can move the whole jam to a different key just by starting on a different fret.',
        listenFor: ['Slow Dancing in a Burning Room'],
        fretboards: [
          {
            label: 'Notes on the low E string. C# (the root) is at the 9th fret',
            startFret: 1,
            endFret: 12,
            numbers: [5, 9, 12],
            dots: [
              { s: 5, f: 1, label: 'F' }, { s: 5, f: 2, label: 'F#', kind: 'extra' },
              { s: 5, f: 3, label: 'G' }, { s: 5, f: 4, label: 'G#', kind: 'extra' },
              { s: 5, f: 5, label: 'A' }, { s: 5, f: 6, label: 'A#', kind: 'extra' },
              { s: 5, f: 7, label: 'B' }, { s: 5, f: 8, label: 'C' },
              { s: 5, f: 9, label: 'C#', kind: 'root' }, { s: 5, f: 10, label: 'D' },
              { s: 5, f: 11, label: 'D#', kind: 'extra' }, { s: 5, f: 12, label: 'E' },
            ],
          },
        ],
        exampleTab: null,
      },
      {
        name: 'John Mayer Jam, Step 2: C# Minor Pentatonic (and the Full Minor Scale)',
        description:
          'Play the C# minor pentatonic scale in the box starting at the 9th fret, with your first ' +
          'finger on the C# root. Every string has two notes, at frets 9 and 11 or 9 and 12. When ' +
          'you want more color, switch to the full C# minor scale. It is the same box with a few ' +
          'extra notes (shown in gray): D# on the G string (fret 8) and on both E strings (fret 11), ' +
          'plus A on the B string (fret 10) and the A string (fret 12).',
        tip:
          'Start and end every phrase on a C# (the light dots) so your lines sound resolved. Use the ' +
          'gray minor-scale notes as passing notes rather than notes to land on.',
        listenFor: null,
        fretboards: [
          {
            label: 'C# minor pentatonic, 9th-fret box',
            startFret: 8,
            endFret: 12,
            numbers: [9, 12],
            dots: [
              { s: 0, f: 9, kind: 'root' }, { s: 0, f: 12 },
              { s: 1, f: 9 }, { s: 1, f: 12 },
              { s: 2, f: 9 }, { s: 2, f: 11 },
              { s: 3, f: 9 }, { s: 3, f: 11, kind: 'root' },
              { s: 4, f: 9 }, { s: 4, f: 11 },
              { s: 5, f: 9, label: 'C#', kind: 'root' }, { s: 5, f: 12 },
            ],
          },
          {
            label: 'C# minor scale, same box plus the gray notes',
            startFret: 8,
            endFret: 12,
            numbers: [9, 12],
            dots: [
              { s: 0, f: 9, kind: 'root' }, { s: 0, f: 11, kind: 'extra' }, { s: 0, f: 12 },
              { s: 1, f: 9 }, { s: 1, f: 10, kind: 'extra' }, { s: 1, f: 12 },
              { s: 2, f: 8, kind: 'extra' }, { s: 2, f: 9 }, { s: 2, f: 11 },
              { s: 3, f: 9 }, { s: 3, f: 11, kind: 'root' },
              { s: 4, f: 9 }, { s: 4, f: 11 }, { s: 4, f: 12, kind: 'extra' },
              { s: 5, f: 9, label: 'C#', kind: 'root' }, { s: 5, f: 11, kind: 'extra' }, { s: 5, f: 12 },
            ],
          },
        ],
        exampleTab: null,
      },
      {
        name: 'John Mayer Jam, Step 3: Combine It With the C#m7 Chord',
        description:
          'Play back and forth between this chord and the pentatonic scale: strum the chord, answer ' +
          'it with a short lick, then strum the chord again. It sits in the same spot as the scale: ' +
          'C# on the low E string at fret 9, with your fingers on fret 9 of the G, B and high e ' +
          'strings (A string muted). That shape on its own spells C#m. Add the B at fret 9 on the ' +
          'D string (gray) to get the full C#m7 sound.',
        tip:
          'Keep the chord short and percussive so it leaves room for the lick, the same ' +
          'call-and-response idea from earlier in this section. Your hand never has to leave the ' +
          '9th fret.',
        listenFor: null,
        fretboards: [
          {
            label: 'C#m7 at the 9th fret (9-x-9-9-9-9 with the optional B)',
            startFret: 8,
            endFret: 12,
            numbers: [9, 12],
            dots: [
              { s: 0, f: 9 }, { s: 1, f: 9 }, { s: 2, f: 9 },
              { s: 3, f: 9, label: 'B', kind: 'extra' },
              { s: 5, f: 9, label: 'C#', kind: 'root' },
            ],
            muted: [4],
          },
        ],
        exampleTab: null,
      },
      {
        name: 'John Mayer Jam, Step 4: All the Chords in E Major',
        description:
          'C# minor and E major share the same seven notes (E major is the relative major of C# ' +
          'minor), so every chord in E major fits over the jam and works with the same pentatonic ' +
          'box. In order they are E, F#m, G#m, A, B, C#m and B/D# (a B chord with D# in the bass), ' +
          'and then E again. People usually name them from E major even when the jam centers on C#m, ' +
          'because that is the more practical way to think about them. Each shape below is the same ' +
          'three-note grip on the G, D and B strings with a bass note on the low E, moved up the neck.',
        tip:
          'Try the second version too: it keeps the open B and high e strings ringing over every ' +
          'chord, which gives that shimmering, droning sound. Then build a loop such as C#m, A, E, B ' +
          'and solo over it with the Step 2 box.',
        listenFor: null,
        exampleTabs: [
          {
            label: 'Chords in E major (3-note shapes + bass note)',
            tab:
              '   E     F#m   G#m   A\n' +
              'e|-------------------------|\n' +
              'B|-0-----2-----4-----5-----|\n' +
              'G|-1-----2-----4-----6-----|\n' +
              'D|-2-----4-----6-----7-----|\n' +
              'A|-------------------------|\n' +
              'E|-0-----2-----4-----5-----|\n' +
              '\n' +
              '   B     C#m   B/D#  E\n' +
              'e|-------------------------|\n' +
              'B|-7-----9-----12----12----|\n' +
              'G|-8-----9-----11----13----|\n' +
              'D|-9-----11----13----14----|\n' +
              'A|-------------------------|\n' +
              'E|-7-----9-----11----12----|',
          },
          {
            label: 'Same chords with the open B and high e strings ringing',
            tab:
              '   E     F#m   G#m   A\n' +
              'e|-0-----0-----0-----0-----|\n' +
              'B|-0-----0-----0-----0-----|\n' +
              'G|-1-----2-----4-----6-----|\n' +
              'D|-2-----4-----6-----7-----|\n' +
              'A|-2-----------------------|\n' +
              'E|-0-----2-----4-----5-----|\n' +
              '\n' +
              '   B     C#m   B/D#  E\n' +
              'e|-0-----0-----0-----0-----|\n' +
              'B|-0-----0-----0-----0-----|\n' +
              'G|-8-----9-----11----13----|\n' +
              'D|-9-----11----13----14----|\n' +
              'A|-------------------------|\n' +
              'E|-7-----9-----11----12----|',
          },
        ],
        exampleTab: null,
      },
      {
        name: 'Suggested Practice Order',
        description:
          'If you want to work through this roughly in order of difficulty: start with chord ' +
          'embellishments and capo voicings (easiest, immediately useful), then add hybrid/Travis ' +
          'picking patterns to your rhythm playing, then build pentatonic blues vocabulary with ' +
          'proper bending technique, then layer in call-and-response phrasing and target-note ' +
          'resolution once the vocabulary feels natural, and finally work on touch/dynamics and ' +
          'pocket timing — those last two are what take the longest but matter the most.',
        tip:
          'Don\'t try to combine all of these at once. Pick one technique per week and apply it to ' +
          'songs you already know before moving to the next.',
        listenFor: null,
        exampleTab: null,
      },
    ],
  },

  sheeran: {
    label: 'Ed Sheeran',
    intro:
      'The techniques behind a one-man-band acoustic sound — loop pedal layering, percussive ' +
      'body tapping, and capo-driven strumming — general approach and vocabulary, not ' +
      'transcriptions of any specific song.',
    items: [
      {
        name: 'Percussive Body Tapping',
        description:
          'Using the strumming hand (or a loose fist) to tap or slap the top of the guitar body — ' +
          'near the sound hole or on the upper bout — in between chord strums, adding a ' +
          'kick/snare-like percussive layer without needing an actual drum.',
        tip:
          'Practice the tap completely separately first as a steady beat on the guitar body, then ' +
          'add chord strums into the gaps between taps before trying to blend the two into one ' +
          'continuous motion.',
        listenFor: ['The A Team', 'Sing', 'Bloodstream'],
        exampleTab: {
          label: 'Strum + body tap pattern (original example, T = tap on guitar body)',
          tab: 'Beat:  1   +   2   +   3   +   4   +\nHand:  D   T   D   T   DU  T   D   T',
        },
      },
      {
        name: 'Loop Pedal Layering',
        description:
          'Building a complete arrangement live, one layer at a time, using a loop pedal — ' +
          'typically a rhythm strum pattern first, then a percussive body-tap loop, then a ' +
          'bass-note or melodic layer, sometimes vocal harmonies — turning one guitarist into a ' +
          'full "band."',
        tip:
          'Even without a loop pedal, practice playing each layer (rhythm strum, percussion tap, ' +
          'bass notes) completely alone and in time with a metronome — that\'s the real skill the ' +
          'pedal is just capturing.',
        listenFor: ['You Need Me, I Don\'t Need You (live loop performances)'],
        exampleTab: null,
      },
      {
        name: 'High Capo Placement',
        description:
          'Capoing quite high up the neck (often around the 5th–7th fret) to use simple ' +
          'open-chord shapes while keeping the strum bright and percussive and the vocal melody in ' +
          'a comfortable singing range — a brightness/energy choice, distinct from using a capo ' +
          'just to simplify a chord shape.',
        tip:
          'Try playing a song\'s normal chord shapes with a capo at the 5th or 7th fret instead of ' +
          'barre chords further up the neck — notice how much brighter and more percussive the ' +
          'strum sounds.',
        listenFor: ['Perfect', 'Photograph'],
        exampleTab: null,
      },
      {
        name: 'Driving Sixteenth-Note Strum Patterns',
        description:
          'A continuous, fast down-up strumming motion where some strokes are "ghosted" (the hand ' +
          'keeps moving in rhythm but doesn\'t actually strike the strings) — keeps the strumming ' +
          'hand locked into a steady pulse even when the actual chord changes happen less often, ' +
          'giving a tight, energetic, almost rhythmic-guitar-as-percussion feel.',
        tip:
          'Keep your strumming hand moving in a constant down-up-down-up motion no matter what, ' +
          'and practice choosing which strokes actually hit the strings versus which ones "ghost" ' +
          'past them.',
        listenFor: ['Sing', "Don't"],
        exampleTab: {
          label: 'Ghost-strum pattern (original example, x = ghosted stroke, no string contact)',
          tab: 'D   D   U   x   U   D   U   x',
        },
      },
      {
        name: 'Simple, Direct Chord Vocabulary',
        description:
          'Mostly straightforward major/minor open and capo\'d chord shapes rather than ' +
          'extended/jazz harmony — the energy comes from rhythm, dynamics, and arrangement (loops, ' +
          'taps) rather than chord complexity.',
        tip:
          'Resist the urge to add extensions to every chord — practice getting a simple open ' +
          'G–D–Em–C progression to sound huge through strumming dynamics and tapping alone, with ' +
          'zero embellishment.',
        listenFor: null,
        exampleTab: null,
      },
      {
        name: 'Fingerpicked Intros / Dynamic Builds',
        description:
          'Several songs open with a quiet, simple fingerpicked arpeggio over a capo\'d chord ' +
          'before the full strum and tapping kick in — a deliberate quiet-to-loud arc that makes ' +
          'the "full band" entrance feel bigger.',
        tip:
          'Practice playing just the first few bars of any song fingerpicked and soft before ' +
          'switching to a full strum — the contrast is doing more work than the strum itself.',
        listenFor: ['Photograph', 'Thinking Out Loud'],
        exampleTab: {
          label: 'Simple fingerpicked arpeggio (original example, capo\'d G shape)',
          tab:
            'e|--3-----------3-----------|\n' +
            'B|-----0-----0-----0-----0--|\n' +
            'G|--------0-----------0------|\n' +
            'D|---------------------------|\n' +
            'A|---------------------------|\n' +
            'E|--3-------------------3---|',
        },
      },
      {
        name: 'Rhythmic Pocket for Vocal Phrasing',
        description:
          'Strumming/tapping patterns are often kept rhythmically simple and repetitive so they ' +
          'create a steady "pocket" underneath fast, syncopated vocal lines — letting the vocal ' +
          'phrasing (including rap-influenced fast lyric delivery) sit rhythmically complex on top ' +
          'of a steady guitar part.',
        tip:
          'Record yourself playing a simple strum loop, then practice singing or rapping ' +
          'increasingly complex rhythms on top without letting the strum pattern waver.',
        listenFor: null,
        exampleTab: null,
      },
    ],
  },

  jazz: {
    label: 'Jazz',
    intro:
      'Core jazz guitar vocabulary and comping/soloing concepts — foundational techniques used ' +
      'across the genre, not tied to any one artist.',
    items: [
      {
        name: 'Drop 2 Voicings',
        description:
          'Four-note chord voicings built by taking a close-position chord and dropping the ' +
          'second-highest note down an octave — spreads the notes across the middle strings and ' +
          'makes smooth, guitar-friendly chord shapes that are the backbone of jazz comping.',
        tip:
          'Take a simple 7th chord you know in close position and try moving just the ' +
          'second-highest note down an octave — notice how much easier it becomes to grab on the ' +
          'guitar.',
        listenFor: null,
        exampleTab: {
          label: 'Cmaj7 drop 2 voicing (verified: C-G-B-E from low to high)',
          tab:
            'e|--x--\n' +
            'B|--5--\n' +
            'G|--4--\n' +
            'D|--5--\n' +
            'A|--3--\n' +
            'E|--x--',
        },
      },
      {
        name: 'Essential Jazz Chord Shapes',
        description:
          'Four compact, movable grips (root on the A string, D-G-B strings fretted, low E and ' +
          'high e muted) that cover the chord qualities jazz harmony runs on most: minor 7, ' +
          'dominant 7, half-diminished (m7b5), and fully diminished 7 — the last two are the ones ' +
          'the main Chord Library doesn\'t cover, and they\'re essential for minor ii-V-i\'s and ' +
          'diminished passing chords.',
        tip:
          'These are movable — the whole grip just slides up/down the neck with the root note on ' +
          'the A string. Learn where the root sits for each shape, then practice sliding each shape ' +
          'through all 12 keys before trying to use them in a progression.',
        listenFor: null,
        exampleTab: {
          label: 'Cm7, C7, Cm7b5, Cdim7 (verified voicings, root on A string, movable shapes)',
          tab:
            'Cm7         C7          Cm7b5       Cdim7\n' +
            'e|--x--      e|--x--      e|--x--      e|--x--\n' +
            'B|--4--      B|--5--      B|--4--      B|--4--\n' +
            'G|--3--      G|--3--      G|--4--      G|--2--\n' +
            'D|--5--      D|--5--      D|--4--      D|--4--\n' +
            'A|--3--      A|--3--      A|--3--      A|--3--\n' +
            'E|--x--      E|--x--      E|--x--      E|--x--',
        },
      },
      {
        name: 'ii-V-I Progressions',
        description:
          'The most common harmonic movement in jazz — a minor 7th chord on the 2nd scale ' +
          'degree, moving to a dominant 7th on the 5th, resolving to a major 7th on the 1st (e.g., ' +
          'Dm7–G7–Cmaj7 in the key of C). Nearly every jazz standard is built from chains of these.',
        tip:
          'Practice comping through a ii-V-I in all 12 keys using drop-2 voicings, moving each ' +
          'chord to the nearest available voicing on the neck rather than jumping around.',
        listenFor: null,
        exampleTab: null,
      },
      {
        name: 'Guide Tone Lines',
        description:
          'Connecting just the 3rd and 7th of each chord as you move through a progression — ' +
          'these two notes define whether a chord sounds major, dominant, or minor, so smoothly ' +
          'linking them (often moving by step or holding a common tone) outlines the harmony ' +
          'clearly even without playing full chords.',
        tip:
          'Over a ii-V-I, find just the 3rd and 7th of each chord and practice moving between only ' +
          'those two notes per chord before adding anything else.',
        listenFor: null,
        exampleTab: {
          label: 'Guide tones over Dm7–G7–Cmaj7 (verified voice leading, F held then E, C to B held)',
          tab:
            'e|-----------------|\n' +
            'B|--1-----0-----0--|\n' +
            'G|-----------------|\n' +
            'D|--3-----3-----2--|\n' +
            'A|-----------------|\n' +
            'E|-----------------|',
        },
      },
      {
        name: 'Chromatic Approach Notes',
        description:
          'Approaching a target chord tone from a half-step above or below right before landing ' +
          'on it — a core be-bop melodic device that creates forward motion and tension-release in ' +
          'a solo line.',
        tip:
          'Pick any target note in a scale and practice approaching it from a half-step below, ' +
          'then from a half-step above, then try alternating which side you approach from.',
        listenFor: null,
        exampleTab: {
          label: 'Chromatic approach from both sides to one target note (original example)',
          tab: 'B|--2--3-----4--3--|',
        },
      },
      {
        name: 'Walking Bass Lines',
        description:
          'Outlining the chord progression with a quarter-note bass line built from chord tones ' +
          'and chromatic passing notes — common in solo or duo jazz guitar playing where there\'s ' +
          'no separate bassist.',
        tip:
          'Over a simple ii-V-I, build a bass line using just the root, 3rd, 5th, and one ' +
          'chromatic passing tone per chord, keeping it in steady quarter notes.',
        listenFor: null,
        exampleTab: {
          label: 'Walking bass fragment, D up to G (original example)',
          tab: 'D|--0-----2-----4-----5--|',
        },
      },
      {
        name: 'Swing Comping Rhythm',
        description:
          'Playing chords in a syncopated, "swung" rhythm — often called "Freddie Green" style ' +
          'comping — hitting chords on beats 2 and 4, or in a swung eighth-note pattern, rather ' +
          'than a straight strum, giving the classic swing-era rhythmic feel.',
        tip:
          'Practice comping a single chord on just beats 2 and 4 with a metronome, muting the ' +
          'chord immediately after each hit for a short, percussive "chunk" sound.',
        listenFor: null,
        exampleTab: null,
      },
      {
        name: 'Altered Dominant Tensions',
        description:
          'Adding altered tensions — b9, #9, #11, b13 — to dominant 7th chords for the ' +
          'tension-and-release sound central to be-bop and modern jazz harmony, especially right ' +
          'before resolving to the next chord.',
        tip:
          'Take a basic dominant 7th shape you know and try adding just one altered tension at a ' +
          'time, listening for how it changes the pull toward resolution.',
        listenFor: null,
        exampleTab: null,
      },
    ],
  },
};

let activeTechniqueGroup = 'readtab';

const elTechniqueSubTabs = document.getElementById('techniqueSubTabs');
const elTechniqueIntro = document.getElementById('techniqueIntro');
const elTechniqueCards = document.getElementById('techniqueCards');

// Horizontal fretboard like a lesson book: high e on top, low E at the bottom.
// dots: { s: string index (0 = high e), f: fret, label?, kind?: 'root' | 'extra' }
function buildFretboardSvg(fb) {
  const FW = 44;
  const SG = 22;
  const LEFT = 26;
  const TOP = 14;
  const frets = fb.endFret - fb.startFret + 1;
  const width = LEFT + frets * FW + 8;
  const height = TOP + 5 * SG + 34;
  const xFor = (f) => LEFT + (f - fb.startFret + 0.5) * FW;
  const names = ['e', 'B', 'G', 'D', 'A', 'E'];
  // Long stretches of neck keep a readable size and scroll sideways on narrow screens.
  let svg = `<svg class="fretboard-svg" style="min-width:${Math.min(width, frets * 34 + LEFT)}px" viewBox="0 0 ${width} ${height}" role="img" aria-label="${fb.label}">`;

  for (let f = fb.startFret; f <= fb.endFret; f++) {
    const cx = xFor(f);
    if ([3, 5, 7, 9, 15, 17].includes(f)) svg += `<circle cx="${cx}" cy="${TOP + 2.5 * SG}" r="4" fill="#263f72" />`;
    if (f === 12) {
      svg += `<circle cx="${cx}" cy="${TOP + 1.5 * SG}" r="4" fill="#263f72" />`;
      svg += `<circle cx="${cx}" cy="${TOP + 3.5 * SG}" r="4" fill="#263f72" />`;
    }
  }
  for (let i = 0; i <= frets; i++) {
    const x = LEFT + i * FW;
    const isNut = i === 0 && fb.startFret === 1;
    svg += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + 5 * SG}" stroke="#4a6396" stroke-width="${isNut ? 4 : 1}" />`;
  }
  names.forEach((n, s) => {
    const y = TOP + s * SG;
    svg += `<line x1="${LEFT}" y1="${y}" x2="${LEFT + frets * FW}" y2="${y}" stroke="#8394b3" stroke-width="${1 + s * 0.3}" />`;
    const muted = (fb.muted || []).includes(s);
    svg += `<text x="${LEFT - 8}" y="${y + 4}" font-size="11" fill="${muted ? '#f87171' : '#9fb0cc'}" text-anchor="end">${muted ? 'x' : n}</text>`;
  });
  (fb.numbers || []).forEach((f) => {
    svg += `<text x="${xFor(f)}" y="${TOP + 5 * SG + 24}" font-size="12" fill="#b4c1d9" text-anchor="middle">${f}</text>`;
  });
  fb.dots.forEach((d) => {
    const fill = d.kind === 'root' ? '#edeae3' : d.kind === 'extra' ? '#8394b3' : '#60a5fa';
    const y = TOP + d.s * SG;
    svg += `<circle cx="${xFor(d.f)}" cy="${y}" r="9" fill="${fill}"${d.kind === 'root' ? ' data-root="1"' : ''} />`;
    if (d.label) {
      svg += `<text x="${xFor(d.f)}" y="${y + 3.5}" font-size="${d.label.length > 1 ? 8 : 9.5}" font-weight="700" fill="#0e1b36" text-anchor="middle">${d.label}</text>`;
    }
  });
  svg += '</svg>';
  return `<figure class="fretboard-figure"><div class="fretboard-scroll">${svg}</div><figcaption>${fb.label}</figcaption></figure>`;
}

function renderTechniqueCards() {
  const group = TECHNIQUE_GROUPS[activeTechniqueGroup];
  elTechniqueIntro.textContent = group.intro;

  elTechniqueCards.innerHTML = group.items
    .map(
      (t) => `
        <div class="technique-card">
          <h2 class="technique-card-title">${t.name}</h2>
          <p class="technique-card-desc">${t.description}</p>
          <p class="technique-card-tip"><strong>Practice tip:</strong> ${t.tip}</p>
          ${t.listenFor ? `<p class="technique-card-listen"><strong>Listen for it in:</strong> ${t.listenFor.join(', ')}</p>` : ''}
          ${(t.fretboards || []).map(buildFretboardSvg).join('')}
          ${[t.exampleTab, ...(t.exampleTabs || [])]
            .filter(Boolean)
            .map(
              (ex) => `
                <div class="tab-section">
                  <div class="tab-section-label">${ex.label}</div>
                  <pre class="tab-block">${ex.tab}</pre>
                </div>
              `
            )
            .join('')}
        </div>
      `
    )
    .join('');

  // Fretboards wider than the screen scroll sideways: start them centered on the root note.
  elTechniqueCards.querySelectorAll('.fretboard-scroll').forEach((wrap) => {
    if (wrap.scrollWidth <= wrap.clientWidth + 2) return;
    wrap.closest('.fretboard-figure').classList.add('is-scrollable');
    const root = wrap.querySelector('[data-root]');
    if (!root) return;
    const offset = root.getBoundingClientRect().left - wrap.getBoundingClientRect().left;
    wrap.scrollLeft = Math.max(0, offset - wrap.clientWidth / 2);
  });

  elTechniqueSubTabs.querySelectorAll('.sub-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.group === activeTechniqueGroup);
  });
}

Object.entries(TECHNIQUE_GROUPS).forEach(([key, group]) => {
  const btn = document.createElement('button');
  btn.className = 'sub-tab-btn';
  btn.textContent = group.label;
  btn.dataset.group = key;
  btn.addEventListener('click', () => {
    activeTechniqueGroup = key;
    renderTechniqueCards();
  });
  elTechniqueSubTabs.appendChild(btn);
});

renderTechniqueCards();
