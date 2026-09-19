import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const codeDir = join(process.cwd(), 'Code');
const files = (await readdir(codeDir)).filter((file) => file.endsWith('.html')).sort();

const report = await Promise.all(files.map(async (file) => {
  const source = await readFile(join(codeDir, file), 'utf8');
  return {
    file,
    hasHeader: /<header\b/i.test(source),
    hasSidebar: /<aside\b/i.test(source),
    hasFooter: /<footer\b/i.test(source),
    hasMain: /<main\b/i.test(source),
    hasTable: /<table\b/i.test(source),
    hasFormControl: /<(input|textarea|select|form)\b/i.test(source)
  };
}));

console.table(report);
console.log(`Scanned ${report.length} HTML pages.`);
