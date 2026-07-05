# Admin Dashboard

The admin dashboard is implemented with Google Sheets and Google Apps Script. This keeps operations accessible to non-engineering users while avoiding the cost and complexity of a custom admin application.

## Responsibilities

- Review incoming registrations.
- Track confirmed participants.
- Review donations and payment events.
- Match donations to registrations.
- Assign runner numbers.
- Correct participant information.
- Handle duplicate registrations.
- Void or burn runner numbers when needed.
- Generate or track pickup codes.
- Trigger or review email confirmation batches.
- Keep audit-friendly correction history.

## Why Google Sheets

Google Sheets is familiar, fast to modify, and practical for event operations. It allows admins to filter, review, correct, and coordinate records without needing a custom back-office UI.

Apps Script extends Sheets with dashboard actions, automation, and integration points to backend functions.

## Controlled Firebase Operations

The dashboard includes interactive query panels and action checkboxes. Operators can run prepared views, inspect payment and registration states, and trigger controlled workflows that call Firebase Cloud Functions. Those functions perform the Firestore reads and writes, which keeps database access centralized and auditable.

This approach gave the event team a familiar spreadsheet interface while preserving backend control over sensitive operations such as matching donations, confirming participants, assigning runner numbers, and correcting records.

## Product Evidence

Sanitized screenshots are included in the repository as evidence of the internal operating system behind the public site:

- `assets/admin-dashboard-overview.png`
- `assets/admin-dashboard-queries.png`

## Privacy

The admin dashboard contains operational data and should remain private. Public screenshots should only be included if fully sanitized and stripped of private participant or donor information.
