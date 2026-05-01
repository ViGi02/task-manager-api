/* =============================================================================
   js/render.js
   ─────────────
   Everything that creates or mutates DOM elements lives here.

   WHY SEPARATE RENDERING?
   The "render" layer is responsible for one thing: turning data into HTML.
   It doesn't fetch, doesn't filter, doesn't manage state.
   This mirrors the pattern used by React/Vue components — a component
   takes props (data) and returns UI.

   HOW THE EDIT PATTERN WORKS
   When the user clicks a task title, enterEditMode() surgically replaces
   the .task-body div with a mini-form (input + Save + Cancel).
   exitEditMode() puts it back. Nothing else in the card is touched.
============================================================================= */

import { escapeHtml, formatDate, formatDueDate, isOverdue, isDueToday, taskDateValue, getTimeRemaining, getTimeActive, calculateProgress } from './utils.js';
import { CATEGORY_MAP } from './config.js';
import { updateTask }   from './api.js';
import { showToast }    from './toast.js';

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY BADGE HELPER
───────────────────────────────────────────────────────────────────────────── */

/**
 * buildCategoryBadge
 * Returns an HTML string for the coloured category pill shown on each card.
 * Returns an empty string if the task has no category or it's 'general'.
 *
 * @param {string|undefined} categoryValue
 * @returns {string}  HTML string
 */
function buildCategoryBadge(categoryValue) {
  if (!categoryValue || categoryValue === 'general') return '';

  const cat = CATEGORY_MAP[categoryValue];
  if (!cat) return '';

  return `<span class="category-badge cat-${escapeHtml(categoryValue)}">${escapeHtml(cat.label)}</span>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DUE DATE HELPER
───────────────────────────────────────────────────────────────────────────── */

/**
 * buildDueDateChip
 * Returns an HTML string for the due-date chip shown on cards that have
 * a due date set. Returns '' if no due date.
 *
 * @param {string|undefined} dueDate
 * @param {boolean} completed
 * @returns {string}
 */
function buildDueDateChip(dueDate, completed) {
  if (!dueDate) return '';

  const overdue  = isOverdue(dueDate, completed);
  const dueToday = isDueToday(dueDate, completed);

  // Pick a modifier class for styling: overdue → red, today → amber, normal → muted
  let modifier = '';
  if (overdue)       modifier = 'due-chip--overdue';
  else if (dueToday) modifier = 'due-chip--today';

  const label = overdue  ? `⚠ ${formatDueDate(dueDate)}`
              : dueToday ? `⏰ Today`
              :             `📅 ${formatDueDate(dueDate)}`;

  return `<span class="due-chip ${modifier}" title="Due date">${label}</span>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN RENDER FUNCTION
───────────────────────────────────────────────────────────────────────────── */

/**
 * renderTask
 * Builds one <li> element from a task data object.
 * Does NOT insert it into the DOM — the caller decides where.
 *
 * Data attributes stored on <li> are used by the filter system so it
 * never needs to parse displayed text (which could contain HTML entities).
 *
 * @param {import('./api.js').Task} task
 * @returns {HTMLLIElement}
 */
export function renderTask(task) {
  const overdue = isOverdue(task.dueDate, task.completed);

  const li = document.createElement('li');
  li.className  = [
    'task-item',
    task.completed ? 'completed' : '',
    overdue        ? 'overdue'   : '',
  ].filter(Boolean).join(' ');

  // Data attributes are the contract between the render layer and filter layer.
  // The filter reads these — it never reads displayed text.
  li.dataset.id        = task._id;
  li.dataset.title     = task.title.toLowerCase();
  li.dataset.completed = task.completed;
  li.dataset.category = (task.category || 'general').toLowerCase();
  li.dataset.dueDate   = task.dueDate   || '';

  const timeLeft   = getTimeRemaining(task.dueDate);
  const timeActive = getTimeActive(task.createdAt);
  const progress   = calculateProgress(task.createdAt, task.dueDate);

  li.innerHTML = `
    <button
      class="task-check ${task.completed ? 'checked' : ''}"
      aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
      title="Toggle complete"
    ></button>

    <div class="task-body">
      <div class="task-meta">
        ${buildCategoryBadge(task.category)}
        ${buildDueDateChip(task.dueDate, task.completed)}
      </div>

      <span
        class="task-title"
        data-raw="${escapeHtml(task.title)}"
        title="Click to edit"
      >${escapeHtml(task.title)}</span>

      <span class="task-date">
        Created: ${formatDate(task.createdAt)}
      </span>

      <div class="task-time-info">
        ${timeLeft ? `<span class="time-left">⏳ ${timeLeft}</span>` : ''}
        ${timeActive ? `<span class="time-active">🕒 ${timeActive}</span>` : ''}
      </div>

      ${task.dueDate ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      ` : ''}
    </div>

    <div class="task-actions">
      <select class="task-category-select">
        ${Object.entries(CATEGORY_MAP).map(([value, cat]) => `
          <option value="${value}" ${value === (task.category || 'general') ? 'selected' : ''}>
            ${cat.label}
          </option>
        `).join('')}
      </select>
      <button class="delete-btn" aria-label="Delete task">del</button>
    </div>
  `;

  return li;
}

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE EDIT
───────────────────────────────────────────────────────────────────────────── */

/**
 * enterEditMode
 * Replaces the static .task-body inside `li` with an editable form.
 * The card gets .editing class for the highlight border (CSS).
 *
 * @param {HTMLLIElement} li
 * @param {HTMLElement}   titleEl   The <span class="task-title"> that was clicked
 */
export function enterEditMode(li, titleEl) {
  if (li.classList.contains('editing')) return; // already editing
  li.classList.add('editing');

  // data-raw holds the decoded original title (set in renderTask)
  const originalTitle = titleEl.dataset.raw || titleEl.textContent;

  const editRow = document.createElement('div');
  editRow.className = 'task-body';
  editRow.id        = 'editRow';
  editRow.innerHTML = `
    <input
      class="edit-input"
      type="text"
      value="${escapeHtml(originalTitle)}"
      maxlength="120"
      aria-label="Edit task title"
    />

    <label>Category</label>
    <select class="edit-category">
      <option value="general">General</option>
      <option value="work">Work</option>
      <option value="personal">Personal</option>
      <option value="urgent">Urgent</option>
    </select>

    
    <label>Due Date</label>
    <input
      type="date"
      class="edit-date"
      value="${taskDateValue(li.dataset.dueDate)}"
    />

    <div class="edit-actions">
      <button class="save-btn">
        <span class="btn-text">Save</span>
        <span class="btn-spinner hidden" aria-hidden="true"></span>
      </button>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;

  const taskBody = titleEl.closest('.task-body');
  li.replaceChild(editRow, taskBody);

  const editInput = editRow.querySelector('.edit-input');
  const saveBtn   = editRow.querySelector('.save-btn');
  const cancelBtn = editRow.querySelector('.cancel-btn');

  editInput.focus();
  editInput.select();

  // Wire up interactions
  saveBtn.addEventListener('click',  ()    => saveEdit(li, editInput, originalTitle));
  cancelBtn.addEventListener('click',()    => cancelEdit(li, originalTitle));
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveEdit(li, editInput, originalTitle);
    if (e.key === 'Escape') cancelEdit(li, originalTitle);
  });
}

/**
 * saveEdit — sends PUT /tasks/:id, then restores the normal card view.
 *
 * @param {HTMLLIElement}       li
 * @param {HTMLInputElement}    editInput
 * @param {string}              originalTitle
 */
async function saveEdit(li, editInput, originalTitle) {
  const newTitle = editInput.value.trim();
  const newCategory = li.querySelector('.edit-category').value;
  const newDate     = li.querySelector('.edit-date').value;
  const id       = li.dataset.id;
  const saveBtn  = li.querySelector('.save-btn');

  if (newTitle === originalTitle) { cancelEdit(li, originalTitle); return; }

  if (!newTitle) {
    editInput.style.borderColor = 'var(--danger)';
    editInput.focus();
    return;
  }

  setBtnLoading(saveBtn, true);

  try {
    const updated = await updateTask(id, { title: newTitle, category: newCategory, dueDate: newDate || null });
    exitEditMode(li, updated);
    showToast('Task updated.', 'success');

    // Tell the filter system the title changed
    li.dataset.title = updated.title.toLowerCase();
    li.dataset.category = updated.category;
    li.dataset.dueDate  = updated.dueDate || '';

    // Fire a custom DOM event so filters.js can re-evaluate visibility
    li.dispatchEvent(new CustomEvent('task:updated', { bubbles: true }));

  } catch (err) {
    showToast(`Update failed: ${err.message}`, 'error');
    setBtnLoading(saveBtn, false);
  }
}

/**
 * cancelEdit — discards changes and restores the card.
 *
 * @param {HTMLLIElement} li
 * @param {string}        originalTitle
 */
function cancelEdit(li, originalTitle) {
  const mockTask = {
    _id:       li.dataset.id,
    title:     originalTitle,
    completed: li.dataset.completed === 'true',
    category:  li.dataset.category,
    dueDate:   li.dataset.dueDate   || null,
    createdAt: null,
  };
  exitEditMode(li, mockTask);
}

/**
 * exitEditMode — replaces the edit row with the normal .task-body.
 *
 * @param {HTMLLIElement}              li
 * @param {import('./api.js').Task}    task
 */
function exitEditMode(li, task) {
  li.classList.remove('editing');

  const overdue = isOverdue(task.dueDate, task.completed);
  li.classList.toggle('overdue', overdue);

  const taskBody = document.createElement('div');
  taskBody.className = 'task-body';
  taskBody.innerHTML = `
    <div class="task-meta">
      ${buildCategoryBadge(task.category)}
      ${buildDueDateChip(task.dueDate, task.completed)}
    </div>
    <span
      class="task-title"
      data-raw="${escapeHtml(task.title)}"
      title="Click to edit"
    >${escapeHtml(task.title)}</span>
    <span class="task-date">Added ${formatDate(task.updatedAt || task.createdAt)}</span>
  `;

  const editRow = li.querySelector('#editRow');
  li.replaceChild(taskBody, editRow);
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED UI HELPER — button loading state
   Kept here (not utils.js) because it touches the DOM.
───────────────────────────────────────────────────────────────────────────── */

/**
 * setBtnLoading
 * Swaps a button's label/spinner children and sets disabled.
 * The button must contain <span class="btn-text"> and <span class="btn-spinner">.
 *
 * @param {HTMLButtonElement} btn
 * @param {boolean}           isLoading
 */
export function setBtnLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.querySelector('.btn-text')?.classList.toggle('hidden',  isLoading);
  btn.querySelector('.btn-spinner')?.classList.toggle('hidden', !isLoading);
}

/* ─────────────────────────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────────────────────────── */

/**
 * updateStats
 * Recounts all/visible/completed tasks and refreshes the stats bar.
 * Called after every list mutation or filter change.
 *
 * @param {HTMLUListElement} taskList
 */
export function updateStats(taskList) {
  const allItems        = taskList.querySelectorAll('.task-item');
  const completedItems  = taskList.querySelectorAll('.task-item.completed');
  const visibleItems    = taskList.querySelectorAll('.task-item:not(.filter-hidden)');

  const totalEl    = document.getElementById('taskCount');
  const doneEl     = document.getElementById('doneCount');
  const filteredEl = document.getElementById('filteredNote');
  const emptyEl    = document.getElementById('emptyState');
  const emptyText  = document.getElementById('emptyText');

  if (totalEl) totalEl.textContent = `${allItems.length} ${allItems.length === 1 ? 'task' : 'tasks'}`;
  if (doneEl)  doneEl.textContent  = `${completedItems.length} done`;

  const isFiltered = visibleItems.length < allItems.length;
  filteredEl?.classList.toggle('hidden', !isFiltered);

  // Determine the right empty-state message
  if (emptyEl && emptyText) {
    if (allItems.length === 0) {
      emptyText.textContent = 'No tasks yet. Add one above.';
      emptyEl.classList.remove('hidden');
    } else if (visibleItems.length === 0) {
      emptyText.textContent = 'No tasks match the current filter.';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
    }
  }
}
