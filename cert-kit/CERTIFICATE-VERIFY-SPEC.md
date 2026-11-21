# Certificate Verification — Trial Spec (5–6 students, no database)

Site: https://futurestackacademy.com (static HTML)
Goal: anyone (employer, university, embassy) can verify a Futurestack Academy certificate by ID or QR code.
Brand: navy `#1B2E4B`, dark navy `#0B1626`, orange `#E8772E` (text on white: `#C9631F`), green only for "Valid" status `#15803D` on `#DCFCE7`, red only for "Revoked" `#B42318` on `#FEE4E2`. Use the site's existing header, footer and font.

---

## 1. Certificate data — `/certs/{ID}.json`

One JSON file per certificate. File name = certificate ID. No list/index file of all certificates anywhere.

ID format: `FSA-YYYY-NNNN` (e.g. `FSA-2026-0001`). Regex: `^FSA-\d{4}-\d{4}$`

```json
{
  "id": "FSA-2026-0001",
  "name": "Student Full Name (as on NID/passport)",
  "course": "Diploma in Full Stack AI Development",
  "department": "Web & Software",
  "batch": "Batch 05",
  "duration": "12 months · 126 classes",
  "mode": "On campus",
  "start": "01 Nov 2025",
  "end": "31 Oct 2026",
  "result": "A",
  "issued": "15 Nov 2026",
  "status": "valid"
}
```

- `status`: `"valid"` or `"revoked"`. Add optional `"revoked_reason"` only if needed.
- NEVER store phone, NID, address, email, payment info in these files — they are public.
- Create 2 sample files for testing: `FSA-2026-0001.json` (valid) and `FSA-2026-0002.json` (revoked). Delete them before going live.

---

## 2. Public verify page — `/verify.html`

Layout (match site design):
- Site header and footer.
- Dark navy hero: small orange label "CERTIFICATE VERIFICATION", heading "Verify a Futurestack Academy certificate", one line: "For employers, universities and embassies. Enter the certificate ID printed on the certificate, or scan its QR code."
- Form: one input (label "Certificate ID", placeholder `FSA-2026-0001`) + orange "Verify" button.
- Result area below the hero.

Behaviour:
1. On load, read `?id=` from the URL (used by QR codes). If present, auto-verify.
2. On submit: trim, uppercase, validate with the regex. Invalid format → show "Not found" state with the format hint (don't fetch).
3. Fetch `/certs/{ID}.json` (`cache: "no-store"`).
4. Update the URL to `verify.html?id={ID}` (history.replaceState) so the result can be shared.
5. Show loading state while fetching.

States:
- **Valid** (status valid): green header bar with check icon — "Valid certificate — This certificate was issued by Futurestack Academy." Then a details grid: Student name (large), Certificate ID, Issue date, Course, Department, Batch, Duration + mode, Study period (start – end), Result. Footer line: "Need written confirmation? Email verify@futurestackacademy.com or call +880 1644-099435 with this certificate ID."
- **Revoked**: red card — "Certificate revoked — Certificate {ID} was cancelled by Futurestack Academy and is no longer valid. Contact verify@futurestackacademy.com for details." Do not show the student's details.
- **Not found** (404 or bad format): neutral card — "No certificate found — Check the ID and try again. It looks like FSA-YYYY-XXXX. If it still doesn't match, contact verify@futurestackacademy.com."
- **Error** (network): "Couldn't check right now. Please try again in a minute."

Also:
- `<meta name="robots" content="noindex">` on verify.html.
- Accessible: real `<label>`, result area `aria-live="polite"`.
- Works on mobile (input and button stack).
- Add "Verify Certificate" link to the top bar and the footer of every page.

---

## 3. robots.txt

Add:
```
Disallow: /certs/
Disallow: /tools/
```
(keep the existing Sitemap line). Do NOT add verify.html or /certs/ to sitemap.xml.

---

## 4. Certificate print page (LOCAL ONLY) — `/tools/print-certificate.html`

Used by staff on their own computer to make the PDF. Must NOT be deployed.
- Add `tools/` to `.vercelignore` (or the hosting equivalent) so it is never public.
- Design: copy exactly from `certificate-design.html` (A4 landscape, 1123×794 px).
- Reads `?id=` → loads `../certs/{ID}.json` → fills name, course, department, duration, mode, batch, start/end, result, certificate ID, issue date.
- Generates the QR code in the page (use the `qrcode` library from a CDN, e.g. qrcode-generator or QRCode.js) pointing to `https://futurestackacademy.com/verify.html?id={ID}`. Replace the dashed "QR" placeholder box with it (64–80 px, navy on white).
- Print CSS: `@page { size: A4 landscape; margin: 0 }`, hide everything except the certificate, keep backgrounds/colours (`print-color-adjust: exact`).
- A small "Print / Save as PDF" button visible on screen only.
- Run it locally with any static server (e.g. `npx serve .`) and open `http://localhost:3000/tools/print-certificate.html?id=FSA-2026-0001`.

---

## 5. Done checklist

- [ ] `verify.html?id=FSA-2026-0001` shows Valid with all details
- [ ] `verify.html?id=FSA-2026-0002` shows Revoked without details
- [ ] `verify.html?id=FSA-9999-9999` and `abc` show Not found
- [ ] No file lists all certificates; `/certs/` returns 404 for the folder itself
- [ ] `/tools/` is not reachable on the live site
- [ ] Print page makes a correct A4 PDF with a scannable QR that opens the right verify page
- [ ] "Verify Certificate" link in top bar + footer
- [ ] Mobile layout OK
