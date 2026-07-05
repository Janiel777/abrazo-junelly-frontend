# Cost Model

The platform was designed for a nonprofit and community-event context, where recurring costs matter and operational simplicity is valuable.

## Cost Strategy

- Keep the public frontend static.
- Use GitHub Pages for low-cost public hosting.
- Use serverless backend services to avoid maintaining always-on servers.
- Use Google Sheets as a practical admin dashboard instead of building a full custom back-office app.
- Use pay-as-you-go services only where they provide clear operational value.

## Main Cost Categories

| Component | Purpose | Cost Type | Scaling Risk |
|---|---|---|---|
| GitHub Pages | Static public frontend | Free / low cost | Bandwidth or platform limits |
| Custom domain / DNS | Public branded URL | Annual renewal / DNS hosting | Renewal cost |
| Firebase Cloud Functions | Backend, webhooks, APIs | Usage-based | Invocations, runtime, memory, egress |
| Firestore | Operational database | Usage-based | Reads, writes, indexes, storage |
| Google Forms | Registration intake | Usually no direct cost | Form and account limits |
| Google Sheets | Admin dashboard | Usually no direct cost | Size and performance |
| Apps Script | Dashboard automation | Quota-based | Execution quotas |
| Email provider | Confirmation emails | Provider / volume based | Email volume |
| ATH Movil / Aporta | Donation processing | Payment/merchant fees may apply | Transaction volume |

## Why This Architecture Fits

The architecture minimizes recurring infrastructure while still supporting real operational needs: registration intake, payment processing, public reporting, admin correction workflows, and auditability.

## Future Cost Risks

- Higher API traffic.
- Larger Firestore read/write volume.
- More email delivery.
- Long-term log retention.
- More advanced analytics or monitoring.
- Expanded admin reporting requirements.
