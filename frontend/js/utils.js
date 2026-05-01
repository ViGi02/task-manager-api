/* =============================================================================
   js/utils.js
   ────────────
   Pure utility functions — no DOM access, no API calls, no state.
   Because they have no side-effects they are trivial to test and reuse.

   WHY SEPARATE THIS?
   When a function only transforms data (string in → string out), it has no
   reason to know about the rest of the application. Keeping it isolated
   makes bugs easier to trace and functions easier to unit-test.
============================================================================= */

/**
 * escapeHtml
 * Converts characters that have special meaning in HTML into safe entities.
 * Always use this before inserting any user-supplied or API-supplied text
 * into the DOM — it prevents XSS (Cross-Site Scripting) attacks.
 *
 * Example: escapeHtml('<script>') → '&lt;script&gt;'
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/**
 * formatDate
 * Converts a MongoDB ISO-8601 date string into "10 Jan, 14:32".
 *
 * @param {string|null} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-GB', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * formatDueDate
 * Formats a due-date string for display on a task card.
 * Returns a short date like "15 Jan" without the time component.
 *
 * @param {string|null} isoString
 * @returns {string}
 */
export function formatDueDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
  });
}

/**
 * isOverdue
 * Returns true if the given date string is in the past AND the task is
 * not yet completed.
 *
 * We compare against midnight of today so a task due "today" is not
 * flagged as overdue until the day is actually over.
 *
 * @param {string|null} isoString
 * @param {boolean}     completed
 * @returns {boolean}
 */
export function isOverdue(isoString, completed) {
  if (!isoString || completed) return false;

  const due   = new Date(isoString);
  const today = new Date();

  // Strip the time component so we compare dates, not timestamps
  today.setHours(0, 0, 0, 0);

  return due < today;
}

/**
 * isDueToday
 * Returns true if the task is due today (and not yet completed).
 *
 * @param {string|null} isoString
 * @param {boolean}     completed
 * @returns {boolean}
 */
export function isDueToday(isoString, completed) {
  if (!isoString || completed) return false;

  const due   = new Date(isoString);
  const today = new Date();

  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth()    === today.getMonth()    &&
    due.getDate()     === today.getDate()
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DATE INPUT HELPER (for edit mode)
───────────────────────────────────────────────────────────────────────────── */

/**
 * taskDateValue
 * Returns the date value for a task in YYYY-MM-DD format.
 *
 * @param {string|null} isoString
 * @returns {Date|string} Date string in YYYY-MM-DD format, or empty string if no date  
 */
export function taskDateValue(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().split('T')[0];
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIME TRACKING
───────────────────────────────────────────────────────────────────────────── */

/**
 * getTimeRemaining
 * Returns human readable time left until due date
 *
 * @param {string|null} dueDate
 * @returns {string} "2d left", "5h left", or "Overdue"
 */
export function getTimeRemaining(dueDate) {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
}

/**
 * getTimeActive
 * How long task has existed
 *
 * @param {string|null} createdAt
 * @returns {string} "3d active", "12h active", or null if no createdAt
 */
export function getTimeActive(createdAt) {
  if (!createdAt) return null;

  const now = new Date();
  const created = new Date(createdAt);
  const diff = now - created;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `${days}d active`;
  return `${hours}h active`;
}

/**
 * calculateProgress
 * Returns % progress based on time elapsed vs total time
 *
 * @param {string|null} createdAt
 * @param {string|null} dueDate
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(createdAt, dueDate) {
  if (!createdAt || !dueDate) return 0;

  const start = new Date(createdAt).getTime();
  const end   = new Date(dueDate).getTime();
  const now   = Date.now();

  const total = end - start;
  const elapsed = now - start;

  if (total <= 0) return 100;

  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
