/* ==========================================
   CONFETTI.JS — Party animacije
   ========================================== */

(function initConfetti() {
  // Počakaj da se canvas-confetti naloži
  function launchConfetti() {
    if (typeof confetti !== 'function') return;

    // Začetni izbruh
    setTimeout(function () {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B9D', '#FFC947', '#17C3B2', '#7B2FBE', '#FF8C42', '#A8E06C']
      });
    }, 500);

    // Stranski izbruhi
    setTimeout(function () {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#FF6B9D', '#FFC947', '#17C3B2']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#7B2FBE', '#FF8C42', '#A8E06C']
      });
    }, 1200);
  }

  // Počakaj na nalaganje
  if (document.readyState === 'complete') {
    launchConfetti();
  } else {
    window.addEventListener('load', launchConfetti);
  }

  // Ponoven konfeti ob kliku na CTA gumb
  var heroBtn = document.querySelector('.btn--hero');
  if (heroBtn) {
    heroBtn.addEventListener('click', function () {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF6B9D', '#FFC947', '#17C3B2']
        });
      }
    });
  }
})();

// Eksportirana funkcija za RSVP uspeh
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
      colors: ['#FF6B9D', '#FFC947', '#17C3B2', '#7B2FBE']
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#FF6B9D', '#FFC947', '#17C3B2', '#7B2FBE']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
