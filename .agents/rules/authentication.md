---
trigger: always_on
---

# Authentication Rules

## Purpose

These rules govern the authentication slice of StudyFlow Assessment 1.

This is not a full StudyFlow application.

These rules apply only to:

- Account creation
- Email verification
- Sign in
- Forgot-password request
- Password reset
- Session management
- Protected dashboard access
- Sign out

Do not use these rules to justify implementing features outside the authentication slice.

---

## 1. Authentication Must Be Server-Authoritative

All security-sensitive authentication decisions must be enforced on the server.

The client must never be treated as the authority for:

- Whether a user is authenticated
- Whether an email is verified
- Whether a verification code is valid
- Whether a verification code has expired
- Whether a password-reset token is valid
- Whether a password-reset token has expired
- Whether a reset token has already been used
- Whether a resend cooldown has elapsed
- Whether a rate limit has been exceeded
- Whether a protected route may be accessed

Client-side state may improve user experience but must never determine security outcomes.

---

## 2. Technology Constraints

The authentication implementation must use the established project stack:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- bcrypt
- Zod

Do not introduce another framework, ORM, database technology, password-hashing mechanism, or validation library for the authentication slice unless explicitly authorized.


## 3. Account Creation

The signup flow must:

1. Validate all submitted data on the server using Zod.
2. Apply the required password rules.
3. Hash the password using bcrypt before persistence.
4. Store only the password hash.
5. Enforce unique email addresses through the database.
6. Handle repeated or double submissions safely.
7. Create the required email verification state.
8. Persist verification expiry in the database.
9. Apply signup rate limiting.

The client must never send or persist a plaintext password anywhere other than the intended authentication request.


## 4. Password Hashing

Use bcrypt for password hashing.

Passwords must never be stored in plaintext.

Never:

- Store plaintext passwords in PostgreSQL.
- Return password hashes to the client.
- Log passwords.
- Store passwords in localStorage or similar browser storage.
- Include passwords in error messages.
- Expose passwords through debugging output.

The bcrypt configuration must follow the project requirements and remain documented for assessment defence.

---

## 5. Email Verification

Verification codes must be generated server-side.

The database must contain the state required to determine whether the submitted verification code is valid and unexpired.

Verification must be rejected when:

- The code is incorrect.
- The code has expired.
- The verification attempt is otherwise invalid.

The frontend countdown is informational only.

Never use a frontend timer as the authority for code expiry.

---

## 6. Verification Resend

Verification-code resend must:

- Be rate limited.
- Enforce the resend cooldown on the server.
- Generate a new verification code when permitted.
- Persist the new verification state.
- Prevent premature resend requests from bypassing the client.

A disabled resend button or countdown is not sufficient protection.

A direct request must also be rejected when the cooldown has not elapsed.

---

## 7. Sign In

Sign in must:

1. Validate input using Zod on the server.
2. Apply sign-in rate limiting.
3. Retrieve the appropriate user through Prisma.
4. Verify the submitted password using bcrypt.
5. Create an authenticated session only after successful authentication.
6. Avoid exposing sensitive authentication information through errors.

Do not authenticate a user based solely on client-side state.

---

## 8. Session Management

Authenticated access must depend on a valid server-recognised session.

Session implementation must use the established Next.js architecture and must not expose session secrets to the client.

The implementation must correctly handle:

- Session creation
- Session retrieval
- Authenticated user identification
- Cookie configuration
- Session invalidation during sign out

The session must not contain plaintext passwords or unnecessary sensitive data.

---

## 9. Protected Dashboard

The dashboard is a minimal protected destination.

Before displaying authenticated content, the server must determine whether a valid authenticated session exists.

Unauthenticated users must be redirected to sign in.

Do not protect the dashboard only by:

- Hiding links
- Client-side redirects
- Client-side state
- UI conditions

The dashboard must remain minimal and contain only the required signed-in confirmation, the user's name, and sign-out.

---

## 10. Sign Out

Sign out must invalidate the authenticated session.

After sign out:

- The previous session must no longer grant authenticated access.
- Direct navigation to the protected dashboard must require authentication again.
- The client must not continue presenting the user as authenticated.

---

## 11. Forgot Password

The password-reset request must:

- Validate input using Zod.
- Be rate limited.
- Generate the required password-reset mechanism.
- Persist the information required for server-side validation.
- Avoid unnecessary disclosure of whether an account exists.

Do not treat access to the reset page as proof of authorization.

---

## 12. Password Reset

Password-reset tokens must be:

- Time limited.
- Validated server-side.
- Single use.
- Invalidated after successful use.

The reset flow must not depend on a client-side timer to determine token validity.

A successfully used reset token must not be reusable.

After a successful reset, the user's password must be replaced with a new bcrypt password hash.

---

## 13. Rate-Limited Authentication Operations

The following operations must be rate limited:

- Sign in
- Sign up
- Password-reset request
- Verification-code resend

The actual rate-limit values are implementation decisions and must be provided explicitly when implementation begins.

Do not invent or silently change those values.

Rate limiting must be enforced server-side.

A client-side countdown or disabled button is not a substitute for server enforcement.

---

## 14. Duplicate Signup Requests

Signup must safely handle repeated submissions.

Do not assume that disabling the submit button prevents duplicate requests.

The server and PostgreSQL database must remain correct when multiple signup requests for the same email arrive close together.

The Prisma/PostgreSQL implementation must rely on the database uniqueness constraint as the final protection against duplicate accounts.

---

## 15. Sensitive Authentication Data

Never expose:

- Passwords
- Password hashes
- Session secrets
- Reset tokens
- Verification secrets
- Database credentials
- Environment secrets

through client responses, logs, or debugging output.

Return only information required by the authentication flow.

---

## 16. Scope

Do not implement:

- Social authentication
- Two-factor authentication
- Profile editing
- Account settings
- Full dashboard functionality
- Study planning
- Study material uploads
- AI study assistance
- Notes
- Summaries
- Flashcards
- Other StudyFlow features

This file governs Assessment 1 authentication only.