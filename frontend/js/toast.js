/* =============================================================================
   js/toast.js
   ────────────
   Self-contained toast notification system.

   WHY A SEPARATE MODULE?
   Toast logic (create element, animate, auto-remove) has nothing to do
   with tasks, the API, or the filter state. Isolating it means:
   · Any module can import showToast without importing the whole app.
   · The animation/timing logic is in one place to tweak.
   · Easy to swap for a library (e.g. Notyf) later without touching other files.

   USAGE (from any other module):
     import { showToast } from './toast.js';
     showToast('Task saved!', 'success');
============================================================================= */

import { escapeHtml } from './utils.js';

/* Map toast type → icon glyph */
const ICONS = {
  success: '✓',
  error:   '✕',
  info:    '●',
  warning: '⚠',
};

/* How long (ms) a toast stays visible before it starts fading out */
const DEFAULT_DURATION = 3000;

/**
 * showToast
 * Appends a toast to #toastContainer, then removes it after `duration` ms.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = DEFAULT_DURATION) {
  const container = document.getElementById('toastContainer');
  if (!container) return; // guard: DOM not ready

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${ICONS[type] ?? '●'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  /*
    Schedule removal:
    1. Add .removing → triggers the CSS fade-out animation (250ms).
    2. Once the animation fires 'animationend', delete the DOM node.
    The { once: true } option auto-removes the listener after it fires.
  */
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
