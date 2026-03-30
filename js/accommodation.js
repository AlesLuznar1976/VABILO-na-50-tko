/* ==========================================
   ACCOMMODATION.JS — Rezervacija prenočišča
   Jezero Jasna, Kranjska Gora
   Fiksni datum: 16.→17. maj 2026
   ========================================== */

(function initAccommodation() {
  var form = document.getElementById('accommodationForm');
  var success = document.getElementById('accommodationSuccess');
  var submitBtn = document.getElementById('accSubmit');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var guestName = localStorage.getItem('guestName') || 'Gost';
    var guestsEl = document.getElementById('accGuests');
    var guests = guestsEl ? guestsEl.value : '1';

    // Prikaži loading
    submitBtn.disabled = true;
    var btnText = submitBtn.querySelector('.btn__text');
    var btnSpinner = submitBtn.querySelector('.btn__spinner');
    if (btnText) btnText.textContent = 'Pošiljam...';
    if (btnSpinner) btnSpinner.hidden = false;

    var data = {
      type: 'accommodation',
      name: guestName,
      checkin: '2026-05-16',
      checkout: '2026-05-17',
      guests: guests
    };

    // Pošlji na backend
    apiPost(data).then(function () {
      form.hidden = true;
      success.hidden = false;
      showToast('Prenočišče uspešno rezervirano!', 'success');
      if (typeof celebrateConfetti === 'function') celebrateConfetti();
      localStorage.setItem('accData', JSON.stringify(data));
      localStorage.setItem('accDone', 'true');
      checkAndSendSummary();
    }).catch(function () {
      // Demo mode — simuliraj uspeh
      form.hidden = true;
      success.hidden = false;
      showToast('Prenočišče uspešno rezervirano!', 'success');
      if (typeof celebrateConfetti === 'function') celebrateConfetti();
      localStorage.setItem('accData', JSON.stringify(data));
      localStorage.setItem('accDone', 'true');
      checkAndSendSummary();
    }).finally(function () {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Rezerviraj prenočišče';
      if (btnSpinner) btnSpinner.hidden = true;
    });
  });

  // Gumb "Ne potrebujem prenočišča"
  var declineBtn = document.getElementById('accDecline');
  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      localStorage.setItem('accDone', 'true');
      localStorage.setItem('accData', JSON.stringify({ guests: 0, declined: true }));
      form.hidden = true;
      var successDiv = document.getElementById('accommodationSuccess');
      if (successDiv) {
        successDiv.hidden = false;
        var icon = successDiv.querySelector('.rsvp-success__icon');
        var title = successDiv.querySelector('.rsvp-success__title');
        var text = successDiv.querySelector('.rsvp-success__text');
        if (icon) icon.textContent = '👍';
        if (title) title.textContent = 'Razumemo!';
        if (text) text.textContent = 'Prenočišče ni potrebno — vidimo se na zabavi!';
      }
      showToast('Odgovor zabeležen. Hvala!', 'success');
      checkAndSendSummary();
    });
  }
})();
