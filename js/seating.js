/* ==========================================
   SEATING.JS — Interaktivni SVG sedežni red
   Layout po skici prostora:
   - Zgoraj: notranji prostor (DJ, plesišče, foto, sladki k., kuhinja, WC, bife 1/2)
   - Notranje okrogle mize za ~20 oseb
   - Spodaj: zunanja dolga miza za 40 oseb
   ========================================== */

// ===== KONFIGURACIJA MIZ =====
// Notranje okrogle mize (20 sedežev)
var ROUND_TABLES = [
  { id: 1, label: 'Miza 1', cx: 250, cy: 350, seats: 5 },
  { id: 2, label: 'Miza 2', cx: 450, cy: 280, seats: 5 },
  { id: 3, label: 'Miza 3', cx: 650, cy: 350, seats: 5 },
  { id: 4, label: 'Miza 4', cx: 450, cy: 440, seats: 5 },
];

// Zunanja dolga miza (40 sedežev — 20 na vsaki strani)
var LONG_TABLE = {
  id: 5, label: 'Zunanja miza',
  x: 120, y: 620, width: 760, height: 60,
  seatsTop: 20,
  seatsBottom: 20
};

var TABLE_RADIUS = 48;
var SEAT_RADIUS = 16;
var SEAT_ORBIT = 82;

var occupiedSeats = [];
var selectedSeats = [];
var partyNames = [];
var currentPickIndex = 0;

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
  if (!svg) return;

  partyNames = getPartyNames();
  selectedSeats = [];
  currentPickIndex = 0;
  svg.innerHTML = '';

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
    statusEl.textContent = 'Klikni na prazen sedež, da ga rezerviraš.';
  } else if (total > 1 && chosen < total) {
    statusEl.innerHTML = '<strong>Izbira sedeža za: ' + partyNames[chosen] + '</strong> (' + (chosen + 1) + '/' + total + ')';
  } else if (chosen === total && total > 1) {
    statusEl.innerHTML = 'Vsi sedeži izbrani! Klikni <strong>"Potrdi vse sedeže"</strong> za dokončanje.';
  } else if (chosen === total && total === 1) {
    statusEl.textContent = '';
  }
}

function renderChart(svg) {
  svg.innerHTML = '';
  var svgW = 1000, svgH = 820;
  svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + svgH);

  // ---- Ozadje ----
  var defs = createSvgElement('defs');
  var pattern = createSvgElement('pattern', {
    id: 'dotPattern', x: '0', y: '0', width: '30', height: '30', patternUnits: 'userSpaceOnUse'
  });
  pattern.appendChild(createSvgElement('circle', { cx: '15', cy: '15', r: '1', fill: 'rgba(10,22,40,0.05)' }));
  defs.appendChild(pattern);
  svg.appendChild(defs);
  svg.appendChild(createSvgElement('rect', { x: 0, y: 0, width: svgW, height: svgH, fill: 'url(#dotPattern)' }));

  // ---- NOTRANJI PROSTOR (okvirno) ----
  svg.appendChild(createSvgElement('rect', {
    x: 60, y: 30, width: 880, height: 520, rx: 20,
    fill: 'none', stroke: 'rgba(10,22,40,0.1)', 'stroke-width': 1.5, 'stroke-dasharray': '8,4'
  }));
  // Label
  var indoorLabel = createSvgElement('text', {
    x: 500, y: 56, 'text-anchor': 'middle', 'font-family': "'DM Sans',sans-serif",
    'font-size': 11, fill: 'rgba(10,22,40,0.3)', 'font-weight': 600
  });
  indoorLabel.textContent = 'NOTRANJI PROSTOR';
  svg.appendChild(indoorLabel);

  // ---- DEKORATIVNI ELEMENTI ----
  // Kuhinja (levo zgoraj)
  drawZone(svg, 80, 70, 100, 60, 'Kuhinja', '🍽️');
  // WC (levo)
  drawZone(svg, 80, 150, 80, 45, 'WC', '🚻');
  // DJ + TV (zgoraj sredina)
  drawZone(svg, 380, 70, 140, 55, 'DJ + TV', '🎵');
  // Plesišče (sredina zgoraj)
  drawDanceFloor(svg, 380, 155, 140, 90);
  // Foto kotiček (desno zgoraj)
  drawZone(svg, 720, 70, 200, 100, 'Foto kotiček', '📸');
  // Sladki kotiček (desno)
  drawZone(svg, 780, 200, 140, 80, 'Sladki kotiček', '🎂');
  // Bife 1 (levo spodaj)
  drawZone(svg, 80, 440, 120, 55, 'Bife 1', '🍺');
  // Bife 2 (desno spodaj, poševno)
  drawZone(svg, 720, 440, 140, 55, 'Bife 2 + TV', '🍹');

  // ---- OKROGLE MIZE (notranjost, 20 sedežev) ----
  ROUND_TABLES.forEach(function (table) {
    drawRoundTable(svg, table);
  });

  // ---- ZUNANJA DOLGA MIZA (40 sedežev) ----
  drawLongTable(svg, LONG_TABLE);

  // ---- VHOD ----
  var vhodGroup = createSvgElement('g');
  var vhodText = createSvgElement('text', {
    x: 920, y: svgH - 20, 'text-anchor': 'middle', 'font-family': "'DM Sans',sans-serif",
    'font-size': 13, 'font-weight': 600, fill: '#D4AF37'
  });
  vhodText.textContent = '☀️ VHOD';
  vhodGroup.appendChild(vhodText);
  // Puščica gor
  var arrow = createSvgElement('path', {
    d: 'M920,780 L920,760 M915,768 L920,758 L925,768',
    stroke: '#D4AF37', fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round'
  });
  vhodGroup.appendChild(arrow);
  svg.appendChild(vhodGroup);

  // ---- ZUNAJ label ----
  var outdoorLabel = createSvgElement('text', {
    x: 500, y: 590, 'text-anchor': 'middle', 'font-family': "'DM Sans',sans-serif",
    'font-size': 11, fill: 'rgba(10,22,40,0.3)', 'font-weight': 600
  });
  outdoorLabel.textContent = 'ZUNAJ';
  svg.appendChild(outdoorLabel);
}

function drawZone(svg, x, y, w, h, label, icon) {
  svg.appendChild(createSvgElement('rect', {
    x: x, y: y, width: w, height: h, rx: 8,
    fill: 'rgba(10,22,40,0.04)', stroke: 'rgba(10,22,40,0.1)', 'stroke-width': 1
  }));
  var text = createSvgElement('text', {
    x: x + w / 2, y: y + h / 2 + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-family': "'DM Sans',sans-serif", 'font-size': 11, 'font-weight': 500, fill: 'rgba(10,22,40,0.45)'
  });
  text.textContent = icon + ' ' + label;
  svg.appendChild(text);
}

function drawDanceFloor(svg, x, y, w, h) {
  svg.appendChild(createSvgElement('rect', {
    x: x, y: y, width: w, height: h, rx: 12,
    fill: 'rgba(212,175,55,0.06)', stroke: '#D4AF37', 'stroke-width': 1.5, 'stroke-dasharray': '6,3'
  }));
  var text = createSvgElement('text', {
    x: x + w / 2, y: y + h / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-family': "'DM Sans',sans-serif", 'font-size': 13, 'font-weight': 600, fill: '#D4AF37'
  });
  text.textContent = '💃 Plesišče';
  svg.appendChild(text);
}

function drawRoundTable(svg, table) {
  var group = createSvgElement('g');

  // Miza — krog
  group.appendChild(createSvgElement('circle', {
    cx: table.cx, cy: table.cy, r: TABLE_RADIUS, class: 'table-circle'
  }));

  // Oznaka
  var label = createSvgElement('text', { x: table.cx, y: table.cy, class: 'table-label' });
  label.textContent = table.label;
  group.appendChild(label);

  // Sedeži
  for (var i = 0; i < table.seats; i++) {
    var angle = (2 * Math.PI / table.seats) * i - Math.PI / 2;
    var sx = table.cx + SEAT_ORBIT * Math.cos(angle);
    var sy = table.cy + SEAT_ORBIT * Math.sin(angle);
    drawSeat(group, table.id, i + 1, sx, sy);
  }

  svg.appendChild(group);
}

function drawLongTable(svg, table) {
  var group = createSvgElement('g');

  // Miza — pravokotnik
  group.appendChild(createSvgElement('rect', {
    x: table.x, y: table.y, width: table.width, height: table.height, rx: 10,
    class: 'table-circle'
  }));

  // Label
  var label = createSvgElement('text', {
    x: table.x + table.width / 2, y: table.y + table.height / 2,
    class: 'table-label'
  });
  label.textContent = table.label;
  group.appendChild(label);

  // Sedeži zgoraj (20)
  var topSpacing = table.width / (table.seatsTop + 1);
  for (var i = 0; i < table.seatsTop; i++) {
    var sx = table.x + topSpacing * (i + 1);
    var sy = table.y - 22;
    drawSeat(group, table.id, i + 1, sx, sy);
  }

  // Sedeži spodaj (20)
  var botSpacing = table.width / (table.seatsBottom + 1);
  for (var j = 0; j < table.seatsBottom; j++) {
    var sx2 = table.x + botSpacing * (j + 1);
    var sy2 = table.y + table.height + 22;
    drawSeat(group, table.id, table.seatsTop + j + 1, sx2, sy2);
  }

  svg.appendChild(group);
}

function drawSeat(parent, tableId, seatNum, cx, cy) {
  var seatInfo = getSeatInfo(tableId, seatNum);
  var selectedInfo = getSelectedSeatInfo(tableId, seatNum);
  var seatClass = 'seat-empty';
  var displayName = '';

  if (seatInfo) {
    seatClass = isMyParty(seatInfo.name) ? 'seat-mine' : 'seat-taken';
    displayName = truncateName(seatInfo.name);
  } else if (selectedInfo) {
    seatClass = 'seat-selected';
    displayName = truncateName(selectedInfo.name);
  }

  var seat = createSvgElement('circle', {
    cx: cx, cy: cy, r: SEAT_RADIUS, class: seatClass,
    'data-table': tableId, 'data-seat': seatNum
  });

  if (!seatInfo && !selectedInfo) {
    seat.addEventListener('click', onSeatClick);
  } else if (selectedInfo) {
    seat.addEventListener('click', onSelectedSeatClick);
  }

  parent.appendChild(seat);

  // Oznaka
  var seatLabel = createSvgElement('text', {
    x: cx, y: cy, class: 'seat-label'
  });
  seatLabel.textContent = displayName || seatNum;
  parent.appendChild(seatLabel);
}

// ===== LOGIKA =====

function isMyParty(name) {
  var currentNames = getPartyNames();
  for (var i = 0; i < currentNames.length; i++) {
    if (currentNames[i] === name) return true;
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
    // En sedež — pokaži modal
    var seatData = { table: tableId, seat: seatNum, name: partyNames[0] };
    var tableName = getTableName(tableId);

    var modal = document.getElementById('seatModal');
    var modalText = document.getElementById('seatModalText');
    modalText.textContent = partyNames[0] + ' → ' + tableName + ', Sedež ' + seatNum;
    modal.classList.add('is-visible');

    window._pendingSingleSeat = seatData;
    return;
  }

  // Multi-seat
  if (selectedSeats.length >= total) {
    showToast('Že imaš izbranih ' + total + ' sedežev.', 'error');
    return;
  }

  var personName = partyNames[selectedSeats.length];
  selectedSeats.push({ table: tableId, seat: seatNum, name: personName });

  var svg = document.getElementById('seatingSvg');
  renderChart(svg);
  updateSeatingStatus();

  var tableName2 = getTableName(tableId);
  showToast(personName + ' → ' + tableName2 + ', Sedež ' + seatNum, 'success');

  if (selectedSeats.length === total) {
    showConfirmAllButton();
  }
}

function getTableName(tableId) {
  for (var i = 0; i < ROUND_TABLES.length; i++) {
    if (ROUND_TABLES[i].id === tableId) return ROUND_TABLES[i].label;
  }
  if (LONG_TABLE.id === tableId) return LONG_TABLE.label;
  return 'Miza ' + tableId;
}

function onSelectedSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));

  var removeIndex = -1;
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tableId && selectedSeats[i].seat == seatNum) {
      removeIndex = i;
      break;
    }
  }

  if (removeIndex >= 0) {
    var removedName = selectedSeats[removeIndex].name;
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

  var summary = document.createElement('div');
  summary.style.marginBottom = '1rem';
  summary.style.fontSize = '0.95rem';
  summary.style.color = '#0A1628';
  var html = '<strong>Izbrani sedeži:</strong><br>';
  selectedSeats.forEach(function (s) {
    html += truncateName(s.name) + ' → ' + getTableName(s.table) + ', Sedež ' + s.seat + '<br>';
  });
  summary.innerHTML = html;
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
  if (btn) { btn.disabled = true; btn.textContent = 'Rezerviram...'; }

  var promises = selectedSeats.map(function (s) {
    return apiPost({ action: 'seat', name: s.name, table: s.table, seat: s.seat });
  });

  Promise.all(promises)
    .then(function (results) {
      var allOk = results.every(function (r) { return r.status === 'ok'; });
      if (allOk) {
        partyNames = getPartyNames();
        selectedSeats.forEach(function (s) {
          occupiedSeats.push({ name: s.name, table: s.table, seat: s.seat });
        });
        selectedSeats = [];
        hideConfirmAllButton();
        renderChart(document.getElementById('seatingSvg'));
        showToast('Vsi sedeži uspešno rezervirani!', 'success');
        if (typeof celebrateConfetti === 'function') celebrateConfetti();
      } else {
        showToast('Nekateri sedeži so že zasedeni. Osvežujem...', 'error');
        selectedSeats = [];
        hideConfirmAllButton();
        loadOccupiedSeats().then(function () {
          renderChart(document.getElementById('seatingSvg'));
          updateSeatingStatus();
        });
      }
    })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = 'Potrdi vse sedeže'; }
      showToast('Napaka pri rezervaciji.', 'error');
    });
}

// ===== MODAL (enojni sedež) =====
document.getElementById('seatConfirm').addEventListener('click', function () {
  var seatData = window._pendingSingleSeat;
  if (!seatData) return;

  var modal = document.getElementById('seatModal');
  var confirmBtn = document.getElementById('seatConfirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Rezerviram...';

  apiPost({ action: 'seat', name: seatData.name, table: seatData.table, seat: seatData.seat })
    .then(function (result) {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';

      if (result.status === 'ok') {
        partyNames = getPartyNames();
        occupiedSeats.push({ name: seatData.name, table: seatData.table, seat: seatData.seat });
        renderChart(document.getElementById('seatingSvg'));
        showToast('Sedež uspešno rezerviran!', 'success');
        if (typeof celebrateConfetti === 'function') celebrateConfetti();
      } else {
        showToast(result.message || 'Sedež je že zaseden.', 'error');
        loadOccupiedSeats().then(function () {
          renderChart(document.getElementById('seatingSvg'));
        });
      }
      window._pendingSingleSeat = null;
    })
    .catch(function () {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';
      showToast('Napaka pri rezervaciji.', 'error');
      window._pendingSingleSeat = null;
    });
});

document.getElementById('seatCancel').addEventListener('click', function () {
  document.getElementById('seatModal').classList.remove('is-visible');
  window._pendingSingleSeat = null;
});

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
