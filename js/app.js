// ============================================================
// app.js — Router & Global State
// ============================================================
import { showToast } from './utils.js';

// Global state
export const state = {
  currentPage: 'search',       // 'search' | 'profile' | 'history'
  selectedCandidate: null,      // full candidate object
  fromHistory: false,           // navigated from history page
  searchQuery: '',
};

// Page registry
const pages = {
  search:  document.getElementById('page-search'),
  profile: document.getElementById('page-profile'),
  history: document.getElementById('page-history'),
};

// Nav buttons
const navSearch  = document.getElementById('nav-search');
const navHistory = document.getElementById('nav-history');

export function navigate(page, opts = {}) {
  // Hide all pages
  Object.values(pages).forEach(p => p?.classList.add('hidden'));

  // Show target
  const target = pages[page];
  if (target) {
    target.classList.remove('hidden');
    // Re-trigger animation
    target.style.animation = 'none';
    target.offsetHeight; // reflow
    target.style.animation = '';
  }

  state.currentPage = page;
  state.fromHistory = opts.fromHistory || false;

  // Update nav active states
  navSearch?.classList.toggle('active', page === 'search');
  navHistory?.classList.toggle('active', page === 'history');

  // Update hash for UX (not actual routing)
  history.replaceState(null, '', `#${page}`);

  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page, opts } }));
}

// Header logo → back to search
document.getElementById('logo-btn')?.addEventListener('click', () => {
  navigate('search');
});

navSearch?.addEventListener('click', () => navigate('search'));
navHistory?.addEventListener('click', () => navigate('history'));

// Modal system
let confirmCallback = null;
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel  = document.getElementById('modal-cancel');

export function showConfirm(title, body, onConfirm) {
  modalTitle.textContent = title;
  modalBody.textContent  = body;
  confirmCallback = onConfirm;
  modalOverlay.classList.add('open');
}

modalConfirm?.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
  if (typeof confirmCallback === 'function') confirmCallback();
  confirmCallback = null;
});

modalCancel?.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
  confirmCallback = null;
});

modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('open');
    confirmCallback = null;
  }
});
