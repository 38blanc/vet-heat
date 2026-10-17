/* VET Heat – koppeling met de cloud (Supabase) en met VET Work.
 * Gebruikt de globale toestand S en de functies uit index.html. */
let CS = { state: 'uit' };
const splitPc = (adres) => { const m = String(adres || '').match(/^(.*?)[,\s]+(\d{4}\s+.+)$/); return m ? { straat: m[1].trim(), pc: m[2].trim() } : { straat: adres || '', pc: '' }; };
const toShared = (c) => ({ n: c.n || '', straat: c.straat || '', pc: c.pc || '', adres: [c.straat, c.pc].filter(Boolean).join(', '), tel: c.tel || '', mail: c.mail || '', inst: c.inst || null });

const CLOUD = VETSync.create({
  app: 'heat',
  pullApps: ['heat', 'shared'],
  collect() {
    const out = [];
    S.jobs.forEach((j) => out.push({ app: 'heat', kind: 'job', id: j.id, data: j }));
    S.clients.forEach((c) => out.push({ app: 'shared', kind: 'client', id: c.id, data: toShared(c) }));
    out.push({ app: 'heat', kind: 'settings', id: 'main', data: { cfg: S.cfg, seq: S.seq, tsig: S.tsig || '' } });
    (S.outbox || []).forEach((o) => out.push({ app: 'work', kind: 'order', id: o.id, data: o }));
    // VEKA-status gedeeld met VET Office
    S.jobs.filter((j) => j.veka).forEach((j) => out.push({ app: 'shared', kind: 'veka', id: j.id, data: { ok: !!j.veka.ok, d: j.veka.d || '' } }));
    return out;
  },
  async apply(rows) {
    let curChanged = false; // open onderhoud gewijzigd op ander toestel?
    for (const r of rows) {
      if (r.kind === 'job') {
        const i = S.jobs.findIndex((j) => j.id === r.id);
        if (r.deleted) { if (i > -1) S.jobs.splice(i, 1); }
        else if (i > -1) S.jobs[i] = r.data; else S.jobs.unshift(r.data);
        if (r.id === cur) curChanged = true;
      } else if (r.kind === 'client') {
        if (r.deleted) { S.clients = S.clients.filter((c) => c.id !== r.id); continue; }
        const d = r.data, sp = d.straat || d.pc ? { straat: d.straat || '', pc: d.pc || '' } : splitPc(d.adres);
        let c = S.clients.find((x) => x.id === r.id);
        if (!c) {
          // zelfde klant (naam) met een ander id: neem het id van de cloud over
          const twin = S.clients.find((x) => x.n.trim().toLowerCase() === (d.n || '').trim().toLowerCase());
          if (twin) { const old = twin.id; twin.id = r.id; S.jobs.forEach((j) => { if (j.cid === old) j.cid = r.id; }); CLOUD.markDeleted('shared', 'client', old); c = twin; }
          else { c = { id: r.id }; S.clients.push(c); }
        }
        Object.assign(c, { n: d.n || '', straat: sp.straat, pc: sp.pc, tel: d.tel || '', mail: d.mail || '' });
        if (d.inst) c.inst = d.inst;
      } else if (r.kind === 'veka') {
        const j = S.jobs.find((x) => x.id === r.id); if (j && !r.deleted) { j.veka = { ok: !!r.data.ok, d: r.data.d || '' }; if (j.id === cur) curChanged = true; }
      } else if (r.kind === 'settings' && !r.deleted) {
        const d = r.data || {};
        if (d.cfg) S.cfg = Object.assign(S.cfg, d.cfg);
        S.seq = Math.max(S.seq || 0, d.seq || 0);
        if (d.tsig) S.tsig = d.tsig;
      }
    }
    await save(true);
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (!typing && !(v === 'job' && !curChanged && !rows.some((r) => r.kind === 'client'))) R();
  },
  onPushed(rows) {
    // verstuurde werkbonnen zijn nu van VET Work: uit de wachtrij halen
    const sent = rows.filter((r) => r.app === 'work').map((r) => r.id);
    if (sent.length) { S.outbox = (S.outbox || []).filter((o) => !sent.includes(o.id)); save(true); }
  },
  onStatus(st) { CS = st; const e = document.getElementById('cloudst'); if (e) e.outerHTML = CLOUDST(); const c = document.getElementById('cloudcard'); if (c && CLOUD.session()) c.outerHTML = CLOUDCARD(); /* inlogformulier niet overschrijven terwijl je typt */ }
});

const hm2 = (t) => t ? new Date(t).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) : '';
const CLOUDST = () => {
  if (!CLOUD.session()) return '<span id="cloudst"></span>';
  const s = CS.state, t = { ok: '☁︎ Gesynchroniseerd ' + hm2(CS.last), bezig: '☁︎ Synchroniseren…', offline: '☁︎ Offline – wordt later verstuurd', fout: '⚠ Sync-fout – tik voor details' }[s] || '☁︎';
  return `<span id="cloudst" class="mu" style="font-size:13px;cursor:pointer;${s === 'fout' ? 'color:var(--rd)' : ''}" onclick="go('set')">${t}</span>`;
};
const CLOUDCARD = () => {
  const s = CLOUD.session();
  if (!s) return `<div class="c" id="cloudcard"><h2>Cloud (VET Heat + VET Work)</h2><p class="mu">Log in om je gegevens automatisch te bewaren in de cloud en te delen met VET Work en je andere toestellen.</p>
<label class="f"><span>E-mail</span><input id="ce" type="email" autocomplete="username"></label><label class="f"><span>Wachtwoord</span><input id="cp" type="password" autocomplete="current-password"></label>
<button onclick="cloudLogin(this)">Inloggen</button>${CS.error ? `<p class="hint" style="margin-top:8px">${esc(CS.error)}</p>` : ''}${window.VERSIEKAART ? VERSIEKAART() : ''}</div>`;
  return `<div class="c" id="cloudcard"><h2>Cloud (VET Heat + VET Work)</h2><p style="margin:0 0 6px">Ingelogd als <b>${esc(s.user.email)}</b></p>
<p class="mu" style="margin:0 0 10px">${{ ok: '✓ Alles gesynchroniseerd om ' + hm2(CS.last), bezig: 'Bezig met synchroniseren…', offline: 'Geen internet: wijzigingen worden verstuurd zodra je weer online bent.', fout: 'Fout: ' + esc(CS.error || '') }[CS.state] || ''}</p>
<div class="row wrap"><button class="b2" onclick="CLOUD.sync()">Nu synchroniseren</button><button class="b2" onclick="vetUitloggen()">Uitloggen</button></div>${window.VERSIEKAART ? VERSIEKAART() : ''}</div>`;
};
async function cloudLogin(btn) {
  const e = $('#ce').value, p = $('#cp').value; if (!e || !p) return;
  btn.disabled = true; btn.textContent = 'Inloggen…';
  try { await CLOUD.login(e, p); R(); } catch (x) { CS.error = x.message; alert('Inloggen mislukt: ' + x.message); btn.disabled = false; btn.textContent = 'Inloggen'; }
}

/* ---------- werkbon in VET Work aanmaken ---------- */
const tsOf = (d, hhmm) => { if (!d || !hhmm) return 0; const [h, m] = hhmm.split(':').map(Number); const t = new Date(d); t.setHours(h, m, 0, 0); return t.getTime(); };
function makeWerkbon() {
  const j = J();
  if (!CLOUD.session()) return alert('Log eerst in bij Cloud (Instellingen) om werkbonnen naar VET Work te sturen.');
  if (j.wb && !confirm('Er werd al een werkbon gemaakt op ' + dt(j.wb.d) + '. Nog een werkbon maken?')) return;
  const arts = (S.cfg.wbArt || 'Onderhoud verwarmingsketel\nVerbrandingsanalyse').split('\n').map((x) => x.trim()).filter(Boolean);
  const s = tsOf(j.datum, j.van), e = tsOf(j.datum, j.tot);
  const o = {
    id: 'h' + Date.now().toString(36), nr: '', datum: j.datum, klant: j.klant.n, adres: [j.klant.straat, j.klant.pc].filter(Boolean).join(', '), tel: j.klant.tel, mail: j.klant.mail,
    omschr: [j.verb.soort === 'keuring' ? 'Keuring vóór eerste ingebruikname' : 'Onderhoud', [j.toestel.merk, j.toestel.type].filter(Boolean).join(' '), j.at.anders ? '– toestel: ' + [j.at.straat, j.at.pc].filter(Boolean).join(', ') : '', '– attest ' + j.nr].filter(Boolean).join(' '),
    t: s && e && e > s ? [{ s, e }] : [], werk: arts.map((n) => ({ n, q: 1 })), opm: j.gebreken && j.gebreken !== 'Geen.' ? 'Gebreken: ' + j.gebreken : '', fotos: [], sig: '', sigNaam: j.klant.n,
    status: 'open', od: { ja: 0, t: '' }, sm: 0, btw: '', pr: 0, src: { app: 'heat', id: j.id, nr: j.nr }
  };
  S.outbox = (S.outbox || []).concat(o); j.wb = { id: o.id, d: today() }; save(); R(); CLOUD.sync();
  alert('Werkbon klaargezet voor VET Work. Open VET Work: hij verschijnt bij de open werkbonnen.');
}
/* ---------- attesten naar VET Office (samen met de werkbon factureren) ---------- */
async function naarOffice(id, stil) {
  const j = id ? S.jobs.find((x) => x.id === id) : J();
  if (!CLOUD.session()) { if (!stil) alert('Log eerst in bij Cloud (Instellingen) om naar VET Office te sturen.'); return; }
  const file = await new Promise((res) => { window._vang = res; setTimeout(() => { if (window._vang === res) { window._vang = null; res(null); } }, 30000); pdf(j.id, 'beide'); });
  if (!file) return;
  const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
  j.office = { pdf: data, nm: file.name, d: new Date().toISOString() }; await save(); R(); CLOUD.sync();
  if (!stil) alert('Attest(en) naar VET Office gestuurd. Ze staan daar samen met de werkbon klaar om te factureren.');
}
// bij "Onderhoud afronden" de attesten automatisch naar VET Office sturen
if (typeof fin === 'function') { const _fin = fin; window.fin = function () { _fin.apply(this, arguments); setTimeout(() => { const j = J(); if (j && j.status === 'afgewerkt' && CLOUD.session() && !j.office) naarOffice(j.id, true); }, 600); }; }
// beschikbaar maken voor index.html (const/let staan niet op window)
Object.assign(window, { CLOUD, CLOUDST, CLOUDCARD, naarOffice });
if (typeof R === 'function' && typeof v !== 'undefined' && (v === 'list' || v === 'set')) try { R(); } catch (e) {}
