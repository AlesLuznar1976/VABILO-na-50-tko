/* ==========================================
   APP.JS — Navigacija, countdown, konstante
   ========================================== */

// ===== KONFIGURACIJSKE KONSTANTE =====
const CONFIG = {
  // POMEMBNO: Zamenjaj z URL-jem svojega Google Apps Script deployja
  APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_URL_HERE',

  // Datum zabave
  PARTY_DATE: new Date('2026-05-16T20:00:00+02:00'),

  // Stanje aplikacije
  isRsvpCompleted: false,
};

// ===== NAVIGACIJA =====
(function initNav() {
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  // Scroll shadow
  window.addEventListener('scroll', function () {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  });

  // Mobile toggle
  toggle.addEventListener('click', function () {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  // Zapri meni ob kliku na link
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });

  // Active link ob scrollu
  var sections = document.querySelectorAll('.section');
  var navAnchors = links.querySelectorAll('a');

  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY + 120;
    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos && section.offsetTop + section.offsetHeight > scrollPos) {
        navAnchors.forEach(function (a) { a.classList.remove('active'); });
        var active = links.querySelector('a[href="#' + section.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  });
})();

// ===== COUNTDOWN =====
(function initCountdown() {
  function update() {
    var now = new Date();
    var diff = CONFIG.PARTY_DATE - now;

    if (diff <= 0) {
      document.getElementById('countDays').textContent = '0';
      document.getElementById('countHours').textContent = '0';
      document.getElementById('countMinutes').textContent = '0';
      document.getElementById('countSeconds').textContent = '0';
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countDays').textContent = days;
    document.getElementById('countHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countSeconds').textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
})();

// ===== SCROLL REVEAL =====
(function initReveal() {
  var reveals = document.querySelectorAll('.section__header, .detail-card, .rsvp-form, .music-form');
  reveals.forEach(function (el) { el.classList.add('reveal'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(function (el) { observer.observe(el); });
})();

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type) {
  type = type || 'success';

  // Odstrani obstoječi toast
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Prikaži
  requestAnimationFrame(function () {
    toast.classList.add('show');
  });

  // Skrij po 4 sekundah
  setTimeout(function () {
    toast.classList.remove('show');
    setTimeout(function () { toast.remove(); }, 400);
  }, 4000);
}

// ===== ODKLEPANJE SEKCIJ =====
function unlockSections() {
  CONFIG.isRsvpCompleted = true;

  // Odkleni navigacijo
  var navAccommodation = document.getElementById('navAccommodation');
  var navMusic = document.getElementById('navMusic');
  navAccommodation.classList.add('nav__unlocked');
  navMusic.classList.add('nav__unlocked');

  // Skrij zaklenjene overlayre
  var accommodationLocked = document.getElementById('accommodationLocked');
  var musicLocked = document.getElementById('musicLocked');
  accommodationLocked.hidden = true;
  musicLocked.hidden = true;

  // Prikaži vsebino
  document.getElementById('accommodationContent').hidden = false;
  document.getElementById('musicForm').hidden = false;

  // Inicializiraj glasbo
  if (typeof initMusicForm === 'function') {
    initMusicForm();
  }

  // Pokaži RSVP uspeh namesto obrazca (če se vračamo)
  var rsvpForm = document.getElementById('rsvpForm');
  var rsvpSuccess = document.getElementById('rsvpSuccess');
  if (rsvpForm && rsvpSuccess) {
    rsvpForm.hidden = true;
    rsvpSuccess.hidden = false;
  }
}

// ===== PONASTAVI STRAN =====
function resetPage() {
  localStorage.removeItem('guestName');
  localStorage.removeItem('stOseb');
  localStorage.removeItem('partyNames');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(function () {
    location.reload();
  }, 400);
}

// ===== HERO GUMB — POTRDI UDELEŽBO (reset za novega gosta) =====
(function initHeroReset() {
  var heroBtn = document.getElementById('heroRsvpBtn');
  if (!heroBtn) return;

  heroBtn.addEventListener('click', function (e) {
    // Počisti osebne podatke (sedeži na strežniku ostanejo)
    localStorage.removeItem('guestName');
    localStorage.removeItem('stOseb');
    localStorage.removeItem('partyNames');
    CONFIG.isRsvpCompleted = false;

    // Ponastavi RSVP obrazec
    var rsvpForm = document.getElementById('rsvpForm');
    var rsvpSuccess = document.getElementById('rsvpSuccess');
    if (rsvpForm) {
      rsvpForm.hidden = false;
      rsvpForm.reset();
    }
    if (rsvpSuccess) rsvpSuccess.hidden = true;

    // Ponastavi spremljevalce
    var spremljevalciGroup = document.getElementById('spremljevalciGroup');
    var spremljevalciList = document.getElementById('spremljevalciList');
    if (spremljevalciGroup) spremljevalciGroup.hidden = true;
    if (spremljevalciList) spremljevalciList.innerHTML = '';

    // Zakleni sekcije nazaj
    var navAccommodation = document.getElementById('navAccommodation');
    var navMusic = document.getElementById('navMusic');
    if (navAccommodation) navAccommodation.classList.remove('nav__unlocked');
    if (navMusic) navMusic.classList.remove('nav__unlocked');

    var accommodationLocked = document.getElementById('accommodationLocked');
    var musicLocked = document.getElementById('musicLocked');
    if (accommodationLocked) accommodationLocked.hidden = false;
    if (musicLocked) musicLocked.hidden = false;

    var accommodationContent = document.getElementById('accommodationContent');
    if (accommodationContent) accommodationContent.hidden = true;
    document.getElementById('musicForm').hidden = true;

    // Ponastavi glasbo
    var musicForm = document.getElementById('musicForm');
    var musicSuccess = document.getElementById('musicSuccess');
    if (musicForm) { musicForm.hidden = true; }
    if (musicSuccess) musicSuccess.hidden = true;

    // Ponastavi submit gumbe
    var rsvpSubmit = document.getElementById('rsvpSubmit');
    if (rsvpSubmit) {
      rsvpSubmit.disabled = false;
      var btnText = rsvpSubmit.querySelector('.btn__text');
      var btnSpinner = rsvpSubmit.querySelector('.btn__spinner');
      if (btnText) btnText.hidden = false;
      if (btnSpinner) btnSpinner.hidden = true;
    }
  });
})();


// ===== API HELPER =====
function apiPost(data) {
  if (CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    // Demo način — shrani lokalno
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (data.action === 'seat') {
          var seats = [];
          try { seats = JSON.parse(localStorage.getItem('demoSeats') || '[]'); } catch(e) {}
          // Preveri ali je sedež že zaseden
          var taken = seats.some(function(s) { return s.table == data.table && s.seat == data.seat; });
          if (taken) {
            resolve({ status: 'error', message: 'Sedež je že zaseden.' });
            return;
          }
          seats.push({ table: data.table, seat: data.seat, name: data.name });
          localStorage.setItem('demoSeats', JSON.stringify(seats));
        }
        resolve({ status: 'ok', message: 'Demo način — podatki shranjeni lokalno.' });
      }, 500);
    });
  }

  return fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'text/plain' }
  }).then(function (r) { return r.json(); });
}

function apiGet(params) {
  if (CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    // Demo način — preberi iz localStorage
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (params.action === 'getSeating') {
          var seats = [];
          try { seats = JSON.parse(localStorage.getItem('demoSeats') || '[]'); } catch(e) {}
          resolve({ status: 'ok', seats: seats });
        } else {
          resolve({ status: 'ok' });
        }
      }, 200);
    });
  }

  var url = CONFIG.APPS_SCRIPT_URL + '?' + new URLSearchParams(params).toString();
  return fetch(url).then(function (r) { return r.json(); });
}

// ===== PREVERI OBSTOJEČI RSVP IZ LOCALSTORAGE =====
// Počakaj da se vsi skripti naložijo (seating.js, music.js)
window.addEventListener('DOMContentLoaded', function () {
  var guestName = localStorage.getItem('guestName');
  if (guestName) {
    unlockSections();

    // Prikaži shranjeno ime
    var nameEl = document.getElementById('rsvpSuccessName');
    if (nameEl) {
      var partyNames = [];
      try { partyNames = JSON.parse(localStorage.getItem('partyNames') || '[]'); } catch(e) {}
      var others = partyNames.slice(1);
      nameEl.textContent = 'Potrjeno za: ' + guestName + (others.length > 0 ? ' + ' + others.join(', ') : '');
      nameEl.style.fontWeight = '700';
      nameEl.style.color = '#D4AF37';
      nameEl.style.fontSize = '1.1rem';
    }
  }
});

// ===== CALENDAR DROPDOWN =====
(function initCalendarDropdown() {
  var btn = document.getElementById('addToCalendarBtn');
  var menu = document.getElementById('calendarMenu');
  var icsLink = document.getElementById('downloadIcs');
  if (!btn || !menu) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('is-open');
  });

  document.addEventListener('click', function () {
    menu.classList.remove('is-open');
  });

  menu.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // .ics download za Apple/iPhone
  if (icsLink) {
    icsLink.addEventListener('click', function (e) {
      e.preventDefault();
      menu.classList.remove('is-open');
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Vabilo//50let//SL',
        'BEGIN:VEVENT',
        'DTSTART:20260516T180000',
        'DTEND:20260517T020000',
        'SUMMARY:Rojstnodnevna zabava - 50 let',
        'LOCATION:Jezero Jasna\\, Kranjska Gora',
        'DESCRIPTION:Pridruži se nam na nepozabnem prazniku ob Jezeru Jasna!',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'rojstni-dan-50.ics';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
})();
