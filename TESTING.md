# Testing checklist

Use development/demo accounts only.

## Authentication
- [ ] Student registration creates an ACTIVE account and logs in
- [ ] Alumni registration creates PENDING and cannot fully log in
- [ ] Login stores JWT in httpOnly cookie (`access_token`)
- [ ] GET `/api/auth/me` restores session
- [ ] Logout clears cookie
- [ ] Forgot/reset password issues a hashed token (reset URL returned only in non-production)

## Authorization
- [ ] Student cannot open `/admin` pages
- [ ] Student `/api/admin/*` returns 403
- [ ] Alumni `/api/admin/*` returns 403
- [ ] Student POST `/api/jobs` returns 403
- [ ] Alumni cannot approve users/jobs/events
- [ ] Users cannot update another profile
- [ ] Users cannot read another user's private messages or unauthorized applications

## Directory and profiles
- [ ] Search by name/company/title/skills/city
- [ ] Filters: role, branch, batch, mentor
- [ ] Profile view and edit

## Connections and messaging
- [ ] Send/accept/reject connection
- [ ] Duplicate pending/accepted blocked
- [ ] Messages persist in PostgreSQL
- [ ] Socket.IO delivers messages live
- [ ] Unread counts update
- [ ] Messaging blocked unless ACCEPTED

## Jobs and events
- [ ] Alumni job starts PENDING
- [ ] Admin approve makes job visible to students
- [ ] Student apply + duplicate apply blocked
- [ ] Alumni event starts PENDING; admin event is APPROVED
- [ ] RSVP, capacity full, cancel RSVP

## Donations
- [ ] Campaign list from database
- [ ] Razorpay order created server-side when keys exist
- [ ] Signature verification required before PAID
- [ ] `collected_amount` updates only after verify
- [ ] PDF receipt download works
- [ ] Cancel/fail does not increase collected amount

## Notifications and email
- [ ] Bell unread count
- [ ] Mark one / mark all read
- [ ] SMTP missing does not crash the API

## Admin / analytics
- [ ] Dashboard counts from SQL
- [ ] Recharts use `/api/admin/analytics`
- [ ] Verification approve/reject
- [ ] User suspend/activate
- [ ] Job/event moderate/delete
- [ ] Donation campaign create + donation table

## Responsive
- [ ] Navbar/menu on mobile
- [ ] Tables scroll horizontally
- [ ] Forms usable on small screens
