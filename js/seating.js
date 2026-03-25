/* ==========================================
   SEATING.JS — Interaktivni SVG sedežni red
   Digitalizacija načrta 50TKA.pdf:

   NOTRANJI PROSTOR:
   ┌────────────────────────────────────┐
   │ [X]    │    │  DJ    │ FOTO BOTH  │
   │        │    │        │            │ [SLADKI]
   │        │KLOP│ PLESIŠČE            │ [KOTIČEK]
   │        │ CA │  BIFE 2 (poševno)   │
   │ BIFE 1 │    │                     │
   │        │    │  ╱MIZA ZA 20 OSEB╲  │
   │        │    │ ○○○○○○○○○○○○○○○○○○ │
   └────────────────────────────────────┘

   ZUNAJ:
       ○○○○○○○○○○○○○○○○○○○○
     ○ ┌── MIZA ZA 40 OSEB ──┐ ○
       └─────────────────────┘
       ○○○○○○○○○○○○○○○○○○○○
   ========================================== */

var SVG_W = 900, SVG_H = 780;

// ===== NOTRANJA MIZA (1 velika poševna miza za 20 oseb) =====
var INNER_TABLE = {
  id: 1, label: 'Miza za 20 oseb',
  // Poševna miza — pravokotnik rotiran
  cx: 420, cy: 410,
  width: 280, height: 80,
  rotation: -20,
  seats: 20
};

// ===== ZUNANJA DOLGA MIZA (40 sedežev + 2 na koncih) =====
var OUTER_TABLE = {
  id: 2, label: 'Miza za 40 oseb',
  x: 100, y: 610, width: 620, height: 50,
  seatsTop: 20,
  seatsBottom: 20,
  seatsLeft: 1,
  seatsRight: 1
};

var SEAT_RADIUS = 14;
var occupiedSeats = [];
var selectedSeats = [];
var partyNames = [];

function getPartyNames() {
  try {
    var stored = localStorage.getItem('partyNames');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return [localStorage.getItem('guestName') || 'Gost'];
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
    .then(function (r) { if (r.status === 'ok') occupiedSeats = r.seats || []; })
    .catch(function () { occupiedSeats = []; });
}

function updateSeatingStatus() {
  var el = document.getElementById('seatingStatus');
  if (!el) return;
  var total = partyNames.length, chosen = selectedSeats.length;
  if (total <= 1 && chosen === 0) el.textContent = 'Klikni na prazen sedež, da ga rezerviraš.';
  else if (total > 1 && chosen < total) el.innerHTML = '<strong>Izbira sedeža za: ' + partyNames[chosen] + '</strong> (' + (chosen+1) + '/' + total + ')';
  else if (chosen === total && total > 1) el.innerHTML = 'Vsi sedeži izbrani! Klikni <strong>"Potrdi vse sedeže"</strong>.';
  else el.textContent = '';
}

// ===== GLAVNI RENDER =====
function renderChart(svg) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 ' + SVG_W + ' ' + SVG_H);

  // Pikčast vzorec
  var defs = createSvgElement('defs');
  var pat = createSvgElement('pattern', { id: 'dots', x:0, y:0, width:24, height:24, patternUnits:'userSpaceOnUse' });
  pat.appendChild(createSvgElement('circle', { cx:12, cy:12, r:1, fill:'rgba(10,22,40,0.04)' }));
  defs.appendChild(pat);
  svg.appendChild(defs);
  svg.appendChild(makeRect(0, 0, SVG_W, SVG_H, 0, 'url(#dots)'));

  // ======== NOTRANJI PROSTOR ========
  // Zunanji okvir — vključuje obe mizi (20 + 40 oseb)
  svg.appendChild(createSvgElement('rect', {
    x:40, y:30, width:720, height:700, rx:0,
    fill:'rgba(245,240,232,0.4)', stroke:'rgba(10,22,40,0.15)', 'stroke-width':1.5
  }));
  addText(svg, 400, 18, 'NOTRANJI PROSTOR', 10, 'rgba(10,22,40,0.25)', 600);

  // -- Prečrtan prostor (levo zgoraj) --
  svg.appendChild(makeRect(42, 32, 150, 200, 0, 'rgba(10,22,40,0.02)', 'rgba(10,22,40,0.1)', 1));
  svg.appendChild(createSvgElement('line', { x1:42, y1:32, x2:192, y2:232, stroke:'rgba(10,22,40,0.15)', 'stroke-width':1 }));
  svg.appendChild(createSvgElement('line', { x1:192, y1:32, x2:42, y2:232, stroke:'rgba(10,22,40,0.15)', 'stroke-width':1 }));

  // -- DJ (zgoraj sredina) --
  drawZone(svg, 370, 35, 120, 45, '🎵 DJ');

  // -- FOTO BOTH (desno zgoraj) --
  drawZone(svg, 560, 35, 195, 150, '📸 Foto Both');

  // -- SLADKI KOTIČEK (desno, manjši) --
  drawZone(svg, 695, 200, 60, 130, '🎂', true);
  addText(svg, 725, 275, 'Sladki', 9, 'rgba(10,22,40,0.4)', 500);
  addText(svg, 725, 287, 'kotiček', 9, 'rgba(10,22,40,0.4)', 500);

  // -- KLOPCA (vertikalno levo od plesišča) --
  drawZone(svg, 200, 100, 40, 180, '');
  // Vertikalni tekst za klopco
  var klopcaText = createSvgElement('text', {
    x:220, y:190, 'text-anchor':'middle', 'dominant-baseline':'central',
    'font-family':"'DM Sans',sans-serif", 'font-size':11, 'font-weight':500,
    fill:'rgba(10,22,40,0.45)', transform:'rotate(-90 220 190)'
  });
  klopcaText.textContent = 'KLOPCA';
  svg.appendChild(klopcaText);

  // -- PLESIŠČE (sredina) --
  drawDanceFloor(svg, 260, 100, 250, 150);

  // -- BIFE 2 (poševno pod plesišče) --
  var bife2g = createSvgElement('g');
  var bife2rect = createSvgElement('rect', {
    x:300, y:260, width:200, height:40, rx:4,
    fill:'rgba(10,22,40,0.03)', stroke:'rgba(10,22,40,0.12)', 'stroke-width':1,
    transform:'rotate(-15 400 280)'
  });
  bife2g.appendChild(bife2rect);
  var bife2text = createSvgElement('text', {
    x:400, y:283, 'text-anchor':'middle', 'dominant-baseline':'central',
    'font-family':"'DM Sans',sans-serif", 'font-size':11, 'font-weight':500,
    fill:'rgba(10,22,40,0.45)', transform:'rotate(-15 400 283)'
  });
  bife2text.textContent = '🍹 Bife 2';
  bife2g.appendChild(bife2text);
  svg.appendChild(bife2g);

  // -- BIFE 1 (levo spodaj) --
  drawZone(svg, 42, 350, 110, 55, '🍺 Bife 1');

  // ======== NOTRANJA MIZA ZA 20 OSEB (poševna) ========
  drawInnerTable(svg);

  // ======== MIZA ZA 40 OSEB ========
  drawOuterTable(svg);
}

// ===== NOTRANJA POŠEVNA MIZA =====
function drawInnerTable(svg) {
  var t = INNER_TABLE;
  var g = createSvgElement('g');

  // Poševna miza
  var tableRect = createSvgElement('rect', {
    x: t.cx - t.width/2, y: t.cy - t.height/2,
    width: t.width, height: t.height, rx: 10,
    class: 'table-circle',
    transform: 'rotate(' + t.rotation + ' ' + t.cx + ' ' + t.cy + ')'
  });
  g.appendChild(tableRect);

  // Label
  var lbl = createSvgElement('text', {
    x: t.cx, y: t.cy, class: 'table-label',
    transform: 'rotate(' + t.rotation + ' ' + t.cx + ' ' + t.cy + ')'
  });
  lbl.textContent = t.label;
  g.appendChild(lbl);

  // Sedeži okrog poševne mize
  // Razporedimo 20 sedežev: 7 zgoraj, 7 spodaj, 3 levo, 3 desno
  var rad = Math.PI / 180 * t.rotation;
  var cosR = Math.cos(rad), sinR = Math.sin(rad);

  var positions = [];

  // Zgornja stran (7 sedežev)
  for (var i = 0; i < 7; i++) {
    var lx = -t.width/2 + t.width/(7+1) * (i+1);
    var ly = -t.height/2 - 28;
    positions.push([lx, ly]);
  }
  // Spodnja stran (7 sedežev)
  for (var i = 0; i < 7; i++) {
    var lx = -t.width/2 + t.width/(7+1) * (i+1);
    var ly = t.height/2 + 28;
    positions.push([lx, ly]);
  }
  // Leva stran (3 sedeži)
  for (var i = 0; i < 3; i++) {
    var lx = -t.width/2 - 28;
    var ly = -t.height/2 + t.height/(3+1) * (i+1);
    positions.push([lx, ly]);
  }
  // Desna stran (3 sedeži)
  for (var i = 0; i < 3; i++) {
    var lx = t.width/2 + 28;
    var ly = -t.height/2 + t.height/(3+1) * (i+1);
    positions.push([lx, ly]);
  }

  // Rotiraj in premakni v globalne koordinate
  for (var s = 0; s < positions.length; s++) {
    var localX = positions[s][0];
    var localY = positions[s][1];
    var gx = t.cx + localX * cosR - localY * sinR;
    var gy = t.cy + localX * sinR + localY * cosR;
    drawSeat(g, t.id, s + 1, gx, gy);
  }

  svg.appendChild(g);
}

// ===== ZUNANJA DOLGA MIZA =====
function drawOuterTable(svg) {
  var t = OUTER_TABLE;
  var g = createSvgElement('g');

  g.appendChild(createSvgElement('rect', {
    x:t.x, y:t.y, width:t.width, height:t.height, rx:8, class:'table-circle'
  }));

  var lbl = createSvgElement('text', {
    x:t.x + t.width/2, y:t.y + t.height/2, class:'table-label'
  });
  lbl.textContent = t.label;
  g.appendChild(lbl);

  var seatNum = 1;

  // Sedeži zgoraj (20)
  var topSp = t.width / (t.seatsTop + 1);
  for (var i = 0; i < t.seatsTop; i++) {
    drawSeat(g, t.id, seatNum++, t.x + topSp * (i+1), t.y - 22);
  }

  // Sedeži spodaj (20)
  var botSp = t.width / (t.seatsBottom + 1);
  for (var j = 0; j < t.seatsBottom; j++) {
    drawSeat(g, t.id, seatNum++, t.x + botSp * (j+1), t.y + t.height + 22);
  }

  // Sedež levo
  drawSeat(g, t.id, seatNum++, t.x - 22, t.y + t.height/2);

  // Sedež desno
  drawSeat(g, t.id, seatNum++, t.x + t.width + 22, t.y + t.height/2);

  svg.appendChild(g);
}

// ===== POMOŽNE RISALNE FUNKCIJE =====
function drawZone(svg, x, y, w, h, label, small) {
  svg.appendChild(createSvgElement('rect', {
    x:x, y:y, width:w, height:h, rx:4,
    fill:'rgba(10,22,40,0.03)', stroke:'rgba(10,22,40,0.1)', 'stroke-width':1
  }));
  if (label) addText(svg, x+w/2, y+h/2, label, small ? 16 : 11, 'rgba(10,22,40,0.45)', 500);
}

function drawDanceFloor(svg, x, y, w, h) {
  svg.appendChild(createSvgElement('rect', {
    x:x, y:y, width:w, height:h, rx:8,
    fill:'rgba(212,175,55,0.06)', stroke:'#D4AF37', 'stroke-width':1.5, 'stroke-dasharray':'6,3'
  }));
  addText(svg, x+w/2, y+h/2, '💃 Plesišče', 14, '#D4AF37', 600);
}

function makeRect(x, y, w, h, rx, fill, stroke, sw) {
  var attrs = { x:x, y:y, width:w, height:h, rx:rx||0, fill:fill||'none' };
  if (stroke) { attrs.stroke = stroke; attrs['stroke-width'] = sw||1; }
  return createSvgElement('rect', attrs);
}

function addText(svg, x, y, text, size, color, weight) {
  var t = createSvgElement('text', {
    x:x, y:y, 'text-anchor':'middle', 'dominant-baseline':'central',
    'font-family':"'DM Sans',sans-serif", 'font-size':size, 'font-weight':weight, fill:color
  });
  t.textContent = text;
  svg.appendChild(t);
}

// ===== SEDEŽ =====
function drawSeat(parent, tableId, seatNum, cx, cy) {
  var info = getSeatInfo(tableId, seatNum);
  var sel = getSelectedSeatInfo(tableId, seatNum);
  var cls = 'seat-empty', name = '';

  if (info) {
    cls = isMyParty(info.name) ? 'seat-mine' : 'seat-taken';
    name = truncateName(info.name);
  } else if (sel) {
    cls = 'seat-selected';
    name = truncateName(sel.name);
  }

  var seat = createSvgElement('circle', {
    cx:cx, cy:cy, r:SEAT_RADIUS, class:cls,
    'data-table':tableId, 'data-seat':seatNum
  });

  if (!info && !sel) seat.addEventListener('click', onSeatClick);
  else if (sel) seat.addEventListener('click', onSelectedSeatClick);

  parent.appendChild(seat);

  var lbl = createSvgElement('text', { x:cx, y:cy, class:'seat-label' });
  lbl.textContent = name || seatNum;
  parent.appendChild(lbl);
}

// ===== LOGIKA =====
function isMyParty(name) {
  var n = getPartyNames();
  for (var i = 0; i < n.length; i++) if (n[i] === name) return true;
  return false;
}
function getSeatInfo(tid, sn) {
  for (var i = 0; i < occupiedSeats.length; i++)
    if (occupiedSeats[i].table == tid && occupiedSeats[i].seat == sn) return occupiedSeats[i];
  return null;
}
function getSelectedSeatInfo(tid, sn) {
  for (var i = 0; i < selectedSeats.length; i++)
    if (selectedSeats[i].table == tid && selectedSeats[i].seat == sn) return selectedSeats[i];
  return null;
}
function truncateName(name) {
  if (!name) return '';
  var p = name.trim().split(' ');
  return p.length > 1 ? p[0] + ' ' + p[p.length-1].charAt(0) + '.' : name;
}
function getTableName(tid) {
  if (tid === INNER_TABLE.id) return INNER_TABLE.label;
  if (tid === OUTER_TABLE.id) return OUTER_TABLE.label;
  return 'Miza ' + tid;
}

function onSeatClick(e) {
  var tid = parseInt(e.target.getAttribute('data-table'));
  var sn = parseInt(e.target.getAttribute('data-seat'));
  var total = partyNames.length;

  if (total <= 1) {
    window._pendingSingleSeat = { table:tid, seat:sn, name:partyNames[0] };
    var modal = document.getElementById('seatModal');
    document.getElementById('seatModalText').textContent = partyNames[0] + ' → ' + getTableName(tid) + ', Sedež ' + sn;
    modal.classList.add('is-visible');
    return;
  }

  if (selectedSeats.length >= total) { showToast('Že imaš izbranih ' + total + ' sedežev.', 'error'); return; }

  var pn = partyNames[selectedSeats.length];
  selectedSeats.push({ table:tid, seat:sn, name:pn });
  renderChart(document.getElementById('seatingSvg'));
  updateSeatingStatus();
  showToast(pn + ' → ' + getTableName(tid) + ', Sedež ' + sn, 'success');
  if (selectedSeats.length === total) showConfirmAllButton();
}

function onSelectedSeatClick(e) {
  var tid = parseInt(e.target.getAttribute('data-table'));
  var sn = parseInt(e.target.getAttribute('data-seat'));
  for (var i = 0; i < selectedSeats.length; i++) {
    if (selectedSeats[i].table == tid && selectedSeats[i].seat == sn) {
      var nm = selectedSeats[i].name;
      selectedSeats.splice(i);
      renderChart(document.getElementById('seatingSvg'));
      updateSeatingStatus();
      hideConfirmAllButton();
      showToast('Sedež za ' + nm + ' odstranjen.', 'error');
      return;
    }
  }
}

function showConfirmAllButton() {
  if (document.getElementById('confirmAllSeats')) return;
  var c = document.getElementById('seatingChart');
  if (!c) return;
  var w = document.createElement('div');
  w.style.cssText = 'text-align:center;margin-top:1.5rem';
  w.id = 'confirmAllWrapper';
  var s = document.createElement('div');
  s.style.cssText = 'margin-bottom:1rem;font-size:0.95rem;color:#0A1628';
  var h = '<strong>Izbrani sedeži:</strong><br>';
  selectedSeats.forEach(function(x) { h += truncateName(x.name) + ' → ' + getTableName(x.table) + ', Sedež ' + x.seat + '<br>'; });
  s.innerHTML = h;
  w.appendChild(s);
  var b = document.createElement('button');
  b.className = 'btn btn--primary'; b.id = 'confirmAllSeats';
  b.textContent = 'Potrdi vse sedeže';
  b.addEventListener('click', confirmAllSeats);
  w.appendChild(b);
  c.parentNode.insertBefore(w, c.nextSibling);
}

function hideConfirmAllButton() { var w = document.getElementById('confirmAllWrapper'); if (w) w.remove(); }

function confirmAllSeats() {
  var btn = document.getElementById('confirmAllSeats');
  if (btn) { btn.disabled = true; btn.textContent = 'Rezerviram...'; }
  Promise.all(selectedSeats.map(function(s) {
    return apiPost({ action:'seat', name:s.name, table:s.table, seat:s.seat });
  })).then(function(results) {
    if (results.every(function(r){ return r.status==='ok'; })) {
      partyNames = getPartyNames();
      selectedSeats.forEach(function(s){ occupiedSeats.push(s); });
      selectedSeats = []; hideConfirmAllButton();
      renderChart(document.getElementById('seatingSvg'));
      showToast('Vsi sedeži uspešno rezervirani!', 'success');
      if (typeof celebrateConfetti === 'function') celebrateConfetti();
    } else {
      showToast('Nekateri sedeži so že zasedeni.', 'error');
      selectedSeats = []; hideConfirmAllButton();
      loadOccupiedSeats().then(function() { renderChart(document.getElementById('seatingSvg')); updateSeatingStatus(); });
    }
  }).catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Potrdi vse sedeže'; }
    showToast('Napaka pri rezervaciji.', 'error');
  });
}

// ===== MODAL =====
document.getElementById('seatConfirm').addEventListener('click', function() {
  var d = window._pendingSingleSeat; if (!d) return;
  var modal = document.getElementById('seatModal');
  var btn = document.getElementById('seatConfirm');
  btn.disabled = true; btn.textContent = 'Rezerviram...';
  apiPost({ action:'seat', name:d.name, table:d.table, seat:d.seat }).then(function(r) {
    modal.classList.remove('is-visible'); btn.disabled = false; btn.textContent = 'Potrdi';
    if (r.status === 'ok') {
      partyNames = getPartyNames(); occupiedSeats.push(d);
      renderChart(document.getElementById('seatingSvg'));
      showToast('Sedež uspešno rezerviran!', 'success');
      if (typeof celebrateConfetti === 'function') celebrateConfetti();
    } else {
      showToast(r.message || 'Sedež je že zaseden.', 'error');
      loadOccupiedSeats().then(function(){ renderChart(document.getElementById('seatingSvg')); });
    }
    window._pendingSingleSeat = null;
  }).catch(function() {
    modal.classList.remove('is-visible'); btn.disabled = false; btn.textContent = 'Potrdi';
    showToast('Napaka pri rezervaciji.', 'error'); window._pendingSingleSeat = null;
  });
});

document.getElementById('seatCancel').addEventListener('click', function() {
  document.getElementById('seatModal').classList.remove('is-visible'); window._pendingSingleSeat = null;
});
document.querySelector('#seatModal .modal__backdrop').addEventListener('click', function() {
  document.getElementById('seatModal').classList.remove('is-visible'); window._pendingSingleSeat = null;
});

// ===== SVG HELPER =====
function createSvgElement(tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
  return el;
}
