// Diagnóstico Diamante — captura de lead no Notion CRM Pipeline.
// Não gera diagnóstico. Apenas grava as respostas como um card "Novo" no pipeline.
// Variáveis de ambiente necessárias no Vercel:
//   NOTION_TOKEN        -> token (secret) da integração interna do Notion
//   NOTION_DATABASE_ID  -> ID da database CRM Pipeline (ex: aba44cb1603a4f6ab549572d0a66bcc8)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  try {
    const body = req.body || {};
    const d = body.leadData || {};

    if (!d.nome) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
      return res.status(500).json({ error: 'Configuracao ausente (NOTION_TOKEN / NOTION_DATABASE_ID)' });
    }

    const desafios = Array.isArray(d.desafios) ? d.desafios : (d.desafios ? [d.desafios] : []);
    const origensValidas = ['Instagram', 'LinkedIn', 'Indicação', 'Outro'];
    const origem = origensValidas.indexOf(d.origem) >= 0 ? d.origem : 'Instagram';

    const resumo =
      'Cargo: ' + (d.cargo || '-') + ' | Setor: ' + (d.setor || '-') + ' | Nivel: ' + (d.nivel || '-') + '\n' +
      'Tempo no cargo: ' + (d.tempo || '-') + '\n' +
      'Evolucao (2 anos): ' + (d.evol || '-') + '\n' +
      'Desafios: ' + (desafios.join(' | ') || '-') + '\n' +
      'Objetivo (2 anos): ' + (d.amb || '-') + '\n' +
      'Clareza estrategica (1-5): ' + (d.esc || '-') + '\n' +
      'Maior obstaculo: ' + (d.obst || '-') + '\n' +
      'E-mail: ' + (d.email || '-');

    const properties = {
      'Lead': { title: [{ text: { content: String(d.nome).slice(0, 200) } }] },
      'Etapa': { status: { name: 'Novo' } },
      'Origem': { select: { name: origem } },
      'Temperatura': { select: { name: 'Morno' } },
      'WhatsApp (telefone)': { rich_text: [{ text: { content: String(d.wpp || '').slice(0, 200) } }] },
      'Notas': { rich_text: [{ text: { content: resumo.slice(0, 1990) } }] },
      'Próximo passo': { rich_text: [{ text: { content: 'Rodar análise e preparar Diagnóstico Diamante para a devolutiva' } }] }
    };

    const children = [
      h2('Diagnóstico Diamante, respostas do lead'),
      para('Nome: ' + (d.nome || '-')),
      para('Cargo: ' + (d.cargo || '-') + '  |  Setor: ' + (d.setor || '-') + '  |  Nível: ' + (d.nivel || '-')),
      para('WhatsApp: ' + (d.wpp || '-') + '  |  E-mail: ' + (d.email || '-')),
      h3('Momento de carreira'),
      bullet('Tempo no mesmo cargo/nível: ' + (d.tempo || '-')),
      bullet('Evolução nos últimos 2 anos: ' + (d.evol || '-')),
      h3('Desafios'),
      ...(desafios.length ? desafios.map(bullet) : [para('-')]),
      h3('Visão e clareza'),
      bullet('Objetivo nos próximos 2 anos: ' + (d.amb || '-')),
      bullet('Clareza estratégica (1 a 5): ' + (d.esc || '-')),
      h3('Maior obstáculo'),
      para(d.obst || '-')
    ];

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: properties,
        children: children
      })
    });

    if (!notionRes.ok) {
      const detail = await notionRes.text();
      return res.status(502).json({ error: 'Notion ' + notionRes.status, detail: detail.slice(0, 400) });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: (error && error.message) || 'Erro interno' });
  }
};

function rt(content) {
  return [{ type: 'text', text: { content: String(content || '-').slice(0, 1990) } }];
}
function h2(t) { return { object: 'block', type: 'heading_2', heading_2: { rich_text: rt(t) } }; }
function h3(t) { return { object: 'block', type: 'heading_3', heading_3: { rich_text: rt(t) } }; }
function para(t) { return { object: 'block', type: 'paragraph', paragraph: { rich_text: rt(t) } }; }
function bullet(t) { return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: rt(t) } }; }
