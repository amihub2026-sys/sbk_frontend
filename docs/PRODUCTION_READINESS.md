# SBK Chithiram Thiruvila – Production Readiness

## Frontend flow
- Student QR opens `/register` directly.
- Student form supports Tamil/English, optional photo, DOB-based age category, eligible client competitions only, max 2 selection, terms, online-payment UI, receipt and final pass.
- Admin supports online registrations, paper/cash entry, approval/payment review, competition image upload, schedule/venue, judges, event check-in, marks and event settings.
- Judge sees only assigned competitions and approved participants; marks lock after save and require Edit before correction.
- Check-in supports registration number, USB scanner and browser camera QR where BarcodeDetector is available. It verifies participant before confirmation, prevents duplicates and displays IST time.
- Event participation is separate from check-in: judge mark = Present; admin can mark Absent in Marks.

## Backend implementation checklist
1. Replace localStorage with Node.js APIs + MongoDB.
2. Generate registration numbers on the server with an atomic sequence; never trust a frontend-generated number.
3. Store all server timestamps in UTC; render Asia/Kolkata on the frontend.
4. Use role-based authentication for ADMIN and JUDGE. Enforce permissions on the API, not only Angular guards.
5. Use a payment gateway order + webhook flow. Mark Paid only after verified webhook/server confirmation.
6. Send pass email from backend after approval + schedule validation. Use Brevo/Resend/SMTP and attach or link the generated event pass.
7. Store uploaded photos/competition images in object storage (Cloudinary/S3-compatible storage), not MongoDB base64.
8. QR should contain a random/signed pass token, not personal student data. Resolve token server-side.
9. Add audit records for approval, payment changes, check-in, score edits and pass-email sends.
10. Validate all input server-side; limit image type/size; add rate limits to login, registration lookup and check-in APIs.
11. Add indexes for applicationNo, phone, qrToken, email, competitionIds, approval, payment and checkedInAt.
12. Add backups, HTTPS, environment secrets, logging and error monitoring before launch.

## Launch QA
- Test all 12 age boundaries exactly at birthdays and month boundaries.
- Test max-two competition rule and category mapping against client application.
- Test duplicate registration prevention.
- Test payment failed/success/webhook retry.
- Test approval before/after payment.
- Test pass email with missing and completed slots.
- Test QR scan on Android Chrome and manual fallback.
- Test duplicate check-in.
- Test judge cannot access another competition.
- Test mark Save → locked → Edit → Update / Cancel.
- Test mobile widths 320, 360, 390, 412, 768 and desktop 1366/1920.
- Test print/PDF pass and Tamil font rendering.
