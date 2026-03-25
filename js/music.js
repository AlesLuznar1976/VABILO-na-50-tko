/* ==========================================
   MUSIC.JS — Izbira glasbe
   Po potrditvi ostane na isti strani
   ========================================== */

var GENRES = [
  { id: '80ta', label: '🕺 80-ta' },
  { id: '90-00', label: '💿 90-00' },
  { id: 'jugo', label: '🎶 Jugo zabavna' },
  { id: 'narodno', label: '🪗 Narodno zabavna' },
  { id: 'slovenska', label: '<img src="https://flagcdn.com/24x18/si.png" alt="SI" style="vertical-align:middle;margin-right:4px"> Slovenska', html: true },
  { id: 'plesna', label: '💃 Plesna' },
  { id: 'moderna', label: '🎧 Moderna' },
  { id: 'rock', label: '🎸 Rock' },
  { id: 'balkan', label: '🎺 Balkan' },
];

function initMusicForm() {
  var genreGrid = document.getElementById('genreGrid');

  // Generiraj žanre
  if (genreGrid.children.length === 0) {
    GENRES.forEach(function (genre) {
      genreGrid.appendChild(createCheckbox('genre', genre.id, genre.label, genre.html));
    });
  }

  // Submit handler
  var form = document.getElementById('musicForm');
  var submitBtn = document.getElementById('musicSubmit');
  var btnText = submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn.querySelector('.btn__spinner');

  // Odstrani prejšnji listener (če se initMusicForm kliče večkrat)
  var newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  form = newForm;

  // Reattach refs
  submitBtn = document.getElementById('musicSubmit');
  btnText = submitBtn.querySelector('.btn__text');
  btnSpinner = submitBtn.querySelector('.btn__spinner');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var selectedGenres = getCheckedValues('genre');
    var lastnaZelja = document.getElementById('lastnaZelja').value.trim();

    if (selectedGenres.length === 0 && !lastnaZelja) {
      showToast('Izberi vsaj eno zvrst ali napiši željo.', 'error');
      return;
    }

    // Loading
    submitBtn.disabled = true;
    btnText.hidden = true;
    btnSpinner.hidden = false;

    var guestName = localStorage.getItem('guestName') || 'Gost';

    apiPost({
      action: 'music',
      name: guestName,
      zanri: selectedGenres,
      pesmi: [],
      lastnaZelja: lastnaZelja
    })
      .then(function (result) {
        submitBtn.disabled = false;
        btnText.hidden = false;
        btnSpinner.hidden = true;

        if (result.status === 'ok') {
          showToast('Glasbene želje shranjene! Hvala!', 'success');
          // NE skrivamo forme — uporabnik ostane na isti strani
        } else {
          showToast(result.message || 'Prišlo je do napake.', 'error');
        }
      })
      .catch(function () {
        showToast('Napaka pri pošiljanju. Poskusi znova.', 'error');
        submitBtn.disabled = false;
        btnText.hidden = false;
        btnSpinner.hidden = true;
      });
  });
}

function createCheckbox(type, id, label, isHtml) {
  var wrapper = document.createElement('label');
  wrapper.className = 'checkbox-item';

  var input = document.createElement('input');
  input.type = 'checkbox';
  input.name = type;
  input.value = id;

  var custom = document.createElement('span');
  custom.className = 'checkbox-custom';

  var text = document.createElement('span');
  text.className = 'checkbox-text';
  if (isHtml) {
    text.innerHTML = label;
  } else {
    text.textContent = label;
  }

  wrapper.appendChild(input);
  wrapper.appendChild(custom);
  wrapper.appendChild(text);

  return wrapper;
}

function getCheckedValues(name) {
  var checked = document.querySelectorAll('input[name="' + name + '"]:checked');
  var values = [];
  checked.forEach(function (el) { values.push(el.value); });
  return values;
}
