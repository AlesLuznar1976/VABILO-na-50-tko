/* ==========================================
   SEATING.JS — Interaktivni SVG sedežni red
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
var selectedSeat = null;

function initSeatingChart() {
  var svg = document.getElementById('seatingSvg');
  if (!svg || svg.childNodes.length > 0) return;

  // Naloži zasedene sedeže
  loadOccupiedSeats().then(function () {
    renderChart(svg);
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

function renderChart(svg) {
  // Počisti
  svg.innerHTML = '';

  // Ozadje — dekorativna pikčasta mreža
  var defs = createSvgElement('defs');
  var pattern = createSvgElement('pattern', {
    id: 'dotPattern', x: '0', y: '0', width: '30', height: '30', patternUnits: 'userSpaceOnUse'
  });
  var dot = createSvgElement('circle', {
    cx: '15', cy: '15', r: '1.5', fill: 'rgba(123, 47, 190, 0.08)'
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
    'font-size': '22', 'font-weight': '700', fill: '#2D1B4E'
  });
  title.textContent = 'Izberi svoj sedež';
  svg.appendChild(title);

  // DJ podij (dekorativno)
  var djGroup = createSvgElement('g');
  var djRect = createSvgElement('rect', {
    x: '830', y: '260', width: '140', height: '60', rx: '10',
    fill: '#7B2FBE', opacity: '0.15', stroke: '#7B2FBE', 'stroke-width': '2', 'stroke-dasharray': '5,5'
  });
  djGroup.appendChild(djRect);
  var djText = createSvgElement('text', {
    x: '900', y: '296', 'text-anchor': 'middle', 'font-family': "'DM Sans', sans-serif",
    'font-size': '13', 'font-weight': '600', fill: '#7B2FBE'
  });
  djText.textContent = '🎵 DJ';
  djGroup.appendChild(djText);
  svg.appendChild(djGroup);

  // Plesišče
  var danceGroup = createSvgElement('g');
  var danceRect = createSvgElement('rect', {
    x: '830', y: '400', width: '140', height: '140', rx: '15',
    fill: '#FFC947', opacity: '0.12', stroke: '#FFC947', 'stroke-width': '2', 'stroke-dasharray': '8,4'
  });
  danceGroup.appendChild(danceRect);
  var danceText = createSvgElement('text', {
    x: '900', y: '476', 'text-anchor': 'middle', 'font-family': "'DM Sans', sans-serif",
    'font-size': '13', 'font-weight': '600', fill: '#B8941A'
  });
  danceText.textContent = '💃 Plesišče';
  danceGroup.appendChild(danceText);
  svg.appendChild(danceGroup);

  // Riši mize
  var guestName = sessionStorage.getItem('guestName') || '';

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
      var seatClass = 'seat-empty';
      if (seatInfo) {
        seatClass = seatInfo.name === guestName ? 'seat-mine' : 'seat-taken';
      }

      var seat = createSvgElement('circle', {
        cx: seatCx, cy: seatCy, r: SEAT_RADIUS,
        class: seatClass,
        'data-table': table.id,
        'data-seat': i + 1
      });

      if (!seatInfo) {
        seat.addEventListener('click', onSeatClick);
      }

      group.appendChild(seat);

      // Oznaka sedeža
      var seatLabel = createSvgElement('text', {
        x: seatCx, y: seatCy, class: 'seat-label'
      });
      seatLabel.textContent = seatInfo ? truncateName(seatInfo.name) : (i + 1);
      group.appendChild(seatLabel);
    }

    svg.appendChild(group);
  });
}

function getSeatInfo(tableId, seatNum) {
  for (var i = 0; i < occupiedSeats.length; i++) {
    if (occupiedSeats[i].table == tableId && occupiedSeats[i].seat == seatNum) {
      return occupiedSeats[i];
    }
  }
  return null;
}

function truncateName(name) {
  if (!name) return '';
  var parts = name.split(' ');
  if (parts.length > 1) {
    return parts[0].charAt(0) + '.' + parts[parts.length - 1].charAt(0) + '.';
  }
  return name.length > 6 ? name.substring(0, 5) + '.' : name;
}

function onSeatClick(e) {
  var tableId = parseInt(e.target.getAttribute('data-table'));
  var seatNum = parseInt(e.target.getAttribute('data-seat'));

  selectedSeat = { table: tableId, seat: seatNum };

  // Pokaži modal
  var modal = document.getElementById('seatModal');
  var modalText = document.getElementById('seatModalText');
  modalText.textContent = 'Želiš sedeti na Mizi ' + tableId + ', Sedež ' + seatNum + '?';
  modal.classList.add('is-visible');
}

// Modal gumbi
document.getElementById('seatConfirm').addEventListener('click', function () {
  if (!selectedSeat) return;

  var guestName = sessionStorage.getItem('guestName') || 'Gost';

  var modal = document.getElementById('seatModal');
  var confirmBtn = document.getElementById('seatConfirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Rezerviram...';

  apiPost({
    action: 'seat',
    name: guestName,
    table: selectedSeat.table,
    seat: selectedSeat.seat
  })
    .then(function (result) {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';

      if (result.status === 'ok') {
        // Dodaj v lokalni seznam
        occupiedSeats.push({
          name: guestName,
          table: selectedSeat.table,
          seat: selectedSeat.seat
        });

        // Osveži prikaz
        var svg = document.getElementById('seatingSvg');
        renderChart(svg);

        showToast('Sedež uspešno rezerviran!', 'success');

        if (typeof celebrateConfetti === 'function') {
          celebrateConfetti();
        }
      } else {
        showToast(result.message || 'Sedež je že zaseden.', 'error');
        // Osveži sedeže s strežnika
        loadOccupiedSeats().then(function () {
          var svg = document.getElementById('seatingSvg');
          renderChart(svg);
        });
      }

      selectedSeat = null;
    })
    .catch(function () {
      modal.classList.remove('is-visible');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Potrdi';
      showToast('Napaka pri rezervaciji. Poskusi znova.', 'error');
      selectedSeat = null;
    });
});

document.getElementById('seatCancel').addEventListener('click', function () {
  document.getElementById('seatModal').classList.remove('is-visible');
  selectedSeat = null;
});

// Zapri modal ob kliku na backdrop
document.querySelector('#seatModal .modal__backdrop').addEventListener('click', function () {
  document.getElementById('seatModal').classList.remove('is-visible');
  selectedSeat = null;
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
