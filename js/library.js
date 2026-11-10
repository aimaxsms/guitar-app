const ROOTS = [
  { label: 'C', value: 'C' },
  { label: 'C#/Db', value: 'C#' },
  { label: 'D', value: 'D' },
  { label: 'D#/Eb', value: 'D#' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'F#/Gb', value: 'F#' },
  { label: 'G', value: 'G' },
  { label: 'G#/Ab', value: 'G#' },
  { label: 'A', value: 'A' },
  { label: 'A#/Bb', value: 'A#' },
  { label: 'B', value: 'B' },
];

const QUALITIES = [
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
];

const elLibraryRoots = document.getElementById('libraryRoots');
const elLibraryQuality = document.getElementById('libraryQuality');
const elLibraryTitle = document.getElementById('libraryTitle');
const elLibraryDiagrams = document.getElementById('libraryDiagrams');

let libraryRoot = 'C';
let libraryQuality = 'major';

function renderLibrary() {
  elLibraryTitle.textContent = `${libraryRoot} ${libraryQuality}`;
  const chordLabel = libraryQuality === 'minor' ? `${libraryRoot}m` : libraryRoot;
  renderChordDiagrams(elLibraryDiagrams, chordLabel);

  elLibraryRoots.querySelectorAll('.root-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === libraryRoot);
  });
  elLibraryQuality.querySelectorAll('.quality-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.value === libraryQuality);
  });
}

ROOTS.forEach((root) => {
  const btn = document.createElement('button');
  btn.className = 'root-btn';
  btn.textContent = root.label;
  btn.dataset.value = root.value;
  btn.addEventListener('click', () => {
    libraryRoot = root.value;
    renderLibrary();
  });
  elLibraryRoots.appendChild(btn);
});

QUALITIES.forEach((quality) => {
  const btn = document.createElement('button');
  btn.className = 'quality-btn';
  btn.textContent = quality.label;
  btn.dataset.value = quality.value;
  btn.addEventListener('click', () => {
    libraryQuality = quality.value;
    renderLibrary();
  });
  elLibraryQuality.appendChild(btn);
});

renderLibrary();
