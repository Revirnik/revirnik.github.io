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
for (const q of ["?from=10&size=5", "?size=2000", "?from=1000&size=500", "?offset=10&limit=5"]) {
  try { const j = await get(`${API}/reviry${q}`, { json: true }); out["list" + q] = { keys: keys(j), n: (j.items || j.content || []).length, meta: Object.fromEntries(Object.entries(j).filter(([k]) => !["items", "content"].includes(k))), prvni: (j.items || j.content || []).slice(0, 2).map((x) => [x.cislo, x.oficialniNazev, x.typReviru?.kod, !!x.uzemniVymezeni]) }; }
  catch (e) { out["list" + q] = String(e).slice(0, 200); }
}
await writeFile(new URL("../data/diag.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 3000));
