import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KöniglichePlüschigkeit';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('schedule')
      .select('data')
      .eq('id', 1)
      .single();
    
    if (error || !data) {
      return res.json(initialData);
    }
    
    return res.json(data.data);
  }
  
  if (req.method === 'POST') {
    const { password, data: scheduleData } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { error } = await supabase
      .from('schedule')
      .upsert({ id: 1, data: scheduleData });
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save' });
    }
    
    return res.json({ success: true });
  }
}
