// server.js - Node.js Backend (Dual-Plan Version)
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Separate Passwörter für Plüschi und Noffley
const PLUESCHI_PASSWORD = process.env.PLUESCHI_PASSWORD || process.env.ADMIN_PASSWORD || 'streamplan123';
const NOFFLEY_PASSWORD  = process.env.NOFFLEY_PASSWORD  || 'noffley123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data.json');

// Standarddaten für einen leeren Plan
function defaultPlan(footerName) {
  return {
    bgImage: '',
    avatar: '',
    footerLeft: 'Besucht JETZT auch meine\nanderen Social-Media-Konten!!',
    footerRight: `MIT LIEBE\nGEMACHT\nFÜR EUCH\nVON ${footerName}`,
    days: [
      { name: 'MO', stream: '', time: '', sleep: false },
      { name: 'DI', stream: '', time: '', sleep: false },
      { name: 'MI', stream: '', time: '', sleep: false },
      { name: 'DO', stream: '', time: '', sleep: false },
      { name: 'FR', stream: '', time: '', sleep: false },
      { name: 'SA', stream: '', time: '', sleep: false },
      { name: 'SO', stream: '', time: '', sleep: false }
    ]
  };
}

// Datei initialisieren falls noch nicht vorhanden
async function initData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const existing = JSON.parse(raw);

    // Migration: altes Format (single plan) → neues Format (dual plan)
    if (existing.days && !existing.plueschi) {
      console.log('📦 Altes Datenformat erkannt – migriere zu Dual-Plan...');
      const migrated = {
        plueschi: existing,
        noffley: defaultPlan('NOFFLEY')
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(migrated, null, 2));
      console.log('✅ Migration abgeschlossen!');
    }
  } catch {
    // Datei existiert nicht → neu erstellen
    const initialData = {
      plueschi: defaultPlan('PLÜSCHI'),
      noffley:  defaultPlan('NOFFLEY')
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('📝 Neue data.json erstellt!');
  }
}

// ===================== ROUTES =====================

// GET - Öffentlich: beide Pläne laden
app.get('/api/schedule', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Fehler beim Lesen:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST - Speichern (Passwort erforderlich)
// Body: { password, plan: 'plueschi'|'noffley'|'both', data: {...} }
app.post('/api/schedule', async (req, res) => {
  const { password, plan, data } = req.body;

  // Passwort prüfen
  const isPlueschi = password === PLUESCHI_PASSWORD;
  const isNoffley  = password === NOFFLEY_PASSWORD;

  if (!isPlueschi && !isNoffley) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const current = JSON.parse(raw);

    if (isPlueschi) {
      // Plüschi darf alles speichern
      if (data.plueschi !== undefined) current.plueschi = data.plueschi;
      if (data.noffley  !== undefined) current.noffley  = data.noffley;
      // Oder falls 'data' direkt ein Plan-Objekt ist (Rückwärtskompatibilität)
      if (data.days) current.plueschi = data;
    } else if (isNoffley) {
      // Noffley darf nur seinen eigenen Plan speichern
      if (data.noffley !== undefined) {
        current.noffley = data.noffley;
      } else if (data.days) {
        current.noffley = data;
      } else {
        return res.status(403).json({ error: 'Noffley kann nur seinen eigenen Plan speichern' });
      }
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(current, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Plüschi Login prüfen
app.post('/api/verify', (req, res) => {
  const { password } = req.body;
  if (password === PLUESCHI_PASSWORD) {
    res.json({ valid: true, role: 'plueschi' });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Noffley Login prüfen
app.post('/api/verify/noffley', (req, res) => {
  const { password } = req.body;
  if (password === NOFFLEY_PASSWORD) {
    res.json({ valid: true, role: 'noffley' });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Start
initData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`🔑 Plüschi-Passwort: ${PLUESCHI_PASSWORD}`);
    console.log(`🔑 Noffley-Passwort: ${NOFFLEY_PASSWORD}`);
    console.log(`\n🔗 URLs:`);
    console.log(`   Öffentlich:  http://localhost:${PORT}/`);
    console.log(`   Admin-Panel: http://localhost:${PORT}/admin.html`);
  });
});
