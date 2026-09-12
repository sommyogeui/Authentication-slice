---
trigger: always_on
---

# Git Conventions

## Purpose

These rules govern Git usage for the StudyFlow Assessment 1 authentication slice.

The purpose is to preserve a reviewable development history and prevent accidental exposure of secrets.


## 1. Never Commit Secrets

Never commit:

- `.env`
- Real API keys
- Database passwords
- Session secrets
- Email-provider credentials
- Authentication secrets
- Reset secrets
- Verification secrets

Use `.env.example` with safe placeholder values where required.


## 2. Protect Environment Variables

Server-only secrets must remain server-side.

Do not expose sensitive environment variables through:

- Client components
- Public configuration
- API responses
- Committed files

Never prefix a secret with a public/client-exposed environment variable convention merely for convenience.


## 3. Check Before Committing

Before committing authentication work:

- Check staged files.
- Confirm `.env` and secret files are excluded.
- Confirm no passwords or tokens appear in source files.
- Confirm no debugging output exposes sensitive authentication data.

Do not assume `.gitignore` alone guarantees that a secret cannot be committed.


## 4. Focused Commits

Prefer commits that represent a meaningful authentication change.

Examples:

- Database schema
- Validation
- Signup
- Email verification
- Sign in
- Session management
- Password reset
- Protected dashboard
- Testing fixes

Do not mix unrelated StudyFlow features into authentication commits.


## 5. Preserve Development History

Do not use Git to hide implementation problems.

The assessment requires real documentation of problems encountered, investigation, causes, and fixes.

Keep development history consistent with genuine work.


## 6. Avoid Destructive Git Operations

Do not:

- Force-push without explicit instruction.
- Delete important branches without confirmation.
- Rewrite history unnecessarily.
- Reset or discard another person's changes without understanding them.

Preserve existing work unless there is a clear reason to change it.


## 7. Commit Messages

Commit messages should describe the actual change clearly.

Avoid vague messages such as:

- `update`
- `changes`
- `fix`
- `done`
- `stuff`

Do not impose an unnecessarily complicated commit-message format unless the project explicitly adopts one.


## 8. Scope

Git history should represent development of the authentication slice.

Do not commit unrelated future StudyFlow features merely because they may be useful later.