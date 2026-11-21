import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function discoverApiEndpoints() {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const entries = [];
  const scan = (source, receiver, prefix, file) => {
    const regex = new RegExp(`${receiver}\\.(get|post|put|patch|delete)\\(['"]([^'"]+)['"]`, 'g');
    for (const match of source.matchAll(regex)) entries.push({ method: match[1].toUpperCase(), path: (prefix + (match[2] === '/' && prefix ? '' : match[2])), file });
  };
  scan(app, 'app', '', 'server/app.js');
  const imports = new Map([...app.matchAll(/import\s+(\w+)\s+from\s+['"]\.\/routes\/([^'"]+)['"]/g)].map(match => [match[1], match[2]]));
  for (const mount of app.matchAll(/app\.use\(['"]([^'"]+)['"],\s*(\w+)\)/g)) {
    const file = imports.get(mount[2]);
    if (file) scan(await readFile(new URL('../routes/' + file, import.meta.url), 'utf8'), 'router', mount[1], 'server/routes/' + file);
  }
  return entries.sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method));
}

export function endpointKey(entries, method, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const entry = entries.find(item => item.method === method.toUpperCase() && new RegExp('^' + item.path.split('/').map(part => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '$').test(path));
  return entry ? entry.method + ' ' + entry.path : null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const entries = await discoverApiEndpoints();
  console.log(`Explicit endpoints discovered: ${entries.length}; business API endpoints: ${entries.filter(item => item.path.startsWith('/api/')).length}`);
  for (const entry of entries) console.log(entry.method + ' ' + entry.path);
}
