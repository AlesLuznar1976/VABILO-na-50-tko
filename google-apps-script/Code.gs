/**
 * Google Apps Script — Backend za rojstnodnevna vabila
 *
 * NAVODILA ZA DEPLOY:
 * 1. Ustvari nov Google Sheet s 5 zavihki: "RSVP", "Seating", "Music", "Accommodation", "Log"
 * 2. Odpri Extensions > Apps Script
 * 3. Prilepi to kodo
 * 4. Zaženi funkcijo addHeaders() za dodajanje glav stolpcev
 * 5. Zaženi funkcijo createDailyTrigger() za nastavitev dnevnega emaila
 * 6. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Kopiraj URL in ga vstavi v js/app.js kot APPS_SCRIPT_URL
 */

var NOTIFY_EMAIL = 'ales@luznar.com';
var SHEET_ID = '1m_uzRYQVLfqZ0Sk5N55azOA6vwjlk3273LAo5dUR3nY';

// ==================== HEADERS ====================

function addHeaders() {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  var rsvp = ss.getSheetByName('RSVP');
  if (!rsvp) rsvp = ss.insertSheet('RSVP');
  if (rsvp.getLastRow() === 0) {
    rsvp.appendRow(['Časovni žig', 'Ime', 'Priimek', 'Telefon', 'Št. oseb', 'Spremljevalci', 'Prehrana', 'Udeležba']);
  }

  var seating = ss.getSheetByName('Seating');
  if (!seating) seating = ss.insertSheet('Seating');
  if (seating.getLastRow() === 0) {
    seating.appendRow(['Časovni žig', 'Ime gosta', 'Miza', 'Sedež']);
  }

  var music = ss.getSheetByName('Music');
  if (!music) music = ss.insertSheet('Music');
  if (music.getLastRow() === 0) {
    music.appendRow(['Časovni žig', 'Ime gosta', 'Žanri', 'Lastna želja']);
  }

  var acc = ss.getSheetByName('Accommodation');
  if (!acc) acc = ss.insertSheet('Accommodation');
  if (acc.getLastRow() === 0) {
    acc.appendRow(['Časovni žig', 'Ime gosta', 'Check-in', 'Check-out', 'Št. gostov']);
  }

  var log = ss.getSheetByName('Log');
  if (!log) log = ss.insertSheet('Log');
  if (log.getLastRow() === 0) {
    log.appendRow(['Časovni žig', 'Dogodek', 'Podrobnosti', 'Gost', 'Stran', 'Zaslon', 'User Agent']);
  }
}

// ==================== DNEVNI TRIGGER ====================

function createDailyTrigger() {
  // Odstrani morebitne obstoječe triggerje
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailyLog') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Ustvari nov dnevni trigger ob 8:00
  ScriptApp.newTrigger('sendDailyLog')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log('Dnevni trigger ustvarjen — email vsak dan ob 8:00');
}

function sendDailyLog() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var now = new Date();
  var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ===== ZBERI DNEVNE PODATKE =====
  var sections = [];

  // RSVP-ji
  var rsvpSheet = ss.getSheetByName('RSVP');
  if (rsvpSheet && rsvpSheet.getLastRow() > 1) {
    var rsvpData = rsvpSheet.getDataRange().getValues();
    var newRsvps = [];
    for (var i = 1; i < rsvpData.length; i++) {
      var ts = new Date(rsvpData[i][0]);
      if (ts >= yesterday) {
        newRsvps.push('  • ' + rsvpData[i][1] + ' ' + rsvpData[i][2] +
          ' (' + rsvpData[i][4] + ' oseb) — ' + (rsvpData[i][7] === 'da' ? '✅ POTRJENO' : '❌ ODKLONENO'));
      }
    }
    if (newRsvps.length > 0) {
      sections.push('🎉 NOVI RSVP-ji (' + newRsvps.length + '):\n' + newRsvps.join('\n'));
    }
  }

  // Prenočišča
  var accSheet = ss.getSheetByName('Accommodation');
  if (accSheet && accSheet.getLastRow() > 1) {
    var accData = accSheet.getDataRange().getValues();
    var newAcc = [];
    for (var i = 1; i < accData.length; i++) {
      var ts = new Date(accData[i][0]);
      if (ts >= yesterday) {
        newAcc.push('  • ' + accData[i][1] + ' (' + accData[i][4] + ' gostov)');
      }
    }
    if (newAcc.length > 0) {
      sections.push('🏨 NOVA PRENOČIŠČA (' + newAcc.length + '):\n' + newAcc.join('\n'));
    }
  }

  // Glasba
  var musicSheet = ss.getSheetByName('Music');
  if (musicSheet && musicSheet.getLastRow() > 1) {
    var musicData = musicSheet.getDataRange().getValues();
    var newMusic = [];
    for (var i = 1; i < musicData.length; i++) {
      var ts = new Date(musicData[i][0]);
      if (ts >= yesterday) {
        newMusic.push('  • ' + musicData[i][1] + ': ' + musicData[i][2] +
          (musicData[i][3] ? ' | Želja: ' + musicData[i][3] : ''));
      }
    }
    if (newMusic.length > 0) {
      sections.push('🎵 NOVE GLASBENE ŽELJE (' + newMusic.length + '):\n' + newMusic.join('\n'));
    }
  }

  // Log statistika
  var logSheet = ss.getSheetByName('Log');
  if (logSheet && logSheet.getLastRow() > 1) {
    var logData = logSheet.getDataRange().getValues();
    var pageViews = 0;
    var uniqueGuests = {};
    var formSubmits = 0;
    for (var i = 1; i < logData.length; i++) {
      var ts = new Date(logData[i][0]);
      if (ts >= yesterday) {
        if (logData[i][1] === 'page_view') pageViews++;
        if (logData[i][1] === 'form_submit') formSubmits++;
        if (logData[i][3] && logData[i][3] !== 'Neznan') uniqueGuests[logData[i][3]] = true;
      }
    }
    var guestCount = Object.keys(uniqueGuests).length;
    if (pageViews > 0) {
      sections.push('📊 STATISTIKA:\n' +
        '  • Ogledov strani: ' + pageViews + '\n' +
        '  • Unikatnih gostov: ' + guestCount + '\n' +
        '  • Oddanih obrazcev: ' + formSubmits);
    }
  }

  // Skupne številke
  var totalRsvp = rsvpSheet ? Math.max(0, rsvpSheet.getLastRow() - 1) : 0;
  var totalAcc = accSheet ? Math.max(0, accSheet.getLastRow() - 1) : 0;
  var totalMusic = musicSheet ? Math.max(0, musicSheet.getLastRow() - 1) : 0;

  sections.push('📋 SKUPNO STANJE:\n' +
    '  • RSVP-jev: ' + totalRsvp + '\n' +
    '  • Prenočišč: ' + totalAcc + '\n' +
    '  • Glasbenih želja: ' + totalMusic);

  // ===== POŠLJI EMAIL =====
  if (sections.length === 0) return; // Nič novega

  var subject = '📊 Dnevni povzetek — Aleševa 50-tka (' +
    Utilities.formatDate(now, 'Europe/Ljubljana', 'dd.MM.yyyy') + ')';

  var body = '🎂 DNEVNI POVZETEK — ALEŠEVA 50-TKA\n' +
    Utilities.formatDate(now, 'Europe/Ljubljana', 'dd.MM.yyyy HH:mm') + '\n' +
    '═══════════════════════════════════\n\n' +
    sections.join('\n\n') + '\n\n' +
    '───────────────────────────────────\n' +
    'Avtomatski dnevni povzetek s spletne strani vabila.\n' +
    'Google Sheet: ' + ss.getUrl();

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body
  });
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
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Seating');
  var data = sheet.getDataRange().getValues();
  var seats = [];

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
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Seating');
  var count = Math.max(0, sheet.getLastRow() - 1);
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
    switch (data.action || data.type) {
      case 'rsvp':
        result = handleRsvp(data);
        break;
      case 'seat':
        result = handleSeat(data);
        break;
      case 'music':
        result = handleMusic(data);
        break;
      case 'accommodation':
        result = handleAccommodation(data);
        break;
      case 'log':
        result = handleLog(data);
        break;
      default:
        result = { status: 'error', message: 'Neznana akcija: ' + (data.action || data.type) };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRsvp(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('RSVP');

  sheet.appendRow([
    new Date(),
    data.ime || '',
    data.priimek || '',
    data.telefon || '',
    data.stOseb || 1,
    data.spremljevalci || '',
    data.prehrana || '',
    data.udelezba || 'da'
  ]);

  // Pošlji email obvestilo
  try {
    var fullName = (data.ime || '') + ' ' + (data.priimek || '');
    var status = data.udelezba === 'da' ? 'POTRJENA' : 'ODKLONJENA';
    var subject = '🎂 Vabilo 50-tka: ' + status + ' — ' + fullName;
    var body = 'RSVP ' + status + '\n\n' +
      'Ime: ' + fullName + '\n' +
      'Telefon: ' + (data.telefon || '/') + '\n' +
      'Število oseb: ' + (data.stOseb || 1) + '\n' +
      (data.spremljevalci ? 'Spremljevalci: ' + data.spremljevalci + '\n' : '') +
      (data.prehrana ? 'Prehrana: ' + data.prehrana + '\n' : '') +
      '\nČas: ' + new Date().toLocaleString('sl-SI');

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body
    });
  } catch (err) {
    Logger.log('RSVP email napaka: ' + err.message);
  }

  return { status: 'ok', message: 'RSVP uspešno shranjeno!' };
}

function handleSeat(data) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (err) {
    return { status: 'error', message: 'Strežnik je zaseden, poskusi znova.' };
  }

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Seating');
    var allData = sheet.getDataRange().getValues();

    for (var i = 1; i < allData.length; i++) {
      if (allData[i][2] == data.table && allData[i][3] == data.seat) {
        return { status: 'error', message: 'Ta sedež je žal že zaseden!' };
      }
    }

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
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Music');

  sheet.appendRow([
    new Date(),
    data.name || '',
    (data.zanri || []).join(', '),
    data.lastnaZelja || ''
  ]);

  return { status: 'ok', message: 'Glasbene želje shranjene!' };
}

function handleAccommodation(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Accommodation');

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.checkin || '',
    data.checkout || '',
    data.guests || 1
  ]);

  // Pošlji email obvestilo
  try {
    var subject = '🏨 Nova rezervacija prenočišča — ' + (data.name || 'Gost');
    var body = 'NOVA REZERVACIJA PRENOČIŠČA\n\n' +
      'Ime: ' + (data.name || '/') + '\n' +
      'Check-in: ' + (data.checkin || '/') + '\n' +
      'Check-out: ' + (data.checkout || '/') + '\n' +
      'Število gostov: ' + (data.guests || 1) + '\n\n' +
      'Čas: ' + new Date().toLocaleString('sl-SI');

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body
    });
  } catch (err) {
    Logger.log('Accommodation email napaka: ' + err.message);
  }

  return { status: 'ok', message: 'Prenočišče rezervirano!' };
}

function handleLog(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Log');

  sheet.appendRow([
    new Date(),
    data.event || '',
    data.details || '',
    data.guest || '',
    data.page || '',
    data.screen || '',
    data.userAgent || ''
  ]);

  return { status: 'ok' };
}
