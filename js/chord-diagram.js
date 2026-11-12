const DIAGRAM_WIDTH = 112;
const DIAGRAM_TOP = 26;
const DIAGRAM_LEFT = 26;
const STRING_GAP = 14;
const FRET_GAP = 20;
const FRET_ROWS = 4;

function buildChordDiagramSvg(position, labelMode = 'finger') {
  const { startFret, frets, fingers } = position;
  const bottom = DIAGRAM_TOP + FRET_ROWS * FRET_GAP;
  let svg = `<svg viewBox="0 0 ${DIAGRAM_WIDTH} ${bottom + 10}" width="${DIAGRAM_WIDTH}" height="${bottom + 10}">`;

  for (let s = 0; s < 6; s++) {
    const x = DIAGRAM_LEFT + s * STRING_GAP;
    svg += `<line x1="${x}" y1="${DIAGRAM_TOP}" x2="${x}" y2="${bottom}" stroke="#555" stroke-width="1" />`;
  }

  for (let row = 0; row <= FRET_ROWS; row++) {
    const y = DIAGRAM_TOP + row * FRET_GAP;
    const thick = row === 0 && startFret === 0;
    svg += `<line x1="${DIAGRAM_LEFT}" y1="${y}" x2="${DIAGRAM_LEFT + 5 * STRING_GAP}" y2="${y}" stroke="#555" stroke-width="${thick ? 3 : 1}" />`;
  }

  for (let row = 0; row < FRET_ROWS; row++) {
    const absoluteFret = startFret + row;
    const y = DIAGRAM_TOP + (row + 0.5) * FRET_GAP;
    svg += `<text x="${DIAGRAM_LEFT - 10}" y="${y + 3}" font-size="9" fill="#6b7280" text-anchor="end">${absoluteFret}</text>`;
  }

  frets.forEach((fret, s) => {
    const x = DIAGRAM_LEFT + s * STRING_GAP;
    if (fret === 'x') {
      svg += `<text x="${x}" y="${DIAGRAM_TOP - 10}" font-size="11" fill="#9ca3af" text-anchor="middle">x</text>`;
    } else if (fret === startFret && startFret === 0) {
      if (labelMode === 'note') {
        const openNote = fretToNoteName(s, 0);
        svg += `<circle cx="${x}" cy="${DIAGRAM_TOP - 14}" r="6" fill="none" stroke="#9ca3af" stroke-width="1.2" />`;
        svg += `<text x="${x}" y="${DIAGRAM_TOP - 11}" font-size="7.5" fill="#9ca3af" text-anchor="middle">${openNote}</text>`;
      } else {
        svg += `<text x="${x}" y="${DIAGRAM_TOP - 10}" font-size="11" fill="#9ca3af" text-anchor="middle">o</text>`;
      }
    } else {
      const relative = fret - startFret;
      const y = DIAGRAM_TOP + (relative + 0.5) * FRET_GAP;
      svg += `<circle cx="${x}" cy="${y}" r="7" fill="#edeae3" />`;
      if (labelMode === 'note') {
        const noteName = fretToNoteName(s, fret);
        svg += `<text x="${x}" y="${y + 3}" font-size="8" font-weight="700" fill="#121212" text-anchor="middle">${noteName}</text>`;
      } else {
        const finger = fingers ? fingers[s] : null;
        if (finger !== null && finger !== undefined && finger !== 0 && finger !== 'x') {
          svg += `<text x="${x}" y="${y + 3}" font-size="9" font-weight="700" fill="#121212" text-anchor="middle">${finger}</text>`;
        }
      }
    }
  });

  svg += '</svg>';
  return svg;
}

function renderChordDiagrams(container, chordLabel, { labelMode = 'finger' } = {}) {
  const parsed = parseChordName(chordLabel);
  if (!parsed) {
    container.innerHTML = `<p class="chord-panel-error">Can't generate a diagram for "${chordLabel}".</p>`;
    return;
  }

  const positions = getChordPositions(parsed.root, parsed.quality);
  container.innerHTML = positions
    .map(
      (pos) => `
        <div class="diagram-card">
          ${buildChordDiagramSvg(pos, labelMode)}
          <div class="diagram-label">${pos.shapeName}</div>
        </div>
      `
    )
    .join('');
}
