// Leonida Trophy Guide: boot the app. Load the trophy data, wire the views,
// filters, spoiler setting, theme and export/import, and honour deep links
// (?view=, ?open=<id>, ?filter=, ?spoilers=on) so any trophy or view can be
// shared as a link.
import { STORAGE_KEY, loadState, saveState, exportFile, importFile } from './state.js';
import { renderChecklist } from './list.js';
import { renderDetail } from './detail.js';
import { renderRoadmap, renderNextUp, ROADMAP_ORDER } from './roadmap.js';

const params = new URLSearchParams(location.search);
const state = loadState();
const trophies = (await (await fetch('data/trophies.json')).json()).trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const filters = {
  kind: 'all',
  grade: 'all',
  query: '',
  earnedOnly: false,
};
let view = 'checklist';
let selectedId = null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailPanel = $('detailPanel');

// --- Progress header -------------------------------------------------------
function renderProgress() {
  const earned = new Set(state.earned);
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  $('progressText').textContent = `${earned.size} of ${total} earned`;
  $('progressPct').textContent = `${pct}%`;
  $('barFill').style.width = `${pct}%`;
  $('progressBar').setAttribute('aria-valuenow', String(earned.size));
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const have = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === grade).length;
    return `${grade} ${have}/${all}`;
  });
  $('gradeCounts').textContent = counts.join(' · ');
  const next = ROADMAP_ORDER.map((id) => byId.get(id)).find((t) => t && !earned.has(t.id));
  const hint = $('nextHint');
  hint.replaceChildren();
  if (next) {
    hint.append(document.createTextNode('Next up: '));
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = next.name;
    link.addEventListener('click', () => selectTrophy(next.id, { rerender: false }));
    hint.append(link);
  } else {
    hint.textContent = 'Everything earned — the platinum is yours.';
  }
}

// --- Views -----------------------------------------------------------------
function showView(next) {
  view = next;
  for (const tab of document.querySelectorAll('.view-tab')) {
    const active = tab.dataset.view === next;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'true');
    else tab.removeAttribute('aria-current');
  }
  $('checklistLayout').hidden = next !== 'checklist';
  $('controls').style.display = next === 'checklist' ? '' : 'none';
  $('roadmapView').hidden = next !== 'roadmap';
  $('nextView').hidden = next !== 'next';
  if (next === 'roadmap') {
    $('roadmapMissable').innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = 'Missable watch';
    $('roadmapMissable').append(
      strong,
      document.createTextNode(
        ' — only Positive Mental Attitude is flagged possibly missable by the published guides (a Chapter 1 meditation spot disappears after that chapter). ' +
          'Actions Speak Louder is a save watch: rotate manual saves before major chapter decisions, because there is no mission replay. ' +
          'Story trophies cannot be missed. Keep a manual save at the start of every chapter and one before the final mission.',
      ),
    );
    renderRoadmap($('stages'), trophies, state, (id) => selectTrophy(id, { rerender: false }));
  }
  if (next === 'next') renderNextUp($('nextList'), trophies, state, (id) => selectTrophy(id, { rerender: false }));
}

// --- Selection and rendering ----------------------------------------------
function renderAll() {
  renderProgress();
  renderChecklist(listEl, $('listMeta'), $('missableNote'), trophies, state, filters, selectTrophy, selectedId);
  renderDetail(detailPanel, selectedId ? byId.get(selectedId) : null, state, toggleEarned, stepSelection);
  $('emptyMsg').hidden = listEl.children.length > 0;
}

function selectTrophy(id, { rerender }) {
  selectedId = byId.has(id) ? id : null;
  if (view !== 'checklist') showView('checklist');
  if (rerender) renderAll();
  else {
    renderProgress();
    renderChecklist(listEl, $('listMeta'), $('missableNote'), trophies, state, filters, selectTrophy, selectedId);
    renderDetail(detailPanel, selectedId ? byId.get(selectedId) : null, state, toggleEarned, stepSelection);
    $('emptyMsg').hidden = listEl.children.length > 0;
    const row = listEl.querySelector(`[data-id="${id}"]`);
    if (row) row.scrollIntoView({ block: 'nearest' });
    detailPanel.scrollTop = 0;
  }
}

function toggleEarned(id) {
  if (state.earned.includes(id)) state.earned = state.earned.filter((n) => n !== id);
  else state.earned.push(id);
  saveState(state);
  renderAll();
}

function stepSelection(delta) {
  if (delta === 0) {
    selectedId = null;
    renderAll();
    return;
  }
  const order = trophies.map((t) => t.id);
  const at = selectedId ? order.indexOf(selectedId) : -1;
  const nextIndex = (at + delta + order.length) % order.length;
  selectTrophy(order[nextIndex], { rerender: false });
}

// --- Controls --------------------------------------------------------------
for (const tab of document.querySelectorAll('.view-tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}
for (const chip of document.querySelectorAll('#kindChips .chip')) {
  chip.addEventListener('click', () => {
    filters.kind = chip.dataset.kind;
    for (const other of document.querySelectorAll('#kindChips .chip')) {
      other.classList.toggle('active', other === chip);
    }
    renderAll();
  });
}
$('gradeFilter').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  renderAll();
});
$('search').addEventListener('input', (event) => {
  filters.query = event.target.value;
  renderAll();
});
$('earnedOnly').addEventListener('change', (event) => {
  filters.earnedOnly = event.target.checked;
  renderAll();
});

const spoilerToggle = $('spoilerToggle');
function applySpoilers() {
  state.spoilers = spoilerToggle.checked;
  saveState(state);
  renderAll();
}
spoilerToggle.addEventListener('change', applySpoilers);

const themeToggle = $('themeToggle');
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  themeToggle.textContent = state.theme === 'dark' ? 'Light theme' : 'Dark theme';
  saveState(state);
}
themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
});

$('exportBtn').addEventListener('click', () => exportFile(state));
$('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = await importFile(file, new Set(trophies.map((t) => t.id)));
    state.earned = imported.earned;
    state.notes = imported.notes;
    saveState(state);
    renderAll();
  } catch (error) {
    window.alert(error.message);
  }
  event.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!window.confirm('Clear all earned ticks and notes? This cannot be undone.')) return;
  state.earned = [];
  state.notes = {};
  saveState(state);
  renderAll();
});

// --- Keyboard shortcuts ----------------------------------------------------
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea, select')) {
    if (event.key === 'Escape') event.target.blur();
    return;
  }
  if (event.key === '/') {
    event.preventDefault();
    $('search').focus();
  } else if (event.key === '1') showView('checklist');
  else if (event.key === '2') showView('roadmap');
  else if (event.key === '3') showView('next');
  else if (event.key === 's' || event.key === 'S') {
    spoilerToggle.checked = !spoilerToggle.checked;
    applySpoilers();
  } else if (event.key === 't' || event.key === 'T') {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  } else if (event.key === 'Escape') {
    selectedId = null;
    renderAll();
  }
});

// --- Deep links and first paint --------------------------------------------
if (window.matchMedia && !localStorage.getItem(STORAGE_KEY) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  state.theme = 'dark';
}
spoilerToggle.checked = state.spoilers || params.get('spoilers') === 'on';
if (params.get('spoilers') === 'on') state.spoilers = true;
applyTheme();

const filterParam = params.get('filter');
if (['story', 'missable', 'collectibles', 'activities', 'online'].includes(filterParam)) {
  filters.kind = filterParam;
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === filterParam);
  }
}
const gradeParam = params.get('grade');
if (['platinum', 'gold', 'silver', 'bronze'].includes(gradeParam)) {
  filters.grade = gradeParam;
  $('gradeFilter').value = gradeParam;
}
const viewParam = params.get('view');
if (['checklist', 'roadmap', 'next'].includes(viewParam)) showView(viewParam);
const openParam = Number(params.get('open'));
if (openParam && byId.has(openParam)) selectedId = openParam;
renderAll();
