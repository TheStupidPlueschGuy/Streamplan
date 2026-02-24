const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KöniglichePlüschigkeit';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const initialData = {
  bgImage: '',
  avatar: '',
  footerLeft: 'Besucht JETZT auch meine\nanderen Social-Media-Konten!!',
  footerRight: 'MIT LIEBE\nGEMACHT\nFÜR EUCH\nVON PLÜSCHI',
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

async function getData() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedule?id=eq.1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return data[0].data;
    }
    
    return initialData;
  } catch (error) {
    console.error('Error loading data:', error);
    return initialData;
  }
}

async function saveData(newData) {
  try {
    // First try to update
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/schedule?id=eq.1`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ data: newData })
    });
    
    if (updateResponse.ok || updateResponse.status === 204) {
      return true;
    }
    
    // If update fails, try insert
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/schedule`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ id: 1, data: newData })
    });
    
    return insertResponse.ok || insertResponse.status === 201;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    const data = await getData();
    return res.json(data);
  }
  
  if (req.method === 'POST') {
    const { password, data } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const success = await saveData(data);
    
    if (success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }
};
