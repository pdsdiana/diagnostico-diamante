export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { leadData } = req.body || {};
    if (!leadData || !leadData.nome) return res.status(400).json({ error: 'Dados incompletos' });

    const webhook = process.env.SHEETS_WEBHOOK_URL;
    if (!webhook) return res.status(500).json({ error: 'SHEETS_WEBHOOK_URL ausente' });

    const payload = {
      timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      nome: leadData.nome || '',
      cargo: leadData.cargo || '',
      setor: leadData.setor || '',
      nivel: leadData.nivel || '',
      tempo: leadData.tempo || '',
      evol: leadData.evol || '',
      desafios: Array.isArray(leadData.desafios) ? leadData.desafios.join(' | ') : (leadData.desafios || ''),
      amb: leadData.amb || '',
      clareza: leadData.esc || '',
      obstaculo: leadData.obst || '',
      whatsapp: leadData.wpp || '',
      email: leadData.email || '',
      origem: leadData.origem || '',
      score: leadData.esc || '',
      status: 'Novo lead'
    };

    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!r.ok) return res.status(502).json({ error: 'Sheets respondeu ' + r.status });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
