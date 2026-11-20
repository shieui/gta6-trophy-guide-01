// The roadmap to the platinum, built from the official descriptions: the
// story first, then the stranger strands, the collectibles and the map, the
// activities, the money and the robberies, and the 100% cleanup last. Each
// stage names the trophies it covers, in the order to earn them.

export const STAGES = [
  {
    title: 'Stage 1 — Play the story',
    text: 'Chapters 1 to 4, then the final mission. Every chapter and mission trophy pops as you finish it; none of them can be missed by skipping side content. Keep a manual save at the start of every chapter and one before the final mission, because there is no mission replay.',
    ids: [2, 3, 8, 4, 9, 10, 5, 11, 12, 6, 13, 7],
  },
  {
    title: 'Stage 2 — Strangers across Leonida',
    text: 'Eight stranger strands, any eight you like. Andy, Kenton, Billy, Randy and Tyrone each end in a named final mission, and Bret sends you hunting a unique animal. Do them as their markers appear; they are not part of the 100% checklist, but the silver needs eight finished strands.',
    ids: [22, 23, 24, 26, 27, 29, 25],
  },
  {
    title: 'Stage 3 — Choices, and the one missable trophy',
    text: 'Two things to watch while the story is still running. Positive Mental Attitude is the only trophy the published guides flag as possibly missable: a Chapter 1 meditation spot on Lucia’s balcony disappears after that chapter, so meditate at every spot you find, and find that one before Chapter 1 ends. Actions Speak Louder counts your story choices to 500 — rotate manual saves before major chapter decisions.',
    ids: [28, 48],
  },
  {
    title: 'Stage 4 — Collectibles and the map',
    text: 'Cards, WAiNK scans, meditation spots, areas, vehicles, garages and registrations. Pick them up as you travel rather than leaving them all for the end: 100 WAiNK locations, 100 vehicles, 52 areas, 3 card sets, 18 meditation spots, 8 garage properties and 10 Scooter Bros registrations.',
    ids: [30, 31, 42, 35, 54, 55],
  },
  {
    title: 'Stage 5 — Activities and challenges',
    text: 'The skill and grind trophies: 42 Shooting Range golds, 14 drone race wins, 20 race wins, 250 stunts, 50 of the 80 challenges, fishing against Cal, one arcade game, bowling, and trying all 9 activity types. Do the ones you like first — every finished challenge also feeds the 100% checklist.',
    ids: [16, 17, 18, 19, 20, 21, 32, 15, 46],
  },
  {
    title: 'Stage 6 — Money, robberies and the open world',
    text: 'Robberies open up in Chapters 3 and 4. Five bank vaults, one armored truck, one illegal operation for each of the 9 gangs, a jewelry store robbed unseen, a tank taken for a spin, and the partner trophies — Hot Together and Retail Therapy need Jason and Lucia out together. Launder $250,000 of Marked Bills and spend $100,000 across the shops along the way.',
    ids: [40, 41, 43, 39, 38, 33, 34, 52, 53],
  },
  {
    title: 'Stage 7 — Odd ones, cleanup and the platinum',
    text: 'The hidden one-offs — a cocktail on Ocean Beach, a showroom exit in classic style, a melee drive-by, a second try, and something strange — then the cleanup: whatever is left of the 100% checklist. Attain 100% completion for the gold, and the platinum follows the moment the last trophy pops.',
    ids: [44, 45, 51, 49, 50, 37, 36, 47, 14, 1],
  },
];

// The roadmap order, flattened, for the Next-up planner.
export const ROADMAP_ORDER = STAGES.flatMap((stage) => stage.ids);

export function renderRoadmap(stagesEl, trophies, state, onSelect) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const earned = new Set(state.earned);
  stagesEl.replaceChildren();
  for (const stage of STAGES) {
    const item = document.createElement('li');
    item.className = 'stage';
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    const done = stage.ids.filter((id) => earned.has(id)).length;
    count.textContent = `${done} of ${stage.ids.length} earned`;
    heading.append(count);
    const text = document.createElement('p');
    text.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'chips-row';
    for (const id of stage.ids) {
      const trophy = byId.get(id);
      if (!trophy) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-chip' + (earned.has(id) ? ' earned' : '');
      const grade = document.createElement('span');
      grade.className = 'mini-grade';
      grade.textContent = `${trophy.grade} · `;
      chip.append(grade, document.createTextNode(trophy.name));
      if (trophy.missable) chip.append(document.createTextNode(' ⚠ missable'));
      if (trophy.saveWatch && !trophy.missable) chip.append(document.createTextNode(' ⚠ save watch'));
      chip.addEventListener('click', () => onSelect(id));
      chips.append(chip);
    }
    item.append(heading, text, chips);
    stagesEl.append(item);
  }
}

export function nextUp(trophies, state, limit = 5) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const earned = new Set(state.earned);
  const remaining = ROADMAP_ORDER.filter((id) => !earned.has(id));
  return remaining.slice(0, limit).map((id) => byId.get(id)).filter(Boolean);
}

export function renderNextUp(listEl, trophies, state, onSelect) {
  const upcoming = nextUp(trophies, state);
  listEl.replaceChildren();
  if (upcoming.length === 0) {
    const done = document.createElement('li');
    done.className = 'next-item';
    done.textContent = 'Everything is earned — the platinum is yours. Congratulations, Leonida Legend.';
    listEl.append(done);
    return;
  }
  upcoming.forEach((trophy, index) => {
    const stageIndex = STAGES.findIndex((stage) => stage.ids.includes(trophy.id)) + 1;
    const item = document.createElement('li');
    item.className = 'next-item';
    const step = document.createElement('div');
    step.className = 'step';
    step.textContent = index === 0 ? 'Next' : `Then · Stage ${stageIndex}`;
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'next-name';
    name.textContent = trophy.name;
    const desc = document.createElement('div');
    desc.className = 'next-desc';
    desc.textContent = trophy.description;
    main.append(name, desc);
    const why = document.createElement('div');
    why.className = 'next-why';
    why.textContent = `Stage ${stageIndex} · ${trophy.grade}` + (trophy.countLabel ? ` · ${trophy.countLabel}` : '');
    item.append(step, main, why);
    item.addEventListener('click', () => onSelect(trophy.id));
    listEl.append(item);
  });
}
