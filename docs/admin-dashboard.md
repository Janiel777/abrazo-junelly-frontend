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

## Privacy

The admin dashboard contains operational data and should remain private. Public screenshots should only be included if fully sanitized and stripped of private participant or donor information.
