---
trigger: always_on
---

# Coding Standards

## Purpose

These standards apply to the StudyFlow Assessment 1 authentication slice.

They exist to keep the implementation secure, understandable, maintainable, and easy to defend.

This is not a generic programming-style guide.

---

## 1. Technology Stack

The authentication slice uses:

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- bcrypt
- Zod

Use the established stack consistently.

Do not introduce competing technologies without explicit authorization.

---

## 2. TypeScript

Use TypeScript throughout the implementation.

Avoid `any` unless there is a clearly justified technical reason.

Prefer:

- Explicit types for important authentication data.
- Narrow types.
- Type-safe function parameters and return values.
- Existing project types where appropriate.

Do not weaken type safety simply to make an implementation compile faster.

---

## 3. Next.js Architecture

Follow the established Next.js project structure and conventions.

Before creating new routes, components, utilities, or server logic:

1. Inspect the existing structure.
2. Identify the appropriate location.
3. Reuse existing conventions.
4. Avoid duplicate implementations.

Do not create a second architectural pattern for the authentication flow.

---

## 4. Prisma

Use Prisma for PostgreSQL database access.

Do not introduce another ORM or direct database-access pattern when Prisma already provides the required functionality.

Database operations should remain separated from presentation logic.

---

## 5. Separation of Responsibilities

Keep responsibilities reasonably separated.

Avoid unnecessarily mixing:

- UI rendering
- Zod validation
- Authentication logic
- Prisma database operations
- Password hashing
- Session management
- Email verification
- Password reset logic

Do not create excessive abstractions.

The goal is clear separation, not maximum abstraction.

---

## 6. Authentication Logic Must Be Traceable

Authentication code should be easy to follow.

A reviewer should be able to trace:

UI
→ request
→ Zod validation
→ authentication logic
→ Prisma/database operation
→ session or authentication result
→ response

Avoid unnecessary indirection that makes this flow difficult to understand.

---

## 7. Reuse Security Logic

Do not implement the same authentication behaviour independently in multiple places when a shared implementation is appropriate.

Examples include:

- Password hashing
- Password verification
- Session retrieval
- Authentication checks
- Zod schemas
- Token/code validation

Avoid competing implementations of the same security operation.

---

## 8. Error Handling

Authentication failures must be handled deliberately.

Do not:

- Expose stack traces.
- Leak database errors.
- Expose password hashes.
- Reveal secrets.
- Silently swallow important failures.
- Leave requests in undefined states.

Errors should provide useful feedback without exposing internal security details.

---

## 9. Secrets and Environment Variables

Never hard-code secrets.

Use environment variables for sensitive configuration.

Never commit real secrets to Git.

Do not expose server-only environment variables to client-side code.

---

## 10. Dependencies

Before adding a dependency:

1. Check whether the current stack already provides the required capability.
2. Check whether an existing dependency can be reused.
3. Confirm that the dependency supports an actual Assessment 1 requirement.
4. Avoid overlapping libraries.

Do not add dependencies merely because they are popular or convenient.

---

## 11. Comments

Comments should explain important reasoning rather than restating obvious code.

Useful comments may explain:

- Security decisions.
- Non-obvious authentication behaviour.
- Important architectural constraints.
- Why an unusual implementation is necessary.

Do not fill the codebase with comments that simply describe each line.

---

## 12. Minimal Changes

Prefer small, focused changes.

Do not perform unrelated refactoring while implementing authentication.

Do not rewrite working code merely because another style is preferred.

---

## 13. Scope

Do not create code for:

- Study planning
- Study materials
- AI processing
- Notes
- Summaries
- Flashcards
- Profile management
- Settings
- Full dashboard functionality

unless explicitly required to support the authentication slice.