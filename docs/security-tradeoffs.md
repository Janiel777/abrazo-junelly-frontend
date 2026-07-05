# Security and Privacy Tradeoffs

Abrazo Solidario Junelly was designed for a community charity event where usability, low cost, and operational speed matter. The system separates public information from private operational data and documents deliberate tradeoffs.

## Public / Private Separation

The public frontend never connects directly to Firestore. It consumes a public read-only API that returns sanitized aggregate data and paginated public donation records.

The private backend, dashboard workflows, payment processing details, and operational records remain outside the public repository.

## Public API Safety

The public API should only expose fields that are safe for public display:

- fundraising total
- goal
- progress percent
- milestone status
- contribution count
- shortened or anonymous donor display names
- sanitized public messages
- pagination metadata

The API must not expose emails, phone numbers, ATH phone numbers, reference numbers, registration IDs, pickup codes, internal notes, service account data, or dashboard-only fields.

## Matching Tradeoff

The production system uses a low-friction matching approach appropriate for a community event. Matching donations to registrations reduces manual work, but ambiguous cases must be reviewable by admins.

This is a deliberate operational tradeoff: the system avoids forcing participants into a heavy account or identity flow while still providing manual correction tools, audit logs, and duplicate handling.

## Mitigations

- Private admin dashboard.
- Manual correction workflows.
- Duplicate detection and review.
- Audit logs and correction history.
- Ability to void or burn runner numbers.
- Review of unmatched or ambiguous donations.
- Public API sanitization.
- No secrets in the frontend.
- No direct Firestore access from the browser.

## Secrets

Secrets belong in backend environment configuration or secret management. They must not be committed to the frontend repository.
