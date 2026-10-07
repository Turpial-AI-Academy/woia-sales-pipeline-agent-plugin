import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { validateOpportunityProjection as validate } from '../skills/sales-pipeline/scripts/validate-opportunity-projection.mjs';

function fixture() {
  return {
    request: { org_id: 'org', opportunity_id: 'op', source_ref: 'opportunity-source', expected_revision: 'r7', operation_id: 'op-1', patch: { stage: 'won' }, evidence_refs: ['decision-evidence'] },
    context: {
      authenticated: true, department: 'sales', org_id: 'org', access: 'write',
      current: { entity: 'Opportunity', org_id: 'org', opportunity_id: 'op', source_ref: 'opportunity-source', revision: 'r7', stage: 'negotiating', domain_refs: { offer: 'offer-version-3' } },
      source_status: 'CURRENT', source_map: { accepted: true, version: 'source-map-2', opportunity_source_ref: 'opportunity-source' },
      authority: { accepted: true, decision_ref: 'accepted-1', org_id: 'org', opportunity_id: 'op', source_ref: 'opportunity-source', expected_revision: 'r7', fields: ['stage', 'owner_ref', 'status', 'next_action'], accepted_patch: { stage: 'won' } },
      transition_policy: { accepted: true, version: 'playbook-2', allowed_transitions: { negotiating: ['won', 'lost'] } },
      accepted_evidence_refs: ['decision-evidence'], effect_status: 'NONE',
      authorized_owner_refs: ['person-1'], allowed_statuses: ['active'], allowed_next_actions: ['request-review'],
    },
  };
}

test('typed projection preserves domain references, input and distinct business facts', () => {
  const { request, context } = fixture();
  const before = structuredClone(context);
  const r = validate(request, context);
  assert.equal(r.result, 'PASS');
  assert.equal(r.proposal.stage, 'won');
  assert.deepEqual(context, before);
  assert.deepEqual(r.proposal.domain_refs, context.current.domain_refs);
  assert.equal(r.domain_facts_inferred, false);
  assert.equal(r.write_executed, false);
  assert.equal(r.proposal.payment, undefined);
});

for (const department of ['leasing', 'supply-acquisition', 'executive']) {
  test(`${department} scoped consumer still needs explicit field authority`, () => {
    const f = fixture(); f.context.department = department;
    assert.equal(validate(f.request, f.context).result, 'PASS');
    f.context.authority.accepted = false;
    assert.equal(validate(f.request, f.context).result, 'FAIL');
  });
}

const negatives = {
  unauthenticated: f => { f.context.authenticated = false; },
  unauthorized_department: f => { f.context.department = 'data'; },
  readonly: f => { f.context.access = 'read'; },
  missing_acceptance: f => { f.context.authority.accepted = false; },
  changed_accepted_proposal: f => { f.context.authority.accepted_patch = { stage: 'lost' }; },
  approval_for_old_revision: f => { f.context.authority.expected_revision = 'r6'; },
  wrong_authority_org: f => { f.context.authority.org_id = 'other'; },
  wrong_authority_opportunity: f => { f.context.authority.opportunity_id = 'other'; },
  wrong_authority_source: f => { f.context.authority.source_ref = 'crm'; },
  customer_instead_of_opportunity: f => { f.context.current.entity = 'Customer'; },
  different_org: f => { f.request.org_id = 'other'; },
  different_opportunity: f => { f.request.opportunity_id = 'other'; },
  customer_source_substitution: f => { f.request.source_ref = 'customer-data'; },
  unaccepted_source_map: f => { f.context.source_map.accepted = false; },
  stale_revision: f => { f.request.expected_revision = 'r6'; },
  unknown_source: f => { f.context.source_status = 'UNKNOWN'; },
  missing_operation: f => { delete f.request.operation_id; },
  payment_mutation: f => { f.request.patch.payment = 'accepted'; },
  domain_fact_mutation: f => { f.request.domain_facts = { lease: 'active' }; },
  customer_mutation: f => { f.request.customer_patch = { stage: 'won' }; },
  field_not_accepted: f => { f.context.authority.fields = []; },
  inferred_evidence: f => { f.request.evidence_refs = ['model-inference']; },
  no_evidence: f => { f.request.evidence_refs = []; },
  unknown_effect: f => { f.context.effect_status = 'UNKNOWN'; },
  unaccepted_playbook: f => { f.context.transition_policy.accepted = false; },
  forbidden_transition: f => { f.request.patch.stage = 'closed'; },
  arbitrary_owner: f => { f.request.patch = { owner_ref: 'other-person' }; },
  arbitrary_status: f => { f.request.patch = { status: 'paid' }; },
  arbitrary_next_action: f => { f.request.patch = { next_action: 'send-person-message' }; },
};
for (const [name, change] of Object.entries(negatives)) {
  test(`fail closed: ${name}`, () => {
    const f = fixture(); change(f);
    const r = validate(f.request, f.context);
    assert.equal(r.result, 'FAIL'); assert.equal(r.permitted, false); assert.ok(r.errors.length);
    assert.equal(r.proposal, undefined);
  });
}

test('invalid envelopes fail closed', () => {
  assert.equal(validate(null, null).result, 'FAIL');
  assert.equal(validate({}, {}).result, 'FAIL');
});

test('legacy transition CLI retains exact compatible graph-only result', () => {
  const output = execFileSync(process.execPath, ['skills/sales-pipeline/scripts/validate-transition.mjs', '--file', 'skills/sales-pipeline/assets/transition.example.json'], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), { result: 'PASS', current: 'new', target: 'qualified', allowed_from_current: ['qualified', 'disqualified'], permitted: true, errors: [] });
});
