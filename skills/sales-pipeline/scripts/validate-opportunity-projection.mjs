import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const consumers = ['sales', 'leasing', 'supply-acquisition', 'executive'];
const mutableFields = ['stage', 'owner_ref', 'status', 'next_action'];
const text = (v) => typeof v === 'string' && v.trim().length > 0;
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Pure proposal validation. The host supplies authenticated, current context;
 * it must enforce authentication, storage CAS and idempotency before any write. */
export function validateOpportunityProjection(request, context) {
  const errors = [];
  const require = (condition, code) => { if (!condition) errors.push(code); };
  require(plain(request) && plain(context), 'INVALID_INPUT');
  if (errors.length) return { result: 'FAIL', errors, permitted: false };
  const current = context.current;
  const patch = request.patch;
  require(context.authenticated === true, 'UNAUTHENTICATED');
  require(consumers.includes(context.department), 'INELIGIBLE_CONSUMER');
  require(context.access === 'write', 'WRITE_ACCESS_REQUIRED');
  require(context.authority?.accepted === true && text(context.authority?.decision_ref), 'COMPETENT_ACCEPTANCE_REQUIRED');
  require(plain(current) && current.entity === 'Opportunity', 'TYPED_OPPORTUNITY_REQUIRED');
  require(text(context.org_id) && context.org_id === request.org_id && context.org_id === current?.org_id, 'ORG_SCOPE_MISMATCH');
  require(text(request.opportunity_id) && request.opportunity_id === current?.opportunity_id, 'OPPORTUNITY_SCOPE_MISMATCH');
  require(text(request.source_ref) && request.source_ref === current?.source_ref && request.source_ref === context.source_map?.opportunity_source_ref, 'SOURCE_AUTHORITY_MISMATCH');
  require(context.source_map?.accepted === true && text(context.source_map?.version), 'ACCEPTED_SOURCE_MAP_REQUIRED');
  require(context.source_status === 'CURRENT' && text(current?.revision) && request.expected_revision === current?.revision, 'STALE_OR_UNKNOWN_SOURCE');
  require(context.authority?.org_id === request.org_id && context.authority?.opportunity_id === request.opportunity_id && context.authority?.source_ref === request.source_ref, 'AUTHORITY_SCOPE_MISMATCH');
  require(equal(context.authority?.accepted_patch, patch), 'EXACT_PROPOSAL_ACCEPTANCE_REQUIRED');
  require(context.authority?.expected_revision === request.expected_revision, 'ACCEPTANCE_REVISION_MISMATCH');
  require(text(request.operation_id), 'IDEMPOTENCY_KEY_REQUIRED');
  require(plain(patch) && Object.keys(patch).length > 0, 'BOUNDED_PATCH_REQUIRED');
  require(plain(patch) && Object.keys(patch).every((key) => mutableFields.includes(key)), 'DOMAIN_FACT_OR_UNKNOWN_FIELD');
  require(context.effect_status === 'NONE' || context.effect_status === 'RECONCILED', 'RECONCILE_BEFORE_RETRY');
  if (plain(patch)) {
    require(Object.values(patch).every(text), 'NONEMPTY_PATCH_VALUES_REQUIRED');
    require(Object.keys(patch).every((key) => context.authority?.fields?.includes(key)), 'FIELD_AUTHORITY_REQUIRED');
    if ('stage' in patch) {
      const allowed = context.transition_policy?.allowed_transitions?.[current?.stage];
      require(context.transition_policy?.accepted === true && text(context.transition_policy?.version), 'ACCEPTED_TRANSITION_POLICY_REQUIRED');
      require(Array.isArray(allowed) && allowed.includes(patch.stage), 'TRANSITION_NOT_ALLOWED');
    }
    if ('owner_ref' in patch) require(context.authorized_owner_refs?.includes(patch.owner_ref), 'OWNER_SCOPE_MISMATCH');
    if ('status' in patch) require(context.allowed_statuses?.includes(patch.status), 'STATUS_NOT_ALLOWED');
    if ('next_action' in patch) require(context.allowed_next_actions?.includes(patch.next_action), 'NEXT_ACTION_NOT_ALLOWED');
  }
  require(Array.isArray(request.evidence_refs) && request.evidence_refs.length > 0 && request.evidence_refs.every((ref) => text(ref) && context.accepted_evidence_refs?.includes(ref)), 'ACCEPTED_EVIDENCE_REQUIRED');
  require(!request.domain_facts && !request.customer_patch, 'DOMAIN_FACT_MUTATION_FORBIDDEN');
  if (errors.length) return { result: 'FAIL', permitted: false, errors };
  const projection = { ...structuredClone(current), ...patch };
  // Guard against accidental relation mutation in future additions.
  require(equal(projection.domain_refs, current.domain_refs), 'DOMAIN_REFERENCES_CHANGED');
  return errors.length ? { result: 'FAIL', permitted: false, errors } : {
    result: 'PASS', permitted: true, write_executed: false,
    expected_revision: current.revision, operation_id: request.operation_id,
    proposal: projection, evidence_refs: [...request.evidence_refs],
    domain_facts_inferred: false,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--file');
  if (i < 0 || !process.argv[i + 1]) throw new Error('--file is required');
  const { request, context } = JSON.parse(await readFile(process.argv[i + 1], 'utf8'));
  const result = validateOpportunityProjection(request, context);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.result === 'PASS' ? 0 : 2;
}
