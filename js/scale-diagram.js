const SCALE_DIAGRAM_WINDOW = 4;

function getScaleFretboardPositions(root, scale) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const scaleSet = new Set(scale.intervals);

  return STANDARD_STRING_NOTES.map((openNote) => {
    const openIndex = NOTE_NAMES.indexOf(openNote);
    const notes = [];
    for (let fret = 0; fret <= SCALE_DIAGRAM_WINDOW; fret++) {
      const semitone = ((openIndex + fret - rootIndex) % 12 + 12) % 12;
      if (scaleSet.has(semitone)) {
        notes.push({ fret, isRoot: semitone === 0, note: NOTE_NAMES[(rootIndex + semitone) % 12] });
      }
    }
    return notes;
  });
}

function buildScaleDiagramSvg(strings) {
  const fretRows = SCALE_DIAGRAM_WINDOW + 1;
  const bottom = DIAGRAM_TOP + fretRows * FRET_GAP;
  let svg = `<svg viewBox="0 0 ${DIAGRAM_WIDTH} ${bottom + 10}" width="${DIAGRAM_WIDTH}" height="${bottom + 10}">`;

  for (let s = 0; s < 6; s++) {
    const x = DIAGRAM_LEFT + s * STRING_GAP;
    svg += `<line x1="${x}" y1="${DIAGRAM_TOP}" x2="${x}" y2="${bottom}" stroke="#555" stroke-width="1" />`;
  }

  for (let row = 0; row <= fretRows; row++) {
    const y = DIAGRAM_TOP + row * FRET_GAP;
    svg += `<line x1="${DIAGRAM_LEFT}" y1="${y}" x2="${DIAGRAM_LEFT + 5 * STRING_GAP}" y2="${y}" stroke="#555" stroke-width="${row === 0 ? 3 : 1}" />`;
  }

  for (let row = 0; row < fretRows; row++) {
    const y = DIAGRAM_TOP + (row + 0.5) * FRET_GAP;
    svg += `<text x="${DIAGRAM_LEFT - 10}" y="${y + 3}" font-size="9" fill="#6b7280" text-anchor="end">${row}</text>`;
  }

  strings.forEach((notes, s) => {
    const x = DIAGRAM_LEFT + s * STRING_GAP;
    notes.forEach(({ fret, isRoot, note }) => {
      const y = DIAGRAM_TOP + (fret + 0.5) * FRET_GAP;
      svg += `<circle cx="${x}" cy="${y}" r="7" fill="${isRoot ? '#4ade80' : '#60a5fa'}" />`;
      svg += `<text x="${x}" y="${y + 3}" font-size="8" font-weight="700" fill="#121212" text-anchor="middle">${note}</text>`;
    });
  });

  svg += '</svg>';
  return svg;
}

function renderScaleDiagram(container, root, scale) {
  const strings = getScaleFretboardPositions(root, scale);
  container.innerHTML = `
    <div class="diagram-card scale-diagram-card">
      ${buildScaleDiagramSvg(strings)}
      <div class="diagram-label">Root position (frets 0-${SCALE_DIAGRAM_WINDOW})</div>
    </div>
  `;
}
