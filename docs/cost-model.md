# Cost Model

The platform was designed for a nonprofit and community-event context, where recurring costs matter and operational simplicity is valuable.

## Cost Strategy

- Keep the public frontend static.
- Use GitHub Pages for low-cost public hosting.
- Use AWS Route 53 for custom-domain DNS and hosted zone management.
- Use serverless backend services to avoid maintaining always-on servers.
- Use Google Sheets as a practical admin dashboard instead of building a full custom back-office app.
- Use pay-as-you-go services only where they provide clear operational value.

## Main Cost Categories

| Component | Purpose | Cost Type | Scaling Risk |
|---|---|---|---|
| GitHub Pages | Static public frontend | Free / low cost | Bandwidth or platform limits |
| AWS Route 53 | Custom domain hosted zone and DNS | Annual domain / hosted zone | Renewal and DNS hosting cost |
| Firebase Cloud Functions | Backend, webhooks, APIs | Usage-based | Invocations, runtime, memory, egress |
| Firestore | Operational database | Usage-based | Reads, writes, indexes, storage |
| Google Forms | Registration intake | Usually no direct cost | Form and account limits |
| Google Sheets | Admin dashboard | Usually no direct cost | Size and performance |
| Apps Script | Dashboard automation | Quota-based | Execution quotas |
| Resend | Confirmation emails | Monthly / volume based | Email volume |
| AWS SES | Lower-cost email migration path | Pay-as-you-go | AWS approval and setup process |
| ATH Movil | Donation processing | Payment/merchant fees may apply | Transaction volume |

## Why This Architecture Fits

The architecture minimizes recurring infrastructure while still supporting real operational needs: registration intake, payment processing, public reporting, admin correction workflows, and auditability.

## Email Provider Tradeoff

Resend was used because the system needed to be production-ready quickly for a real client timeline. AWS SES was considered because it is significantly cheaper for ongoing email delivery, and it was eventually approved, but the Resend workflow was already implemented and stable by that point. The system can migrate to SES later if the recurring email cost becomes the bigger priority.
