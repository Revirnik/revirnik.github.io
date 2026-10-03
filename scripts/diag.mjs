// Jednorázová diagnostika: proč některé revíry ze Soupisu ČRS chybí v datech z RIS.
import { readFile, writeFile } from "node:fs/promises";
import { get } from "./lib.mjs";
const API = "https://ris.rybsvaz.cz/proxy/api/public";
const out = { cas: new Date().toISOString() };
const keys = (o) => (o && typeof o === "object" ? Object.keys(o) : typeof o);
try {
  const j = await get(`${API}/reviry?filter.bbox=-910000,-1235000,-750000,-1082500&output.uzemniVymezeni=true`, { json: true });
  out.bboxKeys = keys(j); out.bboxCount = (j.items || []).length;
  out.bboxMeta = Object.fromEntries(Object.entries(j).filter(([k]) => k !== "items"));
} catch (e) { out.bboxErr = String(e); }
for (const q of ["", "?page=2", "?filter.cislo=433052", "?filter.nazev=%C3%9AHLAVA", "?search=%C3%9Ahlava", "?pageSize=5"]) {
  try { const j = await get(`${API}/reviry${q}`, { json: true }); out["list" + q] = { keys: keys(j), n: (j.items || j.content || []).length, meta: Object.fromEntries(Object.entries(j).filter(([k]) => !["items", "content"].includes(k))), prvni: (j.items || j.content || []).slice(0, 2).map((x) => [x.cislo, x.oficialniNazev, x.typReviru?.kod, !!x.uzemniVymezeni]) }; }
  catch (e) { out["list" + q] = String(e).slice(0, 200); }
}
const miss = JSON.parse(await readFile(new URL("./diag-chybejici.json", import.meta.url)));
out.chybejici = [];
for (const m of miss) {
  try { const d = await get(`${API}/reviry/by-friendly-url/${m.url}`, { json: true, tries: 1 });
    out.chybejici.push({ ...m, ok: true, cislo: d.cislo, typ: d.typReviru?.kod, sid: d.sid, gps: [d.gpsSouradniceSirka, d.gpsSouradniceDelka], geom: !!d.uzemniVymezeni, keys: keys(d) });
  } catch (e) { out.chybejici.push({ ...m, ok: false, err: String(e).slice(0, 120) }); }
}
await writeFile(new URL("../data/diag.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 3000));
