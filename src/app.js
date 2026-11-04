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
  clip:'<svg viewBox="0 0 24 24"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  map:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></svg>',
  grid:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="4" y="4" width="7" height="9" rx="2"/><rect x="13" y="4" width="7" height="5" rx="2"/><rect x="4" y="15" width="7" height="5" rx="2"/><rect x="13" y="11" width="7" height="9" rx="2"/></svg>'
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
const PALETTE = ['#1c1c1e','#3a3a3c','#1e5a46','#5f8f6e','#636366','#8a6d3b'];
function hashColor(s){ let x=0; for (const c of String(s)) x = (x*31 + c.charCodeAt(0)) | 0; return PALETTE[Math.abs(x) % PALETTE.length]; }

const sheet = document.getElementById('sheet');
const sheetBody = document.getElementById('sheetBody');
/* ---------- state ---------- */
const S = {
  db:null, user:null, assets:null, me:null, canWrite:true,
  trip:null, items:[], ideas:[], members:{}, profiles:{},
  packing:[], personal:{}, prep:{}, loaded:{trip:false, items:false, ideas:false, members:false}, confirmed:false, timedOut:false, noDb:false,
  view: (h => h === 'papirer' ? 'penger' : ['plan','ideer','pakk','penger','hjem'].includes(h) ? h : 'plan')(location.hash.slice(1)),
  tripId: null, trips:[], profileDocs:{}, memberDocs:{}, tripMembers:{}, homeTab:'next',
  filter:'all', boardMode:'tavle', pending:new Set(), joined:false, skipNick:false, flash:new Set(), prevAllIn:null
};
try { S.skipNick = sessionStorage.getItem('yaffle-skip-nick') === '1'; } catch(e){}

function nameOf(uid){
  if (!uid) return 'Claude';
  return (S.members[uid] && S.members[uid].nick) || (S.profileDocs[uid] && S.profileDocs[uid].nick) || (S.profiles[uid] && S.profiles[uid].name) || 'Noen';
}
function colorOf(uid){ return (S.profiles[uid] && S.profiles[uid].color) || hashColor(uid); }
function face(uid, sm, big){
  const n = nameOf(uid);
  const photo = (S.members[uid] && S.members[uid].photo) || (S.profileDocs[uid] && S.profileDocs[uid].photo);
  const src = photo ? blobUrl(photo) : null;
  const cls = 'face' + (sm ? ' sm' : '') + (big ? ' big' : '');
  if (src) return h('img', {class:cls, src, alt:n, title:n});
  return h('span', {class:cls, style:'background:' + colorOf(uid), title:n, role:'img', 'aria-label':n}, n.trim()[0] ? n.trim()[0].toUpperCase() : '?');
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

  // Hvilken tur: ?tur=ID i adressen, ellers den du så på sist
  const q = new URLSearchParams(location.search).get('tur');
  let tid = q; try { if (q) localStorage.setItem('yaffle-trip', q); else tid = localStorage.getItem('yaffle-trip'); } catch(e){}
  S.rdb = db; S.tripId = tid || null;
  if (window.yaffleNotice) setTimeout(() => toast(window.yaffleNotice), 300);

  db.collection('trips').onSnapshot(s => {
    S.trips = s.docs.map(d => ({id:d.id, ...d.data()}));
    for (const t of S.trips) if (!(t.id in S.tripMembers)){
      S.tripMembers[t.id] = [];
      db.collection('trips/' + t.id + '/members').onSnapshot(m => { S.tripMembers[t.id] = m.docs.map(d => d.id); render(); }, () => {});
    }
    S.loaded.trips = true; render();
  }, () => { S.loaded.trips = true; render(); });
  db.collection('profiles').onSnapshot(s => { S.profileDocs = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); S.loaded.profiles = true; mergeMembers(); render(); }, () => {});

  if (!S.tripId){ S.view = 'hjem'; for (const k of ['trip','items','ideas','members']) S.loaded[k] = true; S.confirmed = true; clearTimeout(timer); render(); return; }
  const base = 'trips/' + S.tripId + '/';
  S.db = { doc: p => p === 'trip/main' ? db.doc('trips/' + S.tripId) : db.doc(base + p), collection: p => db.collection(base + p) };
  window.yaffleTrip = S.tripId;

  S.db.doc('trip/main').onSnapshot(s => { S.trip = s.exists ? s.data() : null; done('trip', s); render(); }, onErr('trip'));
  S.db.collection('items').onSnapshot(s => { S.items = s.docs.map(d => ({id:d.id, ...d.data()})); done('items', s); render(); }, onErr('items'));
  S.db.collection('ideas').onSnapshot(s => {
    S.ideas = s.docs.map(d => ({id:d.id, ...d.data()}));
    const now = new Set(S.ideas.filter(isAllIn).map(i => i.id));
    if (S.prevAllIn) for (const id of now) if (!S.prevAllIn.has(id)) S.flash.add(id);
    S.prevAllIn = now;
    done('ideas', s); render();
    if (detailId && sheet.open) ideaDetail(detailId);
  }, onErr('ideas'));
  S.db.collection('packing').onSnapshot(s => { S.packing = s.docs.map(d => ({id:d.id, ...d.data()})); render(); }, () => {});
  S.db.collection('personal').onSnapshot(s => { S.personal = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); render(); }, () => {});
  S.db.collection('prep').onSnapshot(s => { S.prep = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); render(); }, () => {});
  S.db.collection('members').onSnapshot(s => {
    S.memberDocs = Object.fromEntries(s.docs.map(d => [d.id, d.data()]));
    mergeMembers(); done('members', s); refreshProfiles(); render();
  }, onErr('members'));
})();

function mergeMembers(){
  S.members = Object.fromEntries(Object.keys(S.memberDocs).map(id => [id, {...S.memberDocs[id], ...(S.profileDocs[id] || {})}]));
}
async function saveProfile(patch){
  if (!S.me || !S.rdb) return false;
  const ref = S.rdb.doc('profiles/' + S.me);
  return write('profiles/' + S.me, () => S.profileDocs[S.me] ? ref.update(patch) : ref.set({...patch}));
}
async function maybeJoin(){
  return;
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
  if (['plan','ideer','pakk','penger','hjem'].includes(v) && v !== S.view){ S.view = v; render(); }
});
function go(v){ S.view = v; try { history.replaceState(null, '', '#' + v); } catch(e){ location.hash = v; } render(); }

/* ---------- render ---------- */
function render(){
  const app = document.getElementById('app');
  const y = window.scrollY;
  const hs = document.getElementById('plan-scroll'); const hx = hs ? hs.scrollLeft : null;
  const keep = {}; app.querySelectorAll('input[id]').forEach(el => { if (el.value) keep[el.id] = el.value; });
  const focusId = document.activeElement && app.contains(document.activeElement) ? document.activeElement.id : null;
  app.replaceChildren(...[...view(), footer()].flat(9).filter(k => k != null && k !== false));
  for (const [id, v] of Object.entries(keep)){ const el = document.getElementById(id); if (el && !el.value) el.value = v; }
  if (focusId){ const el = document.getElementById(focusId); if (el) el.focus({preventScroll:true}); }
  app.classList.toggle('wide', S.view === 'ideer' || S.view === 'plan');
  window.scrollTo(0, y);
  const hs2 = document.getElementById('plan-scroll'); if (hs2 && hx != null) hs2.scrollLeft = hx;
  S.flash.clear();
}

function footSvg(url){
  const footCache = footSvg.cache || (footSvg.cache = {});
  if (!footCache[url]) footCache[url] = fetch(url).then(r => r.ok ? r.text() : '').then(t => t
    .replace(/<\?xml[^>]*>/, '').replace(/<title>[^<]*<\/title>/, '')
    .replace(/fill="#1e5a46"/g, 'style="fill:var(--accent)"').replace(/fill="#9db8a9"/g, 'style="fill:var(--foot-soft)"')
    .replace(/\swidth="\d+" height="\d+"/, ' aria-hidden="true"')).catch(() => '');
  return footCache[url];
}
window.addEventListener('yaffle:logo', () => render());
function footer(){
  if (S.db && !S.loaded.trip) return null;
  const L = window.yaffleLogo;
  const logo = L ? L.lockup() : '/brand/yay-waffle/yay-waffle-forkortelse-green.svg';
  let mark;
  if (!L || L.inline()){
    // «Yay, waffle» med Y og affle uthevet: inline så fargene følger lys/mørk modus
    mark = h('span', {class:'foot-logo inline', role:'img', 'aria-label':'Yay, waffle (Yaffle)'});
    footSvg(logo).then(svg => { if (svg) mark.innerHTML = svg; });
  } else mark = h('span', {class:'foot-logo', role:'img', 'aria-label':'Yaffle', style:"--logo:url('" + logo + "')"});
  return h('footer', {class:'foot'},
    mark,
    h('p', null, 'Yaffle samler turen på ett sted: plan og bookinger, idéer dere vil gjøre, pakkeliste og hva det koster. Hele gjengen ser det samme, så ingen trenger å lete i chatten.'),
    h('p', {class:'foot-meta'}, 'Laget for venninnegjengen'));
}

function view(){
  const loading = S.db && !S.loaded.trip;
  if (S.noDb) return [topBar(), h('div', {class:'empty', style:'margin-top:40px'}, h('h3', null, 'Turen vises ikke her'), h('p', null, 'Får ikke kontakt med databasen. Sjekk innstillingene i src/config.js.'))];
  if (loading && !S.timedOut) return [topBar(), h('p', {class:'muted', style:'margin-top:60px'}, 'Henter turen …')];
  if (S.db && !S.loaded.trip && S.timedOut) return [topBar(), h('div', {class:'notice'}, 'Får ikke kontakt med turen akkurat nå. Sjekk nettet, så prøver siden igjen av seg selv.')];

  if (S.me && S.canWrite && S.loaded.profiles && !S.skipNick && !(S.profileDocs[S.me] && S.profileDocs[S.me].nick)) return [topBar(), onboard()];
  if (S.view === 'hjem' || !S.tripId) return [topBar(), ...homeView()];

  if (!S.trip) return [topBar(), h('div', {class:'onboard'},
    h('h2', null, 'Fant ikke turen'),
    h('p', null, 'Enten finnes den ikke, eller så er du ikke med på den. Be om en invitasjonslenke fra noen i gjengen.'),
    h('button', {class:'btn dark', onclick:() => goHome()}, 'Til turene dine')
  )];

  const out = [topBar(), hero()];
  if (S.timedOut) out.push(h('div', {class:'notice'}, 'Får ikke kontakt akkurat nå, så det du ser kan være utdatert.'));
  if (!S.canWrite) out.push(h('div', {class:'notice'}, 'Du kan se turen, men ikke endre den. Be den som administrerer turen om å legge til e-posten din.'));
  out.push(...tabs());
  if (S.view === 'plan') out.push(...planView());
  else if (S.view === 'ideer') out.push(...boardView());
  else if (S.view === 'pakk') out.push(...packView());
  else if (S.view === 'penger') out.push(...moneyView());

  if (S.canWrite){
    if (S.view === 'ideer') out.push(h('button', {class:'fab', 'aria-label':'Ny idé', title:'Ny idé', onclick:() => ideaSheet(null)}, '+'));
  }
  return out;
}

function topBar(){
  return h('div', {class:'top'},
    h('a', {class:'brand', href:'#plan', 'aria-label':'Yaffle, til forsiden', onclick: e => { e.preventDefault(); goHome(); }}, h('span', {class:'brandmark', 'aria-hidden':'true', svg: window.yaffleLogo ? window.yaffleLogo.svg() : ''}), h('b', null, 'Yaffle'), h('i', null, 'Yay, waffles.')),
    S.me ? h('button', {class:'mebtn', 'aria-label':'Din profil', onclick:() => meSheet()}, face(S.me)) : null
  );
}

function crew(){
  const ids = memberIds(); if (!ids.length) return null;
  const sorted = ids.slice().sort((a, b) => (a === S.me ? -1 : b === S.me ? 1 : nameOf(a).localeCompare(nameOf(b), 'nb')));
  const missing = Math.max(0, groupSize() - ids.length);
  return h('section', {class:'crew', 'aria-label':'Gjengen'},
    h('div', {class:'crew-label'}, 'Gjengen'),
    h('div', {class:'crew-row'},
      sorted.map(id => h(id === S.me ? 'button' : 'div', {class:'crew-person', onclick: id === S.me ? () => meSheet() : null, 'aria-label': id === S.me ? 'Endre profilen din' : null},
        face(id, false, true),
        h('span', null, id === S.me ? nameOf(id) + ' (deg)' : nameOf(id)),
        id === S.me && !(S.members[id] && S.members[id].photo) ? h('small', null, '+ bilde') : null)),
      Array.from({length:missing}, () => h('div', {class:'crew-person'}, h('span', {class:'face big ghost', 'aria-hidden':'true'}, '?'), h('span', {class:'muted'}, 'Ikke logget inn')))
    ));
}

function resizeImage(file, max){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height); const out = Math.min(max, side);
      const c = document.createElement('canvas'); c.width = out; c.height = out;
      c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('load')); };
    img.src = url;
  });
}

function meSheet(){
  const me = S.profileDocs[S.me] || S.members[S.me] || {};
  const nick = h('input', {class:'input', id:'me-nick', value: me.nick || '', maxlength:'24', placeholder:'Navnet ditt'});
  const pic = h('div', {class:'me-pic'}, face(S.me, false, true));
  const input = h('input', {type:'file', accept:'image/*', onchange: async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (!S.assets){ toast('Du kan ikke laste opp bilder.'); return; }
    toast('Laster opp bildet …');
    try {
      const blob = await resizeImage(f, 512);
      const r = await S.assets.upload(blob, {type:'image/jpeg', folder:'profiles/' + S.me});
      const ok = await saveProfile({photo: r.id});
      if (ok){ toast('Profilbildet er lagret'); meSheet(); }
    } catch(e){ toast('Fikk ikke brukt bildet. Prøv et annet (iPhone-bilder: ta et skjermbilde).'); }
  }});
  openSheet(
    h('h2', null, 'Din profil'),
    h('div', {class:'me-top'}, pic, h('label', {class:'attach'}, input, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), me.photo ? 'Bytt bilde' : 'Last opp bilde')),
    h('form', {class:'form', style:'margin-top:16px', onsubmit: async e => {
      e.preventDefault(); const v = nick.value.trim(); if (!v) return nick.focus();
      const ok = await saveProfile({nick: v});
      if (ok) toast('Navnet er lagret');
    }}, field('Navn', 'me-nick', nick), h('div', {class:'actions'}, h('span'), h('button', {class:'btn primary', type:'submit'}, 'Lagre navn'))),
    S.canWrite && S.trip ? h('button', {class:'btn ghost', type:'button', style:'margin-top:12px', onclick:() => tripSheet()}, 'Endre turen (navn og datoer)') : null,
    window.yaffleLogo ? h('div', {class:'field', style:'margin-top:18px'}, h('label', null, 'Logo (test)'),
      h('div', {class:'seg', role:'group', 'aria-label':'Velg logo'}, window.yaffleLogo.list.map(l => h('button', {type:'button', 'aria-pressed': String(window.yaffleLogo.current() === l.id),
        onclick: e => { window.yaffleLogo.set(l.id); e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); render(); toast('Logoen er byttet på denne enheten'); }}, l.label))),
      h('p', {class:'muted', style:'margin:6px 0 0;font-size:13px'}, 'Bytter logo i appen og fanen bare for deg, så du kan teste.')) : null,
    h('div', {class:'me-links'},
      window.yaffleChangePassword ? h('button', {class:'btn ghost', type:'button', onclick:() => { sheet.close(); window.yaffleChangePassword(); }}, 'Bytt passord') : null,
      window.yaffleSignOut ? h('button', {class:'btn danger', type:'button', onclick:() => window.yaffleSignOut()}, 'Logg ut') : null)
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
  const cd = countdown();
  const ids = memberIds();
  const nights = Math.max(0, days.length - 1);
  const cover = tripCover(t);
  const edit = S.canWrite ? e => { if (!e.target.closest('button')) tripSheet(); } : null;
  return h('header', {class:'hero' + (cover ? ' has-cover' : '') + (edit ? ' editable' : ''), onclick:edit,
      role: edit ? 'button' : null, tabindex: edit ? '0' : null, 'aria-label': edit ? 'Endre turdetaljer' : null,
      onkeydown: edit ? e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget){ e.preventDefault(); tripSheet(); } } : null},
    edit ? h('span', {class:'hero-edit', 'aria-hidden':'true'}, 'Endre') : null,
    cover ? h('img', {class:'hero-bg', src:cover, alt:'', referrerpolicy:'no-referrer', onerror: e => { e.target.closest('.hero').classList.remove('has-cover'); e.target.remove(); }}) : null,
    h('h1', null, t.title || 'Turen'),
    heroDates(days),
    h('div', {class:'hero-row'},
      h('span', {class:'countpill' + (cd.live ? ' live' : '')}, cd.pill),
      nights > 0 ? h('span', {class:'hd-nights'}, nights + (nights === 1 ? ' natt' : ' netter')) : null,
      cd.daysTo != null && cd.daysTo <= 5 && cd.daysTo >= 0 && packLeft() ? h('button', {class:'countpill todo', onclick:() => go('pakk')}, packLeft() + ' igjen å pakke') : null,
      ids.length ? h('button', {class:'stack-btn', 'aria-label':'Se gjengen', onclick:() => crewSheet()},
        h('span', {class:'faces'}, ids.slice(0, 5).map(id => face(id, true)))) : null)
  );
}

// Datoene under turnavnet: TOR 19. — SØN 22. NOVEMBER
function heroDates(days){
  if (!days.length) return h('span', {class:'hero-dates'}, 'Datoer ikke satt');
  const a = D(days[0]), b = D(days[days.length - 1]);
  const wd = d => WD[d.getUTCDay()].slice(0, 3);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth();
  const left = wd(a) + ' ' + a.getUTCDate() + '.' + (sameMonth ? '' : ' ' + MONL[a.getUTCMonth()]);
  const right = wd(b) + ' ' + b.getUTCDate() + '. ' + MONL[b.getUTCMonth()];
  return h('div', {class:'hero-dates'},
    h('span', {class:'hd-range'}, days.length > 1 ? [left, h('span', {class:'hd-sep', 'aria-hidden':'true'}), right] : right));
}

function crewSheet(){
  const ids = memberIds().slice().sort((a, b) => (a === S.me ? -1 : b === S.me ? 1 : nameOf(a).localeCompare(nameOf(b), 'nb')));
  const missing = Math.max(0, groupSize() - ids.length);
  openSheet(h('h2', null, 'Gjengen'),
    h('div', {class:'crew-row', style:'margin-bottom:20px'},
      ids.map(id => h('div', {class:'crew-person'}, face(id, false, true), h('span', null, id === S.me ? nameOf(id) + ' (deg)' : nameOf(id)))),
      Array.from({length:missing}, () => h('div', {class:'crew-person'}, h('span', {class:'face big ghost', 'aria-hidden':'true'}, '?'), h('span', {class:'muted'}, 'Ikke logget inn')))),
    h('div', {style:'display:flex;flex-wrap:wrap;gap:10px'},
      S.tripId ? h('button', {class:'btn primary', onclick:() => inviteSheet()}, 'Inviter flere') : null,
      S.me ? h('button', {class:'btn ghost', onclick:() => meSheet()}, 'Endre profilen din') : null));
}

function countdown(){
  const days = tripDays(); if (!days.length) return {big:'Snart', small:''};
  const now = new Date(); const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const diff = Math.round((D(days[0]) - today) / 864e5);
  const left = Math.round((D(days[days.length-1]) - today) / 864e5);
  if (diff > 1) return {big: diff + ' dager', small:'til dere drar til ' + (S.trip.title || 'turen'), pill:'om ' + diff + ' dager', daysTo:diff};
  if (diff === 1) return {big:'I morgen!', small:'Pakk sekken', pill:'i morgen!', live:true, daysTo:1};
  if (left >= 0) return {big:'Dag ' + (1 - diff) + ' av ' + days.length, small:'God tur!', pill:'dag ' + (1 - diff) + ' av ' + days.length, live:true};
  return {big:'Hjemme igjen', small:'Håper det var en fin tur', pill:'hjemme igjen'};
}

function summary(){
  const cd = countdown();
  return h('section', {class:'summary', 'aria-label':'Nedtelling'},
    h('div', {class:'big'}, cd.big, cd.small ? h('small', null, cd.small) : null));
}

/* ---------- penger ---------- */
// Kurser til NOK hentes fra Frankfurter (ECB-kurser). Reserven brukes hvis den ikke svarer.
const FALLBACK_RATES = {NOK:1, PLN:2.5, EUR:11.7};
const FX = {rates:{...FALLBACK_RATES}, date:null, live:false, loading:false};
function loadRates(){
  if (FX.loading || FX.live) return; FX.loading = true;
  fetch('https://api.frankfurter.app/latest?from=NOK&to=PLN,EUR')
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (!j || !j.rates) return; for (const [k, v] of Object.entries(j.rates)) if (v > 0) FX.rates[k] = 1 / v; FX.date = j.date; FX.live = true; render(); })
    .catch(() => {}).finally(() => { FX.loading = false; });
}
const toNok = (amount, cur) => amount * (FX.rates[cur || 'NOK'] || 1);

function moneyView(){
  loadRates();
  const costs = S.items.filter(i => Number(i.cost) > 0)
    .map(i => ({i, nok: toNok(Number(i.cost), i.currency)}))
    .sort((a, b) => b.nok - a.nok);
  if (!costs.length) return [h('div', {class:'empty'}, h('h3', null, 'Ingen priser ennå'), h('p', null, 'Legg inn pris på bookingene i planen, så ser du her hva turen koster.'))];

  const total = costs.reduce((a, c) => a + c.nok, 0);
  const otherPapers = S.items.filter(i => !(Number(i.cost) > 0) && (i.attachments || []).length);
  const n = groupSize();
  const byKind = {};
  for (const c of costs){ const k = c.i.kind || 'other'; byKind[k] = (byKind[k] || 0) + c.nok; }
  const kinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
  const foreign = [...new Set(costs.map(c => c.i.currency).filter(c => c && c !== 'NOK'))];
  const rateLine = foreign.map(c => '1 ' + (CUR[c] || c) + ' = ' + FX.rates[c].toFixed(2).replace('.', ',') + ' kr').join(' · ');

  return [
    h('section', {class:'moneycard', style:'margin-bottom:24px'},
      h('div', {class:'kicker'}, 'Hele turen'),
      h('div', {class:'moneybig'}, money(Math.round(total), 'NOK')),
      h('div', {class:'moneysub'}, 'ca. ', h('b', null, money(Math.round(total / n), 'NOK')), ' per person når dere er ' + n),
      foreign.length ? h('div', {class:'muted', style:'font-size:13px'}, rateLine + (FX.live ? ' (kurs ' + FX.date.split('-').reverse().join('.') + ')' : ' (omtrentlig kurs)')) : null
    ),
    h('section', {class:'moneysection'}, h('h3', null, 'Fordelt på'),
      h('div', {class:'stack'}, kinds.map(([k, v]) => h('div', {class:'kindrow'},
        h('div', {class:'tile ' + k, svg: ICONS[k] || ICONS.other, 'aria-hidden':'true', style:'width:36px;height:36px;border-radius:11px'}),
        h('div', {style:'flex:1;min-width:0'},
          h('div', {style:'display:flex;justify-content:space-between;gap:8px'}, h('b', null, KIND_LABEL[k] || 'Annet'), h('b', {style:'font-variant-numeric:tabular-nums'}, money(Math.round(v), 'NOK'))),
          h('div', {class:'bar', style:'margin:6px 0 0'}, h('span', {style:'width:' + (v / total * 100) + '%'}))))))),
    h('section', {class:'moneysection'}, h('h3', null, 'Alle kostnader'),
      h('div', {class:'stack'}, costs.map(({i, nok}) => h('div', {class:'payrow'},
        h('div', null, h('b', null, i.title), h('span', {class:'muted'}, isoDate(i.date) ? ' · ' + dayLabel(i.date, true) : '')),
        h('div', {style:'text-align:right;font-variant-numeric:tabular-nums;margin-left:auto'},
          h('b', null, money(Math.round(nok), 'NOK')),
          h('div', {class:'muted', style:'font-size:13px'}, (i.currency && i.currency !== 'NOK' ? money(Number(i.cost), i.currency) + ' · ' : '') + money(Math.round(nok / n), 'NOK') + ' hver')),
        (i.attachments || []).length ? h('div', {class:'files', style:'width:100%'}, i.attachments.map(fileChip)) : null)))),
    otherPapers.length ? h('section', {class:'moneysection'}, h('h3', null, 'Andre papirer'),
      h('div', {class:'stack'}, otherPapers.map(i => h('div', {class:'payrow'},
        h('div', null, h('b', null, i.title), h('span', {class:'muted'}, isoDate(i.date) ? ' · ' + dayLabel(i.date, true) : '')),
        h('div', {class:'files', style:'width:100%'}, i.attachments.map(fileChip)))))) : null
  ];
}

function tabs(){
  const nIdeas = S.ideas.filter(i => !isoDate(i.day) || !tripDays().includes(i.day)).length;
  const nFiles = S.items.reduce((a, i) => a + (i.attachments || []).length, 0);
  const t = (id, label, n) => h('button', {class:'tab', role:'tab', 'aria-selected': String(S.view === id), onclick:() => go(id)}, label, n ? h('sup', null, n) : null);
  const hints = {plan:'Alt dere har booket, dag for dag.', ideer:'Gi hjerte til det du vil gjøre, og flytt favorittene inn på en dag.', papirer:'Boardingkort, kvitteringer og bekreftelser samlet.', penger:'Hva turen koster, med kvitteringene.'};
  return [h('nav', {class:'tabs', role:'tablist', 'aria-label':'Visning'}, t('plan','Plan'), t('ideer','Idéer', nIdeas), t('pakk','Pakk', packLeft() || null), t('penger','Penger'))];
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
        h('div', {class:'dayname'}, cap(WD[d.getUTCDay()]), h('span', null, 'Dag ' + (idx+1) + (placesOn(day).length ? ' · ' + placesOn(day).join(' → ') : ''))),
        idx === 0 ? h('span', {class:'daytag'}, 'Avreise') : idx === days.length - 1 ? h('span', {class:'daytag'}, 'Hjemreise') : null
      ),
      weatherLine(day),
      h('div', {class:'stack', style:'flex:1;align-content:start'},
        sleeping.map(s => h('div', {class:'sleep'}, h('span', {class:'tile stay', style:'width:24px;height:24px;border-radius:8px', svg:ICONS.stay}), 'Dere bor på ', h('b', {style:'color:var(--ink)'}, s.title))),
        groupTravel(entries).map(e => e.type === 'travel' ? travelBlock(e.items) : e.type === 'item' ? itemCard(e.x) : plannedIdeaCard(e.x)),
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
  const scroller = h('div', {class:'hscroll', id:'plan-scroll', tabindex:'0', 'aria-label':'Reiseplan per dag'}, cols);
  const jump = idx => { const col = scroller.children[idx]; if (col) scroller.scrollTo({left: col.offsetLeft - scroller.children[0].offsetLeft, behavior:'smooth'}); };
  const chips = h('div', {class:'daychips-row', role:'group', 'aria-label':'Gå til dag'},
    days.map((d, idx) => h('button', {class: d === todayIso ? 'today' : null, onclick:() => jump(idx)}, dayLabel(d, true))));
  if (!S.jumpedToday && days.includes(todayIso)){ S.jumpedToday = true; setTimeout(() => jump(days.indexOf(todayIso)), 60); }
  return [prepCard(), days.length > 1 ? chips : null, scroller];
}

/* ---------- før dere reiser: apper og ting å ordne ---------- */
// Steder vi vet hvilke apper som brukes. Sjekket nov. 2026.
const PLACE_TIPS = [
  {match:/gda[nń]sk|sopot|gdynia|tr[oó]jmiasto|warszawa|warsaw|krak[oó]w|wroc[lł]aw|pozna[nń]|polen|poland/i, country:'Polen', tips:[
    {key:'ride-pl', title:'Bolt eller Uber', note:'Begge kjører i Gdańsk og Sopot, og Bolt er ofte billigst. FreeNow bestiller vanlige taxier. Legg inn betalingskort før dere drar.', group:'Apper'},
    {key:'transit-pl', title:'Jakdojade', note:'Rutetider og billetter for buss, trikk og SKM-toget mellom Gdańsk og Sopot, på engelsk.', group:'Apper'},
    {key:'money-pl', title:'Betal i zloty', note:'Polen bruker zloty (PLN). Kort fungerer nesten overalt. Velg å betale i PLN, ikke NOK, når terminalen spør, så slipper dere dårlig kurs.', group:'Ordne'}
  ]}
];
const AIRLINES = [
  ['Ryanair', /ryanair|\bFR\d{2,4}\b/i], ['Norwegian', /norwegian|\bDY\d{2,4}\b/i], ['SAS', /\bSAS\b|\bSK\d{2,4}\b/], ['Widerøe', /wider[oø]e|\bWF\d{2,4}\b/i],
  ['Wizz Air', /wizz|\bW6\d{2,4}\b/i], ['easyJet', /easyjet|\bU2\d{2,4}\b/i], ['KLM', /\bKLM\b|\bKL\d{2,4}\b/], ['Lufthansa', /lufthansa|\bLH\d{2,4}\b/i]
];
function prepList(){
  const out = [];
  const flights = S.items.filter(i => i.kind === 'flight');
  const seen = new Set();
  for (const f of flights){
    const txt = (f.title || '') + ' ' + (f.details || '');
    for (const [name, re] of AIRLINES){
      if (!re.test(txt) || seen.has(name)) continue;
      seen.add(name);
      const reserved = flights.some(x => /sete|seat/i.test(x.details || ''));
      if (name === 'Ryanair'){
        out.push({key:'app-ryanair', title:'Ryanair-appen', note:'Boardingkortet finnes bare i appen. Utskrift og PDF godtas ikke.', group:'Apper'});
        out.push({key:'checkin-ryanair', title:'Sjekk inn hos Ryanair', note: reserved
          ? 'Dere har kjøpt seter, så innsjekk er åpen fra 60 dager før. Den stenger 2 timer før avgang, og etter det koster det penger på flyplassen.'
          : 'Uten kjøpt sete åpner innsjekk 24 timer før avgang og stenger 2 timer før. Etter det koster det penger på flyplassen.', group:'Ordne'});
      } else {
        out.push({key:'app-' + name.toLowerCase().replace(/\W/g,''), title: name + '-appen', note:'Ha boardingkortet i appen, og sjekk inn så snart det åpner.', group:'Apper'});
      }
    }
  }
  const where = [(S.trip && S.trip.title) || '', ...tripFolders().map(f => f.name), ...S.items.filter(i => i.kind === 'stay').map(i => (i.title || '') + ' ' + (i.place || ''))].join(' ');
  for (const p of PLACE_TIPS) if (p.match.test(where)) out.push(...p.tips);
  out.push({key:'maps-offline', title:'Kart uten nett', note:'Last ned området i Google Maps eller Apple Maps, så finner dere fram selv uten dekning.', group:'Apper'});
  out.push({key:'id', title:'Pass eller nasjonalt ID-kort', note:'Sjekk at det ikke går ut før dere er hjemme igjen.', group:'Ordne'});
  out.push({key:'ehic', title:'Europeisk helsetrygdkort', note:'Gratis på helsenorge.no. Gir rett til nødvendig helsehjelp i EU/EØS.', group:'Ordne'});
  out.push({key:'insurance', title:'Reiseforsikring', note:'Sjekk at den gjelder, ofte via bank eller kredittkort.', group:'Ordne'});
  const hidden = new Set((S.trip && S.trip.prepHidden) || []);
  const edits = (S.trip && S.trip.prepEdits) || {};
  const extra = ((S.trip && S.trip.prepExtra) || []).map(x => ({key:'x-' + x.id, title:x.text, note:x.note || '', group:'Egne', own:true, id:x.id}));
  return [...out.filter(t => !hidden.has(t.key)).map(t => edits[t.key] ? {...t, title: edits[t.key].title || t.title, note: edits[t.key].note != null ? edits[t.key].note : t.note, edited:true} : t), ...extra];
}
function prepDone(uid, key){ const d = S.prep[uid] && S.prep[uid].done; return !!(d && d[key]); }
async function togglePrep(key){
  if (!S.me) return;
  const on = !prepDone(S.me, key);
  const path = 'prep/' + S.me;
  await write(path, () => S.prep[S.me] ? S.db.doc(path).update({done:{[key]: on ? Date.now() : null}}) : S.db.doc(path).set({done:{[key]: Date.now()}}));
}
function prepCard(){
  const days = tripDays();
  if (!days.length || !S.me) return null;
  const now = new Date(); const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  if (today > days[0]) return null;
  const list = prepList(); if (!list.length) return null;
  const mine = list.filter(t => prepDone(S.me, t.key)).length;
  const all = mine === list.length;
  return h('button', {class:'prepcard' + (all ? ' done' : ''), onclick:() => prepSheet()},
    h('span', {class:'prepcard-ring', style:'--p:' + Math.round(mine / list.length * 100)}, h('b', null, mine), h('small', null, '/' + list.length)),
    h('span', {class:'prepcard-txt'}, h('b', null, all ? 'Du er klar til å reise' : 'Før dere reiser'),
      h('span', null, all ? 'Alt på sjekklisten er huket av.' : 'Apper å laste ned og ting å ordne')),
    h('span', {class:'prepcard-go', 'aria-hidden':'true'}, '›'));
}
function prepSheet(){
  let editing = null;
  const saveEdit = async (t, title, note) => {
    const tr = S.trip || {};
    if (!title){ toast('Punktet må ha et navn.'); return; }
    const patch = t.own
      ? {prepExtra: (tr.prepExtra || []).map(x => x.id === t.id ? {...x, text:title, note} : x)}
      : {prepEdits: {[t.key]: {title, note}}};
    await write('trip/main', () => S.db.doc('trip/main').update(patch));
    editing = null; draw();
  };
  const draw = () => {
    const list = prepList();
    const ids = memberIds();
    const groups = ['Apper', 'Ordne', 'Egne'].map(g => [g, list.filter(t => t.group === g)]).filter(([, l]) => l.length);
    const row = t => {
      if (editing === t.key){
        const ti = h('input', {class:'input', value:t.title, maxlength:'80', 'aria-label':'Navn på punktet'});
        const no = h('textarea', {class:'input', maxlength:'300', rows:'3', 'aria-label':'Beskrivelse', placeholder:'Beskrivelse (valgfritt)'}); no.value = t.note || '';
        setTimeout(() => ti.focus(), 30);
        ti.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); saveEdit(t, ti.value.trim(), no.value.trim()); } });
        return h('div', {class:'prep-row editing'}, h('div', {class:'prep-body', style:'display:grid;gap:8px'}, ti, no,
          h('div', {style:'display:flex;gap:8px;justify-content:flex-end;align-items:center'},
            t.edited ? h('button', {class:'linkbtn', type:'button', style:'margin-right:auto;font-size:13px', onclick: async () => {
              await write('trip/main', () => S.db.doc('trip/main').update({prepEdits: {[t.key]: null}})); editing = null; draw(); }}, 'Tilbake til forslaget') : null,
            h('button', {class:'btn ghost', type:'button', onclick:() => { editing = null; draw(); }}, 'Avbryt'),
            h('button', {class:'btn primary', type:'button', onclick:() => saveEdit(t, ti.value.trim(), no.value.trim())}, 'Lagre'))));
      }
      const done = prepDone(S.me, t.key);
      const who = ids.filter(id => prepDone(id, t.key));
      let armed = false;
      const rm = S.canWrite ? h('button', {class:'check-del', type:'button', 'aria-label':'Fjern ' + t.title + ' fra listen', onclick: async e => {
        e.stopPropagation();
        if (!armed){ armed = true; rm.textContent = 'Fjern?'; rm.classList.add('armed'); setTimeout(() => { armed = false; rm.textContent = '×'; rm.classList.remove('armed'); }, 3000); return; }
        const tr = S.trip || {};
        const patch = t.own ? {prepExtra: (tr.prepExtra || []).filter(x => x.id !== t.id)} : {prepHidden: [...new Set([...(tr.prepHidden || []), t.key])]};
        await write('trip/main', () => S.db.doc('trip/main').update(patch)); draw();
      }}, '×') : null;
      return h('div', {class:'prep-row' + (done ? ' on' : '')},
        h('button', {class:'prep-check', role:'checkbox', 'aria-checked': String(done), 'aria-label': t.title, onclick: async () => { await togglePrep(t.key); draw(); }}, done ? '✓' : ''),
        h('div', {class:'prep-body'}, S.canWrite ? h('button', {class:'prep-title', type:'button', title:'Endre', onclick:() => { editing = t.key; draw(); }}, t.title, h('span', {class:'prep-edit', 'aria-hidden':'true'}, 'Endre')) : h('b', null, t.title), t.note ? h('p', null, t.note) : null,
          ids.length > 1 ? h('div', {class:'prep-who'}, who.length ? h('span', {class:'faces'}, who.map(id => face(id, true))) : null, h('small', null, !who.length ? 'Ingen har huket av ennå' : who.length === ids.length ? 'Alle har ordnet det' : who.map(nameOf).join(', '))) : null),
        rm);
    };
    const inp = h('input', {class:'input', placeholder:'Legg til eget punkt', maxlength:'80', 'aria-label':'Nytt punkt'});
    const add = async () => {
      const v = inp.value.trim(); if (!v) return inp.focus();
      const tr = S.trip || {};
      await write('trip/main', () => S.db.doc('trip/main').update({prepExtra: [...(tr.prepExtra || []), {id: Date.now().toString(36), text:v}]})); draw();
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); add(); } });
    body.replaceChildren(...[
      h('p', {class:'muted', style:'margin:0 0 4px'}, 'Hver av dere huker av sin egen liste, så dere ser hvem som er klar. Forslagene bygger på bookingene og hvor dere skal.'),
      groups.map(([g, l]) => [h('div', {class:'section-label'}, g === 'Apper' ? 'Last ned' : g === 'Ordne' ? 'Ordne før avreise' : 'Egne punkter'), h('div', {class:'prep-list'}, l.map(row))]).flat(),
      S.canWrite ? h('div', {class:'quickadd', style:'margin-top:14px'}, inp, h('button', {class:'btn dark', type:'button', onclick:add}, 'Legg til')) : null,
      S.canWrite && ((S.trip && S.trip.prepHidden) || []).length ? h('button', {class:'linkbtn', type:'button', style:'font-size:13px;margin-top:6px', onclick: async () => { await write('trip/main', () => S.db.doc('trip/main').update({prepHidden: []})); draw(); }}, 'Vis forslag jeg har fjernet') : null
    ].flat(9).filter(x => x != null && x !== false)
    );
  };
  const body = h('div', {class:'form'});
  draw();
  openSheet(h('h2', null, 'Før dere reiser'), body);
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
    (bookedPill(i) || payPill(i) || i.kind === 'taxi' || i.kind === 'stay') ? h('div', {class:'pills'}, bookedPill(i), payPill(i),
      i.kind === 'taxi' || i.kind === 'stay' ? h('button', {class:'pill neutral', onclick:() => taxiScreen(/→\s*flyplass/i.test(i.title || '') ? 'airport' : 'home')}, h('span', {svg:ICONS.taxi, style:'display:inline-flex'}), 'Vis taxisjåføren') : null) : null,
    (atts.length || S.assets) ? h('div', {class:'files'},
      atts.map(fileChip),
      S.assets && S.canWrite ? h('label', {class:'attach'}, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), atts.length ? 'Legg ved mer' : 'Legg ved kvittering', input) : null
    ) : null
  );
}


/* ---------- samlet reisevei ---------- */
const TRAVEL = ['car', 'parking', 'flight', 'taxi'];
// Slår sammen transport som kommer etter hverandre på en dag til én blokk (minst to ledd)
function groupTravel(entries){
  const out = []; let run = [];
  const flush = () => { if (run.length >= 2) out.push({type:'travel', items:run.map(e => e.x)}); else out.push(...run); run = []; };
  for (const e of entries){
    if (e.type === 'item' && TRAVEL.includes(e.x.kind)) run.push(e); else { flush(); out.push(e); }
  }
  flush();
  return out;
}
function minutesOf(t){ const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; }
function durText(min){ if (min < 60) return min + ' min'; const hh = Math.floor(min / 60), mm = min % 60; return hh + ' t' + (mm ? ' ' + mm + ' min' : ''); }
function travelBlock(items){
  const first = items.find(i => i.time), last = items.slice().reverse().find(i => i.time);
  const span = first && last && first !== last ? first.time + '–' + last.time : first ? 'fra ' + first.time : '';
  const rows = [];
  items.forEach((i, k) => {
    if (k > 0){
      const a = minutesOf(items[k - 1].time), b = minutesOf(i.time);
      const gap = a != null && b != null && b > a ? durText(b - a) : '';
      rows.push(h('div', {class:'tv-gap', 'aria-hidden': gap ? null : 'true'}, h('span', {class:'tv-dash'}), gap ? h('span', {class:'tv-gaptext'}, gap + ' senere') : null));
    }
    const kind = i.kind || 'other';
    const status = i.booked === 'no' ? ['todo', 'Må bookes'] : i.pay === 'unpaid' ? ['todo', 'Ikke betalt'] : i.pay === 'unknown' ? ['unknown', 'Betalt?'] : null;
    const atts = (i.attachments || []).length;
    const firstLine = String(i.details || '').split('\n')[0];
    rows.push(h('button', {class:'tv-row', type:'button', onclick:() => S.canWrite ? itemSheet(i) : null, 'aria-label': (i.time ? i.time + ', ' : '') + (i.title || '') + (S.canWrite ? '. Trykk for å endre' : '')},
      h('span', {class:'tv-time'}, i.time || ''),
      h('span', {class:'tv-node tile ' + kind, svg: ICONS[kind] || ICONS.other, 'aria-hidden':'true'}),
      h('span', {class:'tv-body'},
        h('b', null, i.title || KIND_LABEL[kind]),
        firstLine ? h('small', null, firstLine) : null,
        (status || atts || i.ref) ? h('span', {class:'tv-meta'},
          status ? h('span', {class:'pill ' + status[0]}, h('span', {class:'dot'}), status[1]) : null,
          i.ref ? h('span', {class:'tv-ref'}, i.ref) : null,
          atts ? h('span', {class:'tv-att'}, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), atts) : null) : null)
    ));
  });
  return h('section', {class:'travel', 'aria-label':'Reisevei'},
    h('div', {class:'tv-head'}, h('span', null, 'Reisevei'), span ? h('span', {class:'muted'}, span) : null),
    rows);
}

function plannedIdeaCard(i){
  const img = ideaImage(i);
  const [cname, c] = catOf(i.category);
  // To trykk for å flytte ut: første trykk spør, andre flytter. Går tilbake etter noen sekunder.
  let armed = false, timer = null;
  const back = S.canWrite ? h('button', {class:'moveback', type:'button', onclick: async e => {
    e.stopPropagation();
    if (!armed){
      armed = true; back.classList.add('armed'); back.textContent = 'Sikker? Trykk igjen for å flytte ut';
      timer = setTimeout(() => { armed = false; back.classList.remove('armed'); back.textContent = 'Flytt tilbake til idéer'; }, 3500);
      return;
    }
    clearTimeout(timer); back.disabled = true; await moveIdea(i, null); toast('«' + (i.title || 'Idéen') + '» er flyttet tilbake til idéer');
  }}, 'Flytt tilbake til idéer') : null;
  return h('article', {class:'card planned', style:catStyle(c)},
    img ? h('div', {class:'planned-img'}, h('img', {src:img.src, alt:'', loading:'lazy', referrerpolicy:'no-referrer', onerror: e => e.target.closest('.planned-img').remove()})) : null,
    h('div', {class:'body-col'},
      h('div', {class:'kicker'}, i.time ? h('span', {class:'time'}, i.time) : null, h('span', {class:'catdot', style:catStyle(c)}, cname)),
      h('h3', null, i.title || 'Idé'),
      i.note ? h('p', {class:'details'}, i.note) : null,
      safeUrl(i.link) ? h('div', {class:'meta'}, h('a', {href:safeUrl(i.link), target:'_blank', rel:'noopener', style:'color:var(--ink)'}, 'Åpne lenke')) : null
    ),
    S.canWrite ? h('button', {class:'iconbtn edit', onclick:() => ideaSheet(i)}, 'Endre') : h('span'),
    back
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


/* ---------- steder (mapper) på idétavla ---------- */
function tripFolders(){ return (S.trip && Array.isArray(S.trip.folders)) ? S.trip.folders : []; }
function folderName(id){ const f = tripFolders().find(x => x.id === id); return f ? f.name : ''; }
// Et sted kan ha egne datoer (en etappe av turen)
function folderDays(f){ if (!f || !isoDate(f.start)) return []; const end = isoDate(f.end) ? f.end : f.start; return tripDays().filter(d => d >= f.start && d <= end); }
function folderRange(f){
  if (!f || !isoDate(f.start)) return '';
  const a = D(f.start), b = D(isoDate(f.end) ? f.end : f.start);
  if (f.start === (f.end || f.start)) return a.getUTCDate() + '.';
  return a.getUTCMonth() === b.getUTCMonth() ? a.getUTCDate() + '.–' + b.getUTCDate() + '.' : a.getUTCDate() + '. ' + MON[a.getUTCMonth()] + '–' + b.getUTCDate() + '. ' + MON[b.getUTCMonth()];
}
function placesOn(day){ return tripFolders().filter(f => folderDays(f).includes(day)).map(f => f.name); }
// Dagene en idé kan flyttes til: stedets dager hvis stedet har datoer, ellers hele turen
function daysFor(i){ const f = i && tripFolders().find(x => x.id === i.folder); const fd = folderDays(f); return fd.length ? fd : tripDays(); }
async function saveFolders(list){ return write('trip/main', () => S.db.doc('trip/main').update({folders: list})); }
function folderRow(folders){
  const count = id => S.ideas.filter(i => id ? i.folder === id : true).length;
  const chip = (id, label, sub) => h('button', {class:'folder-chip', 'aria-pressed': String((S.folder || null) === id), onclick:() => { S.folder = id; mapFitted = false; render(); }},
    label, h('small', null, sub || count(id)));
  if (!folders.length && !S.canWrite) return null;
  return h('div', {class:'folder-row', role:'group', 'aria-label':'Steder'},
    chip(null, folders.length ? 'Alle' : 'Alle idéer'),
    folders.map(f => chip(f.id, f.name, folderRange(f))),
    S.canWrite ? h('button', {class:'folder-chip add', 'aria-label': folders.length ? 'Legg til eller endre steder' : 'Legg til sted', title:'Steder på turen', onclick:() => foldersSheet()},
      h('span', {svg:ICONS.plus || '', style:'display:inline-flex'}), folders.length ? null : 'Sted') : null);
}
function foldersSheet(){
  let list = tripFolders().map(f => ({...f}));
  const body = h('div', {class:'form'});
  const draw = () => {
    body.replaceChildren(
      h('p', {class:'muted', style:'margin:0'}, 'Skal dere flere steder på turen? Lag et sted for hver by eller område. Med datoer vises stedet i planen, og idéene foreslås bare for de dagene.'),
      list.length ? h('div', {class:'stack'}, list.map((f, k) => {
        const inp = h('input', {class:'input', value:f.name, maxlength:'30', 'aria-label':'Navn på sted', oninput: e => { list[k].name = e.target.value; }});
        const t = S.trip || {};
        const dIn = (key, label) => h('input', {class:'input', type:'date', value:f[key] || '', min:t.start || null, max:t.end || null, 'aria-label':label + ' ' + (f.name || ''), onchange: e => { list[k][key] = e.target.value; }});
        let armed = false;
        const del = h('button', {class:'check-del', type:'button', 'aria-label':'Fjern ' + f.name, onclick: () => {
          if (!armed){ armed = true; del.textContent = 'Fjern?'; del.classList.add('armed'); setTimeout(() => { armed = false; del.textContent = '×'; del.classList.remove('armed'); }, 3000); return; }
          list.splice(k, 1); draw();
        }}, '×');
        return h('div', {class:'leg-edit'}, h('div', {style:'display:flex;gap:8px;align-items:center'}, inp, del),
          h('div', {class:'row2'}, h('label', {class:'leg-date'}, h('span', null, 'Fra'), dIn('start', 'Fra')), h('label', {class:'leg-date'}, h('span', null, 'Til'), dIn('end', 'Til'))));
      })) : null,
      (() => {
        const inp = h('input', {class:'input', placeholder:'Nytt sted, f.eks. Warszawa', maxlength:'30', 'aria-label':'Nytt sted'});
        const add = () => { const v = inp.value.trim(); if (!v) return inp.focus(); list.push({id:'f' + Date.now().toString(36), name:v}); draw(); setTimeout(() => { const n = body.querySelector('input[aria-label="Nytt sted"]'); if (n) n.focus(); }, 30); };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); add(); } });
        return h('div', {class:'quickadd'}, inp, h('button', {class:'btn dark', type:'button', onclick:add}, 'Legg til'));
      })(),
      h('p', {class:'muted', style:'margin:0;font-size:13px'}, 'Fjerner du et sted, blir idéene liggende under «Alle».'),
      h('div', {class:'actions'}, h('span'), h('button', {class:'btn primary', type:'button', onclick: async () => {
        const bad = list.find(f => isoDate(f.start) && isoDate(f.end) && f.end < f.start);
        if (bad){ toast('«Til» må være etter «Fra» for ' + (bad.name || 'stedet') + '.'); return; }
        const clean = list.map(f => ({id:f.id, name:String(f.name || '').trim(), start: isoDate(f.start) ? f.start : '', end: isoDate(f.end) ? f.end : ''})).filter(f => f.name);
        if (await saveFolders(clean)){ sheet.close(); toast('Stedene er lagret'); }
      }}, 'Lagre'))
    );
  };
  draw();
  openSheet(h('h2', null, 'Steder på turen'), body);
}

function boardView(){
  const days = tripDays();
  const planned = i => isoDate(i.day) && days.includes(i.day);
  let list = S.ideas.slice();
  if (S.filter === 'open') list = list.filter(i => !planned(i));
  if (S.filter === 'planned') list = list.filter(planned);
  const folders = tripFolders();
  if (S.folder && !folders.some(f => f.id === S.folder)) S.folder = null;
  if (S.folder) list = list.filter(i => i.folder === S.folder);
  const when = i => planned(i) ? i.day + ' ' + (i.time || '99:99') : '';
  list.sort((a, b) => S.filter === 'planned'
    ? (when(a) < when(b) ? -1 : when(a) > when(b) ? 1 : 0)
    : ((a.createdAt || 0) - (b.createdAt || 0)));


  const inFolder = S.ideas.filter(i => !S.folder || i.folder === S.folder);
  const nOpen = inFolder.filter(i => !planned(i)).length, nPlanned = inFolder.length - nOpen;
  const seg = (id, label, n) => h('button', {'aria-pressed': String(S.filter === id), onclick:() => { S.filter = id; render(); }}, label, n != null ? h('small', null, ' ' + n) : null);

  const grid = list.length ? h('div', {class:'masonry'}, list.map(ideaCard)) : h('div', {class:'empty'},
    h('h3', null, S.ideas.length ? 'Ingen idéer her' : 'Tavla er tom'),
    h('p', null, S.folder ? 'Ingen idéer for ' + folderName(S.folder) + ' ennå. Trykk + for å feste den første.' : S.ideas.length ? 'Prøv et annet filter.' : 'Trykk + for å feste det første forslaget, for eksempel en kafé eller en dagstur.'));

  const isMap = S.boardMode === 'kart';
  const toolbar = h('div', {class:'boardtools'},
    folderRow(folders),
    h('div', {class:'boardrow'},
      h('div', {class:'seg', role:'group', 'aria-label':'Filter'}, seg('all','Alle'), seg('open','Ikke planlagt', nOpen), seg('planned','Planlagt', nPlanned)),
      h('button', {class:'viewtoggle', 'aria-pressed': String(isMap), 'aria-label': isMap ? 'Vis tavla' : 'Vis kart', title: isMap ? 'Tavle' : 'Kart',
        onclick:() => { S.boardMode = isMap ? 'tavle' : 'kart'; render(); }}, h('span', {svg: isMap ? ICONS.grid : ICONS.map, style:'display:inline-flex'}))));
  requestAnimationFrame(() => { const tabs = document.querySelector('.tabs'); if (tabs) toolbar.style.top = (tabs.getBoundingClientRect().height + 14) + 'px'; });
  const sel = S.folder ? folders.find(f => f.id === S.folder) : null;
  const leg = sel ? legCard(sel, inFolder.length) : null;
  if (isMap) return [toolbar, leg, ...mapView(list)];
  return [toolbar, leg, grid];
}

// Kort for valgt sted: bilde, datoer og antall idéer
function legCard(f, n){
  const w = wikiImage(f.wiki || ('en:' + f.name));
  const days = folderDays(f);
  const bits = [folderRange(f) ? folderRange(f) + ' ' + MONL[D(f.start).getUTCMonth()] : 'Ingen datoer', n + (n === 1 ? ' idé' : ' idéer')];
  if (days.length) bits.push(days.length + (days.length === 1 ? ' dag' : ' dager'));
  return h('div', {class:'legcard'},
    h('span', {class:'legcard-img'}, w ? h('img', {src:w.src, alt:'', referrerpolicy:'no-referrer', onerror: e => e.target.remove()}) : null),
    h('div', null, h('b', null, f.name), h('span', null, bits.join(' · '))),
    S.canWrite && !days.length ? h('button', {class:'linkbtn', style:'margin-left:auto;font-size:13px', onclick:() => foldersSheet()}, 'Legg til datoer') : null);
}
// Skuff med dager som glir opp nederst mens man drar et kort
let dragTray = null;
function showDragTray(i){
  hideDragTray();
  if (!S.canWrite) return;
  const days = daysFor(i);
  if (!days.length) return;
  const f = tripFolders().find(x => x.id === i.folder);
  dragTray = h('div', {class:'dragtray', role:'region', 'aria-label':'Slipp på en dag'},
    h('p', null, folderDays(f).length ? 'Slipp på en dag i ' + f.name : 'Slipp på en dag'),
    h('div', {class:'dragtray-days'}, days.map(d => dropZone(d, dayLabel(d, true))), i.day ? dropZone(null, 'Tilbake til tavla') : null));
  document.body.append(dragTray);
  requestAnimationFrame(() => dragTray && dragTray.classList.add('open'));
}
function hideDragTray(){ if (dragTray){ const t = dragTray; dragTray = null; t.classList.remove('open'); setTimeout(() => t.remove(), 220); } }
function dropZone(day, label){
  const el = h('button', {class:'drop', onclick:() => toast('Dra et idékort hit, eller velg dag på kortet.')}, label);
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); hideDragTray(); const id = e.dataTransfer.getData('text/plain'); const i = S.ideas.find(x => x.id === id); if (i) moveIdea(i, day); });
  return el;
}


/* ---------- bilder: opplastet > bildelenke > Wikipedia ---------- */
const wikiCache = new Map();
try { const saved = JSON.parse(sessionStorage.getItem('yaffle-wiki') || '{}'); for (const [k, v] of Object.entries(saved)) wikiCache.set(k, v); } catch(e){}
function parseWiki(v){
  if (!v) return null;
  const m = String(v).match(/^https?:\/\/([a-z-]+)\.(?:m\.)?wikipedia\.org\/wiki\/([^?#]+)/i);
  if (m) return m[1] + ':' + decodeURIComponent(m[2]).replace(/_/g, ' ');
  return /^[a-z-]{2,3}:.+/.test(v) ? v : null;
}
function wikiImage(key){
  if (!key) return null;
  if (wikiCache.has(key)) return wikiCache.get(key);
  wikiCache.set(key, null);
  const i = key.indexOf(':'); const lang = key.slice(0, i); const title = key.slice(i + 1).replace(/ /g, '_');
  fetch('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title))
    .then(r => r.ok ? r.json() : null)
    .then(j => {
      const t = j && (j.thumbnail || j.originalimage);
      if (!t || !t.source) return;
      const src = j.thumbnail ? j.thumbnail.source.replace(/\/\d+px-/, '/800px-') : j.originalimage.source;
      const page = (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || ('https://' + lang + '.wikipedia.org/wiki/' + title);
      wikiCache.set(key, {src, page});
      try { sessionStorage.setItem('yaffle-wiki', JSON.stringify(Object.fromEntries([...wikiCache].filter(([, v]) => v)))); } catch(e){}
      render(); if (detailId && sheet.open) ideaDetail(detailId);
    }).catch(() => {});
  return null;
}
function ideaImage(i){
  if (i.photo){ const src = blobUrl(i.photo); return src ? {src} : null; }
  const u = safeUrl(i.photoUrl);
  if (u && !parseWiki(u)) return {src:u, credit:new URL(u).hostname.replace(/^www\./,''), page:u};
  const w = wikiImage(parseWiki(i.wiki) || parseWiki(i.photoUrl));
  return w ? {src:w.src, credit:'Wikipedia', page:w.page} : null;
}

function hashNum(id){ let x = 7; for (const c of String(id)) x = (x*33 + c.charCodeAt(0)) >>> 0; return x; }

function ideaCard(i){
  const days = tripDays(); const allin = isAllIn(i);
  const planned = isoDate(i.day) && days.includes(i.day);
  const [cname, c] = catOf(i.category);
  const who = heartsOf(i); const mine = S.me && who.includes(S.me);
  const heights = [190, 240, 160, 280, 210];
  const img = ideaImage(i);
  const media = img
    ? h('img', {src:img.src, alt:'', loading:'lazy', referrerpolicy:'no-referrer', onerror: e => { e.target.style.display = 'none'; }})
    : h('div', {class:'art', style:catStyle(c) + 'background:var(--c-bg);min-height:' + heights[hashNum(i.id) % heights.length] + 'px'},
        h('span', {svg: ICONS[c.icon] || ICONS.other, style:'display:inline-flex;justify-content:flex-end;width:100%'}),
        h('b', null, i.title || 'Idé'));
  const el = h('div', {class:'pin' + (S.flash.has(i.id) ? ' flash' : ''), role:'button', tabindex:'0', draggable: S.canWrite ? 'true' : null, onclick:() => ideaDetail(i.id),
      onkeydown: e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget){ e.preventDefault(); ideaDetail(i.id); } },
      'aria-label': (i.title || 'Idé') + ', ' + cname + ', ' + who.length + ' hjerter'},
    h('span', {class:'ph', style:catStyle(c)},
      media,
      h('span', {class:'tag'}, cname),
      allin ? h('span', {class:'allin'}, 'Alle er med!') : null
    ),
    h('span', {class:'cap'},
      h('h3', null, i.title || 'Idé'),
      !S.folder && i.folder && folderName(i.folder) ? h('span', {class:'pin-folder'}, folderName(i.folder)) : null,
      h('span', null, planned ? 'Planlagt ' + dayLabel(i.day, true).toLowerCase() + (i.time ? ' kl. ' + i.time : '') : (i.addedBy ? 'Festet av ' + nameOf(i.addedBy) : 'Forslag fra Claude'))
    )
  );
  el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i.id); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); setTimeout(() => showDragTray(i), 0); });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); hideDragTray(); });
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
    (() => { const img = ideaImage(i); return h('div', {class:'detail-hero', style:catStyle(c) + 'position:relative'}, img ? [h('img', {src:img.src, alt:'', referrerpolicy:'no-referrer'}),
        img.credit ? h('a', {href:img.page, target:'_blank', rel:'noopener', style:'position:absolute;right:10px;bottom:10px;font-size:11px;font-weight:600;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:99px;text-decoration:none'}, 'Foto: ' + img.credit) : null]
      : h('div', {class:'art', style:'background:var(--c-bg)'}, h('span', {svg: ICONS[c.icon] || ICONS.other, style:'display:inline-flex'}))); })(),
    h('div', {style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px'},
      h('span', {class:'cat-chip', style:catStyle(c)}, cname), isAllIn(i) ? h('span', {class:'allin-badge'}, 'Alle er med!') : null),
    h('h2', null, i.title || 'Idé'),
    i.note ? h('p', {class:'details', style:'font-size:16px;margin:0 0 10px'}, i.note) : h('p', {class:'muted', style:'margin:0 0 10px'}, 'Ingen beskrivelse ennå.'),
    url ? h('p', {style:'margin:0 0 6px'}, h('a', {href:url, target:'_blank', rel:'noopener', style:'color:var(--ink);font-weight:600'}, 'Åpne ' + new URL(url).hostname.replace(/^www\./,'') + ' ↗')) : null,
    hasPos(i) ? h('p', {style:'margin:0 0 6px'}, h('a', {href:'https://www.google.com/maps/search/?api=1&query=' + i.lat + ',' + i.lng, target:'_blank', rel:'noopener', style:'color:var(--ink);font-weight:600'}, 'Veibeskrivelse' + (i.place ? ' til ' + i.place : '') + ' ↗')) : null,
    h('div', {class:'section-label'}, 'Hvem vil?'),
    heartBtn(i),
    h('div', {class:'section-label'}, planned ? 'Planlagt ' + dayLabel(i.day).toLowerCase() : 'Flytt inn på en dag'),
    days.length ? h('div', {class:'daychips', role:'group', 'aria-label':'Velg dag'},
      [...new Set([...daysFor(i), ...(planned ? [i.day] : [])])].sort().map(d => h('button', {'aria-pressed': String(i.day === d), disabled: !S.canWrite, onclick:() => moveIdea(i, i.day === d ? null : d)}, dayLabel(d, true))),
      planned && S.canWrite ? h('button', {onclick:() => moveIdea(i, null)}, 'Tilbake til tavla') : null
    ) : h('p', {class:'muted'}, 'Legg inn datoer for turen først.'),
    planned ? h('div', {class:'field', style:'margin-top:12px'}, h('label', {for:'d-time'}, 'Klokkeslett (valgfritt)'), time) : null,
    h('div', {class:'actions', style:'margin-top:22px'},
      h('span', {class:'muted', style:'font-size:13px'}, i.addedBy ? 'Festet av ' + nameOf(i.addedBy) : 'Forslag fra Claude'),
      S.canWrite ? h('button', {class:'btn ghost', onclick:() => ideaSheet(i)}, 'Endre') : null)
  );
}
sheet.addEventListener('close', () => { detailId = null; });


/* ---------- kart (Leaflet + OpenStreetMap) ---------- */
let L_ready = null, mapEl = null, map = null, markerLayer = null, mapFitted = false, placing = null;
function loadLeaflet(){
  if (L_ready) return L_ready;
  L_ready = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.append(css);
    const js = document.createElement('script'); js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; js.onload = () => res(window.L); js.onerror = rej; document.head.append(js);
  });
  return L_ready;
}
const hasPos = x => Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lng)) && x.lat !== null && x.lng !== null && x.lat !== '' ;
let mapLayers = null;
function walkMin(a, b){
  // Luftlinje × 1,3 for gater, 80 m i minuttet
  const dy = (a[0] - b[0]) * 111320, dx = (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180);
  return Math.max(1, Math.round(Math.hypot(dx, dy) * 1.3 / 80));
}
function mapView(list){
  if (!mapEl){ mapEl = h('div', {class:'mapbox', role:'region', 'aria-label':'Kart over idéene'}); }
  const days = tripDays();
  if (S.mapDay && !days.includes(S.mapDay)) S.mapDay = null;
  const dayIdeas = S.mapDay ? S.ideas.filter(i => i.day === S.mapDay && hasPos(i)).sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1) : null;
  const shown = dayIdeas || list.filter(hasPos);
  const missing = (dayIdeas ? S.ideas.filter(i => i.day === S.mapDay) : list).filter(i => !hasPos(i));
  const stays = S.items.filter(i => i.kind === 'stay' && hasPos(i));
  locateStays();
  loadLeaflet().then(L => {
    if (!map){
      map = L.map(mapEl, {scrollWheelZoom:false, zoomControl:false, attributionControl:true});
      const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      const ck = window.yaffleCartoKey;
      if (ck){
        // CARTO Voyager / Dark Matter (gratis nøkkel, opptil 5 mill. fliser i måneden)
        L.tileLayer('https://basemaps.cartocdn.com/rastertiles/' + (dark ? 'dark_all' : 'voyager') + '/{z}/{x}/{y}.png?key=' + encodeURIComponent(ck), {maxZoom:20,
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).addTo(map);
      } else {
        // OpenStreetMap-fliser (gratis, uten nøkkel), gjort lyse og grå med CSS-filter
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, className: dark ? 'tiles-mono dark' : 'tiles-mono',
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
      }
      L.control.zoom({position:'topright'}).addTo(map);
      mapLayers = {lines:L.layerGroup().addTo(map), marks:L.layerGroup().addTo(map)};
      markerLayer = mapLayers.marks;
      map.setView([54.349, 18.653], 14);
      const labels = () => mapEl.classList.toggle('show-labels', map.getZoom() >= 16 || !!S.mapDay);
      map.on('zoomend', labels); labels();
      map.on('click', async e => {
        if (!placing) return;
        const id = placing; placing = null; mapEl.classList.remove('placing');
        const ok = await write('items/' + id, () => S.db.doc('items/' + id).update({lat: e.latlng.lat, lng: e.latlng.lng}));
        if (ok) toast('Overnattingen er satt på kartet');
        render();
      });
    }
    mapLayers.lines.clearLayers(); mapLayers.marks.clearLayers();
    mapEl.classList.toggle('show-labels', map.getZoom() >= 16 || !!S.mapDay);
    const pts = [];
    const callout = (title, sub, cls) => { const el = document.createElement('span'); el.className = 'callout-in' + (cls ? ' ' + cls : '');
      const col = document.createElement('span'); col.className = 'callout-txt';
      const t = document.createElement('b'); t.textContent = title; col.append(t);
      if (sub){ const s2 = document.createElement('small'); s2.textContent = sub; col.append(s2); }
      el.append(col);
      const ch = document.createElement('i'); ch.textContent = '›'; el.append(ch); return el; };
    const home = stays[0] ? [Number(stays[0].lat), Number(stays[0].lng)] : null;
    for (const st of stays){
      const m = L.marker([Number(st.lat), Number(st.lng)], {icon: L.divIcon({className:'', html:'<span class="pinb pinb-home"><span class="pinb-face">' + ICONS.stay + '</span></span>', iconSize:[46, 54], iconAnchor:[23, 52]}), title:'Her bor dere: ' + st.title, keyboard:true, zIndexOffset:1000});
      m.bindTooltip(callout('Her bor dere'), {permanent:true, direction:'right', offset:[8, -28], className:'callout callout-home'});
      m.on('click', () => itemSheet(st)); mapLayers.marks.addLayer(m); pts.push([Number(st.lat), Number(st.lng)]);
    }
    shown.forEach((i, k) => {
      const [cname, c] = catOf(i.category);
      // Bildenål: rund miniatyr med hvit kant og liten spiss, eller kategorifarge med ikon uten bilde
      const img = ideaImage(i);
      const esc = v => String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      const face2 = img ? '<img src="' + esc(img.src) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : '';
      const num = dayIdeas ? '<em>' + (k + 1) + '</em>' : '';
      const html = '<span class="pinb' + (img ? ' has-img' : '') + '" style="' + catStyle(c) + '"><span class="pinb-face">' + (ICONS[c.icon] || ICONS.other) + face2 + '</span>' + num + '</span>';
      const m = L.marker([Number(i.lat), Number(i.lng)], {icon: L.divIcon({className:'', html, iconSize:[46, 54], iconAnchor:[23, 52]}), title:i.title + ' (' + cname + ')', keyboard:true, riseOnHover:true});
      m.bindTooltip(callout(i.title, (dayIdeas && i.time ? i.time + ' · ' : '') + cname), {permanent:true, direction:'right', offset:[8, -28], className:'callout'});
      m.on('click', () => ideaDetail(i.id)); mapLayers.marks.addLayer(m); pts.push([Number(i.lat), Number(i.lng)]);
    });
    // Dagsrute: fra der dere bor, gjennom dagens idéer i tidsrekkefølge
    if (dayIdeas && dayIdeas.length){
      const route = [...(home ? [home] : []), ...dayIdeas.map(i => [Number(i.lat), Number(i.lng)])];
      L.polyline(route, {color: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#0e0f0c', weight:4, opacity:.9, lineJoin:'round'}).addTo(mapLayers.lines);
      for (let k = 1; k < route.length; k++){
        const a = route[k - 1], b = route[k];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.003) continue;
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const min = walkMin(a, b);
        L.marker(mid, {interactive:false, icon: L.divIcon({className:'', html:'<span class="walk"><b>' + (min > 90 ? Math.round(min / 60) + '' : min) + '</b><small>' + (min > 90 ? 'T' : 'MIN') + '</small></span>', iconSize:[32, 32], iconAnchor:[16, 16]})}).addTo(mapLayers.lines);
      }
    }
    const near = home ? pts.filter(p => Math.hypot((p[0] - home[0]) * 111, (p[1] - home[1]) * 65) < 5) : pts;
    const key = (S.mapDay || 'alle') + ':' + pts.length;
    setTimeout(() => { map.invalidateSize(); if ((!mapFitted || mapFitted !== key) && pts.length){ map.fitBounds(dayIdeas ? pts : (near.length > 1 ? near : pts), {padding:[50, 50], maxZoom:16}); mapFitted = key; } }, 50);
  }).catch(() => { mapEl.textContent = 'Kartet kunne ikke lastes. Sjekk nettet.'; });
  const homeStay = stays[0];
  const dayBtn = (d, label) => h('button', {'aria-pressed': String((S.mapDay || null) === d), onclick:() => { S.mapDay = d; render(); }}, label);
  return [
    days.length ? h('div', {class:'daychips-row map-days', role:'group', 'aria-label':'Vis dag på kartet'},
      dayBtn(null, 'Alle'), days.map(d => dayBtn(d, dayLabel(d, true)))) : null,
    h('div', {class:'mapwrap'}, mapEl,
      dayIdeas ? h('div', {class:'map-sheet'}, h('b', null, dayLabel(S.mapDay)),
        h('span', {class:'muted'}, dayIdeas.length ? dayIdeas.length + (dayIdeas.length === 1 ? ' stopp' : ' stopp') + ' · gangtid er omtrentlig' : 'Ingen planlagte idéer med sted denne dagen')) : null),
    h('div', {class:'maptools'},
      homeStay ? h('button', {class:'pill neutral', onclick:() => { if (map) map.setView([Number(homeStay.lat), Number(homeStay.lng)], 16); }}, h('span', {svg:ICONS.stay, style:'display:inline-flex'}), 'Vis hvor dere bor')
        : (() => { const st = S.items.find(i => i.kind === 'stay'); return st && S.canWrite
            ? h('button', {class:'pill ' + (placing ? 'ok' : 'neutral'), onclick:() => { placing = placing ? null : st.id; mapEl.classList.toggle('placing', !!placing); render(); if (placing) toast('Trykk på kartet der dere bor'); }}, placing ? 'Trykk på kartet der dere bor …' : 'Plasser overnattingen på kartet')
            : h('span', {class:'muted', style:'font-size:14px'}, 'Legg inn adressen på overnattingen i planen, så vises den på kartet.'); })(),
      h('button', {class:'pill neutral', onclick:() => { mapFitted = false; render(); }}, 'Vis alle'),
      homeStay && S.canWrite ? h('button', {class:'pill neutral', onclick:() => { placing = homeStay.id; mapEl.classList.add('placing'); render(); toast('Trykk på kartet der dere bor'); }}, placing ? 'Trykk på kartet …' : 'Flytt hjem-nålen') : null),
    missing.length ? h('div', {class:'notice'}, h('span', null, 'Uten sted: ' + missing.map(i => i.title).join(', ') + '.'), h('span', {class:'muted'}, 'Legg inn adresse på idéen for å få den på kartet.')) : null];
}

const stayTried = new Set();
function stayAddress(i){
  if (i.place) return i.place;
  const first = String(i.details || '').split('\n')[0].replace(/\(.*?\)/g, '').replace(/\.$/, '').trim();
  return /\d/.test(first) ? first : i.title;
}
async function locateStays(){
  if (!S.canWrite) return;
  for (const i of S.items.filter(x => x.kind === 'stay' && !hasPos(x) && !stayTried.has(x.id))){
    stayTried.add(i.id);
    const addr = stayAddress(i);
    const simple = addr.replace(/^ul\.?\s*/i, '').replace(/\b\d{2}-\d{3}\s*/, '').replace(/\s+,/g, ',').trim();
    let pos = null;
    for (const q of [addr, simple, i.title]){ if (q && !pos) pos = await geocode(q); }
    if (!pos) console.warn('Yaffle: fant ikke overnattingen på kartet', addr);
    if (pos) await write('items/' + i.id, () => S.db.doc('items/' + i.id).update({lat:pos.lat, lng:pos.lng}));
  }
}

async function geocode(q){
  const t = S.trip && S.trip.title;
  const query = t && !q.toLowerCase().includes(t.toLowerCase()) ? q + ', ' + t : q;
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=nb&q=' + encodeURIComponent(query));
    if (r.ok){ const j = await r.json(); if (j && j[0]) return {lat: Number(j[0].lat), lng: Number(j[0].lon)}; }
  } catch(e){}
  try {
    // Photon (OpenStreetMap-data fra Komoot) som reserve
    const r = await fetch('https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(query));
    if (r.ok){ const j = await r.json(); const c = j && j.features && j.features[0] && j.features[0].geometry.coordinates; if (c) return {lat: c[1], lng: c[0]}; }
  } catch(e){}
  return null;
}


/* ---------- været (Open-Meteo, gratis og uten nøkkel) ---------- */
const WX = {byDate:{}, loaded:false, loading:false};
function loadWeather(){
  if (WX.loaded || WX.loading) return; WX.loading = true;
  const st = S.items.find(i => i.kind === 'stay' && i.lat != null && i.lat !== '' && Number.isFinite(Number(i.lat)));
  const lat = st ? Number(st.lat) : 54.352, lng = st ? Number(st.lng) : 18.6466;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FWarsaw&forecast_days=16')
    .then(r => r.ok ? r.json() : null)
    .then(j => {
      const d = j && j.daily; if (!d) return;
      d.time.forEach((t, k) => { WX.byDate[t] = {code:d.weather_code[k], max:d.temperature_2m_max[k], min:d.temperature_2m_min[k], rain:d.precipitation_probability_max[k]}; });
      WX.loaded = true; render();
    }).catch(() => {}).finally(() => { WX.loading = false; });
}
const WX_ICONS = {
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  cloud:'<svg viewBox="0 0 24 24"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/></svg>',
  rain:'<svg viewBox="0 0 24 24"><path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
  snow:'<svg viewBox="0 0 24 24"><path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15z"/><path d="M8 19h.01M12 21h.01M16 19h.01"/></svg>',
  fog:'<svg viewBox="0 0 24 24"><path d="M4 10h16M3 14h18M6 18h12"/></svg>'
};
function wxKind(code){
  if (code === 0 || code === 1) return ['sun', code === 0 ? 'Sol' : 'Mest sol'];
  if (code === 2 || code === 3) return ['cloud', code === 2 ? 'Delvis skyet' : 'Overskyet'];
  if (code === 45 || code === 48) return ['fog', 'Tåke'];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['snow', 'Snø'];
  return ['rain', code >= 95 ? 'Torden' : (code >= 51 && code <= 57) ? 'Yr' : 'Regn'];
}
function weatherLine(day){
  loadWeather();
  const w = WX.byDate[day];
  if (!w) return WX.loaded ? h('div', {class:'wx muted'}, 'Værmeldingen kommer ca. to uker før') : null;
  const [k, label] = wxKind(w.code);
  return h('div', {class:'wx', title:label},
    h('span', {class:'wx-ic', svg:WX_ICONS[k]}),
    h('b', null, Math.round(w.max) + '°'), h('span', {class:'muted'}, '/ ' + Math.round(w.min) + '°'),
    h('span', null, label),
    w.rain != null ? h('span', {class:'muted'}, w.rain + ' % sjanse for nedbør') : null);
}

/* ---------- vis taxisjåføren ---------- */
const AIRPORT = {name:'Port Lotniczy Gdańsk im. Lecha Wałęsy', address:'ul. Juliusza Słowackiego 200, 80-298 Gdańsk', code:'GDN'};
function taxiScreen(start){
  const st = S.items.find(i => i.kind === 'stay');
  const home = st ? {name: String(st.title || '').split('–')[0].trim(), address: stayAddress(st)} : null;
  let target = start === 'airport' || !home ? 'airport' : 'home';
  const dlg = h('dialog', {class:'taxi', 'aria-label':'Vis taxisjåføren'});
  const draw = () => {
    const t = target === 'home' ? home : AIRPORT;
    dlg.replaceChildren(
      h('div', {class:'taxi-top'},
        h('div', {class:'seg', role:'group', 'aria-label':'Hvor skal dere?'},
          home ? h('button', {'aria-pressed': String(target === 'home'), onclick:() => { target = 'home'; draw(); }}, 'Til leiligheten') : null,
          h('button', {'aria-pressed': String(target === 'airport'), onclick:() => { target = 'airport'; draw(); }}, 'Til flyplassen')),
        h('button', {class:'close', style:'position:static', 'aria-label':'Lukk', onclick:() => dlg.close()}, '×')),
      h('div', {class:'taxi-body', lang:'pl'},
        h('p', {class:'taxi-ask'}, target === 'home' ? 'Dzień dobry! Proszę nas zawieźć pod ten adres:' : 'Dzień dobry! Proszę nas zawieźć na lotnisko:'),
        h('p', {class:'taxi-name'}, t.name),
        h('p', {class:'taxi-addr'}, t.address),
        target === 'airport' ? h('p', {class:'taxi-code'}, 'Lotnisko ' + AIRPORT.code) : null,
        h('p', {class:'taxi-thanks'}, 'Dziękujemy!')),
      h('p', {class:'taxi-foot', lang:'nb'}, (target === 'home' ? '«Hei! Kan du kjøre oss til denne adressen?»' : '«Hei! Kan du kjøre oss til flyplassen?»') + ' Snu skjermen mot sjåføren.')
    );
  };
  draw();
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg); dlg.showModal();
}

/* ---------- huskeliste ---------- */
const PERSONAL_SUGGESTIONS = ['Pass eller nasjonalt ID-kort', 'Bankkort', 'Litt złoty i kontanter', 'Ryanair-appen med boardingkort', 'Europeisk helsetrygdkort', 'Mobillader', 'Toalettsaker under 100 ml', 'Varm jakke og paraply', 'Gode sko'];
const SHARED_SUGGESTIONS = ['Hårføner', 'Rettetang', 'Powerbank', 'Kortstokk eller spill', 'Høyttaler'];
function myList(){ return (S.me && S.personal[S.me] && S.personal[S.me].items) || []; }
function packLeft(){ return myList().filter(x => !x.done).length; }
async function saveMyList(items){
  if (!S.me) return;
  await write('personal/' + S.me, () => S.db.doc('personal/' + S.me).set({items}));
}
function addRow(id, placeholder, onAdd){
  const inp = h('input', {class:'input', id, placeholder, maxlength:'80'});
  const add = async () => { const v = inp.value.trim(); if (!v) return inp.focus(); inp.value = ''; await onAdd(v); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); add(); } });
  return h('div', {class:'quickadd'}, inp, h('button', {class:'btn dark', type:'button', onclick:add}, 'Legg til'));
}
// Sletting krever to trykk: × blir til «Slett?», og går tilbake etter noen sekunder.
function delBtn(label, onDelete){
  let armed = false, timer = null;
  const b = h('button', {class:'check-del', type:'button', 'aria-label':'Fjern ' + label, onclick: async e => {
    e.preventDefault(); e.stopPropagation();
    if (!armed){
      armed = true; b.textContent = 'Slett?'; b.classList.add('armed'); b.setAttribute('aria-label', 'Trykk igjen for å slette ' + label);
      timer = setTimeout(() => { armed = false; b.textContent = '×'; b.classList.remove('armed'); b.setAttribute('aria-label', 'Fjern ' + label); }, 3000);
      return;
    }
    clearTimeout(timer); b.disabled = true; await onDelete();
  }}, '×');
  return b;
}
function packView(){
  const mine = myList();
  const done = mine.filter(x => x.done).length;
  const shared = S.packing.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const addShared = async v => { const ref = S.db.collection('packing').doc(); await write('packing/' + ref.id, () => ref.set({text:v, by:null, createdAt:Date.now(), addedBy:S.me || null})); };
  return [
    h('section', {class:'moneysection'},
      h('div', {style:'display:flex;justify-content:space-between;align-items:baseline;gap:12px'}, h('h3', null, 'Min liste'),
        mine.length ? h('span', {class:'muted', style:'font-size:14px;font-variant-numeric:tabular-nums'}, done + ' av ' + mine.length + ' pakket') : null),
      mine.length ? h('div', {class:'bar', style:'margin:0 0 12px'}, h('span', {style:'width:' + (done / mine.length * 100) + '%'})) : null,
      S.canWrite && S.me ? addRow('pack-mine', 'Legg til noe du må huske …', v => saveMyList([...myList(), {id:Date.now().toString(36), text:v, done:false}])) : null,
      mine.length ? h('div', {class:'checklist'}, mine.map(x => h('label', {class:'check' + (x.done ? ' done' : '')},
        h('input', {type:'checkbox', checked: x.done || null, onchange: e => saveMyList(myList().map(y => y.id === x.id ? {...y, done: e.target.checked} : y))}),
        h('span', null, x.text),
        delBtn(x.text, () => saveMyList(myList().filter(y => y.id !== x.id))))))
      : h('div', {class:'empty'}, h('p', null, 'Listen din er tom.'),
          S.canWrite && S.me ? h('button', {class:'btn ghost', style:'margin-top:12px', onclick:() => saveMyList(PERSONAL_SUGGESTIONS.map((t, k) => ({id:'s' + k, text:t, done:false})))}, 'Bruk forslag til liste') : null)
    ),
    h('section', {class:'moneysection'},
      h('h3', null, 'Felles'),
      h('p', {class:'muted', style:'margin:-6px 0 12px;font-size:14px'}, 'Ting bare én trenger å ta med.'),
      S.canWrite ? addRow('pack-shared', 'F.eks. hårføner', addShared) : null,
      shared.length ? h('div', {class:'stack'}, shared.map(x => h('div', {class:'payrow'},
        h('b', null, x.text),
        h('div', {style:'display:flex;align-items:center;gap:8px'},
          x.by ? [face(x.by, true), h('span', {class:'muted', style:'font-size:14px'}, x.by === S.me ? 'Du tar med' : nameOf(x.by) + ' tar med')] : null,
          S.canWrite && S.me ? h('button', {class:'pill ' + (x.by === S.me ? 'ok' : 'neutral'), onclick:() => write('packing/' + x.id, () => S.db.doc('packing/' + x.id).update({by: x.by === S.me ? null : S.me}))}, x.by === S.me ? 'Angre' : x.by ? 'Jeg tar med i stedet' : 'Jeg tar med') : null,
          S.canWrite ? delBtn(x.text, () => write('packing/' + x.id, () => S.db.doc('packing/' + x.id).delete())) : null))))
      : h('div', {class:'empty'}, h('p', null, 'Ingen felles ting ennå.'),
          S.canWrite ? h('button', {class:'btn ghost', style:'margin-top:12px', onclick: async () => { for (const t of SHARED_SUGGESTIONS) await addShared(t); }}, 'Bruk forslag') : null)
    )
  ];
}

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
      const r = await S.assets.upload(f, type ? {type, folder:S.tripId} : {folder:S.tripId});
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
document.getElementById('sheetClose').addEventListener('click', () => sheet.close());
function openSheet(...kids){
  sheetBody.replaceChildren(...kids.flat(9).filter(k => k != null && k !== false));
  sheetBody.scrollTop = 0;
  if (!sheet.open) sheet.showModal();
  // Ikke hopp rett inn i et felt på mobil: tastaturet dytter da arket opp.
  const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const first = sheetBody.querySelector('input:not([type=time]):not([type=date]),textarea');
  if (first && !touch) setTimeout(() => first.focus({preventScroll:true}), 30);
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
  const place = h('input', {class:'input', value: it.place || '', placeholder:'Brukes til kartet', maxlength:'200'});
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
      cost: cost.value === '' ? null : Math.max(0, Number(cost.value) || 0), currency:currency.value, booked:booked.value, pay:pay.value, paidBy: pay.value === 'paid' ? (paidBy.value || null) : null, place: place.value.trim()};
    if (data.place && (data.place !== (it.place || '') || !hasPos(it))){
      const pos = await geocode(data.place);
      if (pos){ data.lat = pos.lat; data.lng = pos.lng; } else toast('Fant ikke adressen på kartet. Prøv å skrive den mer nøyaktig.');
    }
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
    field('Adresse', 'f-place', place),
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
  const photoUrl = h('input', {class:'input', value: i.photoUrl || (i.wiki ? 'https://' + i.wiki.split(':')[0] + '.wikipedia.org/wiki/' + i.wiki.slice(i.wiki.indexOf(':') + 1).replace(/ /g, '_') : ''), placeholder:'Lim inn bildeadresse eller Wikipedia-side', inputmode:'url', maxlength:'600'});
  const prev = h('span');
  const showPrev = () => prev.replaceChildren(photo ? h('img', {src:blobUrl(photo), alt:''}) : '');
  showPrev();
  const photoInput = h('input', {type:'file', accept:'image/png,image/jpeg,image/webp,image/gif', onchange: async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (!S.assets){ toast('Bare redaktører kan laste opp bilder.'); return; }
    toast('Laster opp bildet …');
    try { const r = await S.assets.upload(f, f.type ? {folder:S.tripId} : {type:'image/jpeg', folder:S.tripId}); photo = r.id; showPrev(); photoLbl.lastChild.textContent = 'Bytt bilde'; toast('Bildet er klart. Husk å lagre.'); }
    catch(e){ toast(e && e.code === 'unsupported_type' ? 'Bruk JPG, PNG eller WEBP (iPhone-bilder: ta et skjermbilde).' : e && e.code === 'too_large' ? 'Bildet er for stort (maks 20 MB).' : 'Fikk ikke lastet opp bildet.'); }
  }});
  const photoLbl = h('label', {class:'attach'}, photoInput, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), document.createTextNode(photo ? 'Bytt bilde' : 'Legg til bilde'));
  const day = h('select', {class:'input'}, h('option', {value:''}, 'Ikke planlagt (på tavla)'), days.map(d => h('option', {value:d, selected: i.day === d}, dayLabel(d))));
  const time = h('input', {class:'input', type:'time', value:i.time || ''});
  const place = h('input', {class:'input', value:i.place || '', placeholder:'F.eks. Targ Węglowy eller en adresse', maxlength:'200'});
  const flds = tripFolders();
  const folderSel = flds.length ? h('select', {class:'input'}, h('option', {value:''}, 'Ikke valgt'), flds.map(f => h('option', {value:f.id, selected: (idea ? i.folder : S.folder) === f.id}, f.name))) : null;
  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()){ title.focus(); return; }
    const data = {title:title.value.trim(), note:note.value.trim(), link:link.value.trim(), category:catVal, photo: photo || null, photoUrl: photoUrl.value.trim(), wiki: parseWiki(photoUrl.value.trim()) || '', day: day.value || null, time: time.value || '', place: place.value.trim(), folder: folderSel ? (folderSel.value || null) : (i.folder || S.folder || null)};
    if (data.place && (data.place !== (i.place || '') || !hasPos(i))){
      const pos = await geocode(data.place);
      if (pos){ data.lat = pos.lat; data.lng = pos.lng; } else toast('Fant ikke «' + data.place + '» på kartet. Prøv en mer nøyaktig adresse.');
    } else if (!data.place){ data.lat = null; data.lng = null; }
    if (idea){ const ok = await write('ideas/' + idea.id, () => S.db.doc('ideas/' + idea.id).update(data)); if (ok){ toast('Lagret'); ideaDetail(idea.id); } }
    else { sheet.close(); await addIdea(data); }
  }},
    field('Idé', 'i-title', title), field('Notat', 'i-note', note), field('Lenke', 'i-link', link), h('div', {class:'field'}, h('label', null, 'Hva slags'), catRow),
    h('div', {class:'field'}, h('label', null, 'Bilde'), h('div', {class:'photo-pick'}, prev, S.assets ? photoLbl : h('span', {class:'muted', style:'font-size:14px'}, 'Bare redaktører kan laste opp bilder.'))),
    field('Eller bilde fra nett', 'i-photourl', photoUrl),
    h('p', {class:'muted', style:'margin:-6px 0 0;font-size:13px'}, 'Opplastet bilde vises først. En Wikipedia-lenke henter bildet fra artikkelen.'),
    folderSel ? field('Hvor på turen', 'i-folder', folderSel) : null,
    field('Adresse', 'i-place', place),
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
  const size = h('input', {class:'input', type:'number', min:'1', max:'30', value:String(t.groupSize || Object.keys(S.members).length || 3)});
  let cover = t.cover || null;
  const coverUrl = h('input', {class:'input', value:t.coverUrl || '', placeholder:'Lim inn bildeadresse eller Wikipedia-side', inputmode:'url', maxlength:'600'});
  const prev = h('span', {class:'photo-pick'});
  const showPrev = () => prev.replaceChildren(cover && blobUrl(cover) ? h('img', {src:blobUrl(cover), alt:''}) : '');
  showPrev();
  const coverInput = h('input', {type:'file', accept:'image/png,image/jpeg,image/webp', onchange: async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (!S.assets){ toast('Du kan ikke laste opp bilder.'); return; }
    toast('Laster opp bildet …');
    try { const r = await S.assets.upload(f, f.type ? {folder:S.tripId} : {type:'image/jpeg', folder:S.tripId}); cover = r.id; showPrev(); toast('Bildet er klart. Husk å lagre.'); }
    catch(e){ toast(e && e.code === 'unsupported_type' ? 'Bruk JPG, PNG eller WEBP (iPhone-bilder: ta et skjermbilde).' : 'Fikk ikke lastet opp bildet.'); }
  }});
  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()) return title.focus();
    if (start.value && end.value && end.value < start.value){ toast('Hjemreisen må være etter avreisen.'); return end.focus(); }
    const data = {title:title.value.trim(), note:note.value.trim(), start:start.value, end:end.value, groupSize: Math.max(1, Math.min(30, Number(size.value) || 1)), cover: cover || null, coverUrl: coverUrl.value.trim()};
    const ok = await write('trip/main', () => S.db.doc('trip/main').update(data));
    if (ok){ sheet.close(); toast('Turen er lagret'); }
  }},
    field('Hvor', 't-title', title), field('Hva slags tur', 't-note', note),
    h('div', {class:'row2'}, field('Avreise', 't-start', start), field('Hjemreise', 't-end', end)),
    field('Hvor mange er med', 't-size', size),
    h('div', {class:'field'}, h('label', null, 'Bilde på forsiden'),
      h('div', {class:'photo-pick'}, prev, h('label', {class:'attach'}, coverInput, h('span', {svg:ICONS.clip, style:'display:inline-flex'}), cover ? 'Bytt bilde' : 'Last opp bilde'),
        cover ? h('button', {class:'linkbtn', type:'button', onclick:() => { cover = null; showPrev(); }}, 'Fjern') : null)),
    field('Eller bilde fra nett', 't-cover', coverUrl),
    h('p', {class:'muted', style:'margin:-6px 0 0;font-size:13px'}, 'Uten bilde bruker Yaffle Wikipedia-bildet av stedet.'),
    h('p', {class:'muted', style:'margin:0;font-size:14px'}, '«Alle er med» vises når så mange har gitt hjerte til en idé.'),
    h('div', {class:'actions'}, h('span'), h('button', {class:'btn primary', type:'submit'}, 'Lagre')),
    S.trip && S.tripId ? dangerZone() : null
  );
  openSheet(h('h2', null, S.trip ? 'Endre tur' : 'Ny tur'), form);
}
// Slett turen (den som lagde den) eller forlat den (alle andre)
function dangerZone(){
  const tid = S.tripId, name = (S.trip && S.trip.title) || 'turen';
  const box = h('div', {class:'dangerzone'}, h('p', {class:'muted'}, 'Sjekker …'));
  const leaveDone = () => { try { localStorage.removeItem('yaffle-trip'); } catch(_){} location.href = location.pathname + '#hjem'; };
  const twoTap = (label, confirmLabel, fn) => {
    let armed = false, busy = false;
    const b = h('button', {type:'button', class:'btn danger', onclick: async () => {
      if (busy) return;
      if (!armed){ armed = true; b.textContent = confirmLabel; setTimeout(() => { if (!busy){ armed = false; b.textContent = label; } }, 4000); return; }
      busy = true; b.textContent = 'Et øyeblikk …'; b.disabled = true;
      try { await fn(); } catch(e){ busy = false; armed = false; b.disabled = false; b.textContent = label; toast(e && e.message ? e.message : 'Det gikk ikke. Prøv igjen.'); }
    }}, label);
    return b;
  };
  const leave = twoTap('Forlat turen', 'Sikker? Trykk igjen', async () => {
    const { error } = await window.yaffleRpc('leave_trip', {p_trip: tid});
    if (error) throw new Error('Fikk ikke forlatt turen.');
    leaveDone();
  });
  (async () => {
    let owner = false;
    try { const { data, error } = await window.yaffleRpc('is_trip_owner', {p_trip: tid}); owner = error ? /function|schema/i.test(error.message || '') : !!data; } catch(_){}
    if (!owner){
      box.replaceChildren(h('h3', null, 'Forlat turen'), h('p', {class:'muted'}, 'Du forsvinner fra gjengen på ' + name + '. Du kan bli med igjen via en invitasjonslenke.'), leave);
      return;
    }
    box.replaceChildren(
      h('h3', null, 'Slett turen'),
      h('p', {class:'muted'}, 'Sletter ' + name + ' for alle: plan, idéer, pakkelister, kvitteringer og bilder. Dette kan ikke angres.'),
      twoTap('Slett turen', 'Slett for alle? Trykk igjen', async () => {
        try { await window.yaffleRemoveTripFiles(tid); } catch(_){ throw new Error('Fikk ikke slettet filene. Prøv igjen.'); }
        const { error } = await window.yaffleRpc('delete_trip', {p_trip: tid});
        if (error) throw new Error(/function|schema/i.test(error.message) ? 'Sletting er ikke satt opp ennå (kjør slett-tur.sql i Supabase).' : 'Fikk ikke slettet turen.');
        leaveDone();
      }));
  })();
  return box;
}


/* ---------- forsiden: alle turene dine ---------- */
function goHome(){
  if (sheet.open) sheet.close();
  S.view = 'hjem';
  try { history.replaceState(null, '', location.pathname + (S.tripId ? '?tur=' + encodeURIComponent(S.tripId) : '') + '#hjem'); } catch(_){}
  render(); window.scrollTo({top:0, behavior:'smooth'});
}
function openTrip(id){
  try { localStorage.setItem('yaffle-trip', id); } catch(e){}
  if (id === S.tripId){ S.view = 'plan'; try { history.replaceState(null, '', location.pathname + '?tur=' + encodeURIComponent(id) + '#plan'); } catch(_){} render(); window.scrollTo({top:0}); return; }
  location.href = location.pathname + '?tur=' + encodeURIComponent(id) + '#plan';
}
// Forsidebilde: opplastet > bildelenke > Wikipedia-bildet av stedet
function tripCover(t){
  if (t.cover){ const u = blobUrl(t.cover); if (u) return u; }
  const u = safeUrl(t.coverUrl);
  if (u && !parseWiki(u)) return u;
  const key = parseWiki(t.coverUrl) || (t.title ? 'en:' + t.title : null);
  const w = wikiImage(key);
  return w ? w.src : null;
}
// Datoer som to små kalenderblader: 19 NOV → 22 NOV · 3 netter
function tripDates(t){
  if (!isoDate(t.start)) return h('span', {class:'datechip empty'}, 'Ingen datoer ennå');
  const MS = ['JAN','FEB','MAR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DES'];
  const leaf = iso => { const d = D(iso); return h('span', {class:'leaf'}, h('b', null, d.getUTCDate()), h('small', null, MS[d.getUTCMonth()])); };
  const nights = isoDate(t.end) ? Math.round((D(t.end) - D(t.start)) / 864e5) : 0;
  const year = D(t.start).getUTCFullYear(); const thisYear = new Date().getFullYear();
  return h('span', {class:'datechip', 'aria-label': tripRange(t)},
    leaf(t.start),
    isoDate(t.end) && t.end !== t.start ? [h('span', {class:'arrow', 'aria-hidden':'true'}, '→'), leaf(t.end)] : null,
    h('span', {class:'meta'}, nights > 0 ? nights + (nights === 1 ? ' natt' : ' netter') : 'dagstur', year !== thisYear ? h('small', null, year) : null));
}
function tripRange(t){
  if (!isoDate(t.start) || !isoDate(t.end)) return '';
  const a = D(t.start), b = D(t.end);
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()
    ? a.getUTCDate() + '.–' + b.getUTCDate() + '. ' + MONL[b.getUTCMonth()] + ' ' + b.getUTCFullYear()
    : a.getUTCDate() + '. ' + MON[a.getUTCMonth()] + ' – ' + b.getUTCDate() + '. ' + MON[b.getUTCMonth()] + ' ' + b.getUTCFullYear();
}
function tripPill(t){
  if (!isoDate(t.start)) return 'dato ikke satt';
  const now = new Date(); const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const diff = Math.round((D(t.start) - today) / 864e5);
  const left = isoDate(t.end) ? Math.round((D(t.end) - today) / 864e5) : diff;
  if (diff > 1) return 'om ' + diff + ' dager';
  if (diff === 1) return 'i morgen!';
  if (left >= 0) return 'pågår nå';
  return 'ferdig';
}
function isPast(t){
  if (!isoDate(t.end || t.start)) return false;
  const now = new Date(); const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  return D(t.end || t.start) < today;
}
function homeView(){
  const next = S.trips.filter(t => !isPast(t)).sort((a, b) => String(a.start || '9999') < String(b.start || '9999') ? -1 : 1);
  const past = S.trips.filter(isPast).sort((a, b) => String(a.start) > String(b.start) ? -1 : 1);
  const list = S.homeTab === 'past' ? past : next;
  const tab = (id, label) => h('button', {class:'tab', role:'tab', 'aria-selected': String(S.homeTab === id), onclick:() => { S.homeTab = id; render(); }}, label);
  if (!S.loaded.trips) return [h('p', {class:'muted', style:'margin-top:60px'}, 'Henter turene dine …')];
  return [
    h('nav', {class:'tabs', role:'tablist', 'aria-label':'Turer', style:'margin-top:26px'}, tab('next', 'Kommende'), tab('past', 'Tidligere')),
    h('div', {class:'trips'},
      list.map(t => {
        const ids = S.tripMembers[t.id] || [];
        const cover = tripCover(t);
        return h('button', {class:'tripcard' + (t.id === S.tripId ? ' current' : '') + (cover ? ' has-cover' : ''), onclick:() => openTrip(t.id)},
          cover ? h('img', {class:'tripcard-bg', src:cover, alt:'', referrerpolicy:'no-referrer', onerror: e => { e.target.closest('.tripcard').classList.remove('has-cover'); e.target.remove(); }}) : null,
          h('div', {class:'tripcard-top'}, h('span', {class:'eyebrow'}, t.note || 'Tur'), h('span', {class:'countpill' + (tripPill(t) === 'pågår nå' ? ' live' : '')}, tripPill(t))),
          h('div', {class:'tripcard-title'}, t.title || 'Uten navn'),
          h('div', {class:'tripcard-foot'}, tripDates(t), ids.length ? h('span', {class:'faces'}, ids.slice(0, 5).map(id => face(id, true))) : null));
      }),
      S.homeTab === 'next' ? h('button', {class:'addcard tripadd', onclick:() => newTripSheet()}, h('b', null, '+'), 'Ny tur') : null,
      !list.length && S.homeTab === 'past' ? h('p', {class:'muted'}, 'Ingen tidligere turer ennå.') : null
    )
  ];
}
function newTripSheet(){
  const title = h('input', {class:'input', placeholder:'F.eks. København', maxlength:'40'});
  const note = h('input', {class:'input', placeholder:'F.eks. Jentetur', maxlength:'60'});
  const start = h('input', {class:'input', type:'date'});
  const end = h('input', {class:'input', type:'date'});
  const btn = h('button', {class:'btn primary', type:'submit'}, 'Lag turen');
  const form = h('form', {class:'form', onsubmit: async e => {
    e.preventDefault();
    if (!title.value.trim()) return title.focus();
    if (start.value && end.value && end.value < start.value){ toast('Hjemreisen må være etter avreisen.'); return end.focus(); }
    btn.disabled = true; btn.textContent = 'Lager turen …';
    const { data, error } = await window.yaffleRpc('create_trip', {p_title:title.value.trim(), p_note:note.value.trim(), p_start:start.value, p_end:end.value});
    if (error || !data){ btn.disabled = false; btn.textContent = 'Lag turen'; toast('Fikk ikke laget turen. Prøv igjen.'); return; }
    openTrip(data);
  }},
    field('Hvor skal dere?', 'n-title', title), field('Hva slags tur', 'n-note', note),
    h('div', {class:'row2'}, field('Avreise', 'n-start', start), field('Hjemreise', 'n-end', end)),
    h('p', {class:'muted', style:'margin:0;font-size:14px'}, 'Når turen er laget, kan du invitere gjengen med en lenke.'),
    h('div', {class:'actions'}, h('span'), btn));
  openSheet(h('h2', null, 'Ny tur'), form);
}
async function inviteSheet(reset){
  openSheet(h('h2', null, 'Inviter flere'), h('p', {class:'muted'}, 'Lager lenke …'));
  const { data: code, error } = await window.yaffleRpc(reset ? 'reset_invite' : 'create_invite', {p_trip:S.tripId});
  if (error || !code){ openSheet(h('h2', null, 'Inviter flere'), h('p', null, 'Fikk ikke laget en lenke. Prøv igjen.')); return; }
  const url = location.origin + location.pathname + '?bli-med=' + code;
  const inp = h('input', {class:'input', id:'invite-url', readonly:true, value:url, onfocus: e => e.target.select()});
  openSheet(h('h2', null, 'Inviter flere'),
    h('p', null, 'Send lenken til dem som skal være med på ' + (S.trip && S.trip.title || 'turen') + '. De lager en konto og havner rett i turen.'),
    inp,
    h('div', {style:'display:flex;flex-wrap:wrap;gap:10px;margin-top:12px'},
      h('button', {class:'btn primary', onclick: async () => { try { await navigator.clipboard.writeText(url); toast('Lenken er kopiert'); } catch(e){ inp.select(); toast('Merk lenken og kopier den'); } }}, 'Kopier lenke'),
      navigator.share ? h('button', {class:'btn ghost', onclick: () => navigator.share({title:'Bli med på ' + (S.trip && S.trip.title || 'tur') + ' i Yaffle', url}).catch(() => {})}, 'Del') : null),
    h('p', {class:'muted', style:'font-size:14px;margin-top:18px'}, 'Alle med lenken kan bli med. Har den kommet på avveie, lag en ny, så slutter den gamle å virke.'),
    h('button', {class:'linkbtn', onclick:() => inviteSheet(true)}, 'Lag ny lenke'));
}

/* ---------- onboarding ---------- */
function onboard(){
  const inp = h('input', {class:'input', id:'nick', placeholder:'Navnet ditt', maxlength:'24', 'aria-label':'Navnet ditt'});
  const save = async e => {
    e.preventDefault();
    const v = inp.value.trim(); if (!v) return inp.focus();
    await saveProfile({nick:v});
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
