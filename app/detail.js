// The guide panel: one trophy's official text, its guide in our own words,
// the sources behind each fact, and a private note field saved in the browser.
import { saveState } from './state.js';
import { KIND_LABELS } from './list.js';

export function renderDetail(panel, trophy, state, onToggleEarned, onStep) {
  panel.replaceChildren();
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Pick a trophy in the list to read its guide, sources and notes here.';
    panel.append(empty);
    return;
  }
  const earned = state.earned.includes(trophy.id);
  const spoilerHidden = state.spoilers && trophy.kind === 'story' && !earned;

  const title = document.createElement('h2');
  title.textContent = spoilerHidden ? 'Hidden story trophy' : trophy.name;
  panel.append(title);

  const official = document.createElement('p');
  official.className = 'official';
  if (spoilerHidden) {
    official.textContent = 'Official name and description hidden until earned. ';
  } else {
    const quote = document.createElement('em');
    quote.textContent = `“${trophy.description}”`;
    official.append(quote, document.createTextNode(' — the official description. '));
  }
  const grade = document.createElement('strong');
  grade.textContent = `${trophy.grade} · ${KIND_LABELS[trophy.kind] ?? trophy.kind}`;
  official.append(grade);
  if (trophy.countLabel) official.append(document.createTextNode(` · PSN count: ${trophy.countLabel}`));
  if (trophy.hidden) official.append(document.createTextNode(' · hidden on PlayStation until earned'));
  panel.append(official);

  if (trophy.missable || trophy.saveWatch) {
    const flag = document.createElement('p');
    flag.className = 'callout' + (trophy.missable ? ' warn' : '');
    const strong = document.createElement('strong');
    strong.textContent = trophy.missable ? 'Missable' : 'Save watch';
    flag.append(strong);
    flag.append(
      document.createTextNode(
        trophy.missable
          ? ' — the only trophy the published guides flag as possibly missable. Do it when the moment comes; see the guide below.'
          : ' — not missable, but tied to story choices: keep manual saves before major chapter decisions, because there is no mission replay.',
      ),
    );
    panel.append(flag);
  }

  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'How to earn it';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;
  panel.append(guideHeading, guide);

  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  const sources = document.createElement('ul');
  sources.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    item.textContent = source;
    sources.append(item);
  }
  panel.append(sourcesHeading, sources);

  const noteHeading = document.createElement('h3');
  noteHeading.textContent = 'Your note';
  const note = document.createElement('textarea');
  note.className = 'note-area';
  note.placeholder = 'Your own note for this trophy — saved in this browser only.';
  note.value = state.notes[trophy.id] ?? '';
  note.setAttribute('aria-label', `Note for ${trophy.name}`);
  note.addEventListener('input', () => {
    if (note.value.trim()) state.notes[trophy.id] = note.value;
    else delete state.notes[trophy.id];
    saveState(state);
  });
  panel.append(noteHeading, note);

  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'primary';
  toggle.textContent = earned ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => onToggleEarned(trophy.id));
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = '← Previous';
  prev.addEventListener('click', () => onStep(-1));
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next →';
  next.addEventListener('click', () => onStep(1));
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close guide';
  close.addEventListener('click', () => onStep(0));
  actions.append(toggle, prev, next, close);
  panel.append(actions);
}
