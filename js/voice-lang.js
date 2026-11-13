// Shared language setting for everything that turns speech into text (voice song search and the
// Live Chords lyrics). Browsers can't auto-detect the spoken language, so the user picks it once;
// it defaults to the device language and is remembered on this device.

const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-MX', label: 'Español (México)' },
  { code: 'es-US', label: 'Español (Estados Unidos)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-AR', label: 'Español (Argentina)' },
  { code: 'es-CO', label: 'Español (Colombia)' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'de-DE', label: 'Deutsch' },
];
const VOICE_LANG_KEY = 'guitarApp_voiceLang';
const VOICE_LANG_EVENT = 'voicelangchange';

function defaultVoiceLang() {
  const wanted = (navigator.language || 'en-US').toLowerCase();
  const exact = VOICE_LANGUAGES.find((l) => l.code.toLowerCase() === wanted);
  if (exact) return exact.code;
  const prefix = wanted.split('-')[0];
  const sameLanguage = VOICE_LANGUAGES.find((l) => l.code.toLowerCase().startsWith(prefix + '-'));
  return sameLanguage ? sameLanguage.code : 'en-US';
}

function getVoiceLang() {
  try {
    const saved = localStorage.getItem(VOICE_LANG_KEY);
    if (saved && VOICE_LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch (err) { /* storage blocked: fall back to the device language */ }
  return defaultVoiceLang();
}

function setVoiceLang(code) {
  try { localStorage.setItem(VOICE_LANG_KEY, code); } catch (err) { /* not remembered, still used now */ }
  document.dispatchEvent(new CustomEvent(VOICE_LANG_EVENT, { detail: code }));
}

// Fills a <select> with the languages and keeps every such select in sync.
function attachVoiceLangSelect(select) {
  if (!select) return;
  select.innerHTML = VOICE_LANGUAGES.map((l) => `<option value="${l.code}">${l.label}</option>`).join('');
  select.value = getVoiceLang();
  select.addEventListener('change', () => setVoiceLang(select.value));
  document.addEventListener(VOICE_LANG_EVENT, (e) => {
    if (select.value !== e.detail) select.value = e.detail;
  });
}
