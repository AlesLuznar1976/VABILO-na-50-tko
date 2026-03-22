/* ==========================================
   CONFETTI.JS — Party animacije
   Navy + Gold tema
   ========================================== */

(function initConfetti() {
  var goldColors = ['#D4AF37', '#F0D060', '#C9A84C', '#FFFFFF', '#5B8FA8', '#E8D48B'];

  function launchConfetti() {
    if (typeof confetti !== 'function') return;

    setTimeout(function () {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: goldColors
      });
    }, 500);

    setTimeout(function () {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#D4AF37', '#F0D060', '#FFFFFF']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#C9A84C', '#5B8FA8', '#E8D48B']
      });
    }, 1200);
  }

  if (document.readyState === 'complete') {
    launchConfetti();
  } else {
    window.addEventListener('load', launchConfetti);
  }

  var heroBtn = document.querySelector('.btn--hero');
  if (heroBtn) {
    heroBtn.addEventListener('click', function () {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#D4AF37', '#F0D060', '#FFFFFF']
        });
      }
    });
  }
})();

function celebrateConfetti() {
  if (typeof confetti !== 'function') return;

  var duration = 2000;
  var end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#D4AF37', '#F0D060', '#C9A84C', '#FFFFFF']
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#D4AF37', '#F0D060', '#C9A84C', '#FFFFFF']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
