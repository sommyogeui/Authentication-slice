---
trigger: glob
---

# Database Schema Rules

## Purpose

These rules govern the PostgreSQL database schema for StudyFlow Assessment 1.

The project uses:

- PostgreSQL as the database
- Prisma as the ORM

The database exists to support the authentication slice only.


## 1. PostgreSQL Is the Database

Use PostgreSQL for authentication data.

Do not introduce another database technology for this slice.


## 2. Prisma Is the ORM

Use Prisma for application database access.

The Prisma schema must represent the authentication data model clearly.

Do not introduce another ORM for the same authentication data.


## 3. Database Constraints Must Protect Invariants

Important authentication invariants must not depend only on application-level checks.

Where a requirement represents a database invariant, enforce it through the PostgreSQL schema.


## 4. Unique Email

User email addresses must be unique at the database level.

Do not rely only on:

1. Checking whether the email exists.
2. Then creating the user.

Concurrent requests can bypass this pattern.

The PostgreSQL unique constraint is the final protection.


## 5. Password Storage

The user record must store the bcrypt password hash.

Never store the plaintext password.

Do not create a database field intended to persist the original password.

Password hashes must never be returned to the client.


## 6. Email Verification State

The database must persist the state necessary to determine whether email verification is complete.

Verification-code records/state must contain enough information for the server to determine:

- Which account the verification applies to.
- Whether the submitted code is valid.
- Whether the code has expired.
- Whether the verification attempt remains usable.

Expiry must be represented in persisted database state.


## 7. Verification Expiry

The frontend countdown is not a database mechanism.

The server must determine verification-code expiry using persisted database state.

Do not remove or overwrite the information needed to demonstrate the verification record and its expiry behaviour required by the assessment.


## 8. Verification Resend State

The database must support server-side enforcement of the verification resend behaviour.

When a new verification code is issued, the persisted state must correctly represent the current verification attempt and its expiry.

Do not rely on client state to determine whether a resend is permitted.


## 9. Password Reset State

Password-reset persistence must support:

- Time-limited validity.
- Single-use behaviour.
- Server-side validation.
- Invalidation after successful use.

The database must allow the server to determine whether a reset mechanism remains valid.


## 10. Duplicate Signup Protection

The schema must support idempotent signup behaviour.

The unique email constraint must prevent multiple user records from being created for the same email.

Application logic must correctly handle database uniqueness conflicts.

Do not assume duplicate requests cannot occur.


## 11. Nullability

Choose nullable fields deliberately.

A field should be nullable only when its absence represents a legitimate state in the authentication lifecycle.

Do not make fields nullable simply to avoid handling required data.


## 12. Relationships

Use appropriate Prisma relationships where authentication records are separated into related entities.

Relationships should reflect actual authentication requirements.

Do not create relationships for future StudyFlow features.


## 13. Sensitive Data

Authentication-sensitive database fields must not be unnecessarily exposed to the client.

Never expose:

- Password hashes
- Reset tokens
- Verification secrets
- Database credentials

through client-facing database queries or responses.


## 14. Schema Changes

Before changing the Prisma schema:

1. Identify the authentication requirement requiring the change.
2. Inspect the existing schema.
3. Reuse an appropriate existing structure where possible.
4. Add only required fields/tables/constraints.
5. Create the appropriate Prisma migration.
6. Verify the resulting database state.

Do not make speculative schema changes for future features.


## 15. Assessment Evidence

The final schema and implementation must make it possible to demonstrate:

- A user record containing a bcrypt hash rather than plaintext.
- Verification-code state stored in the database.
- Verification expiry stored in the database.
- The verification record/state remaining inspectable after expiry as required by the assessment.

Evidence must represent the real implementation.


## 16. Scope

Do not create database structures for:

- Study plans
- Study materials
- AI processing
- Notes
- Summaries
- Flashcards
- Profiles
- Subscriptions
- Full dashboard features

The database schema is for Assessment 1 authentication only.