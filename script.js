(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const total = slides.length;
  const bar = document.getElementById('progressBar');
  const dotsEl = document.getElementById('dots');
  const pageNum = document.getElementById('pageNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fsBtn = document.getElementById('fsBtn');

  let current = 0;

  /* 하단 점 네비게이션 */
  slides.forEach((s, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.title = s.dataset.title || `슬라이드 ${i + 1}`;
    dot.setAttribute('aria-label', dot.title);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });
  const dots = [...dotsEl.children];

  /* 숫자 카운트업 */
  function countUp(slide) {
    slide.querySelectorAll('.count').forEach(el => {
      const to = Number(el.dataset.to);
      const duration = 1200;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = 0;
      setTimeout(() => requestAnimationFrame(tick), 500);
    });
  }

  /* 슬라이드 이동 */
  function goTo(index) {
    if (index < 0 || index >= total || index === current && slides[index].classList.contains('active')) return;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      s.classList.toggle('past', i < index);
    });
    current = index;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    bar.style.width = `${((index + 1) / total) * 100}%`;
    pageNum.textContent = `${index + 1} / ${total}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    countUp(slides[index]);
    history.replaceState(null, '', `#${index + 1}`);
  }
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  /* 입력: 버튼 / 키보드 / 휠 / 터치 */
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  document.addEventListener('keydown', e => {
    if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': goTo(0); break;
      case 'End': goTo(total - 1); break;
      case 'f': case 'F': toggleFullscreen(); break;
    }
  });

  let wheelLock = false;
  window.addEventListener('wheel', e => {
    if (wheelLock || Math.abs(e.deltaY) < 30) return;
    wheelLock = true;
    e.deltaY > 0 ? next() : prev();
    setTimeout(() => (wheelLock = false), 800);
  }, { passive: true });

  let touchX = 0, touchY = 0;
  window.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
  }, { passive: true });

  /* 전체화면 */
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  fsBtn.addEventListener('click', toggleFullscreen);

  /* 4번 슬라이드: 세트 체크 + 30초 휴식 타이머 */
  const setsEl = document.getElementById('sets');
  const restBtn = document.getElementById('restBtn');
  const REST_SECONDS = 30;
  let timerId = null;

  for (let i = 1; i <= 4; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'set-dot';
    b.textContent = i;
    b.setAttribute('aria-label', `${i}세트 완료 표시`);
    b.addEventListener('click', () => b.classList.toggle('done'));
    setsEl.appendChild(b);
  }

  const resetRestBtn = () => {
    clearInterval(timerId);
    timerId = null;
    restBtn.classList.remove('running');
    restBtn.textContent = `휴식 ${REST_SECONDS}초 시작`;
  };

  restBtn.addEventListener('click', () => {
    if (timerId) return resetRestBtn();
    let left = REST_SECONDS;
    restBtn.classList.add('running');
    restBtn.textContent = `휴식 중… ${left}초 (누르면 취소)`;
    timerId = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        resetRestBtn();
        restBtn.textContent = '휴식 끝! 다음 세트 시작 💪';
        setTimeout(() => !timerId && (restBtn.textContent = `휴식 ${REST_SECONDS}초 시작`), 2500);
      } else {
        restBtn.textContent = `휴식 중… ${left}초 (누르면 취소)`;
      }
    }, 1000);
  });

  /* 초기화: URL 해시(#3)로 시작 슬라이드 지정 가능 */
  const startIndex = Math.min(Math.max((parseInt(location.hash.slice(1), 10) || 1) - 1, 0), total - 1);
  slides[0].classList.remove('active');
  current = -1;
  goTo(startIndex);
})();
