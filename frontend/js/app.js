/* =============================================================================
   js/app.js — Application entry point
   ──────────────────────────────────────
   This file's only job is to wire the modules together.
   It should read almost like a plain-English description of the app:

     1. On load, fetch all tasks and render them.
     2. Listen for Add-task form submission.
     3. Listen for clicks inside the task list (delete / toggle / edit).
     4. Initialise filters and search.

   If a function is more than a few lines, it belongs in another module.
   Keeping this file thin makes the overall architecture obvious at a glance.
============================================================================= */

import { getAllTasks, createTask, updateTask, deleteTaskById } from './api.js';
import { renderTask, setBtnLoading, updateStats, enterEditMode } from './render.js';
import { initFilters, applyFilters } from './filters.js';
import { showToast }  from './toast.js';
import { CATEGORIES } from './config.js';

/* ─────────────────────────────────────────────────────────────────────────────
   DOM REFERENCES
   Only grab what app.js itself uses. Each module grabs its own elements.
───────────────────────────────────────────────────────────────────────────── */

const taskList     = document.getElementById('taskList');
const taskInput    = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const dueDateInput = document.getElementById('dueDateInput');
const addBtn       = document.getElementById('addBtn');
const errorMsg     = document.getElementById('errorMsg');
const loadingState = document.getElementById('loadingState');
const emptyState   = document.getElementById('emptyState');

/* ─────────────────────────────────────────────────────────────────────────────
   POPULATE CATEGORY DROPDOWN
   Built from config.js CATEGORIES array — adding a new category to config
   automatically makes it appear here.
───────────────────────────────────────────────────────────────────────────── */

CATEGORIES.forEach(({ value, label }) => {
  const option = document.createElement('option');
  option.value       = value;
  option.textContent = label;
  categorySelect?.appendChild(option);
});

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE HELPERS (specific to app.js orchestration)
───────────────────────────────────────────────────────────────────────────── */

function showError(msg)  { if (errorMsg) errorMsg.textContent = msg; }
function clearError()    { if (errorMsg) errorMsg.textContent = '';  }

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH ALL TASKS — called once on page load
───────────────────────────────────────────────────────────────────────────── */

async function loadTasks() {
  loadingState?.classList.remove('hidden');
  emptyState?.classList.add('hidden');
  taskList.innerHTML = '';

  try {
    const tasks = await getAllTasks();

    if (tasks.length === 0) {
      document.getElementById('emptyText').textContent = 'No tasks yet. Add one above.';
      emptyState?.classList.remove('hidden');
    } else {
      tasks.forEach((task) => taskList.appendChild(renderTask(task)));
    }

    // Apply saved filter/category immediately after rendering
    applyFilters(taskList);

  } catch (err) {
    /*
      API OFFLINE STATE
      If the fetch fails entirely (network error, server not running)
      we show a specific "API offline" message rather than a generic error.
      This is friendlier and gives the developer a clear diagnostic.
    */
    showApiOffline(err.message);
  } finally {
    loadingState?.classList.add('hidden');
  }
}

/**
 * showApiOffline
 * Replaces the normal empty state with a clear "API unreachable" error.
 * This makes it immediately obvious when the Express server isn't running.
 *
 * @param {string} detail
 */
function showApiOffline(detail) {
  const emptyText = document.getElementById('emptyText');
  const stateIcon = emptyState?.querySelector('.state-icon');

  if (stateIcon) stateIcon.textContent = '⚡';
  if (emptyText) {
    emptyText.innerHTML = `
      <strong>API unreachable</strong><br>
      <span class="offline-detail">
        Make sure your Express server is running on port 3001.<br>
        <code>${detail}</code>
      </span>
    `;
  }
  emptyState?.classList.remove('hidden');
  showToast('Could not connect to the API.', 'error', 6000);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ADD TASK
───────────────────────────────────────────────────────────────────────────── */

async function handleAddTask() {
  const title    = taskInput?.value.trim();
  const category = categorySelect?.value?.toLowerCase() || 'general';
  const dueDate  = dueDateInput?.value   || null;  // "" → null

  if (!title) {
    showError('Please enter a task title.');
    taskInput?.focus();
    return;
  }

  clearError();
  setBtnLoading(addBtn, true);

  try {
    // Build the payload — only include dueDate if the user set one
    const payload = { title, category };
    if (dueDate) payload.dueDate = dueDate;

    const newTask = await createTask(payload);

    console.log(newTask.category);

    // Prepend so newest tasks appear at the top
    const li = renderTask(newTask);
    taskList.prepend(li);

    // Reset inputs
    taskInput.value = '';
    if (dueDateInput) dueDateInput.value = '';

    applyFilters(taskList);
    showToast(`"${newTask.title}" added.`, 'success');

  } catch (err) {
    showError(`Could not add task: ${err.message}`);
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    setBtnLoading(addBtn, false);
    taskInput?.focus();
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE TASK
───────────────────────────────────────────────────────────────────────────── */

async function handleDelete(id, li) {
  try {
    await deleteTaskById(id);

    // Slide the card out before removing it from the DOM
    li.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    li.style.opacity    = '0';
    li.style.transform  = 'translateX(14px)';

    setTimeout(() => {
      li.remove();
      applyFilters(taskList);   // updateStats is called inside applyFilters
    }, 210);

    showToast('Task deleted.', 'info');

  } catch (err) {
    showToast(`Could not delete: ${err.message}`, 'error');
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOGGLE COMPLETE
───────────────────────────────────────────────────────────────────────────── */

async function handleToggle(id, li) {
  const wasCompleted = li.dataset.completed === 'true';

  try {
    const updated = await updateTask(id, { completed: !wasCompleted });

    // Sync every data attribute and class that depends on completion
    li.dataset.completed = updated.completed;
    li.classList.toggle('completed', updated.completed);

    const checkBtn = li.querySelector('.task-check');
    if (checkBtn) {
      checkBtn.classList.toggle('checked', updated.completed);
      checkBtn.setAttribute(
        'aria-label',
        updated.completed ? 'Mark incomplete' : 'Mark complete'
      );
    }

    applyFilters(taskList);
    showToast(updated.completed ? 'Marked as done ✓' : 'Marked as active.', 'success');

  } catch (err) {
    showToast(`Could not update: ${err.message}`, 'error');
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────────────────────────────────────── */

// Add task
addBtn?.addEventListener('click', handleAddTask);

taskInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTask();
});

taskInput?.addEventListener('input', () => {
  if (errorMsg?.textContent) clearError();
});

/*
  EVENT DELEGATION on the task list
  ───────────────────────────────────
  One listener handles all interactions inside task cards.
  We use event.target.closest(selector) to find the correct target
  even if the user clicks on a child element of the button.

  This is more efficient than attaching individual listeners to every
  button — and it works for dynamically added cards too.
*/
// CLICK events (delete, toggle, edit)
taskList?.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.delete-btn');
  const checkBtn  = e.target.closest('.task-check');
  const titleEl   = e.target.closest('.task-title');

  if (deleteBtn) {
    const li = deleteBtn.closest('.task-item');
    handleDelete(li.dataset.id, li);
  }

  if (checkBtn) {
    const li = checkBtn.closest('.task-item');
    handleToggle(li.dataset.id, li);
  }

  if (titleEl) {
    const li = titleEl.closest('.task-item');
    if (!li.classList.contains('editing')) {
      enterEditMode(li, titleEl);
    }
  }
});

taskList?.addEventListener('change', async (e) => {
  const select = e.target.closest('.task-category-select');
  if (!select) return;

  const li = select.closest('.task-item');
  const id = li.dataset.id;
  const newCategory = select.value;

  try {
    const updated = await updateTask(id, { category: newCategory });

    li.dataset.category = newCategory;

    li.replaceWith(renderTask(updated));
    applyFilters(taskList);

    showToast('Category updated', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to update category', 'error');
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   INITIALISE
───────────────────────────────────────────────────────────────────────────── */

// Wire up filter/search listeners (restores saved state from localStorage)
initFilters(taskList);

// Fetch and render all tasks
loadTasks();
