// Saved progress for the Leonida Trophy Guide: earned ticks, per-trophy notes
// and display settings, kept in localStorage and exportable as a file.
export const STORAGE_KEY = 'gta6-trophy-guide-v1';

export function blankState() {
  return { earned: [], notes: {}, spoilers: false, theme: 'light', grade: 'all', kind: 'all' };
}

export function loadState() {
  const state = blankState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return state;
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((n) => Number.isInteger(n));
    if (parsed.notes && typeof parsed.notes === 'object') {
      for (const [key, value] of Object.entries(parsed.notes)) {
        if (typeof value === 'string' && value.trim()) state.notes[Number(key)] = value;
      }
    }
    if (typeof parsed.spoilers === 'boolean') state.spoilers = parsed.spoilers;
    if (parsed.theme === 'dark' || parsed.theme === 'light') state.theme = parsed.theme;
  } catch {
    // A damaged save is ignored rather than breaking the page.
  }
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full store: the page still works for the visit.
  }
}

export function exportFile(state) {
  const payload = {
    app: 'gta6-trophy-guide-01',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    notes: state.notes,
    spoilers: state.spoilers,
    theme: state.theme,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Read an exported progress file and return the state it holds, or throw a
// short message naming what is wrong with it.
export async function importFile(file, validIds) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.earned)) {
    throw new Error('That file is not a trophy-progress export: it has no earned list.');
  }
  const earned = parsed.earned.filter((n) => validIds.has(n));
  const notes = {};
  if (parsed.notes && typeof parsed.notes === 'object') {
    for (const [key, value] of Object.entries(parsed.notes)) {
      const id = Number(key);
      if (validIds.has(id) && typeof value === 'string' && value.trim()) notes[id] = value;
    }
  }
  return { earned, notes };
}
