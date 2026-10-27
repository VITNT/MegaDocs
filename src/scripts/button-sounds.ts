const preferenceKey = 'megadocs-button-sounds';
let enabled = true;
// Preload a tiny local sample; a small pool keeps repeated clicks responsive.
const clicks = Array.from({ length: 4 }, () => {
  const audio = new Audio('/sounds/button-click.mp3');
  audio.preload = 'auto';
  audio.volume = 0.4;
  return audio;
});
let nextClick = 0;
let lastPlayed = -Infinity;

try {
  enabled = localStorage.getItem(preferenceKey) !== 'off';
} catch {}

function updateToggle(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(enabled));
    button.title = `Button sounds ${enabled ? 'on' : 'off'}`;
  });
}

function playTap(): void {
  if (!enabled || performance.now() - lastPlayed < 45) return;

  try {
    const audio = clicks[nextClick];
    nextClick = (nextClick + 1) % clicks.length;
    audio.currentTime = 0;
    // Playback stays inside the activation gesture, including keyboard clicks.
    void audio.play().catch(() => {});
    lastPlayed = performance.now();
  } catch {
    // Audio is optional; unavailable audio must never interrupt a button action.
  }
}

updateToggle();

// Capture before an action hides its button (for example, closing the search dialog).
// Native click events cover mouse, touch, Enter, and Space without double playback.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLElement>(
    'button, a.primary-link, a.grade-card, a.resource-row, a.search-result, [data-button-sound]',
  );
  if (!control || control.matches(':disabled') || control.closest('[inert], [aria-disabled="true"], [data-button-sound="off"]')) return;

  if (control.hasAttribute('data-sound-toggle')) {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch {}
    updateToggle();
  }

  playTap();
}, { capture: true });
