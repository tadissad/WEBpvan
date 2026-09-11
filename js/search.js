// ============================================================
// search.js — Trang tra cứu thí sinh
// ============================================================
import { CANDIDATES } from './data.js';
import { navigate, state } from './app.js';
import { matchesSearch, getInitials, highlight, escapeHtml, icons, getHistoryEntry } from './utils.js';

const grid        = document.getElementById('candidates-grid');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const resultCount = document.getElementById('result-count');

let currentQuery = '';

function renderCandidates(query) {
  currentQuery = query;
  const filtered = CANDIDATES.filter(c => matchesSearch(c, query));

  resultCount.innerHTML = query
    ? `Tìm thấy <strong>${filtered.length}</strong> / ${CANDIDATES.length} thí sinh`
    : `Tổng cộng <strong>${CANDIDATES.length}</strong> thí sinh`;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔍</div>
        <h3>Không tìm thấy thí sinh</h3>
        <p>Thử tìm theo tên đầy đủ hoặc mã sinh viên</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((c, i) => {
    const msv      = c['Mã Sinh Viên'] || '';
    const name     = c['Họ và Tên'] || '';
    const lop      = c['Lớp'] || '';
    const ca       = c['Ca Phỏng Vấn'] || '';
    const nganh    = c['Ngành Học'] || '';
    const gioi     = c['Giới Tính'] || '';
    const initials = getInitials(name);
    const hasInterview = !!getHistoryEntry(msv);

    return `
      <div class="candidate-card" data-id="${c.id}" data-msv="${escapeHtml(msv)}" style="animation-delay:${Math.min(i * 0.03, 0.5)}s">
        <div class="card-header">
          <div class="card-avatar">${initials}</div>
          <div class="card-info">
            <div class="card-name">${highlight(name, query)}</div>
            <div class="card-msv">${highlight(msv, query)}</div>
          </div>
          <div class="card-arrow">${icons.arrow}</div>
        </div>
        <div class="card-tags">
          ${lop ? `<span class="tag tag-purple">${escapeHtml(lop)}</span>` : ''}
          ${ca  ? `<span class="tag tag-cyan">${escapeHtml(ca)}</span>` : ''}
          ${nganh && nganh !== 'Khác' ? `<span class="tag tag-muted">${escapeHtml(nganh.length > 22 ? nganh.slice(0,22)+'…' : nganh)}</span>` : ''}
          ${gioi ? `<span class="tag ${gioi==='Nữ' ? 'tag-pink' : 'tag-yellow'}">${escapeHtml(gioi)}</span>` : ''}
          ${hasInterview ? `<span class="tag tag-green">✓ Đã PV</span>` : ''}
        </div>
      </div>`;
  }).join('');

  // Click handlers
  grid.querySelectorAll('.candidate-card').forEach(card => {
    card.addEventListener('click', () => {
      const id  = card.dataset.id;
      const msv = card.dataset.msv;
      const candidate = CANDIDATES.find(c => c.id === id || c['Mã Sinh Viên'] === msv);
      if (candidate) {
        state.selectedCandidate = candidate;
        window.dispatchEvent(new CustomEvent('openCandidate', { detail: candidate }));
        navigate('profile');
      }
    });
  });
}

// Search input handler
searchInput?.addEventListener('input', (e) => {
  const q = e.target.value.trim();
  searchClear?.classList.toggle('visible', q.length > 0);
  renderCandidates(q);
});

// Clear button
searchClear?.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  searchInput.focus();
  renderCandidates('');
});

// Re-render when navigating back to search (to update "Đã PV" badges)
window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'search') {
    renderCandidates(searchInput?.value?.trim() || '');
  }
});

// Initial render
renderCandidates('');
