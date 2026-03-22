/* ==========================================
   CONTACT.JS — Kontaktni obrazec
   Pošlje sporočilo na ales@luznar.com
   ========================================== */

(function initContact() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var submitBtn = document.getElementById('contactSubmit');
  var btnText = submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn.querySelector('.btn__spinner');
  var successEl = document.getElementById('contactSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = document.getElementById('contactName');
    var email = document.getElementById('contactEmail');
    var message = document.getElementById('contactMessage');

    // Počisti napake
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
    });

    var hasError = false;

    if (!name.value.trim()) { name.classList.add('error'); hasError = true; }
    if (!email.value.trim() || !isValidEmail(email.value)) { email.classList.add('error'); hasError = true; }
    if (!message.value.trim()) { message.classList.add('error'); hasError = true; }

    if (hasError) {
      showToast('Prosim izpolni vsa obvezna polja.', 'error');
      return;
    }

    // Loading
    submitBtn.disabled = true;
    btnText.hidden = true;
    btnSpinner.hidden = false;

    var data = {
      action: 'contact',
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim()
    };

    apiPost(data)
      .then(function (result) {
        if (result.status === 'ok') {
          form.hidden = true;
          successEl.hidden = false;
          showToast('Sporočilo uspešno poslano!', 'success');
        } else {
          showToast(result.message || 'Napaka pri pošiljanju.', 'error');
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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
})();
