import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOpportunityProjection } from '../skills/sales-pipeline/scripts/validate-opportunity-projection.mjs';

export function pipelineFixture(domainRefs = {}) {
  const request = { org_id: 'org:test', opportunity_id: 'intent:1', source_ref: 'source:intent', expected_revision: 'r1', operation_id: 'operation:1', patch: { stage: 'qualified' }, evidence_refs: ['evidence:1'] };
  const context = { authenticated: true, department: 'sales', access: 'write', org_id: 'org:test', current: { entity: 'Opportunity', org_id: 'org:test', opportunity_id: 'intent:1', source_ref: 'source:intent', revision: 'r1', stage: 'new', domain_refs: domainRefs }, source_status: 'CURRENT', source_map: { accepted: true, version: '1', opportunity_source_ref: 'source:intent' }, authority: { accepted: true, decision_ref: 'decision:1', org_id: 'org:test', opportunity_id: 'intent:1', source_ref: 'source:intent', fields: ['stage'], expected_revision: 'r1', accepted_patch: request.patch }, transition_policy: { accepted: true, version: '1', allowed_transitions: { new: ['qualified'] } }, accepted_evidence_refs: ['evidence:1'], effect_status: 'NONE' };
  return { request, context };
}
const descriptor = () => ({ accepted: true, current: true, ref: 'descriptor:1', version: '1', acceptance_ref: 'acceptance:1', entity: 'Opportunity', org_id: 'org:test', scope: 'sales.pipeline', domain_refs: [{ field: 'service_ref', entity: 'Service', owner_plugin: 'example-service-owner', required: false }] });
const serviceRef = () => ({ kind: 'Service', id: 'service:1', source_ref: 'source:service', revision: 'r7' });

test('generic commercial-intent proposal preserves ownership and does not write', () => {
  const { request, context } = pipelineFixture(); const result = validateOpportunityProjection(request, context);
  assert.equal(result.result, 'PASS'); assert.equal(result.write_executed, false); assert.equal(result.domain_facts_inferred, false); assert.deepEqual(result.proposal.domain_refs, {});
});
test('admitted typed links survive a bounded stage projection unchanged', () => {
  const { request, context } = pipelineFixture({ service_ref: serviceRef() }); context.domain_descriptor = descriptor();
  const result = validateOpportunityProjection(request, context);
  assert.equal(result.result, 'PASS'); assert.deepEqual(result.proposal.domain_refs, context.current.domain_refs);
});
test('domain links require exact admitted scope, types, sources and required fields', () => {
  for (const patch of [undefined, { ...descriptor(), accepted: false }, { ...descriptor(), current: false }, { ...descriptor(), org_id: 'other' }, { ...descriptor(), scope: 'other' }, { ...descriptor(), domain_refs: [null] }, { ...descriptor(), domain_refs: [] }]) {
    const { request, context } = pipelineFixture({ service_ref: serviceRef() }); context.domain_descriptor = patch;
    assert.equal(validateOpportunityProjection(request, context).result, 'FAIL');
  }
  for (const link of [{ ...serviceRef(), kind: 'Other' }, { ...serviceRef(), revision: '' }, { ...serviceRef(), source_ref: '' }]) { const { request, context } = pipelineFixture({ service_ref: link }); context.domain_descriptor = descriptor(); assert.equal(validateOpportunityProjection(request, context).result, 'FAIL'); }
  const { request, context } = pipelineFixture({ service_ref: serviceRef() }); context.domain_descriptor = { ...descriptor(), domain_refs: [...descriptor().domain_refs, { field: 'required_ref', entity: 'Service', owner_plugin: 'example-owner', required: true }] }; assert.equal(validateOpportunityProjection(request, context).result, 'FAIL');
});
test('domain facts, link patches and arbitrary fields cannot become pipeline writes', () => {
  for (const mutation of [{ patch: { domain_refs: {} } }, { patch: { arbitrary: 'value' } }, { domain_facts: { accepted: true } }, { customer_patch: { id: 'other' } }]) { const { request, context } = pipelineFixture(); assert.equal(validateOpportunityProjection({ ...request, ...mutation }, context).result, 'FAIL'); }
});
test('exact accepted patch/revision/evidence, current authority and reconciliation remain mandatory', () => {
  for (const patch of [{ authenticated: false }, { access: 'read' }, { source_status: 'UNKNOWN' }, { effect_status: 'UNKNOWN' }, { accepted_evidence_refs: [] }, { authority: { accepted: false } }, { transition_policy: { accepted: false } }]) { const { request, context } = pipelineFixture(); assert.equal(validateOpportunityProjection(request, { ...context, ...patch }).result, 'FAIL'); }
  const { request, context } = pipelineFixture(); assert.equal(validateOpportunityProjection({ ...request, expected_revision: 'stale' }, context).result, 'FAIL');
  assert.equal(validateOpportunityProjection({ ...request, patch: { stage: 'other' } }, context).result, 'FAIL');
});
