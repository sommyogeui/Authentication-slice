---
trigger: always_on
---

# Validation Rules

## Purpose

These rules govern input validation for the StudyFlow Assessment 1 authentication slice.

The project uses Zod for authentication validation.


## 1. Zod Is the Validation Technology

Use Zod for authentication input schemas.

Do not introduce another validation library for the authentication slice.

Validation schemas must be reusable and clearly associated with the authentication operation they validate.


## 2. Server-Side Validation Is Mandatory

Every authentication input must be validated on the server using Zod.

Never rely on:

- HTML validation
- Browser input types
- Client-side JavaScript
- Disabled buttons
- Client-side state

as the final validation mechanism.

The server must independently validate every request.


## 3. Client Validation Mirrors Server Validation

Client-side validation should mirror the server validation rules where practical.

Client validation exists to provide:

- Immediate feedback
- Better user experience
- Earlier detection of invalid input

It does not replace server-side validation.

The server remains authoritative.


## 4. Authentication Inputs

Validation must cover inputs used by:

- Account creation
- Sign in
- Email verification
- Verification resend
- Forgot-password request
- Password reset

Validation requirements must come from the PRD and established authentication requirements.

Do not invent unrelated product requirements.


## 5. Shared Schemas

Where practical, use shared Zod schemas between client and server to reduce validation drift.

Do not duplicate the same validation requirements manually across multiple files.

If the Next.js architecture requires separate client/server adapters, keep their validation requirements consistent.


## 6. Server Rejection Must Work Without the UI

Authentication endpoints must remain secure when browser validation is bypassed.

A direct request using a tool such as `curl` must still pass through server-side Zod validation.

If invalid data reaches the server, it must be rejected according to the schema.


## 7. Validation Errors

Validation errors should:

- Identify the invalid input where appropriate.
- Be understandable to the user.
- Follow the project's established error-response structure.
- Avoid exposing internal implementation details.

Never expose:

- Stack traces
- Database internals
- Secrets
- Password hashes
- Sensitive authentication state

through validation errors.


## 8. Security-Critical Validation

Validation alone must not be confused with authorization or authentication.

Zod validates input structure and values.

Server-side authentication logic must separately determine:

- Session validity
- Verification-code validity
- Token validity
- Expiry
- Rate limits
- Authorization to access protected resources

Do not attempt to make Zod responsible for security decisions that depend on database or session state.



## 9. Validation Consistency

The same logical input should have consistent validation requirements across relevant authentication endpoints.

Avoid situations where:

- Signup accepts an input that reset-password rejects without reason.
- Client validation accepts an input that server validation rejects unexpectedly.
- Different routes implement contradictory password rules.

The PRD remains the source of truth for product validation requirements.


## 10. Scope

Create validation schemas only for the authentication slice.

Do not create schemas for future StudyFlow functionality.