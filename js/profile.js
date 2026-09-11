// ============================================================
// profile.js — Trang hiển thị CV + Panel nhận xét
// ============================================================
import { navigate, state, showConfirm } from './app.js';
import {
  icons, escapeHtml, getInitials, getHistoryEntry, upsertHistory,
  scoreGradient, scoreColor, showToast, formatDate
} from './utils.js';

// DOM elements
const profilePage     = document.getElementById('page-profile');
const profileContent  = document.getElementById('profile-content');
const reviewPanel     = document.getElementById('review-panel');
const panelToggle     = document.getElementById('panel-toggle');
const scoreSlider     = document.getElementById('score-slider');
const scoreDisplay    = document.getElementById('score-display');
const commentArea     = document.getElementById('comment-area');
const submitBtn       = document.getElementById('btn-submit');
const backBtn         = document.getElementById('btn-back-profile');

let panelCollapsed = false;

// Toggle panel
panelToggle?.addEventListener('click', () => {
  panelCollapsed = !panelCollapsed;
  reviewPanel?.classList.toggle('collapsed', panelCollapsed);
});

// Score slider
scoreSlider?.addEventListener('input', () => {
  const val = parseInt(scoreSlider.value);
  updateScoreDisplay(val);
});

function updateScoreDisplay(val) {
  if (scoreDisplay) {
    scoreDisplay.textContent = val;
    scoreDisplay.style.color = scoreColor(val);
  }
  if (scoreSlider) {
    scoreSlider.style.background = scoreGradient(val);
  }
}

// Back button
backBtn?.addEventListener('click', () => {
  if (state.fromHistory) {
    navigate('history');
  } else {
    navigate('search');
  }
});

// Submit
submitBtn?.addEventListener('click', () => {
  const candidate = state.selectedCandidate;
  if (!candidate) return;

  const score   = parseInt(scoreSlider?.value || 5);
  const comment = commentArea?.value?.trim() || '';
  const msv     = candidate['Mã Sinh Viên'] || '';

  upsertHistory({
    msv,
    candidateId: candidate.id,
    name:        candidate['Họ và Tên'] || '',
    lop:         candidate['Lớp'] || '',
    caPhongVan:  candidate['Ca Phỏng Vấn'] || '',
    score,
    comment,
  });

  showToast(`Đã lưu kết quả phỏng vấn của ${candidate['Họ và Tên']}`, 'success');

  // Update submit button to show update mode
  submitBtn.innerHTML = `${icons.check} Đã lưu!`;
  submitBtn.style.background = 'var(--green)';
  submitBtn.style.color = '#0d1117';

  setTimeout(() => {
    if (state.fromHistory) {
      navigate('history');
    } else {
      navigate('search');
    }
    // Reset button
    submitBtn.innerHTML = `${icons.submit} Lưu kết quả`;
    submitBtn.style.background = '';
    submitBtn.style.color = '';
  }, 800);
});

// Open candidate event
window.addEventListener('openCandidate', (e) => {
  renderProfile(e.detail);
});

window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'profile' && state.selectedCandidate) {
    renderProfile(state.selectedCandidate);
  }
});

// ── Render Profile ──
function renderProfile(candidate) {
  if (!candidate) return;

  const name    = candidate['Họ và Tên'] || '';
  const msv     = candidate['Mã Sinh Viên'] || '';
  const lop     = candidate['Lớp'] || '';
  const ca      = candidate['Ca Phỏng Vấn'] || '';
  const gioi    = candidate['Giới Tính'] || '';
  const que     = candidate['Quê'] || '';
  const nganh   = candidate['Ngành Học'] || '';
  const nganhKhac = candidate['Ngành Học Khác (Nếu Có)'] || '';
  const nganhFull = nganhKhac ? nganhKhac : nganh;
  const fb      = candidate['Link Facebook'] || '';
  const email   = candidate['Địa Chỉ Email'] || '';
  const phone   = candidate['Số Điện Thoại'] || '';

  const diemManh = candidate['Điểm Mạnh'] || '';
  const diemYeu  = candidate['Điểm Yếu'] || '';
  const soThich  = candidate['Sở Thích'] || '';
  const tinhCach = candidate['Tính Cách'] || '';
  const thanhTich = candidate['Thành Tích'] || '';
  const kinhNghiem = candidate['Kinh Nghiệm Hoạt Động Hoặc Làm Việc Đã Có?'] || '';
  const bietClb  = candidate['Bạn Biết Đến Câu Lạc Bộ Qua Kênh Nào?'] || '';
  const hieClb   = candidate['Bạn Hiểu Gì Về Câu Lạc Bộ?'] || '';
  const mucTieu  = candidate['Mục Tiêu / Kỳ Vọng Của Bạn Khi Tham Gia CLB?'] || '';
  const khoachHoach = candidate['Kế Hoạch / Định Hướng Đóng Góp Của Bạn Cho CLB?'] || '';
  const kienThuc = candidate['Kiến Thức Chuyên Môn Đã Có Về Ngành Học?'] || '';
  const itInterest = candidate['Bạn Có Hứng Thú Với Mảng IT / Công Nghệ Không?'] || '';
  const itExp    = candidate['Kinh Nghiệm Hoặc Dự Án IT Đã Từng Làm?'] || '';
  const dinhHuong = candidate['Định Hướng Phát Triển'] || '';
  const designInterest = candidate['Bạn Có Hứng Thú Với Mảng Design / Thiết Kế Không?'] || '';
  const designExp = candidate['Kinh Nghiệm Hoặc Sản Phẩm Design Đã Từng Làm?'] || '';
  const contentExp = candidate['Kinh Nghiệm Viết Lách / Content Writing Đã Có?'] || '';
  const q1       = candidate['Câu Hỏi Tư Duy / Hình Học 1'] || '';
  const q2       = candidate['Câu Hỏi Tư Duy / Hình Học 2'] || '';
  const ghiChu   = candidate['Ghi Chú'] || '';

  const initials = getInitials(name);
  const existing = getHistoryEntry(msv);

  // Render main content
  profileContent.innerHTML = `
    <button class="btn-back" id="btn-back-profile">
      ${icons.back} Quay lại
    </button>

    <!-- Header -->
    <div class="profile-header">
      <div class="profile-avatar">${initials}</div>
      <div class="profile-title-block">
        <div class="profile-name">${escapeHtml(name)}</div>
        <div class="profile-meta">
          ${msv  ? `<span class="meta-chip tag tag-cyan">${icons.user} ${escapeHtml(msv)}</span>` : ''}
          ${lop  ? `<span class="meta-chip tag tag-purple">${escapeHtml(lop)}</span>` : ''}
          ${ca   ? `<span class="meta-chip tag tag-yellow">⏰ ${escapeHtml(ca)}</span>` : ''}
          ${gioi ? `<span class="meta-chip tag ${gioi==='Nữ'?'tag-pink':'tag-muted'}">${escapeHtml(gioi)}</span>` : ''}
          ${que  ? `<span class="meta-chip tag tag-muted">${icons.map} ${escapeHtml(que)}</span>` : ''}
          ${existing ? `<span class="interviewed-badge">✓ Đã phỏng vấn · Điểm: ${existing.score}</span>` : ''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${fb ? `<a href="${escapeHtml(fb)}" target="_blank" rel="noopener" class="profile-fb-link">${icons.fb} Facebook</a>` : ''}
          ${email ? `<a href="mailto:${escapeHtml(email)}" class="profile-fb-link" style="color:#8be9fd;border-color:rgba(139,233,253,0.2);background:rgba(139,233,253,0.06)">${icons.mail} ${escapeHtml(email)}</a>` : ''}
          ${phone ? `<span class="meta-chip tag tag-muted">${icons.phone} ${escapeHtml(phone)}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Ngành học -->
    ${nganhFull ? `
    <div style="margin-bottom:16px">
      <span class="tag tag-orange" style="font-size:12px;padding:5px 12px">${icons.book} ${escapeHtml(nganhFull)}</span>
    </div>` : ''}

    <!-- CV Sections -->
    <div class="cv-sections">

      <!-- Điểm mạnh -->
      ${diemManh ? `
      <div class="cv-section">
        <div class="cv-section-label"><span class="section-icon">💪</span> Điểm Mạnh</div>
        <div class="cv-section-content">${escapeHtml(diemManh)}</div>
      </div>` : ''}

      <!-- Điểm yếu -->
      ${diemYeu ? `
      <div class="cv-section">
        <div class="cv-section-label"><span class="section-icon">⚡</span> Điểm Yếu</div>
        <div class="cv-section-content">${escapeHtml(diemYeu)}</div>
      </div>` : ''}

      <!-- Sở thích -->
      ${soThich ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.heart} Sở Thích</div>
        <div class="cv-section-content">${escapeHtml(soThich)}</div>
      </div>` : ''}

      <!-- Tính cách -->
      ${tinhCach ? `
      <div class="cv-section">
        <div class="cv-section-label"><span class="section-icon">🎭</span> Tính Cách</div>
        <div class="cv-section-content">${escapeHtml(tinhCach)}</div>
      </div>` : ''}

      <!-- Thành tích -->
      ${thanhTich ? `
      <div class="cv-section cv-section-full">
        <div class="cv-section-label">${icons.trophy} Thành Tích</div>
        <div class="cv-section-content">${escapeHtml(thanhTich)}</div>
      </div>` : ''}

      <!-- Kinh nghiệm -->
      ${kinhNghiem ? `
      <div class="cv-section cv-section-full">
        <div class="cv-section-label">${icons.star} Kinh Nghiệm Hoạt Động / Làm Việc</div>
        <div class="cv-section-content">${escapeHtml(kinhNghiem)}</div>
      </div>` : ''}

      <!-- Divider: CLB section -->
      <div class="cv-section-full" style="padding:0;background:none;border:none">
        <div class="divider"></div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--purple);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          ${icons.target} Thông tin về CLB
        </div>
      </div>

      <!-- Biết CLB qua kênh nào -->
      ${bietClb ? `
      <div class="cv-section">
        <div class="cv-section-label"><span class="section-icon">📡</span> Biết Đến CLB Qua Kênh Nào?</div>
        <div class="cv-section-content">${escapeHtml(bietClb)}</div>
      </div>` : ''}

      <!-- Hiểu về CLB -->
      ${hieClb ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.info} Hiểu Gì Về CLB?</div>
        <div class="cv-section-content">${escapeHtml(hieClb)}</div>
      </div>` : ''}

      <!-- Mục tiêu -->
      ${mucTieu ? `
      <div class="cv-section cv-section-full">
        <div class="cv-section-label">${icons.target} Mục Tiêu / Kỳ Vọng Khi Tham Gia CLB</div>
        <div class="cv-section-content">${escapeHtml(mucTieu)}</div>
      </div>` : ''}

      <!-- Kế hoạch đóng góp -->
      ${khoachHoach ? `
      <div class="cv-section cv-section-full">
        <div class="cv-section-label">${icons.lightning} Kế Hoạch / Định Hướng Đóng Góp Cho CLB</div>
        <div class="cv-section-content">${escapeHtml(khoachHoach)}</div>
      </div>` : ''}

      <!-- Divider: Chuyên môn -->
      <div class="cv-section-full" style="padding:0;background:none;border:none">
        <div class="divider"></div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--cyan);margin-bottom:12px;display:flex;align-items:center;gap:6px">
          ${icons.code} Kiến Thức Chuyên Môn
        </div>
      </div>

      <!-- Kiến thức ngành -->
      ${kienThuc ? `
      <div class="cv-section cv-section-full">
        <div class="cv-section-label">${icons.book} Kiến Thức Đã Có Về Ngành Học</div>
        <div class="cv-section-content">${escapeHtml(kienThuc)}</div>
      </div>` : ''}

      <!-- IT -->
      <div class="cv-section">
        <div class="cv-section-label">${icons.code} Hứng Thú Với IT / Công Nghệ?</div>
        <div class="interest-row">
          <span class="tag ${itInterest==='Có'?'tag-green':itInterest==='Không'?'tag-muted':'tag-yellow'}">${escapeHtml(itInterest || 'Chưa xác định')}</span>
        </div>
        ${itExp ? `<div class="cv-section-content" style="margin-top:10px">${escapeHtml(itExp)}</div>` : ''}
      </div>

      <!-- Định hướng phát triển -->
      ${dinhHuong ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.compass} Định Hướng Phát Triển</div>
        <div class="cv-section-content">${escapeHtml(dinhHuong)}</div>
      </div>` : ''}

      <!-- Design -->
      <div class="cv-section">
        <div class="cv-section-label">${icons.palette} Hứng Thú Với Design?</div>
        <div class="interest-row">
          <span class="tag ${designInterest==='Có'?'tag-pink':designInterest==='Không'?'tag-muted':'tag-yellow'}">${escapeHtml(designInterest || 'Chưa xác định')}</span>
        </div>
        ${designExp ? `<div class="cv-section-content" style="margin-top:10px">${escapeHtml(designExp)}</div>` : ''}
      </div>

      <!-- Content Writing -->
      ${contentExp ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.pen} Kinh Nghiệm Content Writing</div>
        <div class="cv-section-content">${escapeHtml(contentExp)}</div>
      </div>` : ''}

      <!-- Câu hỏi tư duy -->
      ${(q1 || q2) ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.brain} Câu Hỏi Tư Duy / Hình Học</div>
        <div class="interest-row">
          ${q1 ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)">Câu 1: <span class="answer-badge">${escapeHtml(q1)}</span></div>` : ''}
          ${q2 ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)">Câu 2: <span class="answer-badge">${escapeHtml(q2)}</span></div>` : ''}
        </div>
      </div>` : ''}

      <!-- Ghi chú -->
      ${ghiChu ? `
      <div class="cv-section">
        <div class="cv-section-label">${icons.note} Ghi Chú</div>
        <div class="cv-section-content" style="color:var(--yellow)">${escapeHtml(ghiChu)}</div>
      </div>` : ''}

    </div><!-- end cv-sections -->
  `;

  // Re-attach back button
  document.getElementById('btn-back-profile')?.addEventListener('click', () => {
    if (state.fromHistory) {
      navigate('history');
    } else {
      navigate('search');
    }
  });

  // ── Update panel ──
  updatePanelForCandidate(candidate, existing);
}

function updatePanelForCandidate(candidate, existing) {
  const name    = candidate['Họ và Tên'] || '';
  const msv     = candidate['Mã Sinh Viên'] || '';
  const initials = getInitials(name);

  // Update panel badge
  const badgeName = document.getElementById('panel-candidate-name');
  const badgeMsv  = document.getElementById('panel-candidate-msv');
  const badgeAvatar = document.getElementById('panel-avatar');
  if (badgeName) badgeName.textContent = name;
  if (badgeMsv)  badgeMsv.textContent  = msv;
  if (badgeAvatar) badgeAvatar.textContent = initials;

  // Pre-fill score & comment if existing
  const defaultScore   = existing ? existing.score   : 5;
  const defaultComment = existing ? existing.comment : '';

  if (scoreSlider) {
    scoreSlider.value = defaultScore;
    updateScoreDisplay(defaultScore);
  }
  if (commentArea) {
    commentArea.value = defaultComment;
    commentArea.placeholder = existing
      ? 'Cập nhật nhận xét về thí sinh...'
      : 'Nhập nhận xét về thí sinh này...';
  }

  // Update submit button label
  if (submitBtn) {
    submitBtn.innerHTML = existing
      ? `${icons.edit} Cập nhật`
      : `${icons.submit} Lưu kết quả`;
    submitBtn.style.background = '';
    submitBtn.style.color = '';
  }

  // Update submitted time info
  const submittedInfo = document.getElementById('submitted-info');
  if (submittedInfo) {
    if (existing?.submittedAt) {
      submittedInfo.textContent = `Đã PV: ${formatDate(existing.submittedAt)}`;
      submittedInfo.style.display = 'block';
    } else {
      submittedInfo.style.display = 'none';
    }
  }
}
