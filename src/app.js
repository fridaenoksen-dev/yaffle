(() => {
"use strict";
const blobUrl = id => window.yaffleFiles ? window.yaffleFiles.url(id) : undefined;
window.addEventListener("yaffle:files", () => render());

/* ---------- helpers ---------- */
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const [k,v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'svg') el.innerHTML = v;           // only our own static icons
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(9)){
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ICONS = {
  flight:'<svg viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  car:'<svg viewBox="0 0 24 24"><path d="M5 16V12l2-5h10l2 5v4"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/><path d="M5 12h14"/></svg>',
  taxi:'<svg viewBox="0 0 24 24"><path d="M10 4h4v3"/><path d="M5 16V12l2-5h10l2 5v4"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="18" r="1.6"/><circle cx="16.5" cy="18" r="1.6"/></svg>',
  parking:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3"/></svg>',
  stay:'<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  food:'<svg viewBox="0 0 24 24"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 0-3 2-3 5s1 4 3 4v9"/></svg>',
  activity:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  other:'<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></svg>',
  idea:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  cup:'<svg viewBox="0 0 24 24"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  museum:'<svg viewBox="0 0 24 24"><path d="M3 9 12 4l9 5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/></svg>',
  train:'<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/><path d="m8 21 2-4M16 21l-2-4"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  clip:'<svg viewBox="0 0 24 24"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5"/></svg>'
};
const KINDS = [
  ['car','Bil'],['parking','Parkering'],['flight','Fly'],['taxi','Taxi'],['stay','Overnatting'],['food','Mat'],['activity','Aktivitet'],['other','Annet']
];
const KIND_LABEL = Object.fromEntries(KINDS);
const CUR = {NOK:'kr', PLN:'zł', EUR:'€'};

const CATS = {
  'Mat':      {bg:'#fbe4e4', ink:'#a11d24', icon:'food'},
  'Kafé':     {bg:'#f4e6d8', ink:'#7a4416', icon:'cup'},
  'Shopping': {bg:'#fbefd6', ink:'#8a5a00', icon:'bag'},
  'Museum':   {bg:'#dcebf3', ink:'#0b4c72', icon:'museum'},
  'Se':       {bg:'#e2f6d5', ink:'#163300', icon:'activity'},
  'Utflukt':  {bg:'#d9efe6', ink:'#054d28', icon:'train'},
  'Kveld':    {bg:'#e6e0f3', ink:'#3d2a78', icon:'moon'},
  'Annet':    {bg:'#eef0ec', ink:'#3e403d', icon:'other'}
};
function catOf(name){ const k = Object.keys(CATS).find(c => c.toLowerCase() === String(name||'').trim().toLowerCase()); return k ? [k, CATS[k]] : [name ? String(name) : 'Annet', CATS.Annet]; }
function catStyle(c){ return '--c-bg:' + c.bg + ';--c-ink:' + c.ink + ';'; }
const WD = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
const MON = ['jan.','feb.','mars','april','mai','juni','juli','aug.','sep.','okt.','nov.','des.'];
const MONL = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
const nf = new Intl.NumberFormat('nb-NO', {maximumFractionDigits:0});
const cap = s => s ? s[0].toUpperCase()+s.slice(1) : s;
const isoDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const D = iso => new Date(iso + 'T12:00:00Z');
function dayLabel(iso, short){
  const d = D(iso); const w = WD[d.getUTCDay()];
  return short ? cap(w.slice(0,3)) + ' ' + d.getUTCDate() + '.' : cap(w) + ' ' + d.getUTCDate() + '. ' + MON[d.getUTCMonth()];
}
function money(n, cur){ return nf.format(n) + ' ' + (CUR[cur] || cur || 'kr'); }
const PALETTE = ['#054d28','#0b4c72','#cb272f','#8a5a00','#5b2c6f','#2f6f6a'];
function hashColor(s){ let x=0; for (const c of String(s)) x = (x*31 + c.charCodeAt(0)) | 0; return PALETTE[Math.abs(x) % PALETTE.length]; }

const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheetBody');
/* ---------- state ---------- */
const S = {
  db:null, user:null, assets:null, me:null, canWrite:true,
  trip:null, items:[], ideas:[], members:{}, profiles:{},
  loaded:{trip:false, items:false, ideas:false, members:false}, confirmed:false, timedOut:false, noDb:false,
  view: ['plan','ideer','papirer'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'plan',
  filter:'all', pending:new Set(), joined:false, skipNick:false, flash:new Set(), prevAllIn:null
};
try { S.skipNick = sessionStorage.getItem('yaffle-skip-nick') === '1'; } catch(e){}

function nameOf(uid){
  if (!uid) return 'Claude';
  return (S.members[uid] && S.members[uid].nick) || (S.profiles[uid] && S.profiles[uid].name) || 'Noen';
}
function colorOf(uid){ return (S.profiles[uid] && S.profiles[uid].color) || hashColor(uid); }
function face(uid, sm){
  const n = nameOf(uid);
  return h('span', {class:'face' + (sm ? ' sm' : ''), style:'background:' + colorOf(uid), title:n, 'aria-label':n}, n.trim()[0] ? n.trim()[0].toUpperCase() : '?');
}
function groupSize(){ return Math.max(1, Number(S.trip && S.trip.groupSize) || Object.keys(S.members).length || 1); }
function memberIds(){ return Object.keys(S.members); }
function heartsOf(idea){ return Object.entries(idea.hearts || {}).filter(([,v]) => v === true).map(([k]) => k); }
function isAllIn(idea){ const n = heartsOf(idea).length; return groupSize() > 1 && n >= groupSize(); }

function tripDays(){
  const t = S.trip; if (!t || !isoDate(t.start) || !isoDate(t.end)) return [];
  const out = []; let d = D(t.start); const e = D(t.end);
  while (d <= e && out.length < 31){ out.push(d.toISOString().slice(0,10)); d = new Date(d.getTime() + 864e5); }
  return out;
}

let toastTimer;
function toast(msg){
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = h('div', {class:'toast', role:'status'}, msg); document.body.append(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 4200);
}

async function write(path, fn){
  if (!S.db){ toast('Logg inn for å gjøre endringer.'); return false; }
  if (S.pending.has(path)) return false;
  S.pending.add(path);
  try { await fn(); return true; }
  catch(e){
    const code = e && e.code;
    if (code === 'unavailable'){
      await sleep(400 + Math.random()*700);
      try { await fn(); return true; } catch(e2){ toast('Fikk ikke lagret. Prøv igjen om litt.'); }
    } else if (code === 'invalid_argument'){
      S.canWrite = false; toast('Du kan se turen, men ikke endre den. Be den som administrerer turen om å legge til e-posten din.'); render();
    } else if (code === 'quota_exceeded'){ toast('Lagringsplassen er full. Slett noe før du legger til mer.'); }
    else if (code === 'revoked'){ S.canWrite = false; render(); }
    else toast('Fikk ikke lagret. Prøv igjen.');
    return false;
  } finally { S.pending.delete(path); }
}

/* ---------- boot ---------- */
render();
(async () => {
  const c = window.claude;
  if (!c || !c.use){ S.noDb = true; render(); return; }
  const [db, user, assets] = await Promise.all([c.use('db'), c.use('user'), c.use('assets')]);
  S.db = db; S.user = user; S.assets = assets;
  if (!db){ S.noDb = true; render(); return; }
  if (user){
    try { S.me = await user.id(); } catch(e){}
    try { const w = await user.can('data.write'); if (w === false) S.canWrite = false; } catch(e){}
  }
  const timer = setTimeout(() => { if (!S.confirmed){ S.timedOut = true; render(); } }, 10000);
  const done = (key, snap) => {
    S.loaded[key] = true;
    if (snap && snap.metadata && !snap.metadata.fromCache && Object.values(S.loaded).every(Boolean)){ S.confirmed = true; S.timedOut = false; clearTimeout(timer); }
  };
  const onErr = key => e => { S.loaded[key] = true; clearTimeout(timer); if (e && e.code !== 'revoked') toast('Mistet kontakten med turen. Last inn siden på nytt.'); render(); };

  db.doc('trip/main').onSnapshot(s => { S.trip = s.exists ? s.data() : null; done('trip', s); render(); }, onErr('trip'));
  db.collection('items').onSnapshot(s => { S.items = s.docs.map(d => ({id:d.id, ...d.data()})); done('items', s); render(); }, onErr('items'));
  db.collection('ideas').onSnapshot(s => {
    S.ideas = s.docs.map(d => ({id:d.id, ...d.data()}));
    const now = new Set(S.ideas.filter(isAllIn).map(i => i.id));
    if (S.prevAllIn) for (const id of now) if (!S.prevAllIn.has(id)) S.flash.add(id);
    S.prevAllIn = now;
    done('ideas', s); render();
    if (detailId && sheet.open) ideaDetail(detailId);
  }, onErr('ideas'));
  db.collection('members').onSnapshot(s => {
    S.members = Object.fromEntries(s.docs.map(d => [d.id, d.data()]));
    done('members', s);
    if (!s.metadata.fromCache) maybeJoin();
    refreshProfiles(); render();
  }, onErr('members'));
})();

async function maybeJoin(){
  if (S.joined || !S.me || !S.canWrite || S.members[S.me]) return;
  S.joined = true;
  let nick = '';
  try { const me = await S.user.me(); nick = me.name ? me.name.split(' ')[0] : ''; } catch(e){}
  await write('members/' + S.me, () => S.db.doc('members/' + S.me).set({nick, joinedAt: Date.now()}));
}

let profileKey = '';
async function refreshProfiles(){
  if (!S.user) return;
  const ids = new Set(memberIds());
  S.ideas.forEach(i => { if (i.addedBy) ids.add(i.addedBy); heartsOf(i).forEach(x => ids.add(x)); });
  S.items.forEach(i => { if (i.paidBy) ids.add(i.paidBy); });
  if (S.me) ids.add(S.me);
  const list = [...ids].sort(); if (!list.length) return;
  try {
    const ps = await S.user.profiles(list);
    const key = list.map(id => id + ':' + (ps[id] && ps[id].name) + (ps[id] && ps[id].color)).join('|');
    if (key !== profileKey){ profileKey = key; S.profiles = ps; render(); }
  } catch(e){}
}

window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (['plan','ideer','papirer'].includes(v) && v !== S.view){ S.view = v; render(); }
});
function go(v){ S.view = v; try { history.replaceState(null, '', '#' + v); } catch(e){ location.hash = v; } render(); }

/* ---------- render ---------- */
function render(){
  const app = document.getElementById('app');
  const y = window.scrollY;
  const hs = document.getElementById('plan-scroll'); const hx = hs ? hs.scrollLeft : null;
  const keep = {}; app.querySelectorAll('input[id]').forEach(el => { if (el.value) keep[el.id] = el.value; });
  const focusId = document.activeElement && app.contains(document.activeElement) ? document.activeElement.id : null;
  app.replaceChildren(...view());
  for (const [id, v] of Object.entries(keep)){ const el = document.getElementById(id); if (el && !el.value) el.value = v; }
  if (focusId){ const el = document.getElementById(focusId); if (el) el.focus({preventScroll:true}); }
  app.classList.toggle('wide', S.view === 'ideer' || S.view === 'plan');
  window.scrollTo(0, y);
  const hs2 = document.getElementById('plan-scroll'); if (hs2 && hx != null) hs2.scrollLeft = hx;
  S.flash.clear();
}

function view(){
  const loading = S.db && !S.loaded.trip;
  if (S.noDb) return [topBar(), h('div', {class:'empty', style:'margin-top:40px'}, h('h3', null, 'Turen vises ikke her'), h('p', null, 'Får ikke kontakt med databasen. Sjekk innstillingene i src/config.js.'))];
  if (loading && !S.timedOut) return [topBar(), h('p', {class:'muted', style:'margin-top:60px'}, 'Henter turen …')];
  if (S.db && !S.loaded.trip && S.timedOut) return [topBar(), h('div', {class:'notice'}, 'Får ikke kontakt med turen akkurat nå. Sjekk nettet, så prøver siden igjen av seg selv.')];

  if (S.me && S.canWrite && S.loaded.members && !S.skipNick && S.members[S.me] && !S.members[S.me].nick) return [topBar(), onboard()];

  if (!S.trip) return [topBar(), h('div', {class:'onboard'},
    h('h2', null, 'Hvor skal dere?'),
    h('p', null, 'Sett opp turen først, så kan dere legge inn reiseplan og idéer.'),
    S.canWrite ? h('button', {class:'btn dark', onclick:() => tripSheet()}, 'Sett opp turen') : h('p', null, 'Turen er ikke satt opp ennå.')
  )];

  const out = [topBar(), hero(), summary()];
  if (S.timedOut) out.push(h('div', {class:'notice'}, 'Får ikke kontakt akkurat nå, så det du ser kan være utdatert.'));
  if (!S.canWrite) out.push(h('div', {class:'notice'}, 'Du kan se turen, men ikke endre den. Be den som administrerer turen om å legge til e-posten din.'));
  out.push(...tabs());
  if (S.view === 'plan') out.push(...planView());
  else if (S.view === 'ideer') out.push(...boardView());
  else out.push(...papersView());
  if (S.canWrite){
    if (S.view === 'plan') out.push(h('button', {class:'btn primary fab', onclick:() => itemSheet(null, tripDays()[0])}, '+ Legg til booking'));
    if (S.view === 'ideer') out.push(h('button', {class:'btn primary fab', onclick:() => ideaSheet(null)}, '+ Ny idé'));
  }
  return out;
}

function topBar(){
  const ids = memberIds();
  return h('div', {class:'top'},
    h('div', {class:'brand'}, h('b', null, 'Yaffle'), h('i', null, 'Yay, waffles.')),
    h('div', {style:'display:flex;align-items:center;gap:12px'},
      ids.length ? h('div', {class:'faces', 'aria-label':'Med på turen'}, ids.slice(0,6).map(id => face(id))) : null,
      window.yaffleSignOut ? h('button', {class:'linkbtn', style:'font-size:14px;color:var(--muted)', onclick:() => window.yaffleSignOut()}, 'Logg ut') : null)
  );
}

function hero(){
  const t = S.trip, days = tripDays();
  let range = '';
  if (days.length){
    const a = D(days[0]), b = D(days[days.length-1]);
    range = a.getUTCMonth() === b.getUTCMonth()
      ? a.getUTCDate() + '.–' + b.getUTCDate() + '. ' + MONL[b.getUTCMonth()]
      : a.getUTCDate() + '. ' + MON[a.getUTCMonth()] + ' – ' + b.getUTCDate() + '. ' + MON[b.getUTCMonth()];
  }
  return h('header', {class:'hero'},
    h('div', {class:'eyebrow'}, t.note || 'Tur'),
    h('h1', null, t.title || 'Turen'),
    h('div', {class:'sub'},
      range ? h('span', null, range) : null,
      h('span', null, groupSize() + ' på tur'),
      S.canWrite ? h('button', {class:'linkbtn', onclick:() => tripSheet()}, 'Endre tur') : null
    )
  );
}

function countdown(){
  const days = tripDays(); if (!days.length) return {big:'Snart', small:''};
  const now = new Date(); const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const diff = Math.round((D(days[0]) - today) / 864e5);
  const left = Math.round((D(days[days.length-1]) - today) / 864e5);
  if (diff > 1) return {big: diff + ' dager', small:'til dere drar til ' + (S.trip.title || 'turen')};
  if (diff === 1) return {big:'I morgen!', small:'Pakk sekken'};
  if (left >= 0) return {big:'Dag ' + (1 - diff) + ' av ' + days.length, small:'God tur!'};
  return {big:'Hjemme igjen', small:'Håper det var en fin tur'};
}

function summary(){
  const cd = countdown();
  const toBook = S.items.filter(i => i.booked === 'no').length;
  const unpaid = S.items.filter(i => i.pay === 'unpaid').length;
  const unknown = S.items.filter(i => i.pay === 'unknown').length;
  const totals = {};
  S.items.forEach(i => { const c = Number(i.cost); if (c > 0){ const k = i.currency || 'NOK'; totals[k] = (totals[k] || 0) + c; } });
  const tot = Object.entries(totals);
  return h('section', {class:'summary', 'aria-label':'Oversikt'},
    h('div', {class:'big'}, cd.big, cd.small ? h('small', null, cd.small) : null),
    h('div', {class:'stats'},
      h('div', {class:'stat' + (toBook ? ' alert' : '')}, h('b', null, toBook), h('span', null, 'må bookes')),
      h('div', {class:'stat' + (unpaid ? ' alert' : '')}, h('b', null, unpaid), h('span', null, 'ikke betalt')),
      h('div', {class:'stat'}, h('b', null, unknown), h('span', null, 'betalt? sjekk'))
    ),
    h('div', {class:'money'}, tot.length
      ? tot.map(([c, n], i) => [i ? ' · ' : '', 'Totalt ', h('b', null, money(n, c)), ' (ca. ', money(Math.round(n / groupSize()), c), ' per person)'])
      : 'Legg inn pris på bookingene, så regner Yaffle ut hva det blir per person.')
  );
}

function tabs(){
  const nIdeas = S.ideas.filter(i => !isoDate(i.day) || !tripDays().includes(i.day)).length;
  const nFiles = S.items.reduce((a, i) => a + (i.attachments || []).length, 0);
  const t = (id, label, n) => h('button', {class:'tab', role:'tab', 'aria-selected': String(S.view === id), onclick:() => go(id)}, label, n ? h('sup', null, n) : null);
  const hints = {plan:'Alt dere har booket, dag for dag.', ideer:'Trykk på et kort for detaljer, gi hjerter, og flytt favorittene inn på en dag.', papirer:'Boardingkort, kvitteringer og bekreftelser samlet.'};
  return [h('nav', {class:'tabs', role:'tablist', 'aria-label':'Visning'}, t('plan','Plan'), t('ideer','Idéer', nIdeas), t('papirer','Papirer', nFiles)), h('p', {class:'tabhint'}, hints[S.view])];
}

/* ---------- plan ---------- */
function sortKey(x){ return (x.time || '') + '|' + String(x.order != null ? x.order : 999).padStart(4,'0') + '|' + (x.createdAt || 0); }

function planView(){
  const days = tripDays(); const cols = [];
  const stays = S.items.filter(i => i.kind === 'stay' && isoDate(i.date) && isoDate(i.endDate));
  const now = new Date(); const todayIso = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  days.forEach((day, idx) => {
    const entries = [
      ...S.items.filter(i => i.date === day).map(i => ({type:'item', x:i})),
      ...S.ideas.filter(i => i.day === day).map(i => ({type:'idea', x:i}))
    ].sort((a, b) => sortKey(a.x) < sortKey(b.x) ? -1 : 1);
    const sleeping = stays.filter(s => s.date < day && s.endDate > day);
    const d = D(day);
    cols.push(h('section', {class:'day' + (day === todayIso ? ' today' : ''), 'aria-label':dayLabel(day)},
      h('div', {class:'dayhead'},
        h('div', {class:'daynum'}, d.getUTCDate()),
        h('div', {class:'dayname'}, cap(WD[d.getUTCDay()]), h('span', null, 'Dag ' + (idx+1))),
        idx === 0 ? h('span', {class:'daytag'}, 'Avreise') : idx === days.length - 1 ? h('span', {class:'daytag'}, 'Hjemreise') : null
      ),
      h('div', {class:'stack', style:'flex:1;align-content:start'},
        sleeping.map(s => h('div', {class:'sleep'}, h('span', {class:'tile stay', style:'width:24px;height:24px;border-radius:8px', svg:ICONS.stay}), 'Dere bor på ', h('b', {style:'color:var(--ink)'}, s.title))),
        entries.map(e => e.type === 'item' ? itemCard(e.x) : plannedIdeaCard(e.x)),
        entries.length === 0 ? h('p', {class:'muted', style:'margin:4px'}, 'Fri dag så langt. Flytt en idé hit fra tavla.') : null
      ),
      S.canWrite ? h('button', {class:'addcard', style:'margin-top:10px', onclick:() => itemSheet(null, day)}, h('b', null, '+'), 'Legg til') : null
    ));
  });
  const loose = S.items.filter(i => !days.includes(i.date));
  if (loose.length) cols.push(h('section', {class:'day'},
    h('div', {class:'dayhead'}, h('div', {class:'dayname'}, 'Uten dato', h('span', null, 'Utenfor turdatoene'))),
    h('div', {class:'stack'}, loose.sort((a,b) => sortKey(a) < sortKey(b) ? -1 : 1).map(itemCard))
  ));
  if (!cols.length) return [h('div', {class:'empty'}, h('h3', null, 'Ingen datoer ennå'), h('p', null, 'Legg inn når turen starter og slutter, så får hver dag sin egen kolonne.'))];
  return [h('p', {class:'swipehint'}, 'Sveip sidelengs for å se alle dagene →'), h('div', {class:'hscroll', id:'plan-scroll', tabindex:'0', 'aria-label':'Reiseplan per dag'}, cols)];
}

function bookedPill(i){
  if (i.booked === 'na' || !i.booked) return null;
  const ok = i.booked === 'yes';
  return h('button', {class:'pill ' + (ok ? 'ok' : 'todo'), disabled: !S.canWrite, 'aria-label': (ok ? 'Booket' : 'Må bookes') + '. Trykk for å endre.',
    onclick:() => write('items/' + i.id, () => S.db.doc('items/' + i.id).update({booked: ok ? 'no' : 'yes'}))},
    h('span', {class:'dot'}), ok ? 'Booket' : 'Må bookes');
}
function payPill(i){
  if (i.pay === 'na' || !i.pay) return null;
  const map = {paid:['ok', 'Betalt' + (i.paidBy ? ' av ' + nameOf(i.paidBy) : '')], unpaid:['todo','Ikke betalt'], unknown:['unknown','Betalt?']};
  const [cls, label] = map[i.pay] || map.unknown;
  const next = i.pay === 'paid' ? {pay:'unpaid', paidBy:null} : {pay:'paid', paidBy: S.me || null};
  return h('button', {class:'pill ' + cls, disabled: !S.canWrite, 'aria-label': label + '. Trykk for å endre.',
    onclick:() => write('items/' + i.id, () => S.db.doc('items/' + i.id).update(next))},
    h('span', {class:'dot'}), label);
}

function fileChip(a){
  const src = blobUrl(a.id);
  const isImg = /^image\//.test(a.type || '');
  if (isImg) return h('button', {class:'file', onclick:() => lightbox(a)}, h('img', {src, alt:''}), h('span', null, a.name || 'Bilde'));
  return h('a', {class:'file', href:src, target:'_blank', rel:'noopener'}, h('span', {class:'ph'}, 'PDF'), h('span', null, a.name || 'Fil'));
}

function itemCard(i){
  const kind = i.kind || 'other';
  const range = isoDate(i.endDate) && i.endDate !== i.date ? dayLabel(i.date, true) + ' – ' + dayLabel(i.endDate, true) : null;
  const cost = Number(i.cost) > 0 ? money(Number(i.cost), i.currency) : null;
  const atts = i.attachments || [];
  const input = h('input', {type:'file', accept:'image/*,application/pdf', multiple:true, onchange: ev => { const f = [...ev.target.files]; ev.target.value = ''; attach(i, f); }});
  return h('article', {class:'card'},
    h('div', {class:'tile ' + kind, svg: ICONS[kind] || ICONS.other, 'aria-hidden':'true'}),
    h('div', {class:'body-col'},
      h('div', {class:'kicker'}, i.time ? h('span', {class:'time'}, i.time) : null, h('span', null, KIND_LABEL[kind] || 'Annet'), range ? h('span', null, range) : null),
      h('h3', null, i.title || 'Uten navn'),
      i.details ? h('p', {class:'details'}, i.details) : null,
      (i.ref || cost) ? h('div', {class:'meta'},
        i.ref ? h('span', null, 'Ref ', h('button', {class:'refbtn', title:'Kopier', onclick: async () => { try { await navigator.clipboard.writeText(i.ref); toast('Kopiert: ' + i.ref); } catch(e){ toast('Kunne ikke kopiere. Ref: ' + i.ref); } }}, i.ref)) : null,
        cost ? h('span', null, h('b', null, cost), groupSize() > 1 ? ' · ' + money(Math.round(Number(i.cost) / groupSize()), i.currency) + ' hver' : '') : null
      ) : null
    ),
    S.canWrite ? h('button', {class:'iconbtn edit', onclick:() => itemSheet(i)}, 'Endre') : h('span'),
    (bookedPill(i) || payPill(i)) ? h('div', {class:'pills'}, bookedPill(i), payPill(i)) : null,
    (atts.length || S.assets) ? h('div', {class:'files'},
      atts.map(fileChip),
      S.assets && S.canWrite ? h('label', {class:'attach'}, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), atts.length ? 'Legg ved mer' : 'Legg ved kvittering', input) : null
    ) : null
  );
}

function plannedIdeaCard(i){
  return h('article', {class:'card'},
    h('div', {class:'tile idea', svg:ICONS.idea, 'aria-hidden':'true'}),
    h('div', {class:'body-col'},
      h('div', {class:'kicker'}, i.time ? h('span', {class:'time'}, i.time) : null, h('span', null, i.category || 'Fra idétavla')),
      h('h3', null, i.title || 'Idé'),
      i.note ? h('p', {class:'details'}, i.note) : null,
      safeUrl(i.link) ? h('div', {class:'meta'}, h('a', {href:safeUrl(i.link), target:'_blank', rel:'noopener', style:'color:var(--ink)'}, 'Åpne lenke')) : null
    ),
    S.canWrite ? h('button', {class:'iconbtn edit', onclick:() => ideaSheet(i)}, 'Endre') : h('span'),
    h('div', {class:'pills'}, heartBtn(i), S.canWrite ? h('button', {class:'pill neutral', onclick:() => moveIdea(i, null)}, 'Tilbake til tavla') : null)
  );
}

/* ---------- board ---------- */
function safeUrl(u){ if (!u) return null; try { const x = new URL(u.includes('://') ? u : 'https://' + u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch(e){ return null; } }

function heartBtn(i){
  const who = heartsOf(i); const mine = S.me && who.includes(S.me);
  return h('div', {class:'hearts'},
    h('button', {class:'heart', 'aria-pressed': String(!!mine), disabled: !S.canWrite || !S.me,
      'aria-label': (mine ? 'Fjern hjertet ditt' : 'Gi hjerte') + ' (' + who.length + ' av ' + groupSize() + ')',
      onclick:() => { if (!S.me) return toast('Logg inn for å gi hjerter.'); write('ideas/' + i.id, () => S.db.doc('ideas/' + i.id).update({hearts:{[S.me]: !mine}})); }},
      h('span', {svg:ICONS.heart, style:'display:inline-flex'}), who.length + '/' + groupSize()),
    who.length ? h('div', {class:'faces'}, who.slice(0,5).map(id => face(id, true))) : null
  );
}

async function moveIdea(i, day){
  await write('ideas/' + i.id, () => S.db.doc('ideas/' + i.id).update({day: day || null}));
  if (day) toast('Lagt til ' + dayLabel(day).toLowerCase());
}

function boardView(){
  const days = tripDays();
  const planned = i => isoDate(i.day) && days.includes(i.day);
  let list = S.ideas.slice();
  if (S.filter === 'open') list = list.filter(i => !planned(i));
  if (S.filter === 'allin') list = list.filter(isAllIn);
  list.sort((a, b) => (planned(a) - planned(b)) || (heartsOf(b).length - heartsOf(a).length) || ((a.createdAt || 0) - (b.createdAt || 0)));

  const quick = S.canWrite ? (() => {
    const inp = h('input', {class:'input', id:'quick-idea', placeholder:'Fest en idé på tavla …', maxlength:'120', 'aria-label':'Ny idé'});
    const add = async () => { const v = inp.value.trim(); if (!v) return inp.focus(); inp.value = ''; await addIdea({title:v, category:'Annet'}); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); add(); } });
    return h('div', {class:'quickadd'}, inp, h('button', {class:'btn dark', onclick:add}, 'Fest'));
  })() : null;

  const seg = (id, label) => h('button', {'aria-pressed': String(S.filter === id), onclick:() => { S.filter = id; render(); }}, label);
  const drops = S.canWrite && days.length ? h('div', {class:'drops'},
    h('p', {class:'drops-label'}, 'Dra et kort hit for å legge det til en dag:'),
    days.map(d => dropZone(d, dayLabel(d, true))), dropZone(null, 'Tilbake til tavla')) : null;

  const grid = list.length ? h('div', {class:'masonry'}, list.map(ideaCard)) : h('div', {class:'empty'},
    h('h3', null, S.ideas.length ? 'Ingen idéer her' : 'Tavla er tom'),
    h('p', null, S.ideas.length ? 'Prøv et annet filter.' : 'Fest det første forslaget: en kafé, et museum, en dagstur. Gi hjerter til det dere vil gjøre.'));

  return [quick, h('div', {class:'boardbar'}, h('div', {class:'seg', role:'group', 'aria-label':'Filter'}, seg('all','Alle'), seg('open','Ikke planlagt'), seg('allin','Alle er med'))), drops, grid];
}

function dropZone(day, label){
  const el = h('button', {class:'drop', onclick:() => toast('Dra et idékort hit, eller velg dag på kortet.')}, label);
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); const i = S.ideas.find(x => x.id === id); if (i) moveIdea(i, day); });
  return el;
}

function hashNum(id){ let x = 7; for (const c of String(id)) x = (x*33 + c.charCodeAt(0)) >>> 0; return x; }

function ideaCard(i){
  const days = tripDays(); const allin = isAllIn(i);
  const planned = isoDate(i.day) && days.includes(i.day);
  const [cname, c] = catOf(i.category);
  const who = heartsOf(i); const mine = S.me && who.includes(S.me);
  const heights = [190, 240, 160, 280, 210];
  const media = i.photo
    ? h('img', {src:blobUrl(i.photo), alt:'', loading:'lazy'})
    : h('div', {class:'art', style:catStyle(c) + 'background:var(--c-bg);min-height:' + heights[hashNum(i.id) % heights.length] + 'px'},
        h('span', {svg: ICONS[c.icon] || ICONS.other, style:'display:inline-flex;justify-content:flex-end;width:100%'}),
        h('b', null, i.title || 'Idé'));
  const el = h('button', {class:'pin' + (S.flash.has(i.id) ? ' flash' : ''), type:'button', draggable: S.canWrite ? 'true' : null, onclick:() => ideaDetail(i.id),
      'aria-label': (i.title || 'Idé') + ', ' + cname + ', ' + who.length + ' hjerter'},
    h('span', {class:'ph', style:catStyle(c)},
      media,
      h('span', {class:'tag'}, cname),
      allin ? h('span', {class:'allin'}, 'Alle er med!') : null,
      h('span', {class:'heartcount' + (mine ? ' mine' : '')}, h('span', {svg:ICONS.heart, style:'display:inline-flex'}), who.length + '/' + groupSize())
    ),
    h('span', {class:'cap'},
      h('h3', null, i.title || 'Idé'),
      h('span', null, planned ? 'Planlagt ' + dayLabel(i.day, true).toLowerCase() + (i.time ? ' kl. ' + i.time : '') : (i.addedBy ? 'Festet av ' + nameOf(i.addedBy) : 'Forslag fra Claude'))
    )
  );
  el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i.id); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  return el;
}

let detailId = null;
function ideaDetail(id){
  const i = S.ideas.find(x => x.id === id); if (!i){ if (sheet.open && detailId) sheet.close(); return; }
  detailId = id;
  const days = tripDays(); const [cname, c] = catOf(i.category);
  const planned = isoDate(i.day) && days.includes(i.day);
  const url = safeUrl(i.link);
  const time = h('input', {class:'input', type:'time', id:'d-time', value:i.time || '', style:'max-width:160px', disabled: !S.canWrite,
    onchange: e => write('ideas/' + i.id, () => S.db.doc('ideas/' + i.id).update({time: e.target.value || ''}))});
  openSheet(
    h('div', {class:'detail-hero', style:catStyle(c)}, i.photo ? h('img', {src:blobUrl(i.photo), alt:''})
      : h('div', {class:'art', style:'background:var(--c-bg)'}, h('span', {svg: ICONS[c.icon] || ICONS.other, style:'display:inline-flex'}))),
    h('div', {style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px'},
      h('span', {class:'cat-chip', style:catStyle(c)}, cname), isAllIn(i) ? h('span', {class:'allin-badge'}, 'Alle er med!') : null),
    h('h2', null, i.title || 'Idé'),
    i.note ? h('p', {class:'details', style:'font-size:16px;margin:0 0 10px'}, i.note) : h('p', {class:'muted', style:'margin:0 0 10px'}, 'Ingen beskrivelse ennå.'),
    url ? h('p', {style:'margin:0 0 6px'}, h('a', {href:url, target:'_blank', rel:'noopener', style:'color:var(--ink);font-weight:600'}, 'Åpne ' + new URL(url).hostname.replace(/^www\./,'') + ' ↗')) : null,
    h('div', {class:'section-label'}, 'Hvem vil?'),
    heartBtn(i),
    h('div', {class:'section-label'}, planned ? 'Planlagt ' + dayLabel(i.day).toLowerCase() : 'Flytt inn på en dag'),
    days.length ? h('div', {class:'daychips', role:'group', 'aria-label':'Velg dag'},
      days.map(d => h('button', {'aria-pressed': String(i.day === d), disabled: !S.canWrite, onclick:() => moveIdea(i, i.day === d ? null : d)}, dayLabel(d, true))),
      planned && S.canWrite ? h('button', {onclick:() => moveIdea(i, null)}, 'Tilbake til tavla') : null
    ) : h('p', {class:'muted'}, 'Legg inn datoer for turen først.'),
    planned ? h('div', {class:'field', style:'margin-top:12px'}, h('label', {for:'d-time'}, 'Klokkeslett (valgfritt)'), time) : null,
    h('div', {class:'actions', style:'margin-top:22px'},
      h('span', {class:'muted', style:'font-size:13px'}, i.addedBy ? 'Festet av ' + nameOf(i.addedBy) : 'Forslag fra Claude'),
      S.canWrite ? h('button', {class:'btn ghost', onclick:() => ideaSheet(i)}, 'Endre') : null)
  );
}
sheet.addEventListener('close', () => { detailId = null; });

async function addIdea(data){
  const ref = S.db.collection('ideas').doc();
  const ok = await write('ideas/' + ref.id, () => ref.set({title:'', note:'', link:'', category:'', day:null, time:'', hearts: S.me ? {[S.me]: true} : {}, addedBy: S.me || null, createdAt: Date.now(), ...data}));
  if (ok) toast('Festet på tavla');
}

/* ---------- papers ---------- */
function papersView(){
  const withFiles = S.items.filter(i => (i.attachments || []).length).sort((a,b) => sortKey({...a, time:(a.date||'') + (a.time||'')}) < sortKey({...b, time:(b.date||'') + (b.time||'')}) ? -1 : 1);
  if (!withFiles.length) return [h('div', {class:'empty'}, h('h3', null, 'Ingen papirer ennå'), h('p', null, 'Trykk «Legg ved kvittering» på en booking i planen for å laste opp boardingkort, kvitteringer eller bookingbekreftelser (bilde eller PDF).'))];
  return withFiles.map(i => h('section', {class:'paper-group'},
    h('h3', null, i.title, h('span', {class:'muted', style:'font-weight:500'}, isoDate(i.date) ? ' · ' + dayLabel(i.date, true) : '')),
    h('div', {class:'thumbs'}, i.attachments.map(a => {
      const src = blobUrl(a.id); const img = /^image\//.test(a.type || '');
      return img
        ? h('button', {class:'thumb', onclick:() => lightbox(a)}, h('img', {src, alt:a.name || 'Bilde', loading:'lazy'}), h('span', {class:'lbl'}, a.name || 'Bilde'))
        : h('a', {class:'thumb', href:src, target:'_blank', rel:'noopener'}, h('span', {class:'pdf'}, 'PDF'), h('span', {class:'lbl'}, a.name || 'Fil'));
    }))
  ));
}

async function attach(item, files){
  if (!S.assets){ toast('Bare redaktører kan laste opp filer.'); return; }
  const added = [];
  for (const f of files){
    let type = f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : /\.jpe?g$/i.test(f.name) ? 'image/jpeg' : /\.png$/i.test(f.name) ? 'image/png' : '');
    toast('Laster opp ' + f.name + ' …');
    try {
      const r = await S.assets.upload(f, type ? {type} : undefined);
      added.push({id:r.id, name:f.name.slice(0,80), type:r.contentType});
    } catch(e){
      const c = e && e.code;
      toast(c === 'too_large' ? f.name + ' er for stor (maks 20 MB).'
        : c === 'unsupported_type' ? f.name + ' støttes ikke. Bruk JPG, PNG eller PDF (iPhone-bilder: ta et skjermbilde).'
        : c === 'quota_or_state' ? 'Lagringsplassen er full.' : 'Fikk ikke lastet opp ' + f.name + '.');
    }
  }
  if (!added.length) return;
  const cur = (S.items.find(x => x.id === item.id) || item).attachments || [];
  const ok = await write('items/' + item.id, () => S.db.doc('items/' + item.id).update({attachments:[...cur, ...added]}));
  if (ok) toast(added.length === 1 ? 'Lagt ved' : added.length + ' filer lagt ved');
}

/* ---------- sheets ---------- */
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
function openSheet(...kids){
  sheetBody.replaceChildren(h('div', {class:'grab', 'aria-hidden':'true'}), h('button', {class:'close', 'aria-label':'Lukk', onclick:() => sheet.close()}, '×'), ...kids);
  if (!sheet.open) sheet.showModal();
  const first = sheetBody.querySelector('input,textarea,select'); if (first) setTimeout(() => first.focus(), 30);
}
function field(label, id, el){ el.id = id; return h('div', {class:'field'}, h('label', {for:id}, label), el); }
function deleteBtn(label, fn){
  let armed = false;
  const b = h('button', {type:'button', class:'btn danger', onclick: async () => { if (!armed){ armed = true; b.textContent = 'Sikker? Trykk igjen'; return; } await fn(); sheet.close(); }}, label);
  return b;
}
function lightbox(a){
  openSheet(h('h2', null, a.name || 'Bilde'), h('div', {class:'lightbox'}, h('img', {src:blobUrl(a.id), alt:a.name || ''})),
    h('div', {class:'actions'}, h('a', {class:'btn ghost', href:blobUrl(a.id), target:'_blank', rel:'noopener'}, 'Åpne i ny fane'),
      S.canWrite && S.assets ? deleteBtn('Fjern vedlegget', async () => {
        const it = S.items.find(i => (i.attachments || []).some(x => x.id === a.id));
        if (!it) return;
        const ok = await write('items/' + it.id, () => S.db.doc('items/' + it.id).update({attachments: it.attachments.filter(x => x.id !== a.id)}));
        if (ok){ try { await S.assets.delete(a.id); } catch(e){} toast('Vedlegget er fjernet'); }
      }) : null));
}

function itemSheet(item, day){
  const it = item || {kind:'flight', date: day || tripDays()[0] || '', booked:'yes', pay:'unknown', currency:'NOK'};
  let kind = it.kind || 'other';
  const kindRow = h('div', {class:'kinds', role:'group', 'aria-label':'Type'}, KINDS.map(([k, l]) => h('button', {type:'button', 'aria-pressed': String(k === kind), onclick: e => { kind = k; kindRow.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); }}, l)));
  const title = h('input', {class:'input', value: it.title || '', placeholder:'F.eks. Fly Torp → Gdańsk', maxlength:'120', required:true});
  const date = h('input', {class:'input', type:'date', value: it.date || ''});
  const endDate = h('input', {class:'input', type:'date', value: it.endDate || ''});
  const time = h('input', {class:'input', type:'time', value: it.time || ''});
  const details = h('textarea', {class:'input', placeholder:'Tider, adresse, hvem kjører …', maxlength:'1000'}, it.details || '');
  const ref = h('input', {class:'input', value: it.ref || '', placeholder:'Bookingnummer', maxlength:'60'});
  const cost = h('input', {class:'input', type:'number', inputmode:'decimal', min:'0', step:'1', value: it.cost != null && it.cost !== '' ? String(it.cost) : '', placeholder:'0'});
  const currency = h('select', {class:'input'}, Object.keys(CUR).map(c => h('option', {value:c, selected: (it.currency || 'NOK') === c}, c)));
  const booked = h('select', {class:'input'}, [['yes','Booket'],['no','Må bookes'],['na','Ikke relevant']].map(([v,l]) => h('option', {value:v, selected: (it.booked || 'yes') === v}, l)));
  const pay = h('select', {class:'input'}, [['unknown','Vet ikke'],['unpaid','Ikke betalt'],['paid','Betalt'],['na','Ingen kostnad']].map(([v,l]) => h('option', {value:v, selected: (it.pay || 'unknown') === v}, l)));
  const paidBy = h('select', {class:'input'}, h('option', {value:''}, 'Ingen valgt'), memberIds().map(id => h('option', {value:id, selected: it.paidBy === id}, nameOf(id))));
  const paidByField = field('Betalt av', 'f-paidby', paidBy);
  const syncPaid = () => { paidByField.style.display = pay.value === 'paid' ? '' : 'none'; };
  pay.addEventListener('change', syncPaid); syncPaid();

  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()){ title.focus(); return; }
    const data = {kind, title:title.value.trim(), date:date.value || '', endDate:endDate.value || '', time:time.value || '', details:details.value.trim(), ref:ref.value.trim(),
      cost: cost.value === '' ? null : Math.max(0, Number(cost.value) || 0), currency:currency.value, booked:booked.value, pay:pay.value, paidBy: pay.value === 'paid' ? (paidBy.value || null) : null};
    const docRef = item ? S.db.doc('items/' + item.id) : S.db.collection('items').doc();
    const ok = await write(docRef.path, () => item ? docRef.update(data) : docRef.set({...data, attachments:[], order: 500, createdAt: Date.now()}));
    if (ok){ sheet.close(); toast(item ? 'Lagret' : 'Lagt til i planen'); }
  }},
    kindRow,
    field('Hva', 'f-title', title),
    h('div', {class:'row2'}, field('Dato', 'f-date', date), field('Klokkeslett', 'f-time', time)),
    field(kind === 'stay' || kind === 'parking' ? 'Til og med' : 'Sluttdato (valgfritt)', 'f-end', endDate),
    field('Detaljer', 'f-details', details),
    field('Bookingnummer', 'f-ref', ref),
    h('div', {class:'row3'}, field('Pris totalt', 'f-cost', cost), field('Valuta', 'f-cur', currency)),
    h('div', {class:'row2'}, field('Booking', 'f-booked', booked), field('Betaling', 'f-pay', pay)),
    paidByField,
    h('div', {class:'actions'},
      item ? deleteBtn('Slett', () => write('items/' + item.id, () => S.db.doc('items/' + item.id).delete())) : h('span'),
      h('button', {class:'btn primary', type:'submit'}, item ? 'Lagre' : 'Legg til'))
  );
  openSheet(h('h2', null, item ? 'Endre booking' : 'Ny booking'), form);
}

function ideaSheet(idea){
  const i = idea || {};
  const days = tripDays();
  const title = h('input', {class:'input', value:i.title || '', placeholder:'F.eks. Middag i gamlebyen', maxlength:'120'});
  const note = h('textarea', {class:'input', placeholder:'Hvorfor er dette gøy?', maxlength:'600'}, i.note || '');
  const link = h('input', {class:'input', value:i.link || '', placeholder:'https://', maxlength:'400', inputmode:'url'});
  let catVal = catOf(i.category)[0];
  const catRow = h('div', {class:'kinds', role:'group', 'aria-label':'Kategori'}, Object.entries(CATS).map(([k, c]) => h('button', {type:'button', 'aria-pressed': String(k === catVal), style: k === catVal ? '' : catStyle(c) + 'background:var(--c-bg);color:var(--c-ink)',
    onclick: e => { catVal = k; catRow.querySelectorAll('button').forEach(b => { const on = b === e.currentTarget; b.setAttribute('aria-pressed', String(on)); const cc = CATS[b.textContent]; b.style.cssText = on ? '' : catStyle(cc) + 'background:var(--c-bg);color:var(--c-ink)'; }); }}, k)));
  let photo = i.photo || null;
  const prev = h('span');
  const showPrev = () => prev.replaceChildren(photo ? h('img', {src:blobUrl(photo), alt:''}) : '');
  showPrev();
  const photoInput = h('input', {type:'file', accept:'image/png,image/jpeg,image/webp,image/gif', onchange: async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (!S.assets){ toast('Bare redaktører kan laste opp bilder.'); return; }
    toast('Laster opp bildet …');
    try { const r = await S.assets.upload(f, f.type ? undefined : {type:'image/jpeg'}); photo = r.id; showPrev(); photoLbl.lastChild.textContent = 'Bytt bilde'; toast('Bildet er klart. Husk å lagre.'); }
    catch(e){ toast(e && e.code === 'unsupported_type' ? 'Bruk JPG, PNG eller WEBP (iPhone-bilder: ta et skjermbilde).' : e && e.code === 'too_large' ? 'Bildet er for stort (maks 20 MB).' : 'Fikk ikke lastet opp bildet.'); }
  }});
  const photoLbl = h('label', {class:'attach'}, photoInput, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), document.createTextNode(photo ? 'Bytt bilde' : 'Legg til bilde'));
  const day = h('select', {class:'input'}, h('option', {value:''}, 'Ikke planlagt (på tavla)'), days.map(d => h('option', {value:d, selected: i.day === d}, dayLabel(d))));
  const time = h('input', {class:'input', type:'time', value:i.time || ''});
  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()){ title.focus(); return; }
    const data = {title:title.value.trim(), note:note.value.trim(), link:link.value.trim(), category:catVal, photo: photo || null, day: day.value || null, time: time.value || ''};
    if (idea){ const ok = await write('ideas/' + idea.id, () => S.db.doc('ideas/' + idea.id).update(data)); if (ok){ toast('Lagret'); ideaDetail(idea.id); } }
    else { sheet.close(); await addIdea(data); }
  }},
    field('Idé', 'i-title', title), field('Notat', 'i-note', note), field('Lenke', 'i-link', link), h('div', {class:'field'}, h('label', null, 'Hva slags'), catRow),
    h('div', {class:'field'}, h('label', null, 'Bilde'), h('div', {class:'photo-pick'}, prev, S.assets ? photoLbl : h('span', {class:'muted', style:'font-size:14px'}, 'Bare redaktører kan laste opp bilder.'))),
    h('div', {class:'row2'}, field('Dag', 'i-day', day), field('Klokkeslett', 'i-time', time)),
    h('div', {class:'actions'},
      idea ? deleteBtn('Slett idéen', () => write('ideas/' + idea.id, () => S.db.doc('ideas/' + idea.id).delete())) : h('span'),
      h('button', {class:'btn primary', type:'submit'}, idea ? 'Lagre' : 'Fest på tavla'))
  );
  openSheet(h('h2', null, idea ? 'Endre idé' : 'Ny idé'), form);
}

function tripSheet(){
  const t = S.trip || {};
  const title = h('input', {class:'input', value:t.title || '', placeholder:'Gdańsk', maxlength:'40'});
  const note = h('input', {class:'input', value:t.note || '', placeholder:'Jentetur', maxlength:'60'});
  const start = h('input', {class:'input', type:'date', value:t.start || ''});
  const end = h('input', {class:'input', type:'date', value:t.end || ''});
  const size = h('input', {class:'input', type:'number', min:'1', max:'30', value:String(t.groupSize || 3)});
  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()) return title.focus();
    if (start.value && end.value && end.value < start.value){ toast('Hjemreisen må være etter avreisen.'); return end.focus(); }
    const data = {title:title.value.trim(), note:note.value.trim(), start:start.value, end:end.value, groupSize: Math.max(1, Math.min(30, Number(size.value) || 1))};
    const ok = await write('trip/main', () => S.db.doc('trip/main').set(data));
    if (ok){ sheet.close(); toast('Turen er lagret'); }
  }},
    field('Hvor', 't-title', title), field('Hva slags tur', 't-note', note),
    h('div', {class:'row2'}, field('Avreise', 't-start', start), field('Hjemreise', 't-end', end)),
    field('Hvor mange er med', 't-size', size),
    h('p', {class:'muted', style:'margin:0;font-size:14px'}, '«Alle er med» vises når så mange har gitt hjerte til en idé.'),
    h('div', {class:'actions'}, h('span'), h('button', {class:'btn primary', type:'submit'}, 'Lagre'))
  );
  openSheet(h('h2', null, S.trip ? 'Endre tur' : 'Ny tur'), form);
}

/* ---------- onboarding ---------- */
function onboard(){
  const inp = h('input', {class:'input', id:'nick', placeholder:'Navnet ditt', maxlength:'24', 'aria-label':'Navnet ditt'});
  const save = async e => {
    e.preventDefault();
    const v = inp.value.trim(); if (!v) return inp.focus();
    await write('members/' + S.me, () => S.db.doc('members/' + S.me).update({nick:v}));
  };
  setTimeout(() => inp.focus(), 50);
  return h('form', {class:'onboard', onsubmit:save},
    h('h2', null, 'Hva skal vi kalle deg?'),
    inp,
    h('button', {class:'btn dark', type:'submit'}, 'Ferdig'),
    h('button', {class:'linkbtn', type:'button', style:'margin-top:16px;align-self:center;color:var(--muted)', onclick:() => { S.skipNick = true; try { sessionStorage.setItem('yaffle-skip-nick','1'); } catch(e){} render(); }}, 'Hopp over')
  );
}

/* sticky tab border */
window.addEventListener('scroll', () => { const t = document.querySelector('.tabs'); if (t) t.classList.toggle('stuck', t.getBoundingClientRect().top <= 0); }, {passive:true});
})();
