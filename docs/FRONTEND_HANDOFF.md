# Frontend handoff for backend phase

The frontend currently stores event state under localStorage key `sbk-chithiram-frontend-v5`.

Backend integration should replace persistence/auth/payment/email only; UI rules and models are already separated under `src/app/core`.

Required backend modules tomorrow:
1. Authentication – admin/judge sessions and role enforcement.
2. Event settings/categories/competitions/slots/judges CRUD.
3. Online registrations and sequential application number generation on the server.
4. Paper/cash registration endpoint.
5. Payment order + webhook verification.
6. Approval workflow and pass generation data.
7. Transactional email (Brevo/SMTP) with participant pass link/attachment.
8. Check-in endpoint.
9. Judge participant query restricted to assigned competitions.
10. Judge mark create/update endpoint with audit trail.
11. Image upload storage for competition/event backgrounds.

Never trust frontend-calculated age, fees, approval, payment or marks on the backend; recalculate/authorize them server-side.
