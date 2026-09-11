// ============================================================
// history.js — Trang lịch sử phỏng vấn
// ============================================================
import { CANDIDATES } from './data.js';
import { navigate, state, showConfirm } from './app.js';
import {
  getHistory, deleteHistoryEntry, exportHistoryCSV,
  matchesSearch, icons, escapeHtml, showToast, truncate,
  formatDate, scoreColor
} from './utils.js';

const historyList   = document.getElementById('history-list');
const histSearchIn  = document.getElementById('hist-search-input');
const histClear     = document.getElementById('hist-search-clear');
const sortSelect    = document.getElementById('sort-select');
const filterSelect  = document.getElementById('filter-select');
const exportBtn     = document.getElementById('btn-export-csv');
const statTotal     = document.getElementById('stat-total');
const statAvg       = document.getElementById('stat-avg');
const statHigh      = document.getElementById('stat-high');

function getFilteredHistory(query, sort, filter) {
  let history = getHistory();

  // Search
  if (query) {
    const q = query.toLowerCase().trim();
    history = history.filter(h =>
      (h.name || '').toLowerCase().includes(q) ||
      (h.msv  || '').toLowerCase().includes(q)
    );
  }

  // Filter by score range
  if (filter && filter !== 'all') {
    const [min, max] = filter.split('-').map(Number);
    history = history.filter(h => h.score >= min && h.score <= max);
  }

  // Sort
  switch (sort) {
    case 'order-asc':
      history.sort((a, b) => (a.interviewOrder || 0) - (b.interviewOrder || 0)); break;
    case 'order-desc':
      history.sort((a, b) => (b.interviewOrder || 0) - (a.interviewOrder || 0)); break;
    case 'score-desc':
      history.sort((a, b) => (b.score || 0) - (a.score || 0)); break;
    case 'score-asc':
      history.sort((a, b) => (a.score || 0) - (b.score || 0)); break;
    default:
      history.sort((a, b) => (a.interviewOrder || 0) - (b.interviewOrder || 0));
  }

  return history;
}

function updateStats(allHistory) {
  const count = allHistory.length;
  const avg   = count ? (allHistory.reduce((s, h) => s + (h.score || 0), 0) / count).toFixed(1) : '—';
  const high  = count ? Math.max(...allHistory.map(h => h.score || 0)) : '—';

  if (statTotal) statTotal.textContent = count;
  if (statAvg)   statAvg.textContent   = avg;
  if (statHigh)  statHigh.textContent  = high;
}

function renderHistory() {
  const query  = histSearchIn?.value?.trim() || '';
  const sort   = sortSelect?.value   || 'order-asc';
  const filter = filterSelect?.value || 'all';

  const allHistory     = getHistory();
  const filteredHistory = getFilteredHistory(query, sort, filter);

  updateStats(allHistory);

  if (!allHistory.length) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>Chưa có lịch sử phỏng vấn</h3>
        <p>Tra cứu thí sinh và submit nhận xét để bắt đầu</p>
      </div>`;
    return;
  }

  if (!filteredHistory.length) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Không tìm thấy kết quả</h3>
        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>`;
    return;
  }

  historyList.innerHTML = filteredHistory.map((entry, i) => {
    const scoreNum = entry.score || 0;
    const scoreC   = scoreNum <= 3 ? 1 : scoreNum <= 6 ? scoreNum : scoreNum <= 8 ? scoreNum : scoreNum;
    const scoreClass = `score-${scoreNum}`;

    return `
      <div class="history-card" data-msv="${escapeHtml(entry.msv)}" style="animation-delay:${Math.min(i*0.03,0.4)}s">
        <div class="history-order">#${entry.interviewOrder || '?'}</div>

        <div class="history-info">
          <div class="history-name">${escapeHtml(entry.name)}</div>
          <div class="history-meta">
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan)">${escapeHtml(entry.msv)}</span>
            ${entry.lop ? `<span class="sep">·</span><span>${escapeHtml(entry.lop)}</span>` : ''}
            ${entry.caPhongVan ? `<span class="sep">·</span><span>⏰ ${escapeHtml(entry.caPhongVan)}</span>` : ''}
          </div>
          ${entry.comment ? `<div class="history-comment-preview">"${escapeHtml(truncate(entry.comment, 80))}"</div>` : ''}
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${formatDate(entry.submittedAt)}</div>
        </div>

        <div class="score-bubble ${scoreClass}">${scoreNum}</div>

        <div class="history-actions" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-secondary btn-edit-entry" data-msv="${escapeHtml(entry.msv)}" title="Xem / Sửa">
            ${icons.edit}
          </button>
          <button class="btn btn-sm btn-danger btn-delete-entry" data-msv="${escapeHtml(entry.msv)}" data-name="${escapeHtml(entry.name)}" title="Xóa">
            ${icons.trash}
          </button>
        </div>
      </div>`;
  }).join('');

  // Card click → open profile
  historyList.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.history-actions')) return;
      openFromHistory(card.dataset.msv);
    });
  });

  // Edit button
  historyList.querySelectorAll('.btn-edit-entry').forEach(btn => {
    btn.addEventListener('click', () => openFromHistory(btn.dataset.msv));
  });

  // Delete button
  historyList.querySelectorAll('.btn-delete-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      const msv  = btn.dataset.msv;
      const name = btn.dataset.name;
      showConfirm(
        'Xóa lượt phỏng vấn',
        `Bạn có chắc muốn xóa kết quả phỏng vấn của "${name}"? Hành động này không thể hoàn tác.`,
        () => {
          deleteHistoryEntry(msv);
          showToast(`Đã xóa lượt phỏng vấn của ${name}`, 'info');
          renderHistory();
        }
      );
    });
  });
}

function openFromHistory(msv) {
  const candidate = CANDIDATES.find(c => c['Mã Sinh Viên'] === msv);
  if (!candidate) {
    showToast('Không tìm thấy thông tin thí sinh', 'error');
    return;
  }
  state.selectedCandidate = candidate;
  state.fromHistory = true;
  window.dispatchEvent(new CustomEvent('openCandidate', { detail: candidate }));
  navigate('profile', { fromHistory: true });
}

// Search
histSearchIn?.addEventListener('input', (e) => {
  histClear?.classList.toggle('visible', e.target.value.length > 0);
  renderHistory();
});

histClear?.addEventListener('click', () => {
  if (histSearchIn) histSearchIn.value = '';
  histClear.classList.remove('visible');
  histSearchIn?.focus();
  renderHistory();
});

// Sort / Filter
sortSelect?.addEventListener('change', renderHistory);
filterSelect?.addEventListener('change', renderHistory);

// Export CSV
exportBtn?.addEventListener('click', () => {
  const count = exportHistoryCSV();
  if (count === null) {
    showToast('Chưa có dữ liệu để xuất', 'error');
  } else {
    showToast(`Đã xuất ${count} lượt phỏng vấn thành công`, 'success');
  }
});

// Re-render when navigating to history
window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'history') {
    renderHistory();
  }
});
