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
    markBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M5 3l14 9-14 9V3z"/></svg> Đã đánh dấu`;
  } else {
    markBtn.classList.remove('marked');
    markBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M5 3l14 9-14 9V3z"/></svg> Đánh dấu`;
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

    div.innerHTML = `
      <div class="answer-key">${['A','B','C','D'][i]}</div>
      <div class="answer-text">${opt}</div>
    `;
    answersList.appendChild(div);
  });

  document.getElementById('btn-prev').disabled = currentQ === 0;
  document.getElementById('btn-next').disabled = currentQ === total - 1;

  updateProgress();
  updateNavPanel();
}

// ===== PROGRESS =====
function updateProgress() {
  const total = quiz.length;
  const answered = userAnswers.filter(a => a !== null).length;
  document.getElementById('progress-text').textContent = `${answered} / ${total} câu đã trả lời`;
  document.getElementById('progress-pct').textContent = `${Math.round(answered / total * 100)}%`;
  document.getElementById('progress-fill').style.width = `${answered / total * 100}%`;
  document.getElementById('sum-answered').textContent = answered;
  document.getElementById('sum-unanswered').textContent = total - answered;
  document.getElementById('sum-marked').textContent = marked.filter(Boolean).length;
}

// ===== NAV PANEL =====
function renderNavPanel() {
  const total = quiz.length;
  const isCompact = total > 40;
  const buttons = quiz.map((q, i) => {
    return `<button class="nav-btn" id="nav-btn-${i}" onclick="goToQuestion(${i})">${i + 1}</button>`;
  }).join('');
  document.getElementById('nav-chapters').innerHTML =
    `<div class="nav-grid${isCompact ? ' compact' : ''}">${buttons}</div>`;
}

function updateNavPanel() {
  quiz.forEach((q, i) => {
    const btn = document.getElementById(`nav-btn-${i}`);
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
  });
}

// ===== INIT PAGE =====
document.addEventListener('DOMContentLoaded', () => {
  const totalInBank = getTotalBankSize();
  // Update full exam button label with actual count
  const fullCountEl = document.getElementById('full-exam-count');
  if (fullCountEl) fullCountEl.textContent = totalInBank;
});