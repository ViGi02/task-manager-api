/* =============================================================================
   js/api.js
   ──────────
   All communication with the Express / MongoDB backend lives here.

   WHY ISOLATE API CALLS?
   · The rest of the app (UI, filters, render) never needs to know about
     fetch(), headers, or HTTP status codes.
   · If you change the backend (e.g. swap REST for GraphQL) you only edit
     this one file — the UI layer is untouched.
   · Network errors are caught and re-thrown with clean messages, so
     callers never have to inspect raw fetch responses.

   EVERY function here:
   · Is async and returns the relevant data object on success.
   · Throws a plain Error with a human-readable message on failure.
   · Never touches the DOM.
============================================================================= */

import { API_URL } from './config.js';

/* ── Shared fetch wrapper ──────────────────────────────────────────────────── */

/**
 * request — thin wrapper around fetch() that:
 *   1. Sets JSON headers automatically.
 *   2. Parses the response JSON.
 *   3. Throws a descriptive error for non-2xx responses.
 *
 * @param {string} url
 * @param {RequestInit} options  Standard fetch options (method, body, etc.)
 * @returns {Promise<any>}       The `data` field of the API response JSON.
 */
async function request(url, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  // All our Express routes return { success, data } or { success, error }
  const json = await response.json();

  if (!response.ok) {
    // Use the server's error message if available, otherwise a generic one
    throw new Error(json.error || `Request failed (${response.status})`);
  }

  return json.data;
}

/* ── Public API functions ──────────────────────────────────────────────────── */

/**
 * getAllTasks — GET /tasks
 * @returns {Promise<Task[]>}
 */
export async function getAllTasks() {
  return request(API_URL);
}

/**
 * createTask — POST /tasks
 * @param {{ title: string, category?: string, dueDate?: string }} payload
 * @returns {Promise<Task>}
 */
export async function createTask(payload) {
  return request(API_URL, {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

/**
 * updateTask — PUT /tasks/:id
 * @param {string} id
 * @param {Partial<Task>} changes   Only the fields you want to update.
 * @returns {Promise<Task>}
 */
export async function updateTask(id, changes) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(changes),
  });
}

/**
 * deleteTaskById — DELETE /tasks/:id
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTaskById(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}

/*
  TypeScript-style JSDoc type definition.
  Not enforced at runtime, but IDEs (VS Code) use it for autocomplete.

  @typedef {Object} Task
  @property {string}  _id
  @property {string}  title
  @property {boolean} completed
  @property {string}  [category]
  @property {string}  [dueDate]
  @property {string}  createdAt
  @property {string}  updatedAt
*/
