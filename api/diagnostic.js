export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
          const { leadData } = req.body;
          if (!leadData || !leadData.nome) {
                  return res.status(400).json({ error: 'Dados incompletos' });
          }
          const prompt = 'Voce e Diana Santos, estrategista de carreira. Analise o perfil e retorne APENAS JSON puro sem markdown, sem backticks.\n\nNome: ' + leadData.nome + '\nCargo: ' + leadData.cargo + '\nSetor: ' + leadData.setor + '\nNivel: ' + leadData.nivel + '\nTempo: ' + leadData.tempo + '\nEvolucao: ' + leadData.evol + '\nDesafios: ' + leadData.desafios + '\nEstrategia: ' + leadData.esc + '\nObstaculo: ' + leadData.obst + '\n\nRetorne JSON exato (sem backticks):\n{"perfil_atual":"analise","pontuacao":7,"facetas":[{"titulo":"t","descricao":"d"},{"titulo":"t","descricao":"d"},{"titulo":"t","descricao":"d"}],"diamantes_brutos":[{"titulo":"t","descricao":"d"},{"titulo":"t","descricao":"d"}],"mapa_estrategico":[{"prioridade":"1","acao":"a"},{"prioridade":"2","acao":"a"},{"prioridade":"3","acao":"a"}],"servico_recomendado":"Estrategia Diamante","cta":"cta"}\n\nPersonalize para ' + leadData.nome + '. Linguagem executiva.';
          const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                  body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
          });
          if (!response.ok) return res.status(500).json({ error: 'Erro API ' + response.status });
          const data = await response.json();
          const rawText = (data.content && data.content[0] && data.content[0].text) || '';
          let jsonStr = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
          const s = jsonStr.indexOf('{'), e = jsonStr.lastIndexOf('}');
          if (s === -1 || e === -1) return res.status(500).json({ error: 'JSON nao encontrado' });
          let diag;
          try { diag = JSON.parse(jsonStr.substring(s, e + 1)); } catch(err) { return res.status(500).json({ error: 'JSON invalido: ' + err.message }); }
          if (!diag.perfil_atual || !diag.facetas || !diag.mapa_estrategico) return res.status(500).json({ error: 'Estrutura incompleta' });
          return res.status(200).json(diag);
    } catch (error) {
          return res.status(500).json({ error: error.message || 'Erro interno' });
    }
}
