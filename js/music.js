/* ==========================================
   MUSIC.JS — Izbira glasbe
   ========================================== */

var GENRES = [
  { id: 'pop', label: '🎵 Pop' },
  { id: 'rock', label: '🎸 Rock' },
  { id: 'narodno', label: '🪗 Narodno' },
  { id: 'electronic', label: '🎧 Electronic' },
  { id: 'hiphop', label: '🎤 Hip-Hop' },
  { id: 'jazz', label: '🎷 Jazz' },
  { id: 'retro', label: '🕺 Retro 80s/90s' },
  { id: 'latino', label: '💃 Latino' },
];

var SONGS = [
  { id: 'song1', label: 'Queen — Bohemian Rhapsody' },
  { id: 'song2', label: 'ABBA — Dancing Queen' },
  { id: 'song3', label: 'Avseniki — Na Golici' },
  { id: 'song4', label: 'Siddharta — Ena' },
  { id: 'song5', label: 'Magnifico — Hir Aj Kam, Hir Aj Go' },
  { id: 'song6', label: 'Daft Punk — Get Lucky' },
  { id: 'song7', label: 'Mark Ronson ft. Bruno Mars — Uptown Funk' },
  { id: 'song8', label: 'Bee Gees — Stayin\' Alive' },
  { id: 'song9', label: 'Journey — Don\'t Stop Believin\'' },
  { id: 'song10', label: 'Shakira — Waka Waka' },
  { id: 'song11', label: 'Luis Fonsi — Despacito' },
  { id: 'song12', label: 'Adi Smolar — Gremo mi po svoji poti' },
];

function initMusicForm() {
  var genreGrid = document.getElementById('genreGrid');
  var songGrid = document.getElementById('songGrid');

  // Generiraj žanre
  if (genreGrid.children.length === 0) {
    GENRES.forEach(function (genre) {
      genreGrid.appendChild(createCheckbox('genre', genre.id, genre.label));
    });
  }

  // Generiraj pesmi
  if (songGrid.children.length === 0) {
    SONGS.forEach(function (song) {
      songGrid.appendChild(createCheckbox('song', song.id, song.label));
    });
  }

  // Submit handler
  var form = document.getElementById('musicForm');
  var submitBtn = document.getElementById('musicSubmit');
  var btnText = submitBtn.querySelector('.btn__text');
  var btnSpinner = submitBtn.querySelector('.btn__spinner');
  var successEl = document.getElementById('musicSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var selectedGenres = getCheckedValues('genre');
    var selectedSongs = getCheckedValues('song');
    var lastnaZelja = document.getElementById('lastnaZelja').value.trim();

    if (selectedGenres.length === 0 && selectedSongs.length === 0 && !lastnaZelja) {
      showToast('Izberi vsaj en žanr, pesem ali napiši željo.', 'error');
      return;
    }

    // Loading
    submitBtn.disabled = true;
    btnText.hidden = true;
    btnSpinner.hidden = false;

    var guestName = sessionStorage.getItem('guestName') || 'Gost';

    apiPost({
      action: 'music',
      name: guestName,
      zanri: selectedGenres,
      pesmi: selectedSongs,
      lastnaZelja: lastnaZelja
    })
      .then(function (result) {
        if (result.status === 'ok') {
          form.hidden = true;
          successEl.hidden = false;
          showToast('Glasbene želje shranjene!', 'success');
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
}

function createCheckbox(type, id, label) {
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
  text.textContent = label;

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
