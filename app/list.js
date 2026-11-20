// The checklist: one row per trophy, with its official name, description and
// grade, its kind and count, and its missable / save-watch flags. The spoiler
// setting masks the name and description of story trophies that are not yet
// earned; the grade stays visible, as PlayStation shows it for hidden ones.
import { saveState } from './state.js';

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export function isMissableView(trophy) {
  return trophy.missable || trophy.saveWatch;
}

export function trophyMatches(trophy, filters, query) {
  const earned = filters.earnedSet.has(trophy.id);
  if (filters.kind === 'online') return false;
  if (filters.kind === 'missable' && !isMissableView(trophy)) return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.earnedOnly && !earned) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function badge(text, className) {
  const span = document.createElement('span');
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

export function renderChecklist(listEl, metaEl, missableNoteEl, trophies, state, filters, onSelect, selectedId) {
  const earnedSet = new Set(state.earned);
  const query = filters.query.trim().toLowerCase();
  const shown = trophies.filter((t) => trophyMatches(t, { ...filters, earnedSet }, query));
  const earnedShown = shown.filter((t) => earnedSet.has(t.id)).length;

  metaEl.textContent =
    `Showing ${shown.length} of ${trophies.length} trophies` +
    (filters.kind === 'online'
      ? ' — this list has no online trophies: every one is earned in the single-player game.'
      : '') +
    (shown.length ? ` · ${earnedShown} earned in this view.` : '.');

  if (filters.kind === 'missable') {
    missableNoteEl.hidden = false;
    missableNoteEl.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = 'Missable watch — read this first';
    const text = document.createElement('span');
    text.textContent =
      ' Only one trophy is flagged possibly missable by the published guides: Positive Mental Attitude, whose Chapter 1 meditation spot disappears after that chapter (GTABase, PowerPyx, OutputLag). ' +
      'Actions Speak Louder is a save watch, not a miss: rotate manual save slots before major chapter decisions, because there is no mission replay (LFCarry). ' +
      'Story trophies cannot be missed — they unlock by finishing the story (GTABase). Keep a manual save at the start of every chapter and one before the final mission.';
    missableNoteEl.append(strong, text);
  } else {
    missableNoteEl.hidden = true;
    missableNoteEl.innerHTML = '';
  }

  listEl.replaceChildren();
  for (const trophy of shown) {
    const earned = earnedSet.has(trophy.id);
    const spoilerHidden = state.spoilers && trophy.kind === 'story' && !earned;

    const row = document.createElement('li');
    row.className = 'trophy-row' + (earned ? ' earned' : '') + (trophy.id === selectedId ? ' selected' : '');
    row.dataset.id = String(trophy.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Earned: ${spoilerHidden ? 'hidden story trophy' : trophy.name}`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) state.earned.push(trophy.id);
      else state.earned = state.earned.filter((id) => id !== trophy.id);
      saveState(state);
      onSelect(trophy.id, { rerender: true });
    });

    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = spoilerHidden ? 'Hidden story trophy' : trophy.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc' + (spoilerHidden ? ' hidden-desc' : '');
    desc.textContent = spoilerHidden
      ? 'Hidden until earned — turn spoilers off, or earn it, to reveal the name and description.'
      : trophy.description;
    main.append(name, desc);

    const badges = document.createElement('div');
    badges.className = 'trophy-badges';
    badges.append(badge(trophy.grade, trophy.grade));
    badges.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
    if (trophy.countLabel) badges.append(badge(trophy.countLabel, 'count'));
    if (trophy.hidden) badges.append(badge('Hidden', 'hidden-badge'));
    if (trophy.missable) badges.append(badge('Missable', 'missable'));
    if (trophy.saveWatch) badges.append(badge('Save watch', 'save-watch'));
    main.append(badges);

    const side = document.createElement('div');
    side.className = 'row-side';
    side.textContent = `#${trophy.id}`;
    if (state.notes[trophy.id]) {
      const dot = document.createElement('span');
      dot.className = 'note-dot';
      dot.textContent = '✎ note';
      side.append(dot);
    }

    row.append(box, main, side);
    row.addEventListener('click', () => onSelect(trophy.id, { rerender: false }));
    listEl.append(row);
  }
  return shown.length;
}
