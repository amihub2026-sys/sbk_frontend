# SBK Chithiram Thiruvila API contract

The Angular `api` build uses same-origin `/api` with cookie sessions, `XSRF-TOKEN` / `X-XSRF-TOKEN`, and JSON payloads. Development uses `proxy.conf.json` to proxy `/api` and `/media` to `http://localhost:5000`.

## Public / participant

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/event` | Public categories, slots, competitions and event settings only. No registrations/judges/scores. |
| POST | `/api/registrations` | Create online registration. Server recalculates age/category, validates eligibility, max-two rule, capacity and time conflicts, assigns application no + QR token. |
| GET | `/api/registrations/me` | Read the registration authorized by the current participant session. |
| POST | `/api/registrations/:id/checkout` | Create/reuse online checkout. Paid/free registration returns without a second order. |
| POST | `/api/registrations/lookup/start` | Application no + registered phone starts email OTP challenge. |
| POST | `/api/registrations/lookup/verify` | Verify OTP and authorize participant-session access to receipt/pass. |

## Authentication

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/csrf` | Establish session/XSRF cookie. |
| POST | `/api/auth/login` | Admin/Judge login with `{email,password,role}`. |
| GET | `/api/auth/me` | Restore authenticated admin/judge session. |
| POST | `/api/auth/logout` | Destroy authenticated session. |

## Admin

All `/api/admin/*` endpoints require an authenticated `admin` session.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/state` | Full administrative event state. |
| POST | `/api/admin/registrations/offline` | Create Paper/Cash registration using the same authoritative application-number sequence. |
| PUT | `/api/admin/registrations/:id` | Payment/cancellation update. |
| POST | `/api/admin/registrations/:id/review` | Pending / Approved / Correction requested / Rejected. |
| POST | `/api/admin/registrations/:id/send-pass` | Send approved, fully scheduled event-pass PDF email. |
| POST | `/api/admin/check-in/lookup` | Resolve registration number or random QR token without checking in. |
| POST | `/api/admin/check-in` | Validate and save one event check-in timestamp. Duplicate/unapproved/unpaid/incomplete-schedule check-in is blocked. |
| PATCH | `/api/admin/registrations/:id/attendance` | `Not marked`, `Present`, or `Absent` for one selected competition. |
| PUT | `/api/admin/settings` | Event settings. |
| PUT | `/api/admin/categories/:id` | Age-category setup. |
| PUT | `/api/admin/slots/:id` | Create/update slot (`id="new"` creates). |
| PUT | `/api/admin/competitions/:id` | Create/update competition; image is an uploaded data URL from the Angular image picker, not a user-entered image URL. |
| PUT | `/api/admin/judges/:id` | Create/update judge and assigned competitions. |
| DELETE | `/api/admin/judges/:id` | Delete judge/login. |
| DELETE | `/api/admin/slots/:id` | Delete unused slot. |
| DELETE | `/api/admin/competitions/:id` | Delete competition only when it has no registrations. |

## Judge

All `/api/judge/*` endpoints require an authenticated `judge` session.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/judge/state` | Only this judge, assigned competitions, eligible approved participants and this judge's scores. |
| PUT | `/api/judge/scores/:id` | Upsert 0–100 mark for one assigned participant/competition and mark participation `Present`. |

## Payment webhook

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/payments/razorpay/webhook` | Raw-body HMAC verification; `payment_link.paid` changes authoritative registration payment status to `Paid`. |

## Server authority / invariants

- Never trust client age/category, application number, QR token, fee total, capacity, payment success, approval or check-in time.
- Age category is calculated in months from DOB and application date using the exact 12 client bands.
- Only the 17 client competitions seeded by this project are initial master data; admins may edit the configured event fields through authorized screens.
- Maximum two eligible competitions; actual slot overlaps are rejected.
- Application number is generated transactionally on the server (`26SBK01`, ...).
- Capacity is reserved atomically and the original fee snapshot is frozen on the registration.
- Public participant recovery requires email OTP; phone + application number alone does not reveal personal data.
- QR contains a random opaque token. It does not grant approval; check-in still verifies approval, payment and schedule.
- Check-in timestamps and score timestamps are saved in UTC. Angular displays check-in/mark times in `Asia/Kolkata` with AM/PM.
- Each judge has an independent score record. The system does **not** invent a final multi-judge winner formula; client rules are required before results aggregation.
