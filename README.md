# SBK Chithiram Thiruvila — Angular frontend

Angular participant, Admin and Judge UI for the SBK VIBGYOR School & Star Guru Charitable Foundation event system.

## Routes

- `/register` — QR-target student application (Tamil / English)
- `/find-pass` — secure registration / approved Event Pass recovery
- `/pass` — current participant receipt/pass
- `/admin` — Admin login
- `/admin/dashboard` — Admin workspace
- `/admin/registrations` — approval/payment/pass email
- `/admin/offline-registration` — Paper/Cash application entry
- `/admin/competitions` — supplied competition set; fee/slot/capacity/status/image upload
- `/admin/categories` — exact 12 client age categories
- `/admin/slots` — event schedule/venues
- `/admin/judges` — Judge accounts and competition assignment
- `/admin/check-in` — camera QR / USB scanner / registration-number check-in
- `/admin/marks` — participation/absence and independent Judge marks
- `/admin/settings` — event details, instructions, terms and banner upload
- `/judge` — Judge login
- `/judge/participants` — assigned competition participant list + 0–100 mark entry

## Run modes

### Frontend demo mode

```bash
npm install
npm start
```

Uses localStorage test data. Demo Admin: `admin@sbk.in` / `Admin@123`. Judge test accounts are created from Admin → Judges.

### Real backend/API mode

Start the backend first, then:

```bash
npm install
npm run start:api
```

`start:api` uses `proxy.conf.json` so `/api` and `/media` proxy to `http://localhost:5000` during local development.

> This package now adds `@zxing/browser` for reliable camera QR scanning. If you are upgrading an older project folder, run `npm install` once so the new dependency is installed and the lockfile is refreshed.

## Client rules implemented

- DOB + application date in completed months; no STD/Class category logic.
- Category I = 4 to below 6; II–XII continue through 16 to below 17.
- Maximum two eligible competitions.
- Only the 17 client-supplied competitions are seeded.
- Public online registration uses online payment only.
- Admin Paper/Cash entries use the same server application-number sequence.
- Optional student photo upload with mobile camera/gallery picker.
- Admin competition images are uploaded from the device; no image URL field.
- Receipt is separate from approved Event Pass. Event QR appears only after approval and complete schedule.
- Judge mark becomes read-only after Save; Edit → Update/Cancel.
- Check-in time is shown in India time with AM/PM and duplicate check-in is blocked.
- `Paid`, event `Checked-in`, and competition `Present/Absent` are separate states.

See `docs/API_CONTRACT.md` and the root `docs/IMPLEMENTATION_STATUS.md` for backend/launch details.
