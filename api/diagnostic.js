module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { leadData, claudePayload } = req.body;
    const payload = { model: 'claude-sonnet-4-6', max_tokens: 900, messages: claudePayload.messages };
    console.log('Chamando Claude:', payload.model);
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) { console.error('Erro Claude:', JSON.stringify(claudeData)); return res.status(claudeRes.status).json({ error: claudeData }); }
    console.log('Sucesso!');
    let score = '';
    try { const txt = claudeData.content?.[0]?.text || ''; const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim()); score = parsed.score_lapidacao || ''; } catch (_) {}
    if (process.env.SHEETS_WEBHOOK_URL && leadData) {
      fetch(process.env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }), nome: leadData.nome||'', cargo: leadData.cargo||'', setor: leadData.setor||'', nivel: leadData.nivel||'', tempo: leadData.tempo||'', evol: leadData.evol||'', desafios: Array.isArray(leadData.desafios)?leadData.desafios.join(' | '):'', amb: leadData.amb||'', clareza: leadData.esc||'', obstaculo: leadData.obst||'', whatsapp: leadData.wpp||'', email: leadData.email||'', score, status: 'Novo lead' }) }).catch(e => console.error('Sheets error:', e));
    }
    return res.status(200).json(claudeData);
  } catch (err) { console.error('Erro geral:', err.toString()); return res.status(500).json({ error: err.toString() }); }
}
