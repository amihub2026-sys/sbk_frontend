# Release verification

## Verified in this deliverable

- Angular production compilation with strict template checking.
- Rule tests: all category boundaries, birthday precision, invalid/future dates, India date rollover, slot adjacency/conflicts, capacity and cancellation, category overlap, contact validation and CSV escaping.
- Separate HTML/CSS/TypeScript; lazy route feature folders.

## Before accepting real applications

1. Confirm event date/deadline, entry fees, exact slots/venues, contact, art-choice grouping, leap-day age policy, quiz delivery and judging rubric with the client.
2. Implement and test the API contract, durable storage, secure admin login, authorized participant lookup/OTP, media storage, payment webhook and email service.
3. Build with `npm run build:api`. Never treat the demo admin button as authentication.
4. Complete browser acceptance tests: mobile 360px/390px and desktop, Tamil glyphs, 200% text, keyboard/focus dialogs, school circular and participant PDF printing. Browser QA was unavailable in the provided preview environment.
5. Run end-to-end registration → payment failure/retry → verified payment → admin approval → notification → QR pass → check-in; duplicate submit, concurrent last-seat booking and timeout cases.
6. Check API denial for unauthorized records and roles, server-side scoring/time limits, lookup throttling, cross-site request forgery, and webhook replay resistance.
7. Verify deployment routing falls back to index.html for Angular paths and preserves `/api`. Set hosting security headers and a CSP appropriate to the approved payment and image origins.
8. Remove fictional fixtures from operational responses, confirm fee/prize totals and resolve category ties manually.
9. Optional WebMCP catalog tool is feature-detected; supported-context execution validation remains unavailable in this environment.

The frontend is not certified “100% production ready.” Release requires backend integration and the acceptance checks above.
