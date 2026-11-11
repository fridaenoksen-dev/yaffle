// Yaffle: henter navn, adresse, bilde og koordinater fra en lenke (Google Maps eller vanlig nettside).
// Kjører som Vercel-funksjon på /api/lenke?url=… og krever at man er logget inn i Yaffle.
const dns = require("dns").promises;
const net = require("net");

// Samme offentlige verdier som i src/config.js (publishable-nøkkelen er laget for å være offentlig).
const SUPABASE_URL = "https://lbslhgawkujpuodbtozy.supabase.co";
const SUPABASE_KEY = "sb_publishable_iEzz9gfKaVPcI2aoneSvKg_RMAbL2xF";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return send(res, 405, { error: "Bare GET" });
  if (!(await loggedIn(req))) return send(res, 401, { error: "Logg inn først" });
  const raw = String((req.query && req.query.url) || "").trim();
  let url;
  try { url = new URL(raw); } catch (e) { return send(res, 400, { error: "Ugyldig lenke" }); }
  if (!/^https?:$/.test(url.protocol)) return send(res, 400, { error: "Bare http og https" });

  try {
    const { finalUrl, html } = await fetchFollow(url.toString());
    const out = { url: finalUrl };
    const g = parseGoogleMaps(finalUrl);
    const meta = html ? parseMeta(html) : {};
    const ld = html ? parseJsonLd(html) : {};
    Object.assign(out, cleanObj({ title: meta.title, description: meta.description, image: meta.image, site: meta.site }));
    Object.assign(out, cleanObj(ld));
    if (g) {
      out.source = "google";
      if (g.name) out.title = g.name;
      if (g.lat != null) { out.lat = g.lat; out.lng = g.lng; }
      if (g.query && !out.address) out.address = g.query;
      // Google legger ofte «Navn · Adresse» i og:title
      if (meta.title && meta.title.includes(" · ")) {
        const [n, ...rest] = meta.title.split(" · ");
        if (!g.name) out.title = n.trim();
        if (rest.length) out.address = rest.join(", ").trim();
      }
      if (out.image && /staticmap|maps\.google|googleapis\.com\/maps/.test(out.image)) delete out.image;
      if (out.description && /Google Maps/i.test(out.description)) delete out.description;
    } else out.source = "page";
    if (out.title) out.title = out.title.replace(/\s*[|–-]\s*(Google Maps|Tripadvisor.*)$/i, "").trim();
    if (out.image) { try { out.image = new URL(out.image, finalUrl).toString(); } catch (e) { delete out.image; } }
    // Sider som sperrer oppslag (f.eks. Booking.com): bruk navnet i lenken
    if (!out.title) { const slug = slugName(finalUrl); if (slug) { out.title = slug; out.partial = true; } }
    if (!out.title && !out.address && out.lat == null) return send(res, 422, { error: "Fant ingen informasjon på siden", url: finalUrl });
    return send(res, 200, out);
  } catch (e) {
    return send(res, 502, { error: e && e.userMessage ? e.userMessage : "Fikk ikke hentet siden" });
  }
};

function slugName(href) {
  try {
    const u = new URL(href);
    const seg = u.pathname.split("/").filter(Boolean).pop() || "";
    const base = decodeURIComponent(seg).replace(/\.(html?|php|aspx?)$/i, "").replace(/\.[a-z]{2}(-[a-z]{2})?$/i, "");
    if (!/[a-z]{3}/i.test(base) || /^\d+$/.test(base)) return "";
    const words = base.replace(/[-_+]+/g, " ").trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  } catch (e) { return ""; }
}
function send(res, status, body) { res.status(status).json(body); }
function cleanObj(o) { const r = {}; for (const [k, v] of Object.entries(o)) if (v != null && v !== "") r[k] = v; return r; }

async function loggedIn(req) {
  const auth = req.headers.authorization || "";
  if (!/^Bearer\s+\S+/.test(auth)) return false;
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: SUPABASE_KEY, Authorization: auth } });
    return r.ok;
  } catch (e) { return false; }
}

// Stopper oppslag mot interne adresser (localhost, private nett, metadata-tjenester)
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const s = ip.toLowerCase();
  return s === "::1" || s === "::" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe80") || s.startsWith("::ffff:") && privateIp(s.slice(7));
}
async function assertPublic(u) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (u.port && !["80", "443"].includes(u.port)) throw Object.assign(new Error("port"), { userMessage: "Lenken bruker en port som ikke er tillatt" });
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw Object.assign(new Error("private"), { userMessage: "Lenken peker til en adresse som ikke er tillatt" });
}

async function fetchFollow(start) {
  let url = start;
  for (let hop = 0; hop < 6; hop++) {
    const u = new URL(url);
    // Googles samtykkeside: hopp rett til siden den skulle videre til
    if (/^consent\.google\./.test(u.hostname) && u.searchParams.get("continue")) { url = u.searchParams.get("continue"); continue; }
    await assertPublic(u);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let r;
    try {
      r = await fetch(url, { redirect: "manual", signal: ctrl.signal, headers: { "User-Agent": UA, "Accept-Language": "nb,en;q=0.8", Accept: "text/html,application/xhtml+xml", Cookie: "CONSENT=YES+cb; SOCS=CAI" } });
    } finally { clearTimeout(t); }
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = new URL(r.headers.get("location"), url).toString(); continue; }
    const type = r.headers.get("content-type") || "";
    if (!r.ok) {
      // Mange sider sperrer slike oppslag, men lenken kan likevel si noe (f.eks. Google Maps-adressen)
      return { finalUrl: url, html: "" };
    }
    if (!/html|xml/.test(type)) return { finalUrl: url, html: "" };
    return { finalUrl: url, html: await readLimited(r) };
  }
  return { finalUrl: url, html: "" };
}
async function readLimited(r) {
  const reader = r.body.getReader();
  const chunks = []; let n = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); n += value.length;
    if (n > MAX_BYTES) { try { reader.cancel(); } catch (e) {} break; }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

function parseGoogleMaps(href) {
  let u; try { u = new URL(href); } catch (e) { return null; }
  if (!/(^|\.)google\.[a-z.]+$/.test(u.hostname) || !u.pathname.startsWith("/maps")) {
    if (!/^maps\.google\./.test(u.hostname)) return null;
  }
  const out = {};
  const path = decodeURIComponent(u.pathname);
  const place = /\/maps\/place\/([^/]+)/.exec(path);
  if (place) out.name = place[1].replace(/\+/g, " ").trim();
  const exact = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(href);
  const at = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(path);
  const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("daddr") || "";
  const qll = /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/.exec(q);
  const pos = exact || qll || at;
  if (pos) { out.lat = Number(pos[1]); out.lng = Number(pos[2]); }
  if (q && !qll) out.query = q.replace(/\+/g, " ");
  if (!out.name && out.query) out.name = out.query.split(",")[0].trim();
  return out;
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}
function parseMeta(html) {
  const head = html.slice(0, 400000);
  const metas = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (/(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1];
    const val = (/content\s*=\s*"([^"]*)"/i.exec(tag) || /content\s*=\s*'([^']*)'/i.exec(tag) || [])[1];
    if (key && val != null && !(key.toLowerCase() in metas)) metas[key.toLowerCase()] = decodeEntities(val);
  }
  const titleTag = decodeEntities((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head) || [])[1] || "");
  return {
    title: metas["og:title"] || metas["twitter:title"] || titleTag,
    description: (metas["og:description"] || metas["description"] || metas["twitter:description"] || "").slice(0, 400),
    image: metas["og:image:secure_url"] || metas["og:image"] || metas["twitter:image"] || metas["twitter:image:src"],
    site: metas["og:site_name"],
  };
}
function parseJsonLd(html) {
  const out = {};
  const nodes = [];
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collect(JSON.parse(m[1].trim()), nodes); } catch (e) {}
  }
  for (const n of nodes) {
    const addr = n.address;
    if (!out.address && addr) {
      if (typeof addr === "string") out.address = decodeEntities(addr);
      else if (typeof addr === "object") {
        const a = Array.isArray(addr) ? addr[0] : addr;
        const country = a.addressCountry && typeof a.addressCountry === "object" ? a.addressCountry.name : a.addressCountry;
        const parts = [a.streetAddress, [a.postalCode, a.addressLocality].filter(Boolean).join(" "), country].filter(Boolean);
        if (parts.length) out.address = decodeEntities(parts.join(", "));
      }
      if (!out.ldName && n.name) out.ldName = decodeEntities(n.name);
    }
    const geo = n.geo && (Array.isArray(n.geo) ? n.geo[0] : n.geo);
    if (out.lat == null && geo && geo.latitude != null && geo.longitude != null) {
      const la = Number(geo.latitude), lo = Number(geo.longitude);
      if (Number.isFinite(la) && Number.isFinite(lo)) { out.lat = la; out.lng = lo; }
    }
  }
  if (out.ldName) { out.title = out.ldName; delete out.ldName; }
  return out;
}
function collect(x, acc) {
  if (!x || typeof x !== "object") return;
  if (Array.isArray(x)) { x.forEach((y) => collect(y, acc)); return; }
  acc.push(x);
  if (x["@graph"]) collect(x["@graph"], acc);
  for (const k of ["mainEntity", "location", "itemReviewed", "containedInPlace"]) if (x[k]) collect(x[k], acc);
}
