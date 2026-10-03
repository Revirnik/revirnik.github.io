// Jednorázová diagnostika zdrojů zarybnění (výstup do diag/).
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { get } from "./lib.mjs";
const save = (f, t) => writeFile(new URL("../diag/" + f, import.meta.url), typeof t === "string" ? t : JSON.stringify(t, null, 1));
const bin = async (url) => { const r = await fetch(url, { headers: { "User-Agent": "Pstruh/1.0" } }); if (!r.ok) throw new Error(r.status + " " + url); return Buffer.from(await r.arrayBuffer()); };
const pdf = async (url, name) => { const b = await bin(url); await writeFile("/tmp/" + name + ".pdf", b); execFileSync("pdftotext", ["-layout", "/tmp/" + name + ".pdf", "/tmp/" + name + ".txt"]); const t = (await import("node:fs")).readFileSync("/tmp/" + name + ".txt", "utf8"); await save(name + ".txt", t.split("\n").slice(0, 250).join("\n")); return t.length; };
const log = {};
try { const m = JSON.parse(await get("https://www.rybaripraha.cz/wp-json/wp/v2/media?search=zarybneni&per_page=10&orderby=date")); log.praha = m.map((x) => [x.date, x.source_url]); log.prahaLen = await pdf(m[0].source_url, "praha"); } catch (e) { log.prahaErr = String(e); }
try { const p = JSON.parse(await get("https://www.jcus.cz/wp-json/wp/v2/posts?categories=50&per_page=5")); log.jcus = p.map((x) => [x.date, x.link, (x.content.rendered.match(/https?:[^"']+\.pdf/g) || [])]); const u = p.flatMap((x) => x.content.rendered.match(/https?:[^"']+\.pdf/g) || [])[0]; log.jcusLen = await pdf(u, "jcus"); } catch (e) { log.jcusErr = String(e); }
try { await save("crsusti-rss.xml", (await get("https://www.crsusti.cz/rss")).slice(0, 8000)); } catch (e) { log.ustiErr = String(e); }
try { const h = await get("https://www.crs-sus.cz/"); await save("crs-sus.html", h.slice(0, 60000)); } catch (e) { log.susErr = String(e); }
try { const h = await get("https://www.crs-sus.cz/1/4332/dnesni-vysazeni-linu-okounu-a-kapru"); await save("crs-sus-post.html", h.slice(0, 60000)); } catch (e) { log.susPostErr = String(e); }
await save("log.json", log);
console.log(JSON.stringify(log).slice(0, 2000));
