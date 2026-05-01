/* =============================================================================
   js/filters.js
   ──────────────
   Client-side filtering and search — no API calls, just DOM manipulation.

   WHY SEPARATE FILTERS?
   The filter logic (loop over items, toggle a class) is independent of
   how tasks are fetched or rendered. Separating it means:
   · You can add a new filter type (e.g. priority) without touching api.js.
   · The toggle/visibility logic is trivially unit-testable.

   HOW IT WORKS
   Each <li> carries data attributes set by render.js:
     data-title       — lowercased title (for search)
     data-completed   — "true" / "false"
     data-category    — e.g. "work"

   applyFilters() reads those attributes and toggles .filter-hidden on
   items that don't match the current state. CSS hides .filter-hidden items.
   updateStats() is called afterwards to refresh the counts.
============================================================================= */

import { state, setFilter, setCategory, setSearchQuery } from './state.js';
import { updateStats } from './render.js';

/**
 * applyFilters
 * Evaluates every task card against the three current filter axes
 * (status, category, search) and shows/hides accordingly.
 *
 * Call this after any change to state.activeFilter, state.activeCategory,
 * or state.searchQuery.
 *
 * @param {HTMLUListElement} taskList
 */
export function applyFilters(taskList) {
  const items = taskList.querySelectorAll('.task-item');

  items.forEach((li) => {
    const completed = li.dataset.completed === 'true';
    const category  = li.dataset.category  || 'general';
    const title     = li.dataset.title     || ''; // already lowercased

    // ── Status filter ──
    let passStatus = true;
    if (state.activeFilter === 'active')    passStatus = !completed;
    if (state.activeFilter === 'completed') passStatus =  completed;

    // ── Category filter ──
    const passCategory =
      state.activeCategory === 'all' || category === state.activeCategory;

    // ── Search filter ──
    const passSearch =
      !state.searchQuery || title.includes(state.searchQuery);

    // A task is visible only if it passes all three filters
    li.classList.toggle('filter-hidden', !(passStatus && passCategory && passSearch));
  });

  // Reflect active state visually on status buttons
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === state.activeFilter);
  });

  // Reflect active state visually on category buttons
  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === state.activeCategory);
  });

  updateStats(taskList);
}

/* ─────────────────────────────────────────────────────────────────────────────
   EVENT LISTENER SETUP
───────────────────────────────────────────────────────────────────────────── */

/**
 * initFilters
 * Attaches all filter/search event listeners.
 * Called once from app.js after the DOM is ready.
 *
 * @param {HTMLUListElement} taskList
 */
export function initFilters(taskList) {
  // ── Status filter buttons (All / Active / Done) ──
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      applyFilters(taskList);
    });
  });

  // ── Category filter buttons ──
  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCategory(btn.dataset.category);
      applyFilters(taskList);
    });
  });

  // ── Search input ──
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      setSearchQuery(searchInput.value);
      applyFilters(taskList);
    });
  }

  // ── Restore saved filter button visuals before first render ──
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === state.activeFilter);
  });

  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === state.activeCategory);
  });

  // ── Re-run filters when a task's title is updated via inline edit ──
  // render.js dispatches 'task:updated' on the <li> after a successful PUT
  taskList.addEventListener('task:updated', () => applyFilters(taskList));
}
