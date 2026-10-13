import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map();
function load(file) {
  const filename = path.resolve(testDirectory, '../lib', file.endsWith('.ts') ? file : `${file}.ts`);
  if (cache.has(filename)) return cache.get(filename);
  const testModule = { exports: {} };
  cache.set(filename, testModule.exports);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module: testModule, exports: testModule.exports, require: (ref) => load(path.relative(path.resolve(testDirectory, '../lib'), path.resolve(path.dirname(filename), ref))), Date, Intl, console });
  return testModule.exports;
}
const { talentRows, placementRows, planPlacementCreation } = load('placements');
const { profileKey, historyFor } = load('people');
const { FORM_STATUSES, validatePipeline, scheduledInstant, pipelinePayload } = load('candidate-pipeline');
const clients = [{ id: 'a', name: 'Company A', status: 'active' }, { id: 'b', name: 'Company B', status: 'active' }];
const jobs = [{ id: 'ja', title: 'Engineer', client: 'Company A', status: 'open' }, { id: 'jb', title: 'Engineer', client: 'Company B', status: 'open' }];
const person = { key: 'person', candidateId: 'person', ids: ['person'], name: 'Example Candidate', headline: 'Engineer', status: 'applied', matches: [], gaps: [] };
const first = { id: 'p-a', candidateId: 'person', clientId: 'a', jobId: 'ja', status: 'declined', forms: [] };
const second = { id: 'p-b', candidateId: 'person', clientId: 'b', jobId: 'jb', status: 'submitted', forms: [] };

test('one shared profile resolves two independent company processes without changing its identity', () => {
  const talent = talentRows({ deals: [], candidates: [], applicants: [], jobs, followUps: [] }, [person], [first, second]);
  assert.equal(talent.length, 1);
  assert.equal(profileKey(talent[0]), 'person');
  const rows = placementRows([first, second], talent, clients, jobs, []);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, 'declined');
  assert.equal(rows[1].status, 'submitted');
  assert.equal(profileKey(rows[0]), profileKey(rows[1]));
  assert.equal(talent[0].status, 'applied');
  assert.ok(talent[0].ids.includes('p-a') && talent[0].ids.includes('p-b'));
});
test('different people with identical names are not merged', () => {
  const rows = talentRows({ deals: [], candidates: [], applicants: [], jobs: [], followUps: [] }, [person, { ...person, key: 'another', candidateId: 'another', ids: ['another'] }]);
  assert.equal(rows.length, 2);
});
test('bulk creation validates every role, deduplicates selected IDs and rejects active duplicates atomically', () => {
  assert.equal(planPlacementCreation([], 'person', ['ja', 'jb', 'ja'], jobs, clients).length, 2);
  assert.throws(() => planPlacementCreation([second], 'person', ['ja', 'jb'], jobs, clients), /already exists/);
  assert.equal(second.status, 'submitted');
  assert.equal(planPlacementCreation([first], 'person', ['ja'], jobs, clients).length, 1);
  assert.throws(() => planPlacementCreation([], 'person', ['missing'], jobs, clients), /open role/);
  assert.throws(() => planPlacementCreation([], 'person', [], jobs, clients), /at least one/);
});
test('all nine status forms reject incomplete information', () => {
  assert.equal(FORM_STATUSES.length, 9);
  for (const status of FORM_STATUSES) assert.ok(validatePipeline(status, {}), status);
  const schedule = { date: '2026-10-15', timezone: 'America/New_York', start: '10:00', end: '11:00' };
  assert.equal(validatePipeline('interview', { ...schedule, client: 'b', role: 'jb', contacts: ['contact'], interviewType: 'Virtual Interview', attendees: 'Candidate + Client' }), null);
  assert.ok(validatePipeline('interview', { ...schedule, client: 'b', role: 'jb', contacts: [], interviewType: 'Virtual Interview', attendees: 'Candidate + Client' }));
  assert.ok(validatePipeline('screening', { ...schedule, end: '09:00', email: 'test@example.com' }));
  assert.ok(validatePipeline('placed', { client: 'b', role: 'jb', startDate: '2026-11-01', fee: '-1' }));
});
test('form snapshots do not leak fields from other workflow types', () => {
  const clean = pipelinePayload('interview', { client: 'b', role: 'jb', date: '2026-10-15', submittalType: 'Client Submittal', documentType: 'Offer Letter' });
  assert.equal(clean.client, 'b');
  assert.equal(clean.submittalType, undefined);
  assert.equal(clean.documentType, undefined);
});
test('schedules resolve selected timezones and reject nonexistent DST times', () => {
  assert.equal(new Date(scheduledInstant('2026-10-15', '10:00', 'America/New_York')).toISOString(), '2026-10-15T14:00:00.000Z');
  assert.equal(new Date(scheduledInstant('2026-10-15', '10:00', 'Australia/Sydney')).toISOString(), '2026-10-14T23:00:00.000Z');
  assert.throws(() => scheduledInstant('2026-03-08', '02:30', 'America/New_York'), /does not exist/);
});


test('candidate history never joins other referenced people merely because their names match', () => {
  const events = [{ id: 'mine', subjectId: 'person', summary: 'Updated Example Candidate' }, { id: 'other', subjectId: 'another', summary: 'Updated Example Candidate' }];
  const history = historyFor(person, events);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, 'mine');
});
