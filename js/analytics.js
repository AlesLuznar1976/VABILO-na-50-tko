/* ==========================================
   ANALYTICS.JS — Beleženje dogodkov
   Pošilja dogodke na Google Apps Script,
   ki jih shranjuje v Log sheet in pošilja
   dnevni povzetek na ales@luznar.com
   ========================================== */

(function initAnalytics() {
  'use strict';

  // ===== POMOŽNA FUNKCIJA ZA POŠILJANJE LOGA =====
  function logEvent(event, details) {
    var data = {
      type: 'log',
      event: event,
      details: details || '',
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: window.innerWidth + 'x' + window.innerHeight,
      guest: localStorage.getItem('guestName') || 'Neznan'
    };

    // Pošlji na backend (tiho — ne kaži napak)
    if (typeof apiPost === 'function') {
      try { apiPost(data); } catch (e) { /* tiho */ }
    }

    // Tudi shrani lokalno za debug
    try {
      var logs = JSON.parse(localStorage.getItem('eventLog') || '[]');
      logs.push(data);
      // Ohrani zadnjih 200 zapisov
      if (logs.length > 200) logs = logs.slice(-200);
      localStorage.setItem('eventLog', JSON.stringify(logs));
    } catch (e) { /* tiho */ }
  }

  // Naredi globalno dostopno
  window.logEvent = logEvent;

  // ===== BELEŽI OBISK STRANI =====
  logEvent('page_view', document.title);

  // ===== BELEŽI KLIKE NA GUMBE =====
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button, .btn, a[href^="#"]');
    if (!btn) return;

    var label = btn.textContent.trim().substring(0, 60);
    var section = '';
    var sec = btn.closest('section');
    if (sec) section = sec.id || '';

    logEvent('click', section + ' | ' + label);
  });

  // ===== BELEŽI ODDAJO OBRAZCEV =====
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var formId = form.id || 'unknown_form';
    logEvent('form_submit', formId);
  });

  // ===== BELEŽI SCROLLANJE DO SEKCIJ =====
  var observedSections = {};
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !observedSections[entry.target.id]) {
        observedSections[entry.target.id] = true;
        logEvent('section_view', entry.target.id);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('section[id]').forEach(function (sec) {
    observer.observe(sec);
  });

  // ===== BELEŽI ČAS NA STRANI =====
  var startTime = Date.now();
  window.addEventListener('beforeunload', function () {
    var seconds = Math.round((Date.now() - startTime) / 1000);
    logEvent('page_exit', 'Čas na strani: ' + seconds + 's');
  });

})();
