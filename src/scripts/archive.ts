interface ArchiveState {
  grade: string | null;
  term: string | null;
}

const requestedGrade = new URLSearchParams(window.location.search).get('grade');
const initialGrade = ['Grade 12', 'Grade 11', 'Grade 10', 'Grade 9'].includes(requestedGrade ?? '')
  ? requestedGrade
  : null;

const state: ArchiveState = {
  grade: initialGrade,
  term: null,
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
  const isArchive = !state.grade;
  const isGrade = Boolean(state.grade && !state.term);

  pageTitle.textContent = isArchive
      ? 'Exam Archive'
      : isGrade
        ? state.grade
        : `${state.grade} — ${state.term}`;

  if (isArchive) {
    pageDescription.textContent = 'Past exam notes across all available grades and terms.';
  } else if (isGrade) {
    pageDescription.textContent = `Past exam notes available for ${state.grade}.`;

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
    const drawer = document.getElementById(button.getAttribute('aria-controls') ?? '');
    if (drawer) drawer.inert = !openGrades.has(grade);
  });

  termButtons.forEach((button) => {
    const isActive =
      button.dataset.grade === state.grade && button.dataset.term === state.term;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
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

const searchDialog = getElement<HTMLDialogElement>('#searchDialog');
const searchResults = getElement<HTMLElement>('#searchResults');
const searchStatus = getElement<HTMLElement>('#searchStatus');

function updateSearch(): void {
  const words = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  searchResults.replaceChildren();
  const matches = words.length ? resourceRows.filter((row) =>
    words.every((word) => row.dataset.title?.toLowerCase().includes(word))) : [];
  matches.forEach((row) => {
    const link = document.createElement('a');
    link.href = (row as HTMLAnchorElement).href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.className = 'search-result';
    const title = document.createElement('strong');
    title.textContent = row.querySelector('strong')?.textContent ?? '';
    const context = document.createElement('small');
    context.textContent = `${row.dataset.grade} · ${row.dataset.term} · ${row.querySelector('small')?.textContent}`;
    link.append(title, context);
    searchResults.append(link);
  });
  searchStatus.textContent = !words.length ? 'Search across all grades and terms.'
    : matches.length ? `${matches.length} document${matches.length === 1 ? '' : 's'} found`
    : 'No documents found. Try a different title, grade, term, or subject.';
}

function openSearch(): void {
  closeMenu();
  if (!searchDialog.open) searchDialog.showModal();
  updateSearch();
  searchInput.focus();
}

getElement<HTMLButtonElement>('#searchButton').addEventListener('click', openSearch);
getElement<HTMLButtonElement>('#closeSearch').addEventListener('click', () => searchDialog.close());
searchDialog.addEventListener('click', (event) => {
  const bounds = searchDialog.getBoundingClientRect();
  if (event.target === searchDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) searchDialog.close();
});
searchDialog.addEventListener('close', () => {
  getElement<HTMLButtonElement>('#searchButton').focus();
});
searchInput.addEventListener('input', updateSearch);

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
    openSearch();
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

render();
