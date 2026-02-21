const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KöniglichePlüschigkeit';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

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

async function getDataFromGitHub() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data.json`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (response.ok) {
      const file = await response.json();
      const content = Buffer.from(file.content, 'base64').toString('utf8');
      return { data: JSON.parse(content), sha: file.sha };
    }
    
    return { data: initialData, sha: null };
  } catch (error) {
    console.error('Error reading from GitHub:', error);
    return { data: initialData, sha: null };
  }
}

async function saveDataToGitHub(data, sha) {
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const body = {
      message: 'Update stream schedule',
      content: content
    };
    
    if (sha) body.sha = sha;
    
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error saving to GitHub:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    const { data } = await getDataFromGitHub();
    return res.json(data);
  }
  
  if (req.method === 'POST') {
    const { password, data } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { sha } = await getDataFromGitHub();
    const success = await saveDataToGitHub(data, sha);
    
    if (success) {
      return res.json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }
};
