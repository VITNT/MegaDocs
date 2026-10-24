interface ArchiveState {
  grade: string | null;
  term: string | null;
  query: string;
}

const requestedGrade = new URLSearchParams(window.location.search).get('grade');
const initialGrade = ['Grade 12', 'Grade 11', 'Grade 10', 'Grade 9'].includes(requestedGrade ?? '')
  ? requestedGrade
  : null;

const state: ArchiveState = {
  grade: initialGrade,
  term: null,
  query: '',
};

const openGrades = new Set(initialGrade ? [initialGrade] : []);

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

const sidebar = getElement<HTMLElement>('#sidebar');
const scrim = getElement<HTMLElement>('#scrim');
const menuButton = getElement<HTMLButtonElement>('#menuButton');
const searchInput = getElement<HTMLInputElement>('#searchInput');
const pageTitle = getElement<HTMLElement>('#pageTitle');
const pageDescription = getElement<HTMLElement>('#pageDescription');
const resourceCount = getElement<HTMLElement>('#resourceCount');
const emptyState = getElement<HTMLElement>('#emptyState');
const archiveCrumb = getElement<HTMLButtonElement>('#archiveCrumb');
const gradeCrumb = getElement<HTMLButtonElement>('#gradeCrumb');
const termCrumb = getElement<HTMLButtonElement>('#termCrumb');
const gradeSeparator = getElement<SVGElement>('.grade-separator');
const termSeparator = getElement<SVGElement>('.term-separator');
const top = getElement<HTMLElement>('#top');

const resourceRows = [...document.querySelectorAll<HTMLElement>('.resource-row')];
const gradeButtons = [...document.querySelectorAll<HTMLButtonElement>('.grade-button')];
const termButtons = [...document.querySelectorAll<HTMLButtonElement>('.term-button')];

function matchesCurrentView(resource: HTMLElement): boolean {
  const matchesGrade = !state.grade || resource.dataset.grade === state.grade;
  const matchesTerm =
    !state.term ||
    resource.dataset.term === state.term ||
    resource.dataset.term === 'All terms';
  const matchesSearch =
    !state.query || resource.dataset.title?.toLowerCase().includes(state.query);

  if (state.query) return Boolean(matchesSearch);

  return matchesGrade && matchesTerm;
}

function updateResources(): number {
  let visibleResources = 0;

  resourceRows.forEach((resource) => {
    const isVisible = matchesCurrentView(resource);
    resource.hidden = !isVisible;

    if (isVisible) visibleResources += 1;
  });

  return visibleResources;
}

function updatePageCopy(visibleResources: number): void {
  const isSearching = Boolean(state.query);
  const isArchive = !state.grade;
  const isGrade = Boolean(state.grade && !state.term);

  pageTitle.textContent = isSearching
    ? 'Search results'
    : isArchive
      ? 'Exam Archive'
      : isGrade
        ? state.grade
        : `${state.grade} — ${state.term}`;

  if (isSearching) {
    pageDescription.textContent = 'Matching notes across all grades and terms.';
  } else if (isArchive) {
    pageDescription.textContent = 'Past exam notes across all available grades and terms.';
  } else if (isGrade) {
    pageDescription.textContent = `Past exam notes available for ${state.grade}.`;
  } else if (state.grade === 'Grade 12') {
    pageDescription.textContent = 'No Grade 12 notes have been added yet.';
  } else if (visibleResources > 0) {
    pageDescription.textContent = 'Revision notes for this exam term.';
  } else {
    pageDescription.textContent = 'No notes have been added for this exam term.';
  }

  resourceCount.textContent = `${visibleResources} document${visibleResources === 1 ? '' : 's'}`;
  emptyState.hidden = visibleResources !== 0;
}

function updateBreadcrumbs(): void {
  const isArchive = !state.grade;
  const isGrade = Boolean(state.grade && !state.term);

  gradeCrumb.textContent = state.grade ?? '';
  gradeCrumb.hidden = isArchive;
  gradeSeparator.toggleAttribute('hidden', isArchive);
  gradeCrumb.classList.toggle('current', isGrade);

  termCrumb.textContent = state.term ?? '';
  termCrumb.hidden = !state.term;
  termSeparator.toggleAttribute('hidden', !state.term);
  termCrumb.classList.toggle('current', Boolean(state.term));
}

function updateNavigation(): void {
  gradeButtons.forEach((button) => {
    const grade = button.dataset.grade ?? '';
    button.classList.toggle('active', grade === state.grade);
    button.setAttribute('aria-expanded', String(openGrades.has(grade)));
  });

  termButtons.forEach((button) => {
    const isActive =
      button.dataset.grade === state.grade && button.dataset.term === state.term;
    button.classList.toggle('active', isActive);
  });
}

function render(): void {
  const visibleResources = updateResources();
  updatePageCopy(visibleResources);
  updateBreadcrumbs();
  updateNavigation();
}

function closeMenu(): void {
  sidebar.classList.remove('open');
  scrim.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}

function scrollToTop(): void {
  top.scrollIntoView();
}

gradeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const grade = button.dataset.grade ?? '';

    if (openGrades.has(grade)) {
      openGrades.delete(grade);
    } else {
      openGrades.add(grade);
    }

    render();
  });
});

termButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade ?? null;
    state.term = button.dataset.term ?? null;

    if (state.grade) openGrades.add(state.grade);

    render();
    closeMenu();
    scrollToTop();
  });
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim().toLowerCase();
  render();
});

archiveCrumb.addEventListener('click', () => {
  state.grade = null;
  state.term = null;
  render();
  scrollToTop();
});

gradeCrumb.addEventListener('click', () => {
  state.term = null;
  render();
  scrollToTop();
});

termCrumb.addEventListener('click', scrollToTop);

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === 'Escape') {
    searchInput.blur();
    closeMenu();
  }
});

menuButton.addEventListener('click', () => {
  const isOpen = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', isOpen);
  scrim.hidden = !isOpen;
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

scrim.addEventListener('click', closeMenu);

getElement<HTMLButtonElement>('#themeButton').addEventListener('click', () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
});

render();
