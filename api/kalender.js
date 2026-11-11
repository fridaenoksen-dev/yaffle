// Yaffle: personlig kalenderabonnement (.ics) med treff og turer du er med på.
// Kalenderappen henter /api/kalender?t=<hemmelig nøkkel> noen ganger i timen.
const SUPABASE_URL = "https://lbslhgawkujpuodbtozy.supabase.co";
const SUPABASE_KEY = "sb_publishable_iEzz9gfKaVPcI2aoneSvKg_RMAbL2xF";
const SITE = "https://yaffle.vercel.app";

module.exports = async (req, res) => {
  const token = String((req.query && req.query.t) || "");
  if (!/^[a-f0-9]{40,80}$/i.test(token)) { res.status(404).send("Ukjent kalender"); return; }
  let rows;
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/calendar_feed", {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token }),
    });
    if (!r.ok) { res.status(502).send("Fikk ikke hentet kalenderen"); return; }
    rows = await r.json();
  } catch (e) { res.status(502).send("Fikk ikke hentet kalenderen"); return; }
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="yaffle.ics"');
  res.setHeader("Cache-Control", "private, max-age=900");
  res.status(200).send(buildIcs(Array.isArray(rows) ? rows : []));
};

const isoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
const ymd = (s) => s.replace(/-/g, "");
function addDays(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function esc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function fold(line) {
  const out = []; let cur = ""; let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 73) { out.push(cur); cur = " "; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}
function stamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }

function buildIcs(rows) {
  const now = stamp(new Date());
  const L = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Yaffle//Yay waffles//NO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Yaffle", "X-WR-TIMEZONE:Europe/Oslo", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
    "BEGIN:VTIMEZONE", "TZID:Europe/Oslo",
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const row of rows) {
    const d = row.data || {};
    if (!isoDate(d.start)) continue;
    const treff = d.kind === "treff";
    const title = (d.title || (treff ? "Treff" : "Tur")) + (row.answer === "maybe" ? " (kanskje)" : "");
    L.push("BEGIN:VEVENT", "UID:" + row.trip_id + "@yaffle", "DTSTAMP:" + now, fold("SUMMARY:" + esc(title)));
    if (treff && /^\d{2}:\d{2}$/.test(d.time || "")) {
      const [hh, mm] = d.time.split(":").map(Number);
      const endH = hh + 3;
      const endDate = endH >= 24 ? addDays(d.start, 1) : d.start;
      L.push("DTSTART;TZID=Europe/Oslo:" + ymd(d.start) + "T" + String(hh).padStart(2, "0") + String(mm).padStart(2, "0") + "00");
      L.push("DTEND;TZID=Europe/Oslo:" + ymd(endDate) + "T" + String(endH % 24).padStart(2, "0") + String(mm).padStart(2, "0") + "00");
    } else {
      const end = isoDate(d.end) && d.end >= d.start ? d.end : d.start;
      L.push("DTSTART;VALUE=DATE:" + ymd(d.start), "DTEND;VALUE=DATE:" + ymd(addDays(end, 1)));
    }
    if (d.place) L.push(fold("LOCATION:" + esc(d.place)));
    const url = SITE + "/?tur=" + encodeURIComponent(row.trip_id);
    const desc = [treff ? d.info : d.note, "Åpne i Yaffle: " + url].filter(Boolean).join("\n\n");
    L.push(fold("DESCRIPTION:" + esc(desc)), "URL:" + url, "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.join("\r\n") + "\r\n";
}
