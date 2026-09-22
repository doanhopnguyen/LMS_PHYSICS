import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { pageManifest } from '../src/config/pageManifest.js';
import { routeFiles } from '../src/lib/routes.js';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    })
  );
  return nested.flat();
}

const appSource = await readFile(join(process.cwd(), 'src', 'App.jsx'), 'utf8');
const appRoutes = new Set([...appSource.matchAll(/['"]([^'"]+\.html)['"]\s*:/g)].map((match) => match[1]));
const manifestRoutes = new Set(pageManifest.map((page) => page.file));
const registeredRoutes = new Set(routeFiles);
const issues = [];

for (const route of registeredRoutes) {
  if (!appRoutes.has(route)) issues.push(`Route chưa có component trong App.jsx: ${route}`);
  if (!manifestRoutes.has(route)) issues.push(`Route chưa có trong pageManifest: ${route}`);
}
for (const route of appRoutes) {
  if (!registeredRoutes.has(route)) issues.push(`App.jsx có route chưa đăng ký: ${route}`);
}
for (const route of manifestRoutes) {
  if (!registeredRoutes.has(route)) issues.push(`Manifest có route chưa đăng ký: ${route}`);
}

const sourceFiles = (await walk(join(process.cwd(), 'src'))).filter((file) => ['.js', '.jsx'].includes(extname(file)));
for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/href\s*=\s*['"]([^'"?#]+\.html)(?:[?#][^'"]*)?['"]/g)) {
    if (!registeredRoutes.has(match[1])) {
      issues.push(`Liên kết tĩnh không tồn tại trong ${relative(process.cwd(), file)}: ${match[1]}`);
    }
  }
}

console.log(`Đã kiểm tra ${registeredRoutes.size} route, ${manifestRoutes.size} manifest entry và ${sourceFiles.length} file source.`);
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Route registry, App mapping, manifest và liên kết tĩnh đồng bộ.');
}
