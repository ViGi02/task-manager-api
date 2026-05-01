/* =============================================================================
   js/config.js
   ─────────────
   All hard-coded values live here so the rest of the codebase never has
   magic strings or numbers scattered through it.

   WHY A CONFIG FILE?
   In a real project you would have dev / staging / production API URLs.
   By keeping the URL here, you can swap it in one place and everything
   else just works. Same goes for the category list — add a new one here
   and it automatically appears in the dropdown and the filter bar.
============================================================================= */

export const API_URL = 'http://localhost:3001/tasks';

/*
  CATEGORIES
  Each entry has:
  · value  — stored in MongoDB, used as a data attribute in the DOM
  · label  — human-readable text shown in the UI
  · color  — CSS custom-property name defined in style.css
              (allows per-category theming with zero JS)
*/
export const CATEGORIES = [
  { value: 'general',  label: 'General',  color: 'var(--cat-general)'  },
  { value: 'work',     label: 'Work',     color: 'var(--cat-work)'     },
  { value: 'personal', label: 'Personal', color: 'var(--cat-personal)' },
  { value: 'urgent',   label: 'Urgent',   color: 'var(--cat-urgent)'   },
];

/*
  CATEGORY_MAP
  A plain object for O(1) lookups: CATEGORY_MAP['work'] → { label, color }
  Built automatically from CATEGORIES so there's no duplication.
*/
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c])
);

/* localStorage key used to persist the active status-filter */
export const LS_FILTER_KEY   = 'tm_filter';

/* localStorage key used to persist the active category-filter */
export const LS_CATEGORY_KEY = 'tm_category';
