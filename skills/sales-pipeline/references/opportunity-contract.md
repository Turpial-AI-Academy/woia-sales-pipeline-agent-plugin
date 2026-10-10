# Typed Opportunity projection

Opportunity is an identifiable commercial intent. Its stable identity and
participants come from their semantic owners. An admitted domain descriptor
defines any separately owned links without copying their schemas into this provider. A pipeline
projection holds `org_id`, `opportunity_id`, `source_ref`, `revision`, `stage`,
`owner_ref`, `status`, `next_action` and separately owned `domain_refs`.

Sales, Leasing, Supply Acquisition and Executive may consume scoped views. Write
eligibility is not authority: the competent business owner must accept the
exact organization, Opportunity, source and fields. Executive access defaults
to read/request; no universal write authority follows from consumer eligibility.

Customer Data remains an optional configured CRM adapter. It is neither the
identity master nor the canonical Opportunity source by default. Resolve stable
identity through Identity and Opportunity through the accepted versioned Source
Authority Map. Use the owner named by the admitted descriptor for each domain
reference and retain immutable source and revision provenance. A pipeline stage
does not accept or create separately owned business outcomes.

`validate-opportunity-projection.mjs --file <file.json>` accepts an
envelope with `request` and `context`. Request has org_id, opportunity_id,
source_ref, expected_revision, operation_id, patch and evidence_refs. The context
must be resolved by an authenticated host, never copied from model/user input:
authenticated, department, org_id, access, current, source_status, source_map,
authority, transition_policy, accepted_evidence_refs and effect_status. Authority
has accepted, decision_ref, org_id, opportunity_id, source_ref, fields and
expected_revision and accepted_patch bound to the exact proposed values. An
accepted source_map has version and opportunity_source_ref. The accepted transition
policy has version and allowed_transitions. Host allowlists authorized_owner_refs,
allowed_statuses and allowed_next_actions bound non-stage changes.

`current.domain_refs` is an object. When it contains links, the host must supply
`domain_descriptor` with `accepted`, `current`, `ref`, `version` and
`acceptance_ref`, entity `Opportunity`, exact `org_id`, scope `sales.pipeline`
and a `domain_refs` definition array. Each definition has `field`, `entity`,
`owner_plugin` and boolean `required`. Each linked value is a typed reference
with `kind`, `id`, `source_ref` and `revision`; unknown fields, mismatched entity
types or absent required references fail closed. The qualified host binds the
descriptor's source, revision and digest before supplying its acceptance envelope.
The descriptor source and the Opportunity record source are distinct identities.
An empty link object needs no domain descriptor. Proposals cannot alter links.

Only stage/owner_ref/status/next_action can be proposed. Unknown/stale sources,
unresolved authority, unaccepted evidence, scope mismatch and unknown effects
fail closed. Context authenticity/decision freshness remain host responsibilities;
this offline validator is not an authority service. It does not write, allocate,
send messages or infer business facts. Before applying its proposal the owning
host must atomically compare the unchanged revision, bind the operation key to
the exact request, store immutable before/after evidence and reconcile uncertain
effects before any retry. No durable idempotency or runtime enforcement is claimed.

The validate-transition CLI validates its supplied graph:
it validates a supplied graph only, not authenticated write permission. Use the
typed helper for the Opportunity proposal boundary.
