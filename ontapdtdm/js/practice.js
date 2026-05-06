// ===== PRACTICE MODE STATE =====
let practiceQueue = [];       // câu hỏi đang chờ (bao gồm cả câu sai được đưa lại)
let practiceDone = [];        // câu đã trả lời đúng (loại ra khỏi queue)
let practiceStats = {
  correctFirst: 0,            // đúng ngay lần đầu
  wrongOnce: 0,               // đã sai ít nhất 1 lần
  totalAttempts: 0
};
let practiceAnswered = false; // đã chọn đáp án chưa (để lock options)
let practiceCurrentQ = null;  // câu hiện tại (object từ queue)
let practiceWrongSet = new Set(); // index gốc các câu đã sai ít nhất 1 lần

// ===== BUILD PRACTICE QUEUE =====
function buildPracticeQueue() {
  practiceQueue = [];
  [1, 2, 3, 4, 5].forEach(ch => {
    const bank = QUESTION_BANK[ch];
    const all = [
      ...bank.easy.map(q => ({ ...q, chapter: ch, diff: 'easy' })),
      ...bank.medium.map(q => ({ ...q, chapter: ch, diff: 'medium' })),
      ...bank.hard.map(q => ({ ...q, chapter: ch, diff: 'hard' })),
    ];
    all.forEach(prepareQuestion);
    practiceQueue.push(...all);
  });
  practiceQueue = shuffle(practiceQueue);
  // Gán id duy nhất cho mỗi câu để track
  practiceQueue.forEach((q, i) => { q._pid = i; });

  practiceDone = [];
  practiceWrongSet = new Set();
  practiceStats = { correctFirst: 0, wrongOnce: 0, totalAttempts: 0 };
  practiceAnswered = false;
}

// ===== START PRACTICE =====
function startPractice() {
  buildPracticeQueue();
  hideAllScreens();
  document.getElementById('practice-screen').style.display = 'block';
  renderPracticeQuestion();
}

function confirmBackFromPractice() {
  const remaining = practiceQueue.length;
  if (remaining > 0) {
    if (!confirm('Bạn có chắc muốn thoát? Tiến trình ôn tập sẽ bị mất.')) return;
  }
  backToIntro();
}

// ===== RENDER PRACTICE QUESTION =====
function renderPracticeQuestion() {
  if (practiceQueue.length === 0) {
    showPracticeComplete();
    return;
  }

  practiceAnswered = false;
  practiceCurrentQ = practiceQueue[0];
  const q = practiceCurrentQ;
  const total = practiceDone.length + practiceQueue.length;
  const doneCount = practiceDone.length;

  // Header stats
  document.getElementById('pq-remaining').textContent = practiceQueue.length;
  document.getElementById('pq-correct').textContent = practiceStats.correctFirst;
  document.getElementById('pq-wrong').textContent = practiceWrongSet.size;

  // Progress bar (based on unique done / total unique)
  const progressPct = (practiceDone.length / total) * 100;
  document.getElementById('practice-progress-fill').style.width = progressPct + '%';

  // Question number - show position  
  document.getElementById('pq-num').textContent = 'Câu ' + (doneCount + 1) + ' / ' + total;

  // Chapter badge
  const chBadge = document.getElementById('pq-chapter-badge');
  chBadge.textContent = CHAPTER_NAMES_SHORT[q.chapter];
  chBadge.className = 'q-chapter-badge';
  chBadge.style.color = CHAPTER_COLORS[q.chapter];
  chBadge.style.borderColor = CHAPTER_COLORS[q.chapter] + '55';
  chBadge.style.background = CHAPTER_COLORS[q.chapter] + '15';

  document.getElementById('pq-diff-badge').textContent = DIFF_NAMES[q.diff];

  // Round badge - hiện nếu câu này đã từng sai
  const roundBadge = document.getElementById('pq-round-badge');
  if (practiceWrongSet.has(q._pid)) {
    roundBadge.style.display = 'inline-flex';
    roundBadge.textContent = '🔄 Làm lại';
  } else {
    roundBadge.style.display = 'none';
  }

  document.getElementById('pq-text').textContent = q.q;

  // Render answers
  const answersList = document.getElementById('pq-answers');
  answersList.innerHTML = '';
  q.displayOpts.forEach(function(opt, i) {
    const div = document.createElement('div');
    div.className = 'answer-option';
    div.innerHTML =
      '<div class="answer-key">' + ['A','B','C','D'][i] + '</div>' +
      '<div class="answer-text">' + opt + '</div>';
    div.onclick = function() { practiceSelectAnswer(i); };
    answersList.appendChild(div);
  });

  // Hide feedback
  document.getElementById('practice-feedback').style.display = 'none';
}

// ===== SELECT ANSWER IN PRACTICE =====
function practiceSelectAnswer(idx) {
  if (practiceAnswered) return; // đã chọn rồi, lock
  practiceAnswered = true;
  practiceStats.totalAttempts++;

  const q = practiceCurrentQ;
  const isCorrect = idx === q.correctIdx;

  // Highlight options
  const options = document.querySelectorAll('#pq-answers .answer-option');
  options.forEach(function(opt, i) {
    opt.classList.add('disabled');
    opt.onclick = null;
    if (i === q.correctIdx) opt.classList.add('correct');
    else if (i === idx && !isCorrect) opt.classList.add('wrong');
  });

  // Show feedback
  const feedbackEl = document.getElementById('practice-feedback');
  const iconEl = document.getElementById('feedback-icon');
  const msgEl = document.getElementById('feedback-msg');

  feedbackEl.style.display = 'flex';
  feedbackEl.className = 'practice-feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-wrong');

  if (isCorrect) {
    iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="28" height="28"><polyline points="20 6 9 17 4 12"/></svg>';
    msgEl.textContent = randomCorrectMsg();

    // Stats
    if (!practiceWrongSet.has(q._pid)) {
      practiceStats.correctFirst++;
    }

    // Remove from queue (move to done)
    practiceQueue.shift();
    practiceDone.push(q);

    // Update remaining display immediately
    document.getElementById('pq-remaining').textContent = practiceQueue.length;
  } else {
    iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="28" height="28"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    msgEl.textContent = randomWrongMsg();

    // Mark as wrong
    practiceWrongSet.add(q._pid);

    // Remove from front, insert at random position in remaining queue
    practiceQueue.shift();
    if (practiceQueue.length === 0) {
      practiceQueue.push(q);
    } else {
      // Random position from 1 to queue.length (not position 0 = immediately next)
      const minPos = Math.min(1, practiceQueue.length);
      const maxPos = Math.min(practiceQueue.length, Math.max(1, Math.floor(practiceQueue.length / 2) + 2));
      const insertPos = minPos + Math.floor(Math.random() * (maxPos - minPos + 1));
      practiceQueue.splice(insertPos, 0, q);
    }

    // Update remaining
    document.getElementById('pq-remaining').textContent = practiceQueue.length;
    document.getElementById('pq-wrong').textContent = practiceWrongSet.size;
  }

  // Update progress bar
  const total = practiceDone.length + practiceQueue.length;
  const progressPct = total > 0 ? (practiceDone.length / total) * 100 : 0;
  document.getElementById('practice-progress-fill').style.width = progressPct + '%';
}

// ===== NEXT PRACTICE QUESTION =====
function practiceNext() {
  if (!practiceAnswered) return;
  renderPracticeQuestion();
}

// ===== COMPLETE =====
function showPracticeComplete() {
  const total = practiceDone.length;
  document.getElementById('pc-total').textContent = total;
  document.getElementById('pc-correct').textContent = practiceStats.correctFirst;
  document.getElementById('pc-wrong').textContent = practiceWrongSet.size;
  document.getElementById('pc-attempts').textContent = practiceStats.totalAttempts;

  hideAllScreens();
  document.getElementById('practice-complete-screen').style.display = 'block';
}

// ===== RANDOM MESSAGES =====
function randomCorrectMsg() {
  const msgs = [
    'Chính xác! 🎯', 'Đúng rồi! ✨', 'Tuyệt vời! 🌟',
    'Hoàn hảo! 💪', 'Xuất sắc! 🏆', 'Chính xác! Tiếp tục nào!'
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function randomWrongMsg() {
  const msgs = [
    'Chưa đúng, cố lên nhé! 💡', 'Sai rồi, câu này sẽ quay lại sau!',
    'Không đúng, hãy ghi nhớ đáp án này!', 'Sai, câu này sẽ xuất hiện lại để bạn ôn!'
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}