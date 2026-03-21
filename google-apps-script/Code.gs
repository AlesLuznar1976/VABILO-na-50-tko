/**
 * Google Apps Script — Backend za rojstnodnevna vabila
 *
 * NAVODILA ZA DEPLOY:
 * 1. Ustvari nov Google Sheet s 3 zavihki: "RSVP", "Seating", "Music"
 * 2. Odpri Extensions > Apps Script
 * 3. Prilepi to kodo
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Kopiraj URL in ga vstavi v js/app.js kot APPS_SCRIPT_URL
 */

// ==================== HEADERS ====================

function addHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var rsvp = ss.getSheetByName('RSVP');
  if (rsvp.getLastRow() === 0) {
    rsvp.appendRow(['Časovni žig', 'Ime', 'Priimek', 'Email', 'Telefon', 'Št. oseb', 'Prehrana', 'Udeležba']);
  }

  var seating = ss.getSheetByName('Seating');
  if (seating.getLastRow() === 0) {
    seating.appendRow(['Časovni žig', 'Ime gosta', 'Miza', 'Sedež']);
  }

  var music = ss.getSheetByName('Music');
  if (music.getLastRow() === 0) {
    music.appendRow(['Časovni žig', 'Ime gosta', 'Žanri', 'Pesmi', 'Lastna želja']);
  }
}

// ==================== GET ====================

function doGet(e) {
  var action = e.parameter.action;
  var result;

  try {
    switch (action) {
      case 'getSeating':
        result = getSeating();
        break;
      case 'getSeatingCount':
        result = getSeatingCount();
        break;
      default:
        result = { status: 'error', message: 'Neznana akcija: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSeating() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Seating');
  var data = sheet.getDataRange().getValues();
  var seats = [];

  // Preskoči header vrstico
  for (var i = 1; i < data.length; i++) {
    seats.push({
      name: data[i][1],
      table: data[i][2],
      seat: data[i][3]
    });
  }

  return { status: 'ok', seats: seats };
}

function getSeatingCount() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Seating');
  var count = Math.max(0, sheet.getLastRow() - 1); // minus header
  return { status: 'ok', count: count };
}

// ==================== POST ====================

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Neveljavni podatki' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var result;

  try {
    switch (data.action) {
      case 'rsvp':
        result = handleRsvp(data);
        break;
      case 'seat':
        result = handleSeat(data);
        break;
      case 'music':
        result = handleMusic(data);
        break;
      default:
        result = { status: 'error', message: 'Neznana akcija: ' + data.action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRsvp(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('RSVP');

  sheet.appendRow([
    new Date(),
    data.ime || '',
    data.priimek || '',
    data.email || '',
    data.telefon || '',
    data.stOseb || 1,
    data.prehrana || '',
    data.udelezba || 'da'
  ]);

  return { status: 'ok', message: 'RSVP uspešno shranjeno!' };
}

function handleSeat(data) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000); // čakaj do 10 sekund
  } catch (err) {
    return { status: 'error', message: 'Strežnik je zaseden, poskusi znova.' };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Seating');
    var allData = sheet.getDataRange().getValues();

    // Preveri ali je sedež že zaseden
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][2] == data.table && allData[i][3] == data.seat) {
        return { status: 'error', message: 'Ta sedež je žal že zaseden!' };
      }
    }

    // Zapiši nov sedež
    sheet.appendRow([
      new Date(),
      data.name || '',
      data.table,
      data.seat
    ]);

    return { status: 'ok', message: 'Sedež uspešno rezerviran!' };

  } finally {
    lock.releaseLock();
  }
}

function handleMusic(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Music');

  sheet.appendRow([
    new Date(),
    data.name || '',
    (data.zanri || []).join(', '),
    (data.pesmi || []).join(', '),
    data.lastnaZelja || ''
  ]);

  return { status: 'ok', message: 'Glasbene želje shranjene!' };
}
