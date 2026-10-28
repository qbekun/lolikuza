import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../src/data/vndb.json', import.meta.url);
const local = JSON.parse(await readFile(new URL('../tosho/data.json', import.meta.url), 'utf8'));
const ids = [...new Set(local.items.map(x => x.vndbId || x.link?.match(/^https:\/\/vndb\.org\/(v\d+)/)?.[1]).filter(Boolean))];
async function query(filters, results = 60) {
  const response = await fetch('https://api.vndb.org/kana/vn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filters, fields: 'title,alttitle,released,rating,length_minutes,description,image.url,image.sexual,image.violence', sort: 'rating', reverse: true, results }), signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`VNDB HTTP ${response.status}: ${await response.text()}`);
  return (await response.json()).results;
}
try {
  const results = await query(['lang', '=', 'en']);
  const linked = ids.length ? await query(ids.length === 1 ? ['id', '=', ids[0]] : ['or', ...ids.map(id => ['id', '=', id])]) : [];
  await writeFile(path, JSON.stringify({ updatedAt: new Date().toISOString(), results, linked }, null, 2) + '\n');
  console.log(`VNDB: ${results.length} discovery entries, ${linked.length} linked entries.`);
} catch (error) {
  console.warn(`VNDB refresh failed; keeping existing snapshot. ${error.message}`);
  const previous = JSON.parse(await readFile(path, 'utf8'));
  if (!previous.updatedAt) process.exitCode = 1;
}

