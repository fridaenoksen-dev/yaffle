// Yaffle runtime: Supabase login gate + the small data API the app expects
// (window.claude.use('db' | 'user' | 'assets')). Swapping Claude's built-in
// storage for Supabase here means src/app.js stays almost unchanged.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";
import * as CONFIG from "./config.js?v=20261114a";
const { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } = CONFIG;

// Logo: Vaffelplan er standard. Veiskille kan testes fra profilen (lagres bare på denne enheten).
const LOGOS = {
  vaffel: { label: "Vaffelplan", lockup: "/brand/yay-waffle/yay-waffles-app.svg", inline: true, icons: { svg: "/favicon.svg", ico: "/favicon.ico", apple: "/apple-touch-icon.png" },
    svg: '<svg viewBox="16 16 224 224"><path fill="currentColor" fill-rule="evenodd" d="M78.5 16 H177.5 C 208.5 16 240 47.5 240 78.5 V177.5 C 240 208.5 208.5 240 177.5 240 H78.5 C 47.5 240 16 208.5 16 177.5 V78.5 C 16 47.5 47.5 16 78.5 16 Z M60.0 42.0 H98.0 A18 18 0 0 1 116.0 60.0 V98.0 A18 18 0 0 1 98.0 116.0 H60.0 A18 18 0 0 1 42.0 98.0 V60.0 A18 18 0 0 1 60.0 42.0 Z M158.0 42.0 H196.0 A18 18 0 0 1 214.0 60.0 V98.0 A18 18 0 0 1 196.0 116.0 H158.0 A18 18 0 0 1 140.0 98.0 V60.0 A18 18 0 0 1 158.0 42.0 Z M60.0 140.0 H98.0 A18 18 0 0 1 116.0 158.0 V196.0 A18 18 0 0 1 98.0 214.0 H60.0 A18 18 0 0 1 42.0 196.0 V158.0 A18 18 0 0 1 60.0 140.0 Z M177.0 214.0 C 147.0 194.0 135.0 174.0 137.0 158.0 C 139.0 142.0 153.0 134.0 163.0 134.0 C 171.0 134.0 175.0 140.0 177.0 146.0 C 179.0 140.0 183.0 134.0 191.0 134.0 C 201.0 134.0 215.0 142.0 217.0 158.0 C 219.0 174.0 207.0 194.0 177.0 214.0 Z"/></svg>' },
  veiskille: { label: "Veiskille", lockup: "/brand/veiskille/veiskille-horizontal-green.svg", icons: { svg: "/brand/veiskille/favicon.svg", ico: "/brand/veiskille/favicon.ico", apple: "/brand/veiskille/apple-touch-icon.png" },
    svg: '<svg viewBox="20 12 216 228"><path fill="none" stroke="currentColor" stroke-width="48" stroke-linecap="round" d="M56 44 C 56 106 128 108 128 156 M200 44 C 200 106 128 108 128 156 L 128 212"/></svg>' },
};
window.yaffleLogo = {
  list: Object.entries(LOGOS).map(([id, l]) => ({ id, label: l.label })),
  current() { try { const v = localStorage.getItem("yaffle-logo"); return LOGOS[v] ? v : "vaffel"; } catch (e) { return "vaffel"; } },
  svg() { return LOGOS[this.current()].svg; },
  lockup() { return LOGOS[this.current()].lockup; },
  inline() { return !!LOGOS[this.current()].inline; },
  apply() {
    const ic = LOGOS[this.current()].icons;
    const set = (sel, href) => { const el = document.querySelector(sel); if (el) el.setAttribute("href", href); };
    set('link[rel="icon"][type="image/svg+xml"]', ic.svg); set('link[rel="icon"][sizes]', ic.ico); set('link[rel="apple-touch-icon"]', ic.apple);
    document.querySelectorAll(".brandmark").forEach((m) => { m.innerHTML = LOGOS[this.current()].svg; });
    window.dispatchEvent(new Event("yaffle:logo"));
  },
  set(id) { try { localStorage.setItem("yaffle-logo", id); } catch (e) {} this.apply(); },
};
window.yaffleLogo.apply();

const app = document.getElementById("app");
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat())
    if (c != null && c !== false)
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};
const brand = () =>
  h(
    "div",
    { class: "top" },
    h(
      "div",
      { class: "brand" },
      (() => {
        if (window.yaffleLogo.inline()) { const im = document.createElement("img"); im.className = "brandlock"; im.src = window.yaffleLogo.lockup(); im.alt = "Yay, waffles"; return im; }
        const m = document.createElement("span"); m.className = "brandmark"; m.setAttribute("aria-hidden", "true"); m.innerHTML = window.yaffleLogo.svg();
        const b = document.createElement("b"); b.textContent = "Yaffle"; const w = document.createElement("span"); w.style.display = "contents"; w.append(m, b); return w;
      })(),
    ),
  );

if (!SUPABASE_URL || /DITT-PROSJEKT|xxxxx/.test(SUPABASE_URL) || !SUPABASE_ANON_KEY || /…|LIM-INN/.test(SUPABASE_ANON_KEY)) {
  app.replaceChildren(
    brand(),
    h(
      "div",
      { class: "onboard" },
      h("h2", null, "Nesten klar"),
      h(
        "p",
        null,
        "Legg inn Supabase-URL og anon-nøkkel i src/config.js, så er Yaffle klar til bruk.",
      ),
    ),
  );
  throw new Error("Supabase is not configured");
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});

/* ---------- login screens ---------- */
// Invitasjonskode fra lenken (?bli-med=KODE) huskes til man er logget inn.
const INVITE_KEY = "yaffle-invite";
// Velkomstskjermen vises én gang per enhet, så returnerende går rett til innlogging.
const WELCOMED_KEY = "yaffle-welcomed";
const welcomed = () => { try { return localStorage.getItem(WELCOMED_KEY) === "1"; } catch (e) { return false; } };
const markWelcomed = () => { try { localStorage.setItem(WELCOMED_KEY, "1"); } catch (e) {} };

function welcomeScreen() {
  document.body.classList.add("has-welcome");
  const hero = h("div", { class: "welcome-hero" },
    (() => {
      const v = document.createElement("video");
      v.src = "/brand/welcome/yaffle-splash.mp4";
      v.poster = "/brand/welcome/hero-poster.jpg";
      v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.setAttribute("aria-hidden", "true");
      return v;
    })());
  const nav = h("div", { class: "welcome-nav" },
    h("span", { class: "welcome-wordmark" }, h("span", { class: "dot", "aria-hidden": "true" }), "Yaffle"),
    h("a", { class: "welcome-login", href: "#", onclick: (e) => { e.preventDefault(); markWelcomed(); leaveWelcome(); loginScreen(null, "login"); } }, "Logg inn"));
  const h1 = document.createElement("h1");
  h1.innerHTML = "Planlegg <em>sammen</em>.";
  const body = h("div", { class: "welcome-body" },
    h1,
    h("p", null, "For gjengen din."),
    h("button", { class: "welcome-cta", type: "button", onclick: () => { markWelcomed(); leaveWelcome(); loginScreen(null, "signup"); } },
      "Kom i gang ", h("span", { class: "arrow", "aria-hidden": "true" }, "→")));
  const screen = h("div", { class: "welcome" }, hero, nav, body);
  app.replaceChildren(screen);
}
function leaveWelcome() { document.body.classList.remove("has-welcome"); }
(() => {
  const code = new URLSearchParams(location.search).get("bli-med");
  if (code) { try { sessionStorage.setItem(INVITE_KEY, code); } catch (e) {} }
})();
const pendingInvite = () => { try { return sessionStorage.getItem(INVITE_KEY); } catch (e) { return null; } };

function loginScreen(note, mode) {
  leaveWelcome();
  mode = mode || (pendingInvite() ? "signup" : "login");
  const signup = mode === "signup";
  const name = h("input", { class: "input", id: "login-name", autocomplete: "given-name", placeholder: "Fornavn", maxlength: "24", "aria-label": "Fornavn" });
  const email = h("input", { class: "input", id: "login-email", type: "email", autocomplete: signup ? "email" : "username", placeholder: "navn@epost.no", required: true, "aria-label": "E-post" });
  const pass = h("input", { class: "input", id: "login-pass", type: "password", autocomplete: signup ? "new-password" : "current-password", placeholder: signup ? "Velg et passord (minst 8 tegn)" : "Passord", required: true, "aria-label": "Passord" });
  const show = h("button", { type: "button", class: "linkbtn", style: "font-size:14px;color:var(--muted);align-self:flex-end", onclick: () => {
    const on = pass.type === "password"; pass.type = on ? "text" : "password"; show.textContent = on ? "Skjul passord" : "Vis passord";
  } }, "Vis passord");
  const btn = h("button", { class: "btn dark", type: "submit" }, signup ? "Lag konto" : "Logg inn");
  const msg = h("p", { role: "status" }, note || (pendingInvite()
    ? (signup ? "Du er invitert på tur! Lag en konto for å bli med." : "Du er invitert på tur! Logg inn for å bli med.")
    : (signup ? "Lag en konto med e-post og passord." : "Logg inn med e-post og passord.")));
  const fail = (text) => { btn.disabled = false; btn.textContent = signup ? "Lag konto" : "Logg inn"; msg.style.color = "var(--red)"; msg.textContent = text; };
  const form = h("form", { class: "onboard", style: "gap:12px", onsubmit: async (e) => {
    e.preventDefault();
    const v = email.value.trim(); if (!v) return email.focus(); if (!pass.value) return pass.focus();
    if (signup && !name.value.trim()) return name.focus();
    if (signup && pass.value.length < 8) return fail("Passordet må ha minst 8 tegn.");
    btn.disabled = true; btn.textContent = signup ? "Lager konto …" : "Logger inn …";
    if (signup) {
      const { data, error } = await sb.auth.signUp({ email: v, password: pass.value });
      if (error) return fail(/registered|exists/i.test(error.message) ? "Det finnes allerede en konto med denne e-posten. Logg inn i stedet."
        : /password/i.test(error.message) ? "Passordet er for svakt. Prøv et lengre." : /rate|limit/i.test(error.message) ? "For mange forsøk. Vent litt og prøv igjen." : "Fikk ikke laget kontoen. Prøv igjen.");
      try { sessionStorage.setItem("yaffle-nick", name.value.trim()); } catch (e) {}
      if (data && data.session) return start(data.session);
      form.replaceChildren(h("h2", null, "Sjekk e-posten din"), h("p", null, "Trykk på lenken i e-posten for å bekrefte kontoen, og logg så inn."),
        h("button", { class: "btn ghost", type: "button", onclick: () => loginScreen(null, "login") }, "Til innlogging"));
      return;
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: v, password: pass.value });
    if (error) {
      pass.select();
      return fail(/invalid login credentials/i.test(error.message) ? "Feil e-post eller passord. Prøv igjen."
        : /not confirmed/i.test(error.message) ? "Kontoen er ikke bekreftet ennå. Sjekk e-posten din."
        : /rate|limit|too many/i.test(error.message) ? "For mange forsøk. Vent et par minutter og prøv igjen."
        : "Fikk ikke logget inn. Sjekk nettet og prøv igjen.");
    }
    if (data && data.session) start(data.session);
  } },
    h("h2", { style: "margin-bottom:6px" }, signup ? "Lag konto" : "Logg inn"), msg,
    signup ? name : null, email, pass, show, btn,
    h("button", { type: "button", class: "linkbtn", style: "margin-top:12px;align-self:flex-start", onclick: () => loginScreen(null, signup ? "login" : "signup") },
      signup ? "Har du konto? Logg inn" : "Ny her? Lag konto"));
  app.replaceChildren(brand(), form);
  setTimeout(() => (signup ? name : email).focus(), 50);
}

// Lar hver person bytte fra passordet de fikk til sitt eget.
window.yaffleChangePassword = () => {
  const dlg = h("dialog", { class: "sheet" });
  const p1 = h("input", { class: "input", id: "new-pass", type: "password", autocomplete: "new-password", minlength: "8", placeholder: "Minst 8 tegn", "aria-label": "Nytt passord" });
  const p2 = h("input", { class: "input", id: "new-pass2", type: "password", autocomplete: "new-password", placeholder: "Gjenta passordet", "aria-label": "Gjenta passordet" });
  const msg = h("p", { role: "status", class: "muted", style: "margin:0" }, "Velg et passord bare du vet.");
  const btn = h("button", { class: "btn primary", type: "submit" }, "Lagre passord");
  const form = h("form", { class: "form", onsubmit: async (e) => {
    e.preventDefault();
    if (p1.value.length < 8) { msg.textContent = "Passordet må ha minst 8 tegn."; return p1.focus(); }
    if (p1.value !== p2.value) { msg.textContent = "Passordene er ikke like."; return p2.focus(); }
    btn.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1.value });
    btn.disabled = false;
    if (error) { msg.textContent = /same|different/i.test(error.message) ? "Velg et annet passord enn det du har nå." : /weak|short|length/i.test(error.message) ? "Passordet er for svakt. Prøv et lengre." : "Fikk ikke lagret. Prøv igjen."; return; }
    form.replaceChildren(h("h2", null, "Passordet er byttet"), h("p", null, "Bruk det nye passordet neste gang du logger inn."), h("button", { class: "btn dark", type: "button", onclick: () => dlg.close() }, "Ferdig"));
  } }, h("h2", null, "Bytt passord"), msg, p1, p2, h("div", { class: "actions" }, h("button", { type: "button", class: "linkbtn", onclick: () => dlg.close() }, "Avbryt"), btn));
  dlg.append(h("div", { class: "sheet-in" }, h("div", { class: "grab", "aria-hidden": "true" }), form));
  dlg.addEventListener("close", () => dlg.remove());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg); dlg.showModal(); setTimeout(() => p1.focus(), 30);
};

function noAccessScreen(emailAddr) {
  app.replaceChildren(
    brand(),
    h(
      "div",
      { class: "onboard" },
      h("h2", null, "Ingen tilgang ennå"),
      h(
        "p",
        null,
        "Du er logget inn som ",
        h("b", { style: "color:var(--ink)" }, emailAddr || "ukjent"),
        ", men denne e-posten er ikke lagt til på turen. Be den som administrerer turen om å legge deg til.",
      ),
      h(
        "button",
        {
          class: "btn ghost",
          onclick: async () => {
            await sb.auth.signOut();
            loginScreen();
          },
        },
        "Logg inn med en annen e-post",
      ),
    ),
  );
}

window.yaffleSignOut = async () => {
  await sb.auth.signOut();
  location.reload();
};

/* ---------- data layer ---------- */
const colOf = (path) => path.split("/").slice(0, -1).join("/");
const cache = new Map(); // path -> data
const listeners = new Set(); // {type, key, next}
let loaded = null;

const meta = { fromCache: false, hasPendingWrites: false };
const snapDoc = (path) => {
  const d = cache.get(path);
  return {
    id: path.split("/").pop(),
    exists: d !== undefined,
    data: () => d,
    metadata: meta,
  };
};
const snapCol = (col) => {
  const docs = [...cache.keys()]
    .filter((p) => colOf(p) === col)
    .sort()
    .map(snapDoc);
  return {
    docs,
    size: docs.length,
    empty: !docs.length,
    docChanges: () => [],
    metadata: meta,
  };
};
function notify(path) {
  for (const l of listeners) {
    if (l.type === "doc" && l.key === path) l.next(snapDoc(path));
    if (l.type === "col" && l.key === colOf(path)) l.next(snapCol(l.key));
  }
}
function notifyAll() {
  for (const l of listeners)
    l.next(l.type === "doc" ? snapDoc(l.key) : snapCol(l.key));
}

async function loadAll() {
  const { data, error } = await sb.from("docs").select("path,data");
  if (error) throw error;
  cache.clear();
  for (const r of data) cache.set(r.path, r.data);
}

function deepMerge(a, b) {
  if (
    !a ||
    typeof a !== "object" ||
    Array.isArray(a) ||
    !b ||
    typeof b !== "object" ||
    Array.isArray(b)
  )
    return b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a[k], v);
  return out;
}
const dbError = (error) => ({
  code:
    error &&
    (error.code === "42501" ||
      /row-level security|permission/i.test(error.message || ""))
      ? "invalid_argument"
      : "unavailable",
  message: (error && error.message) || "Feil",
});

async function revert(path) {
  const { data } = await sb
    .from("docs")
    .select("data")
    .eq("path", path)
    .maybeSingle();
  if (data) cache.set(path, data.data);
  else cache.delete(path);
  notify(path);
}

function docRef(path) {
  return {
    path,
    id: path.split("/").pop(),
    async get() {
      await loaded;
      return snapDoc(path);
    },
    async set(data) {
      cache.set(path, data);
      notify(path);
      const { error } = await sb
        .from("docs")
        .upsert({ path, collection: colOf(path), data });
      if (error) {
        await revert(path);
        throw dbError(error);
      }
    },
    async update(patch) {
      const cur = cache.get(path);
      if (cur === undefined)
        throw { code: "invalid_argument", message: "Dokumentet finnes ikke" };
      cache.set(path, deepMerge(cur, patch));
      notify(path);
      const { error } = await sb.rpc("doc_merge", {
        p_path: path,
        p_patch: patch,
      });
      if (error) {
        await revert(path);
        throw dbError(error);
      }
    },
    async delete() {
      cache.delete(path);
      notify(path);
      const { error } = await sb.from("docs").delete().eq("path", path);
      if (error) {
        await revert(path);
        throw dbError(error);
      }
    },
    onSnapshot(next, onError) {
      const l = { type: "doc", key: path, next };
      listeners.add(l);
      loaded.then(
        () => listeners.has(l) && next(snapDoc(path)),
        (e) => onError && onError(dbError(e)),
      );
      return () => listeners.delete(l);
    },
    collection(sub) {
      return colRef(path + "/" + sub);
    },
  };
}
function colRef(col) {
  return {
    path: col,
    doc(id) {
      return docRef(
        col +
          "/" +
          (id ||
            (crypto.randomUUID
              ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
              : Date.now().toString(36) + Math.random().toString(36).slice(2))),
      );
    },
    async add(data) {
      const r = this.doc();
      await r.set(data);
      return r;
    },
    async get() {
      await loaded;
      return snapCol(col);
    },
    onSnapshot(next, onError) {
      const l = { type: "col", key: col, next };
      listeners.add(l);
      loaded.then(
        () => listeners.has(l) && next(snapCol(col)),
        (e) => onError && onError(dbError(e)),
      );
      return () => listeners.delete(l);
    },
  };
}
const db = { doc: docRef, collection: colRef };

function subscribeRealtime() {
  sb.channel("docs-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "docs" },
      (p) => {
        if (p.eventType === "DELETE") {
          const path = p.old && p.old.path;
          if (path) {
            cache.delete(path);
            notify(path);
          }
          return;
        }
        const r = p.new;
        if (!r || !r.path) return;
        cache.set(r.path, r.data);
        notify(r.path);
      },
    )
    .subscribe();
  // Catch up after the phone has been asleep or offline.
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      try {
        await loadAll();
        notifyAll();
      } catch (e) {
        /* keep last view */
      }
    }
  });
}

/* ---------- files (private bucket, signed URLs) ---------- */
const urlCache = new Map();
const pendingUrls = new Set();
let urlTimer = null;
function flushUrls() {
  const paths = [...pendingUrls];
  pendingUrls.clear();
  urlTimer = null;
  sb.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60 * 6)
    .then(({ data }) => {
      for (const r of data || [])
        if (r.signedUrl) urlCache.set(r.path, r.signedUrl);
      window.dispatchEvent(new Event("yaffle:files"));
    });
}
window.yaffleFiles = {
  url(id) {
    if (!id) return undefined;
    if (urlCache.has(id)) return urlCache.get(id);
    if (!pendingUrls.has(id)) {
      pendingUrls.add(id);
      if (!urlTimer) urlTimer = setTimeout(flushUrls, 30);
    }
    return undefined;
  },
};
const OK_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const assets = {
  async upload(file, opts = {}) {
    const type = opts.type || file.type;
    if (!OK_TYPES.includes(type))
      throw { code: "unsupported_type", message: type };
    if (file.size > 20 * 1024 * 1024)
      throw { code: "too_large", message: "For stor" };
    const ext = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
      "application/pdf": "pdf",
    }[type];
    const id = (opts.folder ? String(opts.folder).replace(/[^a-zA-Z0-9_\/-]/g, '') + "/" : "") + crypto.randomUUID() + "." + ext;
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(id, file, { contentType: type, upsert: false });
    if (error)
      throw {
        code: /size|large/i.test(error.message)
          ? "too_large"
          : /mime|type/i.test(error.message)
            ? "unsupported_type"
            : "upstream_error",
        message: error.message,
      };
    return { id, url: "", sizeBytes: file.size, contentType: type };
  },
  async delete(id) {
    const { error } = await sb.storage.from(BUCKET).remove([id]);
    if (error) throw { code: "upstream_error", message: error.message };
    return { deleted: true };
  },
  async list() {
    return { assets: [], usage: {} };
  },
};

/* ---------- user ---------- */
const PALETTE = ['#1c1c1e','#3a3a3c','#007aff','#5856d6','#636366','#0060df'];
const colorFor = (s) => {
  let x = 0;
  for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(x) % PALETTE.length];
};
function makeUser(session) {
  const id = session.user.id,
    email = session.user.email || null;
  return {
    async id() {
      return id;
    },
    async isOwner() {
      return false;
    },
    async canEdit() {
      return true;
    },
    async can() {
      return true;
    },
    async me() {
      return {
        id,
        name: "",
        avatarUrl: "",
        color: colorFor(id),
        email,
        isOwner: false,
        canEdit: true,
      };
    },
    async profiles(ids) {
      const list = Array.isArray(ids) ? ids : [ids];
      return Object.fromEntries(
        list.map((x) => [
          x,
          {
            id: x,
            name: "",
            avatarUrl: "",
            color: colorFor(x),
            email: null,
            isMe: x === id,
            guest: false,
          },
        ]),
      );
    },
    async name() {
      return "";
    },
    async search() {
      return [];
    },
  };
}

/* ---------- boot ---------- */
let started = false;
let alert_msg = null;
async function start(session) {
  if (started) return;
  started = true;
  leaveWelcome();
  app.replaceChildren(
    brand(),
    h("p", { class: "muted", style: "margin-top:60px" }, "Henter turen …"),
  );
  // Godta invitasjon fra lenken
  const code = pendingInvite();
  if (code) {
    const { data: tid, error } = await sb.rpc("accept_invite", { p_code: code });
    try { sessionStorage.removeItem(INVITE_KEY); } catch (e) {}
    if (error) {
      app.replaceChildren(brand(), h("div", { class: "notice", style: "margin-top:40px" }, "Får ikke kontakt med databasen. Sjekk at migrate-flere-turer.sql er kjørt i Supabase."));
      return;
    }
    if (tid) { try { await sb.rpc("befriend_trip", { p_trip: tid }); } catch (e) {} }
    if (tid) { try { localStorage.setItem("yaffle-trip", tid); } catch (e) {} history.replaceState(null, "", location.pathname + "?tur=" + encodeURIComponent(tid) + "#plan"); }
    else { history.replaceState(null, "", location.pathname); alert_msg = "Invitasjonslenken virker ikke lenger. Be om en ny."; }
  }
  // Navn fra registreringen
  let nick = null; try { nick = sessionStorage.getItem("yaffle-nick"); sessionStorage.removeItem("yaffle-nick"); } catch (e) {}
  if (nick) { await sb.from("docs").upsert({ path: "profiles/" + session.user.id, collection: "profiles", data: { nick } }); }
  window.yaffleRpc = (name, args) => sb.rpc(name, args);
  // Henter navn, adresse, bilde og koordinater fra en lenke via /api/lenke (krever innlogging)
  window.yaffleLinkInfo = async (url) => {
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    const r = await fetch("/api/lenke?url=" + encodeURIComponent(url), { headers: token ? { Authorization: "Bearer " + token } : {} });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((j && j.error) || "Fikk ikke hentet lenken");
    return j;
  };
  // Fjerner alle opplastede filer for en tur (kvitteringer, bilder) før turen slettes.
  window.yaffleRemoveTripFiles = async (tid) => {
    const folder = String(tid).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!folder) return;
    for (let round = 0; round < 20; round++) {
      const { data, error } = await sb.storage.from(BUCKET).list(folder, { limit: 100 });
      if (error) throw error;
      const files = (data || []).filter(f => f.id).map(f => folder + "/" + f.name);
      if (!files.length) return;
      const { error: e2 } = await sb.storage.from(BUCKET).remove(files);
      if (e2) throw e2;
    }
  };
  window.yaffleCartoKey = CONFIG.CARTO_KEY || "";
  window.yaffleNotice = alert_msg;
  loaded = loadAll();
  try {
    await loaded;
  } catch (e) {
    /* listeners get the error */
  }
  subscribeRealtime();
  const user = makeUser(session);
  window.claude = {
    use: async (name) =>
      name === "db"
        ? db
        : name === "user"
          ? user
          : name === "assets"
            ? assets
            : null,
  };
  await import("./app.js?v=20261114a");
}

const {
  data: { session },
} = await sb.auth.getSession();
if (session) start(session);
else if (!pendingInvite() && !welcomed()) welcomeScreen();
else loginScreen();
sb.auth.onAuthStateChange((event, s) => {
  if (event === "SIGNED_IN" && s) start(s);
  if (event === "SIGNED_OUT") {
    started = false;
  }
});
