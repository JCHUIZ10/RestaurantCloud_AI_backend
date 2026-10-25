#!/usr/bin/env node
/**
 * Verificador de reglas visuales de la guía de refactorización UI
 * (implementacion/GUIA_REFACTOR_UI_RESPONSIVE_WEB.md).
 *
 * Uso:
 *   npm run check:ui                         -> resumen de todo src/ (no falla)
 *   npm run check:ui -- src/modules/cocina   -> detalle de esas rutas; falla si hay hallazgos
 *   npm run check:ui -- --estricto           -> resumen de todo src/ y falla si hay hallazgos
 *
 * Solo revisa .tsx de la capa visual; la zona congelada (services, types, stores, shared/utils) se excluye.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const SRC = join(RAIZ, 'src');

const EXCLUIDOS = [
  `${sep}services${sep}`,
  `${sep}types${sep}`,
  `${sep}stores${sep}`,
  `${sep}shared${sep}utils${sep}`,
];

const esComentario = (linea) => /^\s*(\/\/|\/\*|\*|\{\s*\/\*)/.test(linea);

const REGLAS = [
  {
    id: 'I1',
    nombre: 'Emoji o pictograma Unicode',
    test: (l) => /(?![©®™])\p{Extended_Pictographic}|[✓✕↳➔↺☰]/u.test(l) && !esComentario(l),
  },
  {
    id: 'T3',
    nombre: 'Texto menor a 12px (text-[9|10|11px])',
    test: (l) => /text-\[(9|10|11)px\]/.test(l),
  },
  {
    id: 'L4',
    nombre: 'Código de caso de uso visible (CU-XXX-NN)',
    test: (l) => /CU-[A-Z]+-\d/.test(l) && !esComentario(l),
  },
  {
    id: 'C5',
    nombre: 'Variante dark: (tema único)',
    test: (l) => /(^|[\s"'`])dark:/.test(l),
  },
  {
    id: 'C2',
    nombre: 'Color fuera de paleta (slate/sky/indigo/purple/violet/teal)',
    test: (l) => /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow)-(?:slate|sky|indigo|purple|violet|teal)-\d/.test(l),
  },
  {
    id: 'NV9',
    nombre: 'Ruta literal en lugar de ROUTES',
    test: (l) => /navigate\(\s*['"`]\/|\bto=["']\/|\bto=\{\s*['"`]\//.test(l),
  },
];

function listarTsx(ruta) {
  if (!existsSync(ruta)) {
    console.error(`Ruta inexistente: ${ruta}`);
    process.exit(2);
  }
  if (statSync(ruta).isFile()) return ruta.endsWith('.tsx') ? [ruta] : [];
  return readdirSync(ruta).flatMap((n) => listarTsx(join(ruta, n)));
}

const args = process.argv.slice(2);
const estricto = args.includes('--estricto');
const rutas = args.filter((a) => !a.startsWith('--'));
const modoDetalle = rutas.length > 0;

const archivos = (modoDetalle ? rutas.map((r) => resolve(process.cwd(), r)) : [SRC])
  .flatMap(listarTsx)
  .filter((f) => !EXCLUIDOS.some((x) => f.includes(x)));

const conteo = Object.fromEntries(REGLAS.map((r) => [r.id, 0]));
const porArchivo = new Map();
const detalle = [];

for (const archivo of archivos) {
  const rel = relative(RAIZ, archivo).split(sep).join('/');
  readFileSync(archivo, 'utf8').split(/\r?\n/).forEach((linea, i) => {
    for (const regla of REGLAS) {
      if (regla.test(linea)) {
        conteo[regla.id]++;
        porArchivo.set(rel, (porArchivo.get(rel) ?? 0) + 1);
        if (modoDetalle) detalle.push(`${rel}:${i + 1}  [${regla.id}] ${regla.nombre}\n    ${linea.trim().slice(0, 140)}`);
      }
    }
  });
}

const total = Object.values(conteo).reduce((a, b) => a + b, 0);

if (modoDetalle && detalle.length) console.log(detalle.join('\n') + '\n');

console.log(`check:ui — ${archivos.length} archivos .tsx revisados`);
for (const r of REGLAS) console.log(`  ${r.id.padEnd(4)} ${r.nombre.padEnd(60)} ${String(conteo[r.id]).padStart(5)}`);
console.log(`  ${'TOTAL'.padEnd(65)} ${String(total).padStart(5)}`);

if (!modoDetalle && total) {
  console.log('\nArchivos con más hallazgos:');
  [...porArchivo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([f, n]) => console.log(`  ${String(n).padStart(5)}  ${f}`));
}

process.exit((modoDetalle || estricto) && total > 0 ? 1 : 0);
