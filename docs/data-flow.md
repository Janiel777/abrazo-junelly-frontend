# Data Flow

This document summarizes the primary production flows for the Abrazo Solidario Junelly platform.

## 1. Registration Flow

A participant submits a registration through Google Forms. The response lands in Google Sheets, where the admin dashboard can review, correct, and process the registration. Apps Script and Cloud Functions coordinate persistence and operational state in Firestore.

## 2. Donation / Payment Webhook Flow

ATH Movil sends donation or payment events to a Firebase Cloud Functions webhook. The backend normalizes the event, stores the donation record, and decides whether it can be matched automatically or needs manual review.

## 3. Donation-to-Registration Matching

The backend attempts to match a donation to a registration using the approved operational matching strategy. Clear matches can confirm participants automatically. Ambiguous or conflicting records are routed to manual review through the admin dashboard.

## 4. Runner Number Assignment

Confirmed registrations can receive runner numbers automatically. Admin workflows support manual assignment, correction, and voiding or burning numbers when duplicate or invalid records need to be handled safely.

## 5. Email Confirmation Flow

Once a participant is confirmed, the backend can queue and send confirmation emails through a provider-backed email workflow. Email batches are tracked so the operations team can review delivery and resend when needed.

## 6. Manual Correction Flow

Admins can correct participant names, matching fields, confirmation states, runner numbers, and related operational details from the dashboard. Corrections should be audit-friendly and traceable.

The Google Sheets dashboard uses Apps Script controls to run selected queries and trigger Firebase Cloud Functions. This keeps Firestore edits behind controlled backend workflows instead of asking operators to edit database records directly.

## 7. Duplicate Handling Flow

Duplicate registrations are detected and handled through dashboard workflows. The system supports ignoring invalid duplicates, correcting the active registration, and voiding or burning already assigned runner numbers when necessary.

## 8. Public Progress Flow

Firestore data is summarized through a public read-only API. The frontend consumes the sanitized summary and paginated donation list to display public progress without exposing private backend data.
