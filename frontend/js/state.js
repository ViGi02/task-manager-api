/* =============================================================================
   js/state.js
   ────────────
   Single source of truth for all runtime state the app needs to remember.

   WHY CENTRALISE STATE?
   In a large codebase, if every module stores its own state in local
   variables, modules end up needing to reach into each other — that's
   how spaghetti code happens. Having one place that owns the state means:
   · Any module reads the same values.
   · Persistence (localStorage) is handled in one place.
   · Easier to debug: one console.log(state) shows everything.

   NOTE: This is a simple hand-rolled state object, not Redux or a framework.
   For a project this size that's completely appropriate.
============================================================================= */

import { LS_FILTER_KEY, LS_CATEGORY_KEY } from './config.js';

/*
  state — the live application state.

  activeFilter   : which status pill is selected ('all' | 'active' | 'completed')
  activeCategory : which category pill is selected ('all' | 'work' | 'personal' | 'urgent' | 'general')
  searchQuery    : the lowercased search string ('' = no filter)

  We restore filter + category from localStorage so the user's last
  selection survives a page refresh.
*/
export const state = {
  activeFilter:   localStorage.getItem(LS_FILTER_KEY)    || 'all',
  activeCategory: localStorage.getItem(LS_CATEGORY_KEY)  || 'all',
  searchQuery:    '',
};

/**
 * setFilter — updates the active status filter and persists it.
 * @param {string} value  'all' | 'active' | 'completed'
 */
export function setFilter(value) {
  state.activeFilter = value;
  localStorage.setItem(LS_FILTER_KEY, value);
}

/**
 * setCategory — updates the active category filter and persists it.
 * @param {string} value  'all' | 'work' | 'personal' | 'urgent' | 'general'
 */
export function setCategory(value) {
  state.activeCategory = value;
  localStorage.setItem(LS_CATEGORY_KEY, value);
}

/**
 * setSearchQuery — updates the search query (not persisted — resets on refresh).
 * @param {string} raw  The raw input value; we lowercase it here.
 */
export function setSearchQuery(raw) {
  state.searchQuery = raw.toLowerCase().trim();
}
