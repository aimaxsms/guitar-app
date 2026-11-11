const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function stopModule(name) {
  const mod = window[name];
  if (mod && typeof mod.stop === 'function') mod.stop();
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));

    if (target !== 'tuner') stopModule('TunerModule');
    if (target !== 'strum') stopModule('StrumModule');
    if (target !== 'livechords') stopModule('LiveChordsModule');
  });
});
