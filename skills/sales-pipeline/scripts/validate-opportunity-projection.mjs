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
  require(plain(current?.domain_refs), 'TYPED_DOMAIN_REFERENCES_REQUIRED');
  if (plain(current?.domain_refs) && Object.keys(current.domain_refs).length > 0) {
    const descriptor = context.domain_descriptor;
    require(descriptor?.accepted === true && descriptor.current === true && text(descriptor.ref) && text(descriptor.version) && text(descriptor.acceptance_ref), 'ADMITTED_DOMAIN_DESCRIPTOR_REQUIRED');
    require(descriptor?.entity === 'Opportunity' && descriptor.org_id === request.org_id && descriptor.scope === 'sales.pipeline', 'DOMAIN_DESCRIPTOR_SCOPE_MISMATCH');
    require(Array.isArray(descriptor?.domain_refs) && descriptor.domain_refs.every(value => plain(value) && text(value.field) && text(value.entity) && text(value.owner_plugin) && typeof value.required === 'boolean') && new Set(descriptor.domain_refs.map(value => value.field)).size === descriptor.domain_refs.length, 'INVALID_DOMAIN_DESCRIPTOR');
    if (Array.isArray(descriptor?.domain_refs) && descriptor.domain_refs.every(plain)) {
      for (const [field, reference] of Object.entries(current.domain_refs)) {
        const definition = descriptor.domain_refs.find(value => value.field === field);
        require(Boolean(definition), 'UNKNOWN_DOMAIN_REFERENCE');
        require(plain(reference) && reference.kind === definition?.entity && text(reference.id) && text(reference.source_ref) && text(reference.revision), 'DOMAIN_REFERENCE_TYPE_OR_SOURCE_MISMATCH');
      }
      require(descriptor.domain_refs.every(value => !value.required || Object.hasOwn(current.domain_refs, value.field)), 'REQUIRED_DOMAIN_REFERENCE_MISSING');
    }
  }
  if (plain(patch)) {
    require(Object.values(patch).every(text), 'NONEMPTY_PATCH_VALUES_REQUIRED');
    require(Array.isArray(context.authority?.fields) && Object.keys(patch).every((key) => context.authority.fields.includes(key)), 'FIELD_AUTHORITY_REQUIRED');
    if ('stage' in patch) {
      const allowed = context.transition_policy?.allowed_transitions?.[current?.stage];
      require(context.transition_policy?.accepted === true && text(context.transition_policy?.version), 'ACCEPTED_TRANSITION_POLICY_REQUIRED');
      require(Array.isArray(allowed) && allowed.includes(patch.stage), 'TRANSITION_NOT_ALLOWED');
    }
    if ('owner_ref' in patch) require(Array.isArray(context.authorized_owner_refs) && context.authorized_owner_refs.includes(patch.owner_ref), 'OWNER_SCOPE_MISMATCH');
    if ('status' in patch) require(Array.isArray(context.allowed_statuses) && context.allowed_statuses.includes(patch.status), 'STATUS_NOT_ALLOWED');
    if ('next_action' in patch) require(Array.isArray(context.allowed_next_actions) && context.allowed_next_actions.includes(patch.next_action), 'NEXT_ACTION_NOT_ALLOWED');
  }
  require(Array.isArray(request.evidence_refs) && request.evidence_refs.length > 0 && Array.isArray(context.accepted_evidence_refs) && request.evidence_refs.every((ref) => text(ref) && context.accepted_evidence_refs.includes(ref)), 'ACCEPTED_EVIDENCE_REQUIRED');
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
