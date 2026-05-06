// ===== QUIZ STATE =====
let quiz = [];
let userAnswers = [];
let marked = [];
let currentQ = 0;
let timerInterval = null;
let secondsLeft = 0;
let isReviewMode = false;
let isFullExam = false; // true = toàn bộ 150 câu, false = 40 câu ngẫu nhiên

// ===== HELPERS =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ===== BUILD QUIZ =====

/**
 * Chế độ thông thường: 40 câu ngẫu nhiên (8/chương: 3 easy + 3 medium + 2 hard)
 */
function buildRandomQuiz() {
  quiz = [];
  [1, 2, 3, 4, 5].forEach(ch => {
    const bank = QUESTION_BANK[ch];
    const selected = [
      ...shuffle(bank.easy).slice(0, 3).map(q => ({ ...q, chapter: ch, diff: 'easy' })),
      ...shuffle(bank.medium).slice(0, 3).map(q => ({ ...q, chapter: ch, diff: 'medium' })),
      ...shuffle(bank.hard).slice(0, 2).map(q => ({ ...q, chapter: ch, diff: 'hard' })),
    ];
    selected.forEach(prepareQuestion);
    quiz.push(...shuffle(selected));
  });
  quiz = shuffle(quiz);
  initState(quiz.length);
}

/**
 * Chế độ toàn bộ: tất cả câu hỏi trong ngân hàng (150 câu), xáo trộn
 */
function buildFullQuiz() {
  quiz = [];
  [1, 2, 3, 4, 5].forEach(ch => {
    const bank = QUESTION_BANK[ch];
    const all = [
      ...bank.easy.map(q => ({ ...q, chapter: ch, diff: 'easy' })),
      ...bank.medium.map(q => ({ ...q, chapter: ch, diff: 'medium' })),
      ...bank.hard.map(q => ({ ...q, chapter: ch, diff: 'hard' })),
    ];
    all.forEach(prepareQuestion);
    quiz.push(...all);
  });
  quiz = shuffle(quiz);
  initState(quiz.length);
}

function prepareQuestion(q) {
  const opts = q.opts.map((o, i) => ({ text: o, isCorrect: i === q.ans }));
  const shuffled = shuffle(opts);
  q.displayOpts = shuffled.map(o => o.text);
  q.correctIdx = shuffled.findIndex(o => o.isCorrect);
}

function initState(total) {
  userAnswers = new Array(total).fill(null);
  marked = new Array(total).fill(false);
  currentQ = 0;
}

// ===== TIMER =====
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();
    const remainEl = document.getElementById('sum-remain');
    if (remainEl) remainEl.textContent = formatTime(secondsLeft);
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-text');
  const timerEl = document.getElementById('timer');
  el.textContent = formatTime(secondsLeft);
  if (secondsLeft < 300) timerEl.classList.add('warning');
  else timerEl.classList.remove('warning');
}

// ===== START / SUBMIT =====
function startQuiz() {
  isFullExam = false;
  buildRandomQuiz();
  secondsLeft = 60 * 60; // 60 phút
  _launchQuiz();
}

function startFullExam() {
  isFullExam = true;
  buildFullQuiz();
  secondsLeft = 3 * 60 * 60; // 3 giờ
  _launchQuiz();
}

function _launchQuiz() {
  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';
  isReviewMode = false;

  // Update header badge for full exam
  const badge = document.getElementById('quiz-mode-badge');
  if (isFullExam) {
    badge.textContent = `Toàn bộ ${quiz.length} câu`;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }

  document.getElementById('btn-submit').textContent = 'Nộp bài';
  document.getElementById('btn-submit').onclick = confirmSubmit;

  startTimer();
  renderNavPanel();
  renderQuestion();
}

function confirmSubmit() {
  const total = quiz.length;
  const answered = userAnswers.filter(a => a !== null).length;
  const unanswered = total - answered;
  if (unanswered > 0) {
    if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài?`)) return;
  }
  submitQuiz();
}

function submitQuiz() {
  clearInterval(timerInterval);
  let correct = 0;
  quiz.forEach((q, i) => { if (userAnswers[i] === q.correctIdx) correct++; });

  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';
  showResult(correct);
}

// ===== RESULT =====
function showResult(correct) {
  const total = quiz.length;
  const score = (correct / total * 10).toFixed(1);
  const pct = Math.round(correct / total * 100);

  document.getElementById('score-big').textContent = score;
  document.getElementById('rs-correct').textContent = correct;
  document.getElementById('rs-wrong').textContent = userAnswers.filter((a,i) => a !== null && a !== quiz[i].correctIdx).length;
  document.getElementById('rs-skip').textContent = userAnswers.filter(a => a === null).length;
  document.getElementById('rs-pct').textContent = pct + '%';

  // Update score denom label
  const totalPerChapter = isFullExam ? 30 : 8;
  document.getElementById('result-total-label').textContent = `/ ${total} câu`;

  const gradeEl = document.getElementById('result-grade');
  const msgEl = document.getElementById('result-msg');
  const circleEl = document.getElementById('score-circle');

  const scoreNum = parseFloat(score);
  const circumference = 502.65;
  const offset = circumference - (correct / total) * circumference;
  setTimeout(() => circleEl.style.strokeDashoffset = offset, 300);

  if (scoreNum >= 9) {
    gradeEl.textContent = '🏆 Xuất sắc!'; gradeEl.style.color = '#f59e0b';
    msgEl.textContent = 'Mày tày rồi!';
  } else if (scoreNum >= 8) {
    gradeEl.textContent = '🎯 Giỏi!'; gradeEl.style.color = '#3fb950';
    msgEl.textContent = 'Kết quả rất tốt! Hãy ôn lại những câu còn sai.';
  } else if (scoreNum >= 6.5) {
    gradeEl.textContent = '👍 Khá!'; gradeEl.style.color = '#58a6ff';
    msgEl.textContent = 'Kết quả khá. Còn nhiều chỗ có thể cải thiện thêm.';
  } else if (scoreNum >= 5) {
    gradeEl.textContent = '📚 Trung bình'; gradeEl.style.color = '#d29922';
    msgEl.textContent = 'Cần ôn tập thêm để nắm chắc kiến thức.';
  } else {
    gradeEl.textContent = '💪 Cần cố gắng'; gradeEl.style.color = '#f85149';
    msgEl.textContent = 'Hãy xem lại lý thuyết và làm bài luyện tập thêm nhé!';
  }

  // Chapter breakdown
  const chapterResultsHtml = [1,2,3,4,5].map(ch => {
    const chQ = quiz.map((q,i) => ({ q, i })).filter(({q}) => q.chapter === ch);
    const chTotal = chQ.length;
    const chCorrect = chQ.filter(({q,i}) => userAnswers[i] === q.correctIdx).length;
    const pct = chTotal > 0 ? Math.round(chCorrect / chTotal * 100) : 0;
    const color = CHAPTER_COLORS[ch];
    return `
      <div class="chapter-result-row">
        <div class="chapter-result-name" style="color:${color}">${QUESTION_BANK[ch].name}</div>
        <div class="chapter-result-bar-wrap">
          <div class="chapter-result-bar" style="width:0%;background:${color}" data-pct="${pct}"></div>
        </div>
        <div class="chapter-result-score">${chCorrect}/${chTotal}</div>
      </div>
    `;
  }).join('');
  document.getElementById('chapter-results-body').innerHTML = chapterResultsHtml;
  setTimeout(() => {
    document.querySelectorAll('.chapter-result-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 400);
}

function retryQuiz() {
  document.getElementById('result-screen').style.display = 'none';
  if (isFullExam) startFullExam();
  else startQuiz();
}

function backToIntro() {
  clearInterval(timerInterval);
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('intro-screen').style.display = 'flex';
}

function showReview() {
  isReviewMode = true;
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';
  document.getElementById('btn-submit').textContent = '← Kết quả';
  document.getElementById('btn-submit').onclick = () => {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
  };
  const firstWrong = quiz.findIndex((q, i) => userAnswers[i] !== q.correctIdx);
  currentQ = firstWrong >= 0 ? firstWrong : 0;
  renderNavPanel();
  updateNavPanel();
  renderQuestion();
}

// ===== NAVIGATION =====
function navigate(dir) {
  currentQ = Math.max(0, Math.min(quiz.length - 1, currentQ + dir));
  renderQuestion();
}

function goToQuestion(idx) {
  currentQ = idx;
  renderQuestion();
}

function selectAnswer(idx) {
  userAnswers[currentQ] = idx;
  renderQuestion();
}

function toggleMark() {
  marked[currentQ] = !marked[currentQ];
  renderQuestion();
  updateNavPanel();
}