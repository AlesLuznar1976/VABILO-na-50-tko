/* ==========================================
   RSVP.JS — Obrazec za potrditev udeležbe
   ========================================== */

(function initRsvp() {
  var form = document.getElementById('rsvpForm');
  var submitBtn = document.getElementById('rsvpSubmit');
  var btnText = submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn.querySelector('.btn__spinner');
  var successEl = document.getElementById('rsvpSuccess');
  var stOsebSelect = document.getElementById('stOseb');
  var spremljevalciGroup = document.getElementById('spremljevalciGroup');
  var spremljevalciList = document.getElementById('spremljevalciList');

  // ---- Dinamična polja za imena spremljevalcev ----
  stOsebSelect.addEventListener('change', updateSpremljevalci);

  function updateSpremljevalci() {
    var count = parseInt(stOsebSelect.value, 10);
    spremljevalciList.innerHTML = '';

    if (count <= 1) {
      spremljevalciGroup.hidden = true;
      return;
    }

    spremljevalciGroup.hidden = false;

    for (var i = 1; i < count; i++) {
      var wrapper = document.createElement('div');
      wrapper.className = 'spremljevalec-row';

      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.name = 'spremljevalec_' + i;
      input.placeholder = 'Ime in priimek ' + (i + 1) + '. osebe';
      input.required = true;

      input.addEventListener('input', function () {
        this.classList.remove('error');
      });

      wrapper.appendChild(input);
      spremljevalciList.appendChild(wrapper);
    }
  }

  // ---- Oddaja obrazca ----
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var ime = document.getElementById('ime');
    var priimek = document.getElementById('priimek');
    var udelezba = form.querySelector('input[name="udelezba"]:checked');

    // Počisti prejšnje napake
    form.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
    });

    var hasError = false;

    if (!ime.value.trim()) { ime.classList.add('error'); hasError = true; }
    if (!priimek.value.trim()) { priimek.classList.add('error'); hasError = true; }
    if (!udelezba) { hasError = true; }

    // Validiraj imena spremljevalcev
    var spremljevalci = [];
    var spremljevalciInputs = spremljevalciList.querySelectorAll('input');
    spremljevalciInputs.forEach(function (input) {
      if (!input.value.trim()) {
        input.classList.add('error');
        hasError = true;
      } else {
        spremljevalci.push(input.value.trim());
      }
    });

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
      telefon: document.getElementById('telefon').value.trim(),
      stOseb: stOsebSelect.value,
      spremljevalci: spremljevalci.join(', '),
      prehrana: document.getElementById('prehrana').value.trim(),
      udelezba: udelezba.value
    };

    apiPost(data)
      .then(function (result) {
        if (result.status === 'ok') {
          var fullName = data.ime + ' ' + data.priimek;
          localStorage.setItem('guestName', fullName);
          localStorage.setItem('stOseb', data.stOseb);

          // Shrani imena vseh oseb v skupini (glavna oseba + spremljevalci)
          var partyNames = [fullName];
          if (spremljevalci.length > 0) {
            partyNames = partyNames.concat(spremljevalci);
          }
          localStorage.setItem('partyNames', JSON.stringify(partyNames));

          form.hidden = true;
          successEl.hidden = false;

          // Prikaži ime v success sporočilu
          var nameEl = document.getElementById('rsvpSuccessName');
          if (nameEl) {
            nameEl.textContent = 'Potrjeno za: ' + fullName + (spremljevalci.length > 0 ? ' + ' + spremljevalci.join(', ') : '');
            nameEl.style.fontWeight = '700';
            nameEl.style.color = '#D4AF37';
            nameEl.style.fontSize = '1.1rem';
          }

          if (typeof celebrateConfetti === 'function') {
            celebrateConfetti();
          }

          showToast('Hvala za potrditev, ' + fullName + '!', 'success');

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
