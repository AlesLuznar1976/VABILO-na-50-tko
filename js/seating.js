/* ==========================================
   SEATING.JS — Interaktivni SVG sedežni red
   Podpora za izbiro sedežev za več oseb
   ========================================== */

// Konfiguracija miz — prilagodi pozicije in število sedežev
var TABLES = [
  { id: 1, label: 'Miza 1', cx: 160, cy: 160, seats: 6 },
  { id: 2, label: 'Miza 2', cx: 420, cy: 140, seats: 6 },
  { id: 3, label: 'Miza 3', cx: 680, cy: 160, seats: 6 },
  { id: 4, label: 'Miza 4', cx: 160, cy: 420, seats: 5 },
  { id: 5, label: 'Miza 5', cx: 420, cy: 400, seats: 6 },
  { id: 6, label: 'Miza 6', cx: 680, cy: 420, seats: 5 },
  { id: 7, label: 'Miza 7', cx: 300, cy: 600, seats: 6 },
  { id: 8, label: 'Miza 8', cx: 580, cy: 600, seats: 5 },
];

var TABLE_RADIUS = 55;
var SEAT_RADIUS = 18;
var SEAT_ORBIT = 95;

var occupiedSeats = [];
var selectedSeats = []; // Array za multi-seat: [{table, seat, name}, ...]
var partyNames = [];    // Imena oseb v skupini
var currentPickIndex = 0; // Katera oseba trenutno izbira sedež

function getPartyNames() {
  try {
    var stored = localStorage.getItem('partyNames');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  var guestName = localStorage.getItem('guestName') || 'Gost';
  return [guestName];
}

function getSeatsNeeded() {
  return getPartyNames().length;
}

function initSeatingChart() {
  var svg = document.getElementById('seatingSvg');
  if (!svg || svg.childNodes.length > 0) return;

  partyNames = getPartyNames();
  selectedSeats = [];
  currentPickIndex = 0;

  // Naloži zasedene sedeže
  loadOccupiedSeats().then(function () {
    renderChart(svg);
    updateSeatingStatus();
  });
}

function loadOccupiedSeats() {
  return apiGet({ action: 'getSeating' })
    .then(function (result) {
      if (result.status === 'ok') {
        occupiedSeats = result.seats || [];
      }
    })
    .catch(function () {
      occupiedSeats = [];
    });
}

function updateSeatingStatus() {
  var statusEl = document.getElementById('seatingStatus');
  if (!statusEl) return;

  var total = partyNames.length;
  var chosen = selectedSeats.length;

  if (total <= 1 && chosen === 0) {
    statusEl.textContent = 'Klikni na zelen sedež, da ga rezerviraš.';
  } else if (total > 1 && chosen < total) {
    statusEl.innerHTML = '<strong>Izbira sedeža za: ' + partyNames[chosen] + '</strong> (' + (chosen + 1) + '/' + total + ')';
  } else if (chosen === total && total > 1) {
    statusEl.innerHTML = 'Vsi sedeži izbrani! Klikni <strong>"Potrdi vse sedeže"</strong> za dokončanje.';
  } else if (chosen === total && total === 1) {
    statusEl.textContent = '';
  }
}

function renderChart(svg) {
  // Počisti
  svg.innerHTML = '';

  // Ozadje — dekorativna pikčasta mreža
  var defs = createSvgElement('defs');
  var pattern = createSvgElement('pattern', {
    id: 'dotPattern', x: '0', y: '0', width: '30', height: '30', patternUnits: 'userSpaceOnUse'
  });
  var dot = createSvgElement('circle', {
    cx: '15', cy: '15', r: '1.5', fill: 'rgba(10, 22, 40, 0.06)'
  });
  pattern.appendChild(dot);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  var bgRect = createSvgElement('rect', {
    x: '0', y: '0', width: '1000', height: '700',
    fill: 'url(#dotPattern)'
  });
  svg.appendChild(bgRect);

  // Naslov
  var title = createSvgElement('text', {
    x: '500', y: '50', 'text-anchor': 'middle', 'font-family': "'Baloo 2', cursive",
    'font-size': '22', 'font-weight': '700', fill: '#0A1628'
  });
  title.textContent = 'Izberi svoj sedež';
  svg.appendChild(title);

  // DJ podij (dekorativno)
  var djGroup = createSvgElement('g');
  var djRect = createSvgElement('rect', {
    x: '830', y: '260', width: '140', height: '60', rx: '10',
    fill: '#0A1628', opacity: '0.15', stroke: '#D4AF37', 'stroke-width': '2', 'stroke-dasharray': '5,5'
  });
  djGroup.appendChild(djRect);
  var djText = createSvgElement('text', {
    x: '900', y: '296', 'text-anchor': 'middle', 'font-family': "'DM Sans', sans-serif",
    'font-size': '13', 'font-weight': '600', fill: '#D4AF37'
  });
  djText.textContent = '🎵 DJ';
  djGroup.appendChild(djText);
  svg.appendChild(djGroup);

  // Plesišče
  var danceGroup = createSvgElement('g');
  var danceRect = createSvgElement('rect', {
    x: '830', y: '400', width: '140', height: '140', rx: '15',
    fill: '#D4AF37', opacity: '0.08', stroke: '#D4AF37', 'stroke-width': '2', 'stroke-dasharray': '8,4'
  });
  danceGroup.appendChild(danceRect);
  var danceText = createSvgElement('text', {
    x: '900', y: '476', 'text-anchor': 'middle', 'font-family': "'DM Sans', sans-serif",
    'font-size': '13', 'font-weight': '600', fill: '#8B7320'
  });
  danceText.textContent = '💃 Plesišče';
  danceGroup.appendChild(danceText);
  svg.appendChild(danceGroup);

  // Riši mize
  var guestName = localStorage.getItem('guestName') || '';

  TABLES.forEach(function (table) {
    var group = createSvgElement('g');

    // Miza — krog
    var tableCircle = createSvgElement('circle', {
      cx: table.cx, cy: table.cy, r: TABLE_RADIUS,
      class: 'table-circle'
    });
    group.appendChild(tableCircle);

    // Oznaka mize
    var label = createSvgElement('text', {
      x: table.cx, y: table.cy, class: 'table-label'
    });
    label.textContent = table.label;
    group.appendChild(label);

    // Sedeži
    for (var i = 0; i < table.seats; i++) {
      var angle = (2 * Math.PI / table.seats) * i - Math.PI / 2;
      var seatCx = table.cx + SEAT_ORBIT * Math.cos(angle);
      var seatCy = table.cy + SEAT_ORBIT * Math.sin(angle);

      var seatInfo = getSeatInfo(table.id, i + 1);
      var selectedInfo = getSelectedSeatInfo(table.id, i + 1);
      var seatClass = 'seat-empty';
      var displayName = i + 1;

      if (seatInfo) {
        // Že potrjeno na strežniku
        seatClass = isMyParty(seatInfo.name) ? 'seat-mine' : 'seat-taken';
        displayName = truncateName(seatInfo.name);
      } else if (selectedInfo) {
        // Lokalno izbrano, še ne potrjeno
        seatClass = 'seat-selected';
        displayName = truncateName(selectedInfo.name);
      }

      var seat = createSvgElement('circle', {
        cx: seatCx, cy: seatCy, r: SEAT_RADIUS,
        class: seatClass,
        'data-table': table.id,
        'data-seat': i + 1
      });

      if (!seatInfo && !selectedInfo) {
        seat.addEventListener('click', onSeatClick);
      } else if (selectedInfo) {
        // Omogoči deselect za lokalno izbrane
        seat.addEventListener('click', onSelectedSeatClick);
      }

      group.appendChild(seat);

      // Oznaka sedeža
      var seatLabel = createSvgElement('text', {
        x: seatCx, y: seatCy, class: 'seat-label'
      });
      seatLabel.textContent = displayName;
      group.appendChild(seatLabel);
    }

    svg.appendChild(group);
  });
}

function isMyParty(name) {
  for (var i = 0; i < partyNames.length; i++) {
    if (partyNames[i] === name) return true;
  }
  return false;
}

function getSeatInfo(tableId, seatNum) {
  for (var i = 0; i < occupiedSeats.length; i++) {
    if (occupiedSeats[i].table == tableId && occupiedSeats[i].seat == seatNum) {
      return occupiedSeats[i];
    }
  }
  return null;
}

function getSelectedSeatInfo(tableId, seatNum) {
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tableId && selectedSeats[i].seat == seatNum) {
      return selectedSeats[i];
    }
  }
  return null;
}

function truncateName(name) {
  if (!name) return '';
  var parts = name.trim().split(' ');
  if (parts.length > 1) {
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }
  return name;
}

function onSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));
  var total = partyNames.length;

  if (total <= 1) {
    // Klasični način — en sedež, takoj potrdi
    var seatData = { table: tableId, seat: seatNum, name: partyNames[0] };

    var modal = document.getElementById('seatModal');
    var modalText = document.getElementById('seatModalText');
    modalText.textContent = 'Želiš sedeti na Mizi ' + tableId + ', Sedež ' + seatNum + '?';
    modal.classList.add('is-visible');

    // Shrani za potrditev
    window._pendingSingleSeat = seatData;
    return;
  }

  // Multi-seat način
  if (selectedSeats.length >= total) {
    showToast('Že imaš izbranih ' + total + ' sedežev. Klikni na oranžen sedež za deselect.', 'error');
    return;
  }

  var personName = partyNames[selectedSeats.length];
  selectedSeats.push({ table: tableId, seat: seatNum, name: personName });

  var svg = document.getElementById('seatingSvg');
  renderChart(svg);
  updateSeatingStatus();

  showToast('Sedež za ' + personName + ' izbran! (Miza ' + tableId + ', Sedež ' + seatNum + ')', 'success');

  // Ko so vsi sedeži izbrani, pokaži potrditveni gumb
  if (selectedSeats.length === total) {
    showConfirmAllButton();
  }
}

function onSelectedSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));

  // Odstrani ta sedež in vse kasnejše (vrstni red je važen)
  var removeIndex = -1;
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tableId && selectedSeats[i].seat == seatNum) {
      removeIndex = i;
      break;
    }
  }

  if (removeIndex >= 0) {
    var removedName = selectedSeats[removeIndex].name;
    // Odstrani od tega indeksa naprej (ker je vrstni red pomemben)
    selectedSeats.splice(removeIndex);

    var svg = document.getElementById('seatingSvg');
    renderChart(svg);
    updateSeatingStatus();
    hideConfirmAllButton();

    showToast('Sedež za ' + removedName + ' odstranjen.', 'error');
  }
}

function showConfirmAllButton() {
  var existing = document.getElementById('confirmAllSeats');
  if (existing) return;

  var container = document.getElementById('seatingChart');
  if (!container) return;

  var wrapper = document.createElement('div');
  wrapper.style.textAlign = 'center';
  wrapper.style.marginTop = '1.5rem';
  wrapper.id = 'confirmAllWrapper';

  // Povzetek izbire
  var summary = document.createElement('div');
  summary.style.marginBottom = '1rem';
  summary.style.fontSize = '0.95rem';
  summary.style.color = '#0A1628';
  var summaryHtml = '<strong>Izbrani sedeži:</strong><br>';
  selectedSeats.forEach(function (s) {
    summaryHtml += s.name + ' → Miza ' + s.table + ', Sedež ' + s.seat + '<br>';
  });
  summary.innerHTML = summaryHtml;
  wrapper.appendChild(summary);

  var btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.id = 'confirmAllSeats';
  btn.innerHTML = '<span>Potrdi vse sedeže</span>';
  btn.addEventListener('click', confirmAllSeats);
  wrapper.appendChild(btn);

  container.parentNode.insertBefore(wrapper, container.nextSibling);
}

function hideConfirmAllButton() {
  var wrapper = document.getElementById('confirmAllWrapper');
  if (wrapper) wrapper.remove();
}

function confirmAllSeats() {
  var btn = document.getElementById('confirmAllSeats');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Rezerviram...';
  }

  // Pošlji vse sedeže naenkrat
  var promises = selectedSeats.map(function (s) {
    return apiPost({
      action: 'seat',
      name: s.name,
      table: s.table,
      seat: s.seat
    });
  });

  Promise.all(promises)
    .then(function (results) {
      var allOk = results.every(function (r) { return r.status === 'ok'; });

      if (allOk) {
        // Dodaj vse v lokalni seznam
        selectedSeats.forEach(function (s) {
          occupiedSeats.push({ name: s.name, table: s.table, seat: s.seat });
        });

        selectedSeats = [];
        hideConfirmAllButton();

        var svg = document.getElementById('seatingSvg');
        renderChart(svg);

        showToast('Vsi sedeži uspešno rezervirani!', 'success');

        if (typeof celebrateConfetti === 'function') {
          celebrateConfetti();
        }
      } else {
        showToast('Nekateri sedeži so že zasedeni. Osvežujem...', 'error');
        selectedSeats = [];
        hideConfirmAllButton();
        loadOccupiedSeats().then(function () {
          var svg = document.getElementById('seatingSvg');
          renderChart(svg);
          updateSeatingStatus();
        });
      }
    })
    .catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Potrdi vse sedeže';
      }
      showToast('Napaka pri rezervaciji. Poskusi znova.', 'error');
    });
}

// Modal gumbi — za enojno izbiro
document.getElementById('seatConfirm').addEventListener('click', function () {
  var seatData = window._pendingSingleSeat;
  if (!seatData) return;

  var modal = document.getElementById('seatModal');
  var confirmBtn = document.getElementById('seatConfirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Rezerviram...';

  apiPost({
    action: 'seat',
    name: seatData.name,
    table: seatData.table,
    seat: seatData.seat
  })
    .then(function (result) {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';

      if (result.status === 'ok') {
        occupiedSeats.push({
          name: seatData.name,
          table: seatData.table,
          seat: seatData.seat
        });

        var svg = document.getElementById('seatingSvg');
        renderChart(svg);

        showToast('Sedež uspešno rezerviran!', 'success');

        if (typeof celebrateConfetti === 'function') {
          celebrateConfetti();
        }
      } else {
        showToast(result.message || 'Sedež je že zaseden.', 'error');
        loadOccupiedSeats().then(function () {
          var svg = document.getElementById('seatingSvg');
          renderChart(svg);
        });
      }

      window._pendingSingleSeat = null;
    })
    .catch(function () {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';
      showToast('Napaka pri rezervaciji. Poskusi znova.', 'error');
      window._pendingSingleSeat = null;
    });
});

document.getElementById('seatCancel').addEventListener('click', function () {
  document.getElementById('seatModal').classList.remove('is-visible');
  window._pendingSingleSeat = null;
});

// Zapri modal ob kliku na backdrop
document.querySelector('#seatModal .modal__backdrop').addEventListener('click', function () {
  document.getElementById('seatModal').classList.remove('is-visible');
  window._pendingSingleSeat = null;
});

// ===== SVG Helper =====
function createSvgElement(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
  }
  return el;
}
