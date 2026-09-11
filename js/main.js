// ============================================================
// main.js — ITPTIT Web Phỏng Vấn (Bundled, no ES modules)
// Requires: data.js loaded first (provides CANDIDATES global)
// ============================================================

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // UTILS
  // ──────────────────────────────────────────────────────────

  function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeVi(str) {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
  }

  function matchesSearch(candidate, query) {
    if (!query) return true;
    var q = normalizeVi(query);
    var name = normalizeVi(candidate['Họ và Tên'] || '');
    var msv  = (candidate['Mã Sinh Viên'] || '').toLowerCase();
    return name.includes(q) || msv.includes(q);
  }

  function highlight(text, query) {
    var escaped = escapeHtml(text || '');
    if (!query) return escaped;
    var qNorm = normalizeVi(query);
    // Simple highlight: find positions in normalized text, apply to original escaped
    var normEscaped = normalizeVi(escaped);
    var qRe = qNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp('(' + qRe + ')', 'gi');
    // We work on escaped string but match normalized—simpler approach: just replace on escaped directly
    return escaped.replace(new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'),
      '<mark class="highlight">$1</mark>');
  }

  function scoreColor(score) {
    var n = parseInt(score);
    if (n === 0)  return '#484f58';   // xám — chưa chấm
    if (n <= 3)   return '#ff5555';
    if (n <= 6)   return '#ffb86c';
    if (n <= 8)   return '#f1fa8c';
    return '#50fa7b';
  }

  function scoreGradient(score) {
    var n   = parseInt(score);
    if (n === 0) return '#30363d';    // thanh xám — chưa chấm
    var pct = (n / 10) * 100;
    var endColor = n <= 3 ? '#ff5555' : n <= 6 ? '#ffb86c' : n <= 8 ? '#f1fa8c' : '#50fa7b';
    return 'linear-gradient(to right, #ff5555 0%, ' + endColor + ' ' + pct + '%, #30363d ' + pct + '%, #30363d 100%)';
  }

  function truncate(str, n) {
    n = n || 80;
    if (!str || str.length <= n) return str || '';
    return str.slice(0, n) + '…';
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ── localStorage helpers ──
  var LS_KEY = 'itptit_interview_history';

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveHistory(history) {
    localStorage.setItem(LS_KEY, JSON.stringify(history));
  }

  function getHistoryEntry(msv) {
    return getHistory().find(function (h) { return h.msv === msv; }) || null;
  }

  function upsertHistory(entry) {
    var history = getHistory();
    var idx = history.findIndex(function (h) { return h.msv === entry.msv; });
    if (idx >= 0) {
      history[idx] = Object.assign({}, history[idx], entry);
    } else {
      var maxOrder = history.reduce(function (m, h) { return Math.max(m, h.interviewOrder || 0); }, 0);
      history.push(Object.assign({}, entry, {
        interviewOrder: maxOrder + 1,
        submittedAt: new Date().toISOString()
      }));
    }
    saveHistory(history);
  }

  function deleteHistoryEntry(msv) {
    saveHistory(getHistory().filter(function (h) { return h.msv !== msv; }));
  }

  function exportHistoryCSV() {
    var history = getHistory().slice().sort(function (a, b) {
      return (a.interviewOrder || 0) - (b.interviewOrder || 0);
    });
    if (!history.length) return null;

    var header = ['Thứ tự', 'Họ và Tên', 'Mã Sinh Viên', 'Lớp', 'Ca Phỏng Vấn', 'Nhận Xét', 'Điểm'];
    var rows   = history.map(function (h) {
      return [h.interviewOrder, h.name, h.msv, h.lop, h.caPhongVan || '', h.comment || '', h.score];
    });

    var csv = [header].concat(rows).map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell || '').replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');

    var bom  = '\uFEFF';
    var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'ITPTIT_PV_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return history.length;
  }

  function showToast(message, type, duration) {
    type     = type     || 'info';
    duration = duration || 3000;
    var container = document.getElementById('toast-container');
    if (!container) return;
    var icons = { success: '✅', error: '❌', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><span>' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '0.3s ease';
      setTimeout(function () { toast.parentNode && toast.parentNode.removeChild(toast); }, 300);
    }, duration);
  }

  // ── SVG Icons ──
  var IC = {
    search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    arrow:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    back:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    panel:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
    trash:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    edit:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    export:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    submit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>',
    fb:      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    trophy:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8,21 16,21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17l-1 7a5 5 0 0 1-4 4.5A5 5 0 0 1 8 11L7 4z"/><path d="M5 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M19 4h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/></svg>',
    star:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
    heart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    target:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    code:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    lightning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    pen:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    brain:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    note:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    mail:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    phone:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    map:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    book:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    user:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  };

  // ──────────────────────────────────────────────────────────
  // GLOBAL STATE & ROUTER
  // ──────────────────────────────────────────────────────────

  var state = {
    currentPage:       'search',
    selectedCandidate: null,
    fromHistory:       false,
  };

  var pages = {
    search:  document.getElementById('page-search'),
    profile: document.getElementById('page-profile'),
    history: document.getElementById('page-history'),
  };

  function navigate(page, opts) {
    opts = opts || {};
    Object.keys(pages).forEach(function (k) {
      if (pages[k]) pages[k].classList.add('hidden');
    });
    if (pages[page]) {
      var el = pages[page];
      el.classList.remove('hidden');
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = '';
    }
    state.currentPage  = page;
    state.fromHistory  = opts.fromHistory || false;

    var navSearch  = document.getElementById('nav-search');
    var navHistory = document.getElementById('nav-history');
    if (navSearch)  navSearch.classList.toggle('active',  page === 'search');
    if (navHistory) navHistory.classList.toggle('active', page === 'history');

    // Fire custom event
    var ev = new CustomEvent('navigate', { detail: { page: page, opts: opts } });
    window.dispatchEvent(ev);
  }

  // ── Header nav ──
  document.getElementById('logo-btn').addEventListener('click', function () { navigate('search'); });
  document.getElementById('nav-search').addEventListener('click', function () { navigate('search'); });
  document.getElementById('nav-history').addEventListener('click', function () { navigate('history'); });

  // ── Modal ──
  var confirmCallback = null;
  var modalOverlay  = document.getElementById('modal-overlay');
  var modalTitle    = document.getElementById('modal-title');
  var modalBody     = document.getElementById('modal-body');
  var modalConfirm  = document.getElementById('modal-confirm');
  var modalCancel   = document.getElementById('modal-cancel');

  function showConfirm(title, body, onConfirm) {
    modalTitle.textContent = title;
    modalBody.textContent  = body;
    confirmCallback = onConfirm;
    modalOverlay.classList.add('open');
  }

  modalConfirm.addEventListener('click', function () {
    modalOverlay.classList.remove('open');
    if (typeof confirmCallback === 'function') confirmCallback();
    confirmCallback = null;
  });
  modalCancel.addEventListener('click', function () {
    modalOverlay.classList.remove('open');
    confirmCallback = null;
  });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('open');
      confirmCallback = null;
    }
  });

  // ──────────────────────────────────────────────────────────
  // SEARCH PAGE
  // ──────────────────────────────────────────────────────────

  var grid        = document.getElementById('candidates-grid');
  var searchInput = document.getElementById('search-input');
  var searchClear = document.getElementById('search-clear');
  var resultCount = document.getElementById('result-count');

  function renderCandidates(query) {
    var filtered = CANDIDATES.filter(function (c) { return matchesSearch(c, query); });

    resultCount.innerHTML = query
      ? 'Tìm thấy <strong>' + filtered.length + '</strong> / ' + CANDIDATES.length + ' thí sinh'
      : 'Tổng cộng <strong>' + CANDIDATES.length + '</strong> thí sinh';

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>Không tìm thấy thí sinh</h3><p>Thử tìm theo tên đầy đủ hoặc mã sinh viên</p></div>';
      return;
    }

    grid.innerHTML = filtered.map(function (c, i) {
      var msv        = c['Mã Sinh Viên'] || '';
      var name       = c['Họ và Tên']    || '';
      var lop        = c['Lớp']           || '';
      var ca         = c['Ca Phỏng Vấn'] || '';
      var nganh      = c['Ngành Học']    || '';
      var gioi       = c['Giới Tính']    || '';
      var initials   = getInitials(name);
      var hasInterview = !!getHistoryEntry(msv);

      var nganh_display = nganh && nganh !== 'Khác' ? (nganh.length > 22 ? nganh.slice(0,22)+'…' : nganh) : '';

      return '<div class="candidate-card" data-id="' + escapeHtml(c.id) + '" data-msv="' + escapeHtml(msv) + '" style="animation-delay:' + Math.min(i * 0.03, 0.5) + 's">' +
        '<div class="card-header">' +
          '<div class="card-avatar">' + initials + '</div>' +
          '<div class="card-info">' +
            '<div class="card-name">' + highlight(name, query) + '</div>' +
            '<div class="card-msv">' + highlight(msv, query) + '</div>' +
          '</div>' +
          '<div class="card-arrow">' + IC.arrow + '</div>' +
        '</div>' +
        '<div class="card-tags">' +
          (lop   ? '<span class="tag tag-purple">' + escapeHtml(lop) + '</span>' : '') +
          (ca    ? '<span class="tag tag-cyan">' + escapeHtml(ca)  + '</span>' : '') +
          (nganh_display ? '<span class="tag tag-muted">' + escapeHtml(nganh_display) + '</span>' : '') +
          (gioi  ? '<span class="tag ' + (gioi === 'Nữ' ? 'tag-pink' : 'tag-yellow') + '">' + escapeHtml(gioi) + '</span>' : '') +
          (hasInterview ? '<span class="tag tag-green">✓ Đã PV</span>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('.candidate-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id  = card.dataset.id;
        var msv = card.dataset.msv;
        var candidate = CANDIDATES.find(function (c) { return c.id === id || c['Mã Sinh Viên'] === msv; });
        if (candidate) {
          state.selectedCandidate = candidate;
          openProfile(candidate);
          navigate('profile');
        }
      });
    });
  }

  searchInput.addEventListener('input', function (e) {
    var q = e.target.value.trim();
    searchClear.classList.toggle('visible', q.length > 0);
    renderCandidates(q);
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    searchInput.focus();
    renderCandidates('');
  });

  window.addEventListener('navigate', function (e) {
    if (e.detail.page === 'search') renderCandidates(searchInput.value.trim() || '');
  });

  // ──────────────────────────────────────────────────────────
  // PROFILE PAGE
  // ──────────────────────────────────────────────────────────

  var profileContent  = document.getElementById('profile-content');
  var reviewPanel     = document.getElementById('review-panel');
  var panelToggle     = document.getElementById('panel-toggle');
  var scoreSlider     = document.getElementById('score-slider');
  var scoreDisplay    = document.getElementById('score-display');
  var commentArea     = document.getElementById('comment-area');
  var submitBtn       = document.getElementById('btn-submit');
  var panelCollapsed  = false;

  panelToggle.addEventListener('click', function () {
    panelCollapsed = !panelCollapsed;
    reviewPanel.classList.toggle('collapsed', panelCollapsed);
  });

  scoreSlider.addEventListener('input', function () {
    updateScoreDisplay(parseInt(scoreSlider.value));
  });

  function updateScoreDisplay(val) {
    if (val === 0) {
      scoreDisplay.textContent  = '—';
      scoreDisplay.style.color  = '#484f58';
    } else {
      scoreDisplay.textContent  = val;
      scoreDisplay.style.color  = scoreColor(val);
    }
    scoreSlider.style.background = scoreGradient(val);
  }

  submitBtn.addEventListener('click', function () {
    var candidate = state.selectedCandidate;
    if (!candidate) return;
    var score   = parseInt(scoreSlider.value || 5);
    var comment = commentArea.value.trim();
    var msv     = candidate['Mã Sinh Viên'] || '';

    upsertHistory({
      msv:        msv,
      candidateId: candidate.id,
      name:        candidate['Họ và Tên'] || '',
      lop:         candidate['Lớp'] || '',
      caPhongVan:  candidate['Ca Phỏng Vấn'] || '',
      score:       score,
      comment:     comment,
    });

    showToast('Đã lưu kết quả phỏng vấn của ' + (candidate['Họ và Tên'] || ''), 'success');
    submitBtn.innerHTML = IC.submit + ' Đã lưu!';
    submitBtn.style.background = 'var(--green)';
    submitBtn.style.color = '#0d1117';

    setTimeout(function () {
      if (state.fromHistory) navigate('history');
      else navigate('search');
      submitBtn.innerHTML = IC.submit + ' Lưu kết quả';
      submitBtn.style.background = '';
      submitBtn.style.color = '';
    }, 800);
  });

  window.addEventListener('navigate', function (e) {
    if (e.detail.page === 'profile' && state.selectedCandidate) {
      openProfile(state.selectedCandidate);
    }
  });

  function openProfile(candidate) {
    var name     = candidate['Họ và Tên']    || '';
    var msv      = candidate['Mã Sinh Viên'] || '';
    var lop      = candidate['Lớp']           || '';
    var ca       = candidate['Ca Phỏng Vấn'] || '';
    var gioi     = candidate['Giới Tính']    || '';
    var que      = candidate['Quê']           || '';
    var nganh    = candidate['Ngành Học']    || '';
    var nganhKhac = candidate['Ngành Học Khác (Nếu Có)'] || '';
    var nganhFull = nganhKhac || nganh;
    var fb       = candidate['Link Facebook'] || '';
    var email    = candidate['Địa Chỉ Email'] || '';
    var phone    = candidate['Số Điện Thoại'] || '';

    var diemManh   = candidate['Điểm Mạnh']  || '';
    var diemYeu    = candidate['Điểm Yếu']   || '';
    var soThich    = candidate['Sở Thích']   || '';
    var tinhCach   = candidate['Tính Cách']  || '';
    var thanhTich  = candidate['Thành Tích'] || '';
    var kinhNghiem = candidate['Kinh Nghiệm Hoạt Động Hoặc Làm Việc Đã Có?'] || '';
    var bietClb    = candidate['Bạn Biết Đến Câu Lạc Bộ Qua Kênh Nào?'] || '';
    var hieClb     = candidate['Bạn Hiểu Gì Về Câu Lạc Bộ?'] || '';
    var mucTieu    = candidate['Mục Tiêu / Kỳ Vọng Của Bạn Khi Tham Gia CLB?'] || '';
    var keHoach    = candidate['Kế Hoạch / Định Hướng Đóng Góp Của Bạn Cho CLB?'] || '';
    var kienThuc   = candidate['Kiến Thức Chuyên Môn Đã Có Về Ngành Học?'] || '';
    var itInterest = candidate['Bạn Có Hứng Thú Với Mảng IT / Công Nghệ Không?'] || '';
    var itExp      = candidate['Kinh Nghiệm Hoặc Dự Án IT Đã Từng Làm?'] || '';
    var dinhHuong  = candidate['Định Hướng Phát Triển'] || '';
    var designInt  = candidate['Bạn Có Hứng Thú Với Mảng Design / Thiết Kế Không?'] || '';
    var designExp  = candidate['Kinh Nghiệm Hoặc Sản Phẩm Design Đã Từng Làm?'] || '';
    var contentExp = candidate['Kinh Nghiệm Viết Lách / Content Writing Đã Có?'] || '';
    var q1         = candidate['Câu Hỏi Tư Duy / Hình Học 1'] || '';
    var q2         = candidate['Câu Hỏi Tư Duy / Hình Học 2'] || '';
    var ghiChu     = candidate['Ghi Chú'] || '';

    var initials = getInitials(name);
    var existing = getHistoryEntry(msv);

    function sec(label, icon, content, full) {
      if (!content) return '';
      return '<div class="cv-section' + (full ? ' cv-section-full' : '') + '">' +
        '<div class="cv-section-label">' + (icon || '') + ' ' + label + '</div>' +
        '<div class="cv-section-content">' + escapeHtml(content) + '</div>' +
      '</div>';
    }

    profileContent.innerHTML =
      '<button class="btn-back" id="btn-back-profile">' + IC.back + ' Quay lại</button>' +

      '<div class="profile-header">' +
        '<div class="profile-avatar">' + initials + '</div>' +
        '<div class="profile-title-block">' +
          '<div class="profile-name">' + escapeHtml(name) + '</div>' +
          '<div class="profile-meta">' +
            (msv  ? '<span class="meta-chip tag tag-cyan">' + IC.user + ' ' + escapeHtml(msv) + '</span>' : '') +
            (lop  ? '<span class="meta-chip tag tag-purple">' + escapeHtml(lop) + '</span>' : '') +
            (ca   ? '<span class="meta-chip tag tag-yellow">⏰ ' + escapeHtml(ca) + '</span>' : '') +
            (gioi ? '<span class="meta-chip tag ' + (gioi==='Nữ'?'tag-pink':'tag-muted') + '">' + escapeHtml(gioi) + '</span>' : '') +
            (que  ? '<span class="meta-chip tag tag-muted">' + IC.map + ' ' + escapeHtml(que) + '</span>' : '') +
            (existing ? '<span class="interviewed-badge">✓ Đã phỏng vấn · Điểm: ' + existing.score + '</span>' : '') +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">' +
            (fb ? '<a href="' + escapeHtml(fb) + '" target="_blank" rel="noopener" class="profile-fb-link">' + IC.fb + ' Facebook</a>' : '') +
            (email ? '<a href="mailto:' + escapeHtml(email) + '" class="profile-fb-link" style="color:#8be9fd;border-color:rgba(139,233,253,0.2);background:rgba(139,233,253,0.06)">' + IC.mail + ' ' + escapeHtml(email) + '</a>' : '') +
            (phone ? '<span class="meta-chip tag tag-muted">' + IC.phone + ' ' + escapeHtml(phone) + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +

      (nganhFull ? '<div style="margin-bottom:16px"><span class="tag tag-orange" style="font-size:12px;padding:5px 12px">' + IC.book + ' ' + escapeHtml(nganhFull) + '</span></div>' : '') +

      '<div class="cv-sections">' +
        sec('Điểm Mạnh', '💪', diemManh) +
        sec('Điểm Yếu', '⚡', diemYeu) +
        sec('Sở Thích', IC.heart, soThich) +
        sec('Tính Cách', '🎭', tinhCach) +
        sec('Thành Tích', IC.trophy, thanhTich, true) +
        sec('Kinh Nghiệm Hoạt Động / Làm Việc', IC.star, kinhNghiem, true) +

        '<div class="cv-section-full" style="padding:0;background:none;border:none">' +
          '<div class="divider"></div>' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--purple);margin-bottom:12px;display:flex;align-items:center;gap:6px">' + IC.target + ' Thông tin về CLB</div>' +
        '</div>' +

        sec('Biết Đến CLB Qua Kênh Nào?', '📡', bietClb) +
        sec('Hiểu Gì Về CLB?', IC.info, hieClb) +
        sec('Mục Tiêu / Kỳ Vọng Khi Tham Gia CLB', IC.target, mucTieu, true) +
        sec('Kế Hoạch / Định Hướng Đóng Góp Cho CLB', IC.lightning, keHoach, true) +

        '<div class="cv-section-full" style="padding:0;background:none;border:none">' +
          '<div class="divider"></div>' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--cyan);margin-bottom:12px;display:flex;align-items:center;gap:6px">' + IC.code + ' Kiến Thức Chuyên Môn</div>' +
        '</div>' +

        sec('Kiến Thức Đã Có Về Ngành Học', IC.book, kienThuc, true) +

        '<div class="cv-section">' +
          '<div class="cv-section-label">' + IC.code + ' Hứng Thú Với IT / Công Nghệ?</div>' +
          '<div class="interest-row"><span class="tag ' + (itInterest==='Có'?'tag-green':itInterest==='Không'?'tag-muted':'tag-yellow') + '">' + escapeHtml(itInterest||'Chưa xác định') + '</span></div>' +
          (itExp ? '<div class="cv-section-content" style="margin-top:10px">' + escapeHtml(itExp) + '</div>' : '') +
        '</div>' +

        sec('Định Hướng Phát Triển', IC.compass, dinhHuong) +

        '<div class="cv-section">' +
          '<div class="cv-section-label">' + IC.palette + ' Hứng Thú Với Design?</div>' +
          '<div class="interest-row"><span class="tag ' + (designInt==='Có'?'tag-pink':designInt==='Không'?'tag-muted':'tag-yellow') + '">' + escapeHtml(designInt||'Chưa xác định') + '</span></div>' +
          (designExp ? '<div class="cv-section-content" style="margin-top:10px">' + escapeHtml(designExp) + '</div>' : '') +
        '</div>' +

        sec('Kinh Nghiệm Content Writing', IC.pen, contentExp) +

        ((q1||q2) ? '<div class="cv-section">' +
          '<div class="cv-section-label">' + IC.brain + ' Câu Hỏi Tư Duy / Hình Học</div>' +
          '<div class="interest-row">' +
            (q1 ? '<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)">Câu 1: <span class="answer-badge">' + escapeHtml(q1) + '</span></div>' : '') +
            (q2 ? '<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)">Câu 2: <span class="answer-badge">' + escapeHtml(q2) + '</span></div>' : '') +
          '</div></div>' : '') +

        (ghiChu ? '<div class="cv-section"><div class="cv-section-label">' + IC.note + ' Ghi Chú</div><div class="cv-section-content" style="color:var(--yellow)">' + escapeHtml(ghiChu) + '</div></div>' : '') +
      '</div>';

    // Back button
    document.getElementById('btn-back-profile').addEventListener('click', function () {
      if (state.fromHistory) navigate('history');
      else navigate('search');
    });

    // Update panel
    var badgeName   = document.getElementById('panel-candidate-name');
    var badgeMsv    = document.getElementById('panel-candidate-msv');
    var badgeAvatar = document.getElementById('panel-avatar');
    if (badgeName)   badgeName.textContent   = name;
    if (badgeMsv)    badgeMsv.textContent    = msv;
    if (badgeAvatar) badgeAvatar.textContent = initials;

    var defaultScore   = existing ? existing.score   : 0;
    var defaultComment = existing ? existing.comment : '';
    scoreSlider.value  = defaultScore;
    updateScoreDisplay(defaultScore);
    commentArea.value  = defaultComment;
    commentArea.placeholder = existing ? 'Cập nhật nhận xét...' : 'Nhập nhận xét về thí sinh này...';

    submitBtn.innerHTML = (existing ? IC.edit + ' Cập nhật' : IC.submit + ' Lưu kết quả');
    submitBtn.style.background = '';
    submitBtn.style.color = '';

    // Warning nếu điểm = 0
    submitBtn.title = '';
    if (!existing) {
      submitBtn.title = 'Kéo slider lên để chấm điểm (0 = chưa chấm)';
    }

    var submittedInfo = document.getElementById('submitted-info');
    if (submittedInfo) {
      if (existing && existing.submittedAt) {
        submittedInfo.textContent = 'Đã PV: ' + formatDate(existing.submittedAt);
        submittedInfo.style.display = 'block';
      } else {
        submittedInfo.style.display = 'none';
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // HISTORY PAGE
  // ──────────────────────────────────────────────────────────

  var historyList  = document.getElementById('history-list');
  var histSearchIn = document.getElementById('hist-search-input');
  var histClear    = document.getElementById('hist-search-clear');
  var sortSelect   = document.getElementById('sort-select');
  var filterSelect = document.getElementById('filter-select');
  var exportBtn    = document.getElementById('btn-export-csv');
  var statTotal    = document.getElementById('stat-total');
  var statAvg      = document.getElementById('stat-avg');
  var statHigh     = document.getElementById('stat-high');

  function renderHistory() {
    var query  = (histSearchIn  ? histSearchIn.value.trim()  : '');
    var sort   = (sortSelect    ? sortSelect.value    : 'order-asc');
    var filter = (filterSelect  ? filterSelect.value  : 'all');

    var allHistory = getHistory();
    var filtered   = allHistory.slice();

    if (query) {
      var q = query.toLowerCase();
      filtered = filtered.filter(function (h) {
        return (h.name || '').toLowerCase().includes(q) || (h.msv || '').toLowerCase().includes(q);
      });
    }

    if (filter && filter !== 'all') {
      var parts = filter.split('-');
      var min = parseInt(parts[0]), max = parseInt(parts[1]);
      filtered = filtered.filter(function (h) { return h.score >= min && h.score <= max; });
    }

    switch (sort) {
      case 'order-asc':  filtered.sort(function(a,b){return (a.interviewOrder||0)-(b.interviewOrder||0);}); break;
      case 'order-desc': filtered.sort(function(a,b){return (b.interviewOrder||0)-(a.interviewOrder||0);}); break;
      case 'score-desc': filtered.sort(function(a,b){return (b.score||0)-(a.score||0);}); break;
      case 'score-asc':  filtered.sort(function(a,b){return (a.score||0)-(b.score||0);}); break;
    }

    // Stats
    var cnt = allHistory.length;
    var avg = cnt ? (allHistory.reduce(function(s,h){return s+(h.score||0);},0)/cnt).toFixed(1) : '—';
    var high = cnt ? Math.max.apply(null, allHistory.map(function(h){return h.score||0;})) : '—';
    if (statTotal) statTotal.textContent = cnt;
    if (statAvg)   statAvg.textContent   = avg;
    if (statHigh)  statHigh.textContent  = high;

    if (!allHistory.length) {
      historyList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>Chưa có lịch sử phỏng vấn</h3><p>Tra cứu thí sinh và submit nhận xét để bắt đầu</p></div>';
      return;
    }
    if (!filtered.length) {
      historyList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Không tìm thấy kết quả</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p></div>';
      return;
    }

    historyList.innerHTML = filtered.map(function (entry, i) {
      var sc = entry.score || 0;
      return '<div class="history-card" data-msv="' + escapeHtml(entry.msv) + '" style="animation-delay:' + Math.min(i*0.03,0.4) + 's">' +
        '<div class="history-order">#' + (entry.interviewOrder || '?') + '</div>' +
        '<div class="history-info">' +
          '<div class="history-name">' + escapeHtml(entry.name) + '</div>' +
          '<div class="history-meta">' +
            '<span style="font-family:JetBrains Mono,monospace;font-size:11px;color:var(--cyan)">' + escapeHtml(entry.msv) + '</span>' +
            (entry.lop ? '<span class="sep">·</span><span>' + escapeHtml(entry.lop) + '</span>' : '') +
            (entry.caPhongVan ? '<span class="sep">·</span><span>⏰ ' + escapeHtml(entry.caPhongVan) + '</span>' : '') +
          '</div>' +
          (entry.comment ? '<div class="history-comment-preview">"' + escapeHtml(truncate(entry.comment, 80)) + '"</div>' : '') +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:3px">' + formatDate(entry.submittedAt) + '</div>' +
        '</div>' +
        '<div class="score-bubble score-' + sc + '">' + (sc === 0 ? '—' : sc) + '</div>' +
        '<div class="history-actions" onclick="event.stopPropagation()">' +
          '<button class="btn btn-sm btn-secondary btn-edit-entry" data-msv="' + escapeHtml(entry.msv) + '" title="Xem / Sửa">' + IC.edit + '</button>' +
          '<button class="btn btn-sm btn-danger btn-delete-entry" data-msv="' + escapeHtml(entry.msv) + '" data-name="' + escapeHtml(entry.name) + '" title="Xóa">' + IC.trash + '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    historyList.querySelectorAll('.history-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.history-actions')) return;
        openFromHistory(card.dataset.msv);
      });
    });
    historyList.querySelectorAll('.btn-edit-entry').forEach(function (btn) {
      btn.addEventListener('click', function () { openFromHistory(btn.dataset.msv); });
    });
    historyList.querySelectorAll('.btn-delete-entry').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var msv  = btn.dataset.msv;
        var name = btn.dataset.name;
        showConfirm('Xóa lượt phỏng vấn',
          'Bạn có chắc muốn xóa kết quả phỏng vấn của "' + name + '"? Hành động này không thể hoàn tác.',
          function () {
            deleteHistoryEntry(msv);
            showToast('Đã xóa lượt phỏng vấn của ' + name, 'info');
            renderHistory();
          }
        );
      });
    });
  }

  function openFromHistory(msv) {
    var candidate = CANDIDATES.find(function (c) { return c['Mã Sinh Viên'] === msv; });
    if (!candidate) { showToast('Không tìm thấy thông tin thí sinh', 'error'); return; }
    state.selectedCandidate = candidate;
    state.fromHistory = true;
    openProfile(candidate);
    navigate('profile', { fromHistory: true });
  }

  histSearchIn && histSearchIn.addEventListener('input', function (e) {
    histClear && histClear.classList.toggle('visible', e.target.value.length > 0);
    renderHistory();
  });
  histClear && histClear.addEventListener('click', function () {
    histSearchIn.value = '';
    histClear.classList.remove('visible');
    histSearchIn.focus();
    renderHistory();
  });
  sortSelect   && sortSelect.addEventListener('change', renderHistory);
  filterSelect && filterSelect.addEventListener('change', renderHistory);

  exportBtn && exportBtn.addEventListener('click', function () {
    var count = exportHistoryCSV();
    if (count === null) showToast('Chưa có dữ liệu để xuất', 'error');
    else showToast('Đã xuất ' + count + ' lượt phỏng vấn thành công', 'success');
  });

  window.addEventListener('navigate', function (e) {
    if (e.detail.page === 'history') renderHistory();
  });

  // ──────────────────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────────────────
  renderCandidates('');
  updateScoreDisplay(0);

})();
