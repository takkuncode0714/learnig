(function () {
  // 状態管理
  const state = {
    totalSeconds: 0,
    remainingSeconds: 0,
    intervalId: null,
    isRunning: false,
  };

  // DOM要素
  const display = document.getElementById('display');
  const progressBar = document.getElementById('progressBar');
  const message = document.getElementById('message');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
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
    display.textContent = formatTime(state.remainingSeconds);
    const pct = state.totalSeconds > 0
      ? ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100
      : 0;
    progressBar.style.width = pct + '%';
  }

  function setInputsDisabled(disabled) {
    hoursInput.disabled = disabled;
    minutesInput.disabled = disabled;
    secondsInput.disabled = disabled;
  }

  function startTimer() {
    if (state.isRunning) return;

    if (state.remainingSeconds === 0) {
      state.totalSeconds = getInputSeconds();
      state.remainingSeconds = state.totalSeconds;
    }

    if (state.remainingSeconds <= 0) {
      message.textContent = '⚠️ 時間を設定してください';
      message.classList.remove('hidden');
      return;
    }

    state.isRunning = true;
    message.classList.add('hidden');
    display.classList.remove('finished');
    display.classList.add('running');
    progressBar.classList.add('running');
    setInputsDisabled(true);
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    state.intervalId = setInterval(() => {
      state.remainingSeconds--;
      updateDisplay();

      if (state.remainingSeconds <= 0) {
        clearInterval(state.intervalId);
        state.intervalId = null;
        state.isRunning = false;
        display.classList.remove('running');
        display.classList.add('finished');
        progressBar.classList.remove('running');
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        setInputsDisabled(false);
        message.textContent = '⏰ 時間になりました！';
        message.classList.remove('hidden');
        playBeep();
      }
    }, 1000);

    updateDisplay();
  }

  function pauseTimer() {
    if (!state.isRunning) return;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
    display.classList.remove('running');
    progressBar.classList.remove('running');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetTimer() {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
    state.remainingSeconds = 0;
    state.totalSeconds = 0;
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
    updateDisplay();
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < 3; i++) {
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

  // イベントリスナー
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName;
    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(activeTag);

    if (e.key === 'Enter' && !startBtn.disabled) {
      startTimer();
    }
    // 入力フィールドにフォーカス中はスペースキーの一時停止を無効化
    if (e.key === ' ' && !pauseBtn.disabled && !isInputFocused) {
      e.preventDefault();
      pauseTimer();
    }
  });
})();
