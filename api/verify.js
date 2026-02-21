const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KöniglichePlüschikeit';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    return res.json({ valid: true });
  }
  
  return res.status(401).json({ valid: false });
};
