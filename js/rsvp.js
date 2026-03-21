/* ==========================================
   RSVP.JS — Obrazec za potrditev udeležbe
   ========================================== */

(function initRsvp() {
  var form = document.getElementById('rsvpForm');
  var submitBtn = document.getElementById('rsvpSubmit');
  var btnText = submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn.querySelector('.btn__spinner');
  var successEl = document.getElementById('rsvpSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validacija
    var ime = document.getElementById('ime');
    var priimek = document.getElementById('priimek');
    var email = document.getElementById('email');
    var udelezba = form.querySelector('input[name="udelezba"]:checked');

    // Počisti prejšnje napake
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
    });

    var hasError = false;

    if (!ime.value.trim()) { ime.classList.add('error'); hasError = true; }
    if (!priimek.value.trim()) { priimek.classList.add('error'); hasError = true; }
    if (!email.value.trim() || !email.validity.valid) { email.classList.add('error'); hasError = true; }
    if (!udelezba) { hasError = true; }

    if (hasError) {
      showToast('Prosim izpolni vsa obvezna polja.', 'error');
      return;
    }

    // Loading stanje
    submitBtn.disabled = true;
    btnText.hidden = true;
    btnSpinner.hidden = false;

    var data = {
      action: 'rsvp',
      ime: ime.value.trim(),
      priimek: priimek.value.trim(),
      email: email.value.trim(),
      telefon: document.getElementById('telefon').value.trim(),
      stOseb: document.getElementById('stOseb').value,
      prehrana: document.getElementById('prehrana').value.trim(),
      udelezba: udelezba.value
    };

    apiPost(data)
      .then(function (result) {
        if (result.status === 'ok') {
          // Shrani ime za nadaljnjo uporabo
          var fullName = data.ime + ' ' + data.priimek;
          sessionStorage.setItem('guestName', fullName);

          // Prikaži uspeh
          form.hidden = true;
          successEl.hidden = false;

          // Konfeti!
          if (typeof celebrateConfetti === 'function') {
            celebrateConfetti();
          }

          showToast('Hvala za potrditev!', 'success');

          // Odkleni ostale sekcije
          if (data.udelezba === 'da') {
            unlockSections();
          }
        } else {
          showToast(result.message || 'Prišlo je do napake.', 'error');
          submitBtn.disabled = false;
          btnText.hidden = false;
          btnSpinner.hidden = true;
        }
      })
      .catch(function () {
        showToast('Napaka pri pošiljanju. Poskusi znova.', 'error');
        submitBtn.disabled = false;
        btnText.hidden = false;
        btnSpinner.hidden = true;
      });
  });

  // Odstrani error ob vnosu
  form.querySelectorAll('.form-input').forEach(function (input) {
    input.addEventListener('input', function () {
      this.classList.remove('error');
    });
  });
})();
