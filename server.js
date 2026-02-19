// server.js - Node.js Backend
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'streamplan123'; // Ändere das!

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
async function initData() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      bgImage: '',
      avatar: '',
      footerLeft: 'Besucht JETZT auch meine\nanderen Social-Media-Konten!!',
      footerRight: 'MIT LIEBE\nGEMACHT\nFÜR EUCH\nVON PLÜSCHI',
      days: [
        { name: 'MO', stream: '', time: '', sleep: true },
        { name: 'DI', stream: '', time: '', sleep: true },
        { name: 'MI', stream: '', time: '', sleep: true },
        { name: 'DO', stream: 'DEAD AS DISCO', time: '15⁰⁰-21³⁰', sleep: false },
        { name: 'FR', stream: 'MARIO KART 8', time: '15³⁰-23³⁰', sleep: false },
        { name: 'SA', stream: 'EURO TRUCK SIMULATOR 2', time: '15³⁰-23³⁰', sleep: false },
        { name: 'SO', stream: '', time: '', sleep: true }
      ]
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// GET - Public endpoint to fetch data
app.get('/api/schedule', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST - Admin endpoint to update data (requires password)
app.post('/api/schedule', async (req, res) => {
  const { password, data } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Verify password endpoint
app.post('/api/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Start server
initData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`\n🔗 URLs:`);
    console.log(`   Public View: http://localhost:${PORT}/`);
    console.log(`   Admin Panel: http://localhost:${PORT}/admin.html`);
  });
});
