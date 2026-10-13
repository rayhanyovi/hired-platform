import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const entry = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../lib/talent-insights.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: entry.exports });
const { profileInsight, placementInsight } = entry.exports;
const profile = { summary: '', experience: ['Frontend Engineer · React TypeScript'], skills: ['React'], location: 'Sydney', notice: '', salary: '', education: [] };
const row = { name: 'Example', headline: 'Frontend Engineer', client: 'A', matches: ['React and TypeScript'], gaps: [], fit: 'strong', applicant: { jobId: 'a', summary: 'Original screening for A' } };
test('a profile summary renders immediately without importing a company assessment', () => {
  const insight = profileInsight(row, profile);
  assert.match(insight.summary, /Frontend Engineer/);
  assert.doesNotMatch(insight.summary, /Original screening/);
  assert.ok(insight.gaps.includes('Education not recorded'));
});
test('reviewed profile text is retained as the preferred summary', () => {
  assert.equal(profileInsight(row, { ...profile, summary: 'Reviewed text' }).summary, 'Reviewed text');
});
test('saved strong screening is scoped to its original company and job', () => {
  assert.equal(placementInsight(row, profile, { id: 'a', client: 'A' }).badge, 'Strong fit');
  const different = placementInsight({ ...row, client: 'B' }, profile, { id: 'b', client: 'B' });
  assert.equal(different.badge, 'Brief needed');
  assert.equal(different.matches.length, 0);
  assert.doesNotMatch(different.summary, /Original screening/);
});
test('recorded requirements show evidence coverage, with unknown requirements kept explicit', () => {
  const insight = placementInsight(row, profile, { id: 'a', client: 'A', requirements: ['React and TypeScript', 'Kubernetes'] });
  assert.equal(insight.badge, '1/2 evidenced');
  assert.equal(insight.matches[0], 'React and TypeScript');
  assert.equal(insight.gaps[0], 'Kubernetes');
});
test('negated evidence and absent requirements never become positive fit evidence', () => {
  const unknown = { ...profile, summary: '', experience: ['No Kubernetes experience'], skills: [] };
  assert.equal(placementInsight({ ...row, applicant: undefined }, unknown, { id: 'a', client: 'A', requirements: ['Kubernetes'] }).badge, '0/1 evidenced');
  assert.equal(placementInsight({ ...row, client: 'B', applicant: undefined }, profile, { id: 'a', client: 'A', requirements: ['React'] }).badge, 'Brief needed');
});

test('process urgency and stage signals are not presented as requirement matches', () => {
  const insight = placementInsight({ ...row, applicant: undefined, candidate: undefined, deal: { role: { client: 'A' }, read: 'Close the offer soon', signals: ['Final interview completed'] } }, profile, { id: 'a', client: 'A' });
  assert.equal(insight.matches.length, 0);
  assert.doesNotMatch(insight.summary, /Close the offer/);
});
