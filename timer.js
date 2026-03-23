let totalSeconds = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;

const display = document.getElementById('display');
const progressBar = document.getElementById('progressBar');
const message = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');

function getInputSeconds() {
  const h = parseInt(hoursInput.value) || 0;
  const m = parseInt(minutesInput.value) || 0;
  const s = parseInt(secondsInput.value) || 0;
  return h * 3600 + m * 60 + s;
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  const pct = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  progressBar.style.width = pct + '%';
}

function setInputsDisabled(disabled) {
  hoursInput.disabled = disabled;
  minutesInput.disabled = disabled;
  secondsInput.disabled = disabled;
}

function startTimer() {
  if (!isRunning) {
    if (remainingSeconds === 0) {
      totalSeconds = getInputSeconds();
      remainingSeconds = totalSeconds;
    }
    if (remainingSeconds <= 0) return;

    isRunning = true;
    message.classList.add('hidden');
    display.classList.remove('finished');
    display.classList.add('running');
    progressBar.classList.add('running');
    setInputsDisabled(true);
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    intervalId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
        display.classList.remove('running');
        display.classList.add('finished');
        progressBar.classList.remove('running');
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        setInputsDisabled(false);
        message.classList.remove('hidden');
        playBeep();
      }
    }, 1000);

    updateDisplay();
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    display.classList.remove('running');
    progressBar.classList.remove('running');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  remainingSeconds = 0;
  totalSeconds = 0;
  display.textContent = '00:00:00';
  display.classList.remove('running', 'finished');
  progressBar.classList.remove('running');
  progressBar.style.width = '0%';
  message.classList.add('hidden');
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  setInputsDisabled(false);
  hoursInput.value = 0;
  minutesInput.value = 0;
  secondsInput.value = 0;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beepCount = 3;
    for (let i = 0; i < beepCount; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.4 + 0.3);
      osc.start(ctx.currentTime + i * 0.4);
      osc.stop(ctx.currentTime + i * 0.4 + 0.3);
    }
  } catch (e) {
    // Audio not supported
  }
}

// Allow pressing Enter to start
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !startBtn.disabled) startTimer();
  if (e.key === ' ' && !pauseBtn.disabled) { e.preventDefault(); pauseTimer(); }
});
