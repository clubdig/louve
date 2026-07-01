const https = require('https');
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dGx0cWZud2pmcXJwZmJ5cnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAxMzcyOSwiZXhwIjoyMDk3NTg5NzI5fQ.yMu4HZn6p6Gni84YXs5LssNDU7lL93y44I309CbL-IU';
const SUPABASE_URL = 'https://avtltqfnwjfqrpfbyrsn.supabase.co';

function api(path, method, body) {
  return new Promise((resolve, reject) => {
    const u = new globalThis.URL(path, SUPABASE_URL);
    const h = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers: h }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const instrumentistas = [
  { nome: 'Daniel', email: 'daniel@louve.com', funcao: 'teclado' },
  { nome: 'Anderson', email: 'anderson@louve.com', funcao: 'teclado' },
  { nome: 'Zé', email: 'ze@louve.com', funcao: 'guitarra' },
  { nome: 'Guilherme', email: 'guilherme-inst@louve.com', funcao: 'violao' },
  { nome: 'Lucas', email: 'lucas@louve.com', funcao: 'violao' },
  { nome: 'Thiago', email: 'thiago@louve.com', funcao: 'violao' },
  { nome: 'Jussyhe', email: 'jussyhe@louve.com', funcao: 'bateria' },
  { nome: 'Naldinho', email: 'naldinho@louve.com', funcao: 'bateria' },
  { nome: 'Maurício', email: 'mauricio@louve.com', funcao: 'bateria' },
  { nome: 'Renê', email: 'rene@louve.com', funcao: 'baixo' },
  { nome: 'Valcemberg', email: 'valcemberg@louve.com', funcao: 'baixo' },
];

async function main() {
  // Get existing users
  const existingUsers = await api('/rest/v1/usuarios?select=id,email', 'GET');
  const existingMap = {};
  if (Array.isArray(existingUsers)) existingUsers.forEach(u => { existingMap[u.email] = u.id; });

  // Get auth users
  const authRes = await api('/auth/v1/admin/users?per_page=200', 'GET');
  const authMap = {};
  if (authRes.users) authRes.users.forEach(u => { if (u.email) authMap[u.email] = u.id; });

  const userMap = {};

  for (const inst of instrumentistas) {
    userMap[inst.nome] = existingMap[inst.email] || authMap[inst.email];

    if (!existingMap[inst.email]) {
      // Create auth user
      if (!authMap[inst.email]) {
        const a = await api('/auth/v1/admin/users', 'POST', {
          email: inst.email, password: 'louve123', email_confirm: true,
          user_metadata: { nome: inst.nome, funcao: inst.funcao },
        });
        if (a.id) {
          authMap[inst.email] = a.id;
          userMap[inst.nome] = a.id;
          console.log(`Auth: ${inst.nome} (${a.id})`);
        }
      }
      // Insert into usuarios
      const uid = userMap[inst.nome];
      if (uid) {
        await api('/rest/v1/usuarios', 'POST', {
          id: uid, nome: inst.nome, email: inst.email, funcao: inst.funcao, status: 'ativo'
        });
        console.log(`Tabela: ${inst.nome}`);
      }
    } else {
      // Update function if needed
      await api(`/rest/v1/usuarios?email=eq.${inst.email}`, 'PATCH', { funcao: inst.funcao });
      console.log(`✓ ${inst.nome} (${userMap[inst.nome]}) [funcao: ${inst.funcao}]`);
    }
    await sleep(500);
  }

  // Get existing cultos
  const cultos = await api('/rest/v1/cultos?select=id,data&order=data', 'GET');
  const cultoMap = {};
  if (Array.isArray(cultos)) cultos.forEach(c => { cultoMap[c.data] = c.id; });

  // Delete old instrumental escalas (keep vocal ones)
  const allEscalas = await api('/rest/v1/escalas?select=id,funcao,culto_id', 'GET');
  if (Array.isArray(allEscalas)) {
    const instFuncoes = ['teclado', 'guitarra', 'violao', 'bateria', 'baixo'];
    for (const e of allEscalas) {
      if (instFuncoes.includes(e.funcao)) {
        await api(`/rest/v1/escalas?id=eq.${e.id}`, 'DELETE');
      }
    }
  }

  // Create instrumental escalas
  const escalas = [
    { data: '2026-06-07', musicos: [
      { nome: 'Daniel', funcao: 'teclado' },
      { nome: 'Jussyhe', funcao: 'bateria' },
      { nome: 'Zé', funcao: 'guitarra' },
      { nome: 'Thiago', funcao: 'violao' },
      { nome: 'Renê', funcao: 'baixo' },
    ]},
    { data: '2026-06-14', musicos: [
      { nome: 'Anderson', funcao: 'teclado' },
      { nome: 'Naldinho', funcao: 'bateria' },
      { nome: 'Zé', funcao: 'guitarra' },
      { nome: 'Lucas', funcao: 'violao' },
      { nome: 'Valcemberg', funcao: 'baixo' },
    ]},
    { data: '2026-06-21', musicos: [
      { nome: 'Daniel', funcao: 'teclado' },
      { nome: 'Maurício', funcao: 'bateria' },
      { nome: 'Zé', funcao: 'guitarra' },
      { nome: 'Guilherme', funcao: 'violao' },
      { nome: 'Renê', funcao: 'baixo' },
    ]},
    { data: '2026-06-28', musicos: [
      { nome: 'Anderson', funcao: 'teclado' },
      { nome: 'Naldinho', funcao: 'bateria' },
      { nome: 'Thiago', funcao: 'guitarra' },
      { nome: 'Lucas', funcao: 'violao' },
      { nome: 'Valcemberg', funcao: 'baixo' },
    ]},
  ];

  console.log('\nEscalas instrumentais:');
  for (const esc of escalas) {
    const cultoId = cultoMap[esc.data];
    if (!cultoId) { console.log(`Culto ${esc.data} não encontrado`); continue; }
    for (const m of esc.musicos) {
      const uid = userMap[m.nome];
      if (uid) {
        await api('/rest/v1/escalas', 'POST', {
          culto_id: cultoId, usuario_id: uid, funcao: m.funcao, confirmado: false
        });
        console.log(`  ${esc.data} - ${m.nome} (${m.funcao})`);
      }
    }
  }

  console.log('\nPronto!');
}

main().catch(console.error);
