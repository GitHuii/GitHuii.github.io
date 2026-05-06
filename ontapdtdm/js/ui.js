// ===== RENDER QUESTION =====
function renderQuestion() {
  const q = quiz[currentQ];
  const total = quiz.length;

  document.getElementById('q-num').textContent = `Câu ${currentQ + 1} / ${total}`;

  const chBadge = document.getElementById('q-chapter-badge');
  chBadge.textContent = CHAPTER_NAMES_SHORT[q.chapter];
  chBadge.className = 'q-chapter-badge ' + QUESTION_BANK[q.chapter].color;
  chBadge.style.color = CHAPTER_COLORS[q.chapter];
  chBadge.style.borderColor = CHAPTER_COLORS[q.chapter] + '55';
  chBadge.style.background = CHAPTER_COLORS[q.chapter] + '15';

  document.getElementById('q-diff-badge').textContent = DIFF_NAMES[q.diff];
  document.getElementById('question-text').textContent = q.q;

  const markBtn = document.getElementById('q-mark-btn');
  if (marked[currentQ]) {
    markBtn.classList.add('marked');
    markBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M5 3l14 9-14 9V3z"/></svg> Đã đánh dấu';
  } else {
    markBtn.classList.remove('marked');
    markBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M5 3l14 9-14 9V3z"/></svg> Đánh dấu';
  }

  const answersList = document.getElementById('answers-list');
  answersList.innerHTML = '';
  q.displayOpts.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'answer-option';

    if (isReviewMode) {
      div.classList.add('disabled');
      if (i === q.correctIdx) div.classList.add('correct');
      else if (userAnswers[currentQ] === i) div.classList.add('wrong');
    } else {
      if (userAnswers[currentQ] === i) div.classList.add('selected');
      div.onclick = () => selectAnswer(i);
    }

    div.innerHTML =
      '<div class="answer-key">' + ['A','B','C','D'][i] + '</div>' +
      '<div class="answer-text">' + opt + '</div>';
    answersList.appendChild(div);
  });

  document.getElementById('btn-prev').disabled = currentQ === 0;
  document.getElementById('btn-next').disabled = currentQ === total - 1;

  updateProgress();
  updateNavPanel();
}

// ===== HELPERS =====
function _setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== PROGRESS =====
function updateProgress() {
  const total = quiz.length;
  const answered = userAnswers.filter(a => a !== null).length;
  const markedCount = marked.filter(Boolean).length;

  document.getElementById('progress-text').textContent = answered + ' / ' + total + ' câu đã trả lời';
  document.getElementById('progress-pct').textContent = Math.round(answered / total * 100) + '%';
  document.getElementById('progress-fill').style.width = (answered / total * 100) + '%';

  // Desktop sidebar
  _setEl('sum-answered', answered);
  _setEl('sum-unanswered', total - answered);
  _setEl('sum-marked', markedCount);

  // Mobile drawer
  _setEl('sum-answered-drawer', answered);
  _setEl('sum-unanswered-drawer', total - answered);
  _setEl('sum-marked-drawer', markedCount);

  // Mobile header badge
  _setEl('drawer-answered-count', answered);
}

// ===== NAV PANEL (desktop + drawer) =====
function renderNavPanel() {
  const total = quiz.length;
  const isCompact = total > 40;
  const gridClass = 'nav-grid' + (isCompact ? ' compact' : '');

  // Desktop
  const desktopButtons = quiz.map(function(q, i) {
    return '<button class="nav-btn" id="nav-btn-' + i + '" onclick="goToQuestion(' + i + ')">' + (i+1) + '</button>';
  }).join('');
  const desktopEl = document.getElementById('nav-chapters');
  if (desktopEl) desktopEl.innerHTML = '<div class="' + gridClass + '">' + desktopButtons + '</div>';

  // Mobile drawer
  const drawerButtons = quiz.map(function(q, i) {
    return '<button class="nav-btn" id="nav-btn-drawer-' + i + '" onclick="goToQuestionFromDrawer(' + i + ')">' + (i+1) + '</button>';
  }).join('');
  const drawerEl = document.getElementById('nav-chapters-drawer');
  if (drawerEl) drawerEl.innerHTML = '<div class="' + gridClass + '">' + drawerButtons + '</div>';
}

function updateNavPanel() {
  quiz.forEach(function(q, i) {
    _updateNavBtn('nav-btn-' + i, q, i);
    _updateNavBtn('nav-btn-drawer-' + i, q, i);
  });
}

function _updateNavBtn(id, q, i) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.className = 'nav-btn';
  if (isReviewMode) {
    if (i === currentQ) btn.classList.add('current');
    if (userAnswers[i] === q.correctIdx) btn.classList.add('correct-nav');
    else btn.classList.add('wrong-nav');
  } else {
    if (i === currentQ) btn.classList.add('current');
    else if (marked[i]) btn.classList.add('marked');
    else if (userAnswers[i] !== null) btn.classList.add('answered');
  }
}

// ===== MOBILE DRAWER =====
function openNavDrawer() {
  document.getElementById('nav-drawer-overlay').classList.add('open');
  document.getElementById('nav-drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
  var timerEl = document.getElementById('timer-text');
  var drawerRemain = document.getElementById('sum-remain-drawer');
  if (timerEl && drawerRemain) drawerRemain.textContent = timerEl.textContent;
}

function closeNavDrawer() {
  document.getElementById('nav-drawer-overlay').classList.remove('open');
  document.getElementById('nav-drawer').classList.remove('open');
  document.body.style.overflow = '';
}

function goToQuestionFromDrawer(idx) {
  closeNavDrawer();
  setTimeout(function() { goToQuestion(idx); }, 200);
}

// Sync timer into drawer while open
setInterval(function() {
  var drawer = document.getElementById('nav-drawer');
  if (drawer && drawer.classList.contains('open')) {
    var timerEl = document.getElementById('timer-text');
    var drawerRemain = document.getElementById('sum-remain-drawer');
    if (timerEl && drawerRemain) drawerRemain.textContent = timerEl.textContent;
  }
}, 1000);

// Swipe down to close
(function() {
  var startY = 0;
  document.addEventListener('touchstart', function(e) {
    var drawer = document.getElementById('nav-drawer');
    if (drawer && drawer.classList.contains('open')) startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var drawer = document.getElementById('nav-drawer');
    if (drawer && drawer.classList.contains('open')) {
      if (e.changedTouches[0].clientY - startY > 60) closeNavDrawer();
    }
  }, { passive: true });
})();

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  var total = getTotalBankSize();
  _setEl('full-exam-count', total);
  _setEl('full-exam-count-btn', total);
});