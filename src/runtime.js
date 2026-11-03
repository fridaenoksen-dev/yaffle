// Yaffle runtime: Supabase login gate + the small data API the app expects
// (window.claude.use('db' | 'user' | 'assets')). Swapping Claude's built-in
// storage for Supabase here means src/app.js stays almost unchanged.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from "./config.js";

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
      h("b", null, "Yaffle"),
      h("i", null, "Yay, waffles."),
    ),
  );

if (!SUPABASE_URL || SUPABASE_URL.includes("DITT-PROSJEKT")) {
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
function loginScreen(note) {
  const email = h("input", {
    class: "input",
    id: "login-email",
    type: "email",
    autocomplete: "email",
    placeholder: "navn@epost.no",
    required: true,
    "aria-label": "E-post",
  });
  const btn = h(
    "button",
    { class: "btn dark", type: "submit" },
    "Send innloggingslenke",
  );
  const msg = h(
    "p",
    { role: "status" },
    note || "Vi sender deg en lenke på e-post. Trykk på den, så er du inne.",
  );
  const form = h(
    "form",
    {
      class: "onboard",
      onsubmit: async (e) => {
        e.preventDefault();
        const v = email.value.trim();
        if (!v) return email.focus();
        btn.disabled = true;
        btn.textContent = "Sender …";
        const { error } = await sb.auth.signInWithOtp({
          email: v,
          options: { emailRedirectTo: location.origin + location.pathname },
        });
        if (error) {
          btn.disabled = false;
          btn.textContent = "Send innloggingslenke";
          msg.textContent = /rate|limit/i.test(error.message)
            ? "For mange forsøk. Vent litt og prøv igjen."
            : "Fikk ikke sendt lenken. Sjekk e-postadressen og prøv igjen.";
          return;
        }
        form.replaceChildren(
          h("h2", null, "Sjekk e-posten din"),
          h(
            "p",
            null,
            "Vi har sendt en innloggingslenke til ",
            h("b", { style: "color:var(--ink)" }, v),
            ". Åpne den på denne enheten.",
          ),
          h(
            "button",
            {
              class: "linkbtn",
              type: "button",
              style: "margin-top:16px;align-self:flex-start",
              onclick: () => loginScreen(),
            },
            "Bruk en annen e-post",
          ),
        );
      },
    },
    h("h2", null, "Logg inn"),
    msg,
    email,
    btn,
  );
  app.replaceChildren(brand(), form);
  setTimeout(() => email.focus(), 50);
}

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
    const id = crypto.randomUUID() + "." + ext;
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
const PALETTE = [
  "#054d28",
  "#0b4c72",
  "#cb272f",
  "#8a5a00",
  "#5b2c6f",
  "#2f6f6a",
];
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
async function start(session) {
  if (started) return;
  started = true;
  app.replaceChildren(
    brand(),
    h("p", { class: "muted", style: "margin-top:60px" }, "Henter turen …"),
  );
  const { data: member, error } = await sb.rpc("is_member");
  if (error) {
    app.replaceChildren(
      brand(),
      h(
        "div",
        { class: "notice", style: "margin-top:40px" },
        "Får ikke kontakt med databasen. Sjekk at schema.sql er kjørt i Supabase.",
      ),
    );
    return;
  }
  if (!member) {
    started = false;
    noAccessScreen(session.user.email);
    return;
  }
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
  await import("./app.js");
}

const {
  data: { session },
} = await sb.auth.getSession();
if (session) start(session);
else loginScreen();
sb.auth.onAuthStateChange((event, s) => {
  if (event === "SIGNED_IN" && s) start(s);
  if (event === "SIGNED_OUT") {
    started = false;
  }
});
