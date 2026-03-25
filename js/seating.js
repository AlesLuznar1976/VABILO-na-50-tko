/* ==========================================
   SEATING.JS — Interaktivni SVG sedežni red
   Digitalizacija skice prostora:

   NOTRANJI PROSTOR (zgoraj):
   ┌──────────────────────────────────┐
   │ [X]  │ WC │  DJ+TV  │  FOTO     │
   │      │    │         │           │
   │KUHNA │  PLESIŠČE   │ SLADKI K. │
   │      │    ·20·     │           │
   │BIFE1 │    sedeži   │  BIFE2+TV │
   └──────────────────────────────────┘

   ZUNAJ (spodaj):
     ○○○○○○○○○○○○○○○○○○○○
     ┌────── 40 ────────┐
     └──────────────────┘
     ○○○○○○○○○○○○○○○○○○○○
                      ☀ VHOD
   ========================================== */

// ===== SVG DIMENZIJE =====
var SVG_W = 900, SVG_H = 750;

// ===== NOTRANJE MIZE (5 okroglih miz za 20 oseb skupaj) =====
// Razporejene v notranjem prostoru med plesišče, kuhinja, foto...
var ROUND_TABLES = [
  { id: 1, label: 'Miza 1', cx: 200, cy: 280, seats: 4 },
  { id: 2, label: 'Miza 2', cx: 350, cy: 340, seats: 4 },
  { id: 3, label: 'Miza 3', cx: 500, cy: 280, seats: 4 },
  { id: 4, label: 'Miza 4', cx: 350, cy: 210, seats: 4 },
  { id: 5, label: 'Miza 5', cx: 200, cy: 400, seats: 4 },
];

// ===== ZUNANJA DOLGA MIZA (40 sedežev) =====
var LONG_TABLE = {
  id: 6, label: 'Zunanja miza',
  x: 70, y: 560, width: 680, height: 50,
  seatsTop: 20,
  seatsBottom: 20
};

var TABLE_RADIUS = 38;
var SEAT_RADIUS = 14;
var SEAT_ORBIT = 65;

var occupiedSeats = [];
var selectedSeats = [];
var partyNames = [];

function getPartyNames() {
  try {
    var stored = localStorage.getItem('partyNames');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  var guestName = localStorage.getItem('guestName') || 'Gost';
  return [guestName];
}

function initSeatingChart() {
  var svg = document.getElementById('seatingSvg');
  if (!svg) return;

  partyNames = getPartyNames();
  selectedSeats = [];
  svg.innerHTML = '';

  loadOccupiedSeats().then(function () {
    renderChart(svg);
    updateSeatingStatus();
  });
}

function loadOccupiedSeats() {
  return apiGet({ action: 'getSeating' })
    .then(function (result) {
      if (result.status === 'ok') occupiedSeats = result.seats || [];
    })
    .catch(function () { occupiedSeats = []; });
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
    statusEl.innerHTML = 'Vsi sedeži izbrani! Klikni <strong>"Potrdi vse sedeže"</strong>.';
  } else if (chosen === total && total === 1) {
    statusEl.textContent = '';
  }
}

// ===== GLAVNI RENDER =====
function renderChart(svg) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 ' + SVG_W + ' ' + SVG_H);

  // Pikčast vzorec
  var defs = createSvgElement('defs');
  var pat = createSvgElement('pattern', { id: 'dots', x: 0, y: 0, width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
  pat.appendChild(createSvgElement('circle', { cx: 12, cy: 12, r: 1, fill: 'rgba(10,22,40,0.04)' }));
  defs.appendChild(pat);
  svg.appendChild(defs);
  svg.appendChild(createSvgElement('rect', { x: 0, y: 0, width: SVG_W, height: SVG_H, fill: 'url(#dots)' }));

  // ========== NOTRANJI PROSTOR ==========
  drawRoom(svg);

  // ========== OKROGLE MIZE (20 sedežev) ==========
  ROUND_TABLES.forEach(function (t) { drawRoundTable(svg, t); });

  // ========== ZUNANJA MIZA (40 sedežev) ==========
  // Oznaka "ZUNAJ"
  addText(svg, SVG_W / 2, 520, 'ZUNAJ', 11, 'rgba(10,22,40,0.3)', 600);
  drawLongTable(svg, LONG_TABLE);

  // ========== VHOD ==========
  addText(svg, 810, 640, '☀️ VHOD', 13, '#D4AF37', 600);
  svg.appendChild(createSvgElement('line', {
    x1: 810, y1: 618, x2: 810, y2: 600,
    stroke: '#D4AF37', 'stroke-width': 2, 'marker-end': 'none'
  }));
  // Puščica gor
  var arrow = createSvgElement('path', {
    d: 'M805,608 L810,596 L815,608', fill: 'none', stroke: '#D4AF37', 'stroke-width': 2
  });
  svg.appendChild(arrow);
}

// ===== NOTRANJI PROSTOR (layout po skici) =====
function drawRoom(svg) {
  var rx = 30, ry = 30, rw = 660, rh = 430;

  // Okvir notranjega prostora
  svg.appendChild(createSvgElement('rect', {
    x: rx, y: ry, width: rw, height: rh, rx: 12,
    fill: 'rgba(245,240,232,0.5)', stroke: 'rgba(10,22,40,0.12)', 'stroke-width': 1.5
  }));
  addText(svg, rx + rw / 2, ry + 16, 'NOTRANJI PROSTOR', 10, 'rgba(10,22,40,0.25)', 600);

  // -- Levo zgoraj: prečrtan prostor (neuporaben) --
  svg.appendChild(createSvgElement('rect', {
    x: 40, y: 45, width: 80, height: 80, rx: 6,
    fill: 'rgba(10,22,40,0.03)', stroke: 'rgba(10,22,40,0.08)', 'stroke-width': 1
  }));
  // X čez
  svg.appendChild(createSvgElement('line', { x1: 42, y1: 47, x2: 118, y2: 123, stroke: 'rgba(10,22,40,0.12)', 'stroke-width': 1 }));
  svg.appendChild(createSvgElement('line', { x1: 118, y1: 47, x2: 42, y2: 123, stroke: 'rgba(10,22,40,0.12)', 'stroke-width': 1 }));

  // -- WC --
  drawZone(svg, 40, 140, 80, 40, '🚻 WC');

  // -- KUHINJA (levo, vertikalno) --
  drawZone(svg, 40, 195, 80, 120, '🍽️ Kuhinja');

  // -- DJ + TV (zgoraj sredina) --
  drawZone(svg, 280, 45, 160, 50, '🎵 DJ + TV');

  // -- PLESIŠČE (sredina) --
  drawDanceFloor(svg, 260, 105, 200, 80);

  // -- FOTO kotiček (desno zgoraj) --
  drawZone(svg, 560, 45, 120, 120, '📸 FOTO');

  // -- SLADKI KOTIČEK (desno) --
  drawZone(svg, 580, 190, 100, 90, '🎂 Sladki k.');

  // -- BIFE 1 (levo spodaj) --
  drawZone(svg, 40, 390, 110, 55, '🍺 Bife 1');

  // -- BIFE 2 + TV (desno spodaj, poševno) --
  var bifeG = createSvgElement('g');
  // Poševni pravokotnik
  var bife2 = createSvgElement('rect', {
    x: 520, y: 380, width: 150, height: 50, rx: 6,
    fill: 'rgba(10,22,40,0.03)', stroke: 'rgba(10,22,40,0.1)', 'stroke-width': 1,
    transform: 'rotate(-15 595 405)'
  });
  bifeG.appendChild(bife2);
  var bife2text = createSvgElement('text', {
    x: 595, y: 408, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-family': "'DM Sans',sans-serif", 'font-size': 11, 'font-weight': 500,
    fill: 'rgba(10,22,40,0.45)', transform: 'rotate(-15 595 408)'
  });
  bife2text.textContent = '🍹 Bife 2 + TV';
  bifeG.appendChild(bife2text);
  svg.appendChild(bifeG);
}

function drawZone(svg, x, y, w, h, label) {
  svg.appendChild(createSvgElement('rect', {
    x: x, y: y, width: w, height: h, rx: 6,
    fill: 'rgba(10,22,40,0.03)', stroke: 'rgba(10,22,40,0.1)', 'stroke-width': 1
  }));
  addText(svg, x + w / 2, y + h / 2, label, 11, 'rgba(10,22,40,0.45)', 500);
}

function drawDanceFloor(svg, x, y, w, h) {
  svg.appendChild(createSvgElement('rect', {
    x: x, y: y, width: w, height: h, rx: 10,
    fill: 'rgba(212,175,55,0.06)', stroke: '#D4AF37', 'stroke-width': 1.5, 'stroke-dasharray': '6,3'
  }));
  addText(svg, x + w / 2, y + h / 2, '💃 Plesišče', 13, '#D4AF37', 600);
}

// ===== OKROGLA MIZA =====
function drawRoundTable(svg, table) {
  var g = createSvgElement('g');

  g.appendChild(createSvgElement('circle', {
    cx: table.cx, cy: table.cy, r: TABLE_RADIUS, class: 'table-circle'
  }));

  var lbl = createSvgElement('text', { x: table.cx, y: table.cy, class: 'table-label' });
  lbl.textContent = table.label;
  g.appendChild(lbl);

  for (var i = 0; i < table.seats; i++) {
    var angle = (2 * Math.PI / table.seats) * i - Math.PI / 2;
    var sx = table.cx + SEAT_ORBIT * Math.cos(angle);
    var sy = table.cy + SEAT_ORBIT * Math.sin(angle);
    drawSeat(g, table.id, i + 1, sx, sy);
  }

  svg.appendChild(g);
}

// ===== DOLGA MIZA =====
function drawLongTable(svg, table) {
  var g = createSvgElement('g');

  g.appendChild(createSvgElement('rect', {
    x: table.x, y: table.y, width: table.width, height: table.height, rx: 8,
    class: 'table-circle'
  }));

  var lbl = createSvgElement('text', {
    x: table.x + table.width / 2, y: table.y + table.height / 2, class: 'table-label'
  });
  lbl.textContent = table.label;
  g.appendChild(lbl);

  // Sedeži zgoraj
  var topSp = table.width / (table.seatsTop + 1);
  for (var i = 0; i < table.seatsTop; i++) {
    drawSeat(g, table.id, i + 1, table.x + topSp * (i + 1), table.y - 20);
  }

  // Sedeži spodaj
  var botSp = table.width / (table.seatsBottom + 1);
  for (var j = 0; j < table.seatsBottom; j++) {
    drawSeat(g, table.id, table.seatsTop + j + 1, table.x + botSp * (j + 1), table.y + table.height + 20);
  }

  svg.appendChild(g);
}

// ===== SEDEŽ =====
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

  var label = createSvgElement('text', { x: cx, y: cy, class: 'seat-label' });
  label.textContent = displayName || seatNum;
  parent.appendChild(label);
}

// ===== POMOŽNE FUNKCIJE =====
function addText(svg, x, y, text, size, color, weight) {
  var t = createSvgElement('text', {
    x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-family': "'DM Sans',sans-serif", 'font-size': size, 'font-weight': weight, fill: color
  });
  t.textContent = text;
  svg.appendChild(t);
}

function isMyParty(name) {
  var names = getPartyNames();
  for (var i = 0; i < names.length; i++) { if (names[i] === name) return true; }
  return false;
}

function getSeatInfo(tableId, seatNum) {
  for (var i = 0; i < occupiedSeats.length; i++) {
    if (occupiedSeats[i].table == tableId && occupiedSeats[i].seat == seatNum) return occupiedSeats[i];
  }
  return null;
}

function getSelectedSeatInfo(tableId, seatNum) {
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tableId && selectedSeats[i].seat == seatNum) return selectedSeats[i];
  }
  return null;
}

function truncateName(name) {
  if (!name) return '';
  var parts = name.trim().split(' ');
  if (parts.length > 1) return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  return name;
}

function getTableName(tableId) {
  for (var i = 0; i < ROUND_TABLES.length; i++) {
    if (ROUND_TABLES[i].id === tableId) return ROUND_TABLES[i].label;
  }
  if (LONG_TABLE.id === tableId) return LONG_TABLE.label;
  return 'Miza ' + tableId;
}

// ===== KLIK LOGIKA =====
function onSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));
  var total = partyNames.length;

  if (total <= 1) {
    var seatData = { table: tableId, seat: seatNum, name: partyNames[0] };
    var modal = document.getElementById('seatModal');
    var modalText = document.getElementById('seatModalText');
    modalText.textContent = partyNames[0] + ' → ' + getTableName(tableId) + ', Sedež ' + seatNum;
    modal.classList.add('is-visible');
    window._pendingSingleSeat = seatData;
    return;
  }

  if (selectedSeats.length >= total) {
    showToast('Že imaš izbranih ' + total + ' sedežev.', 'error');
    return;
  }

  var personName = partyNames[selectedSeats.length];
  selectedSeats.push({ table: tableId, seat: seatNum, name: personName });
  renderChart(document.getElementById('seatingSvg'));
  updateSeatingStatus();
  showToast(personName + ' → ' + getTableName(tableId) + ', Sedež ' + seatNum, 'success');

  if (selectedSeats.length === total) showConfirmAllButton();
}

function onSelectedSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));
  var idx = -1;
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tableId && selectedSeats[i].seat == seatNum) { idx = i; break; }
  }
  if (idx >= 0) {
    var name = selectedSeats[idx].name;
    selectedSeats.splice(idx);
    renderChart(document.getElementById('seatingSvg'));
    updateSeatingStatus();
    hideConfirmAllButton();
    showToast('Sedež za ' + name + ' odstranjen.', 'error');
  }
}

function showConfirmAllButton() {
  if (document.getElementById('confirmAllSeats')) return;
  var container = document.getElementById('seatingChart');
  if (!container) return;

  var wrapper = document.createElement('div');
  wrapper.style.textAlign = 'center';
  wrapper.style.marginTop = '1.5rem';
  wrapper.id = 'confirmAllWrapper';

  var summary = document.createElement('div');
  summary.style.cssText = 'margin-bottom:1rem;font-size:0.95rem;color:#0A1628';
  var html = '<strong>Izbrani sedeži:</strong><br>';
  selectedSeats.forEach(function (s) {
    html += truncateName(s.name) + ' → ' + getTableName(s.table) + ', Sedež ' + s.seat + '<br>';
  });
  summary.innerHTML = html;
  wrapper.appendChild(summary);

  var btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.id = 'confirmAllSeats';
  btn.textContent = 'Potrdi vse sedeže';
  btn.addEventListener('click', confirmAllSeats);
  wrapper.appendChild(btn);
  container.parentNode.insertBefore(wrapper, container.nextSibling);
}

function hideConfirmAllButton() {
  var w = document.getElementById('confirmAllWrapper');
  if (w) w.remove();
}

function confirmAllSeats() {
  var btn = document.getElementById('confirmAllSeats');
  if (btn) { btn.disabled = true; btn.textContent = 'Rezerviram...'; }

  Promise.all(selectedSeats.map(function (s) {
    return apiPost({ action: 'seat', name: s.name, table: s.table, seat: s.seat });
  }))
    .then(function (results) {
      if (results.every(function (r) { return r.status === 'ok'; })) {
        partyNames = getPartyNames();
        selectedSeats.forEach(function (s) { occupiedSeats.push(s); });
        selectedSeats = [];
        hideConfirmAllButton();
        renderChart(document.getElementById('seatingSvg'));
        showToast('Vsi sedeži uspešno rezervirani!', 'success');
        if (typeof celebrateConfetti === 'function') celebrateConfetti();
      } else {
        showToast('Nekateri sedeži so že zasedeni.', 'error');
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

// ===== MODAL =====
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
        occupiedSeats.push(seatData);
        renderChart(document.getElementById('seatingSvg'));
        showToast('Sedež uspešno rezerviran!', 'success');
        if (typeof celebrateConfetti === 'function') celebrateConfetti();
      } else {
        showToast(result.message || 'Sedež je že zaseden.', 'error');
        loadOccupiedSeats().then(function () { renderChart(document.getElementById('seatingSvg')); });
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

// ===== SVG HELPER =====
function createSvgElement(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
  return el;
}
