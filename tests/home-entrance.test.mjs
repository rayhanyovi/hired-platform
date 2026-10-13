import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../lib/home-entrance.ts', import.meta.url), 'utf8');
const entry = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: entry.exports, Date });
const { claimHomeEntrance } = entry.exports;
const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};
test('the same member sees the welcome once across same-day reloads and returns', () => {
  const storage = memoryStorage();
  assert.equal(claimHomeEntrance(storage, 'sam', new Date(2026, 9, 13, 0, 1)), true);
  assert.equal(claimHomeEntrance(storage, 'sam', new Date(2026, 9, 13, 23, 59)), false);
});
test('the next local calendar day replays even if the session was already ready', () => {
  const storage = memoryStorage();
  claimHomeEntrance(storage, 'sam', new Date(2026, 9, 13, 23, 59));
  assert.equal(claimHomeEntrance(storage, 'sam', new Date(2026, 9, 14, 0, 1), true), true);
});
test('members have separate daily welcomes', () => {
  const storage = memoryStorage();
  assert.equal(claimHomeEntrance(storage, 'sam'), true);
  assert.equal(claimHomeEntrance(storage, 'mia'), true);
  assert.equal(claimHomeEntrance(storage, 'sam'), false);
});
test('unavailable storage falls back to once per app session', () => {
  const storage = { getItem() { throw new Error('Unavailable'); }, setItem() {} };
  assert.equal(claimHomeEntrance(storage, 'sam', new Date(), false), true);
  assert.equal(claimHomeEntrance(storage, 'sam', new Date(), true), false);
});
