# DOCUMENTATION.md — StudyFlow Assessment 1: Authentication Slice

This document provides a comprehensive technical overview of the StudyFlow Assessment 1 authentication slice, covering its architecture, setup, data models, security concepts, and implementation findings.

---

## 1. What This Is

The StudyFlow Authentication Slice is a focused, production-grade authentication subsystem built for StudyFlow Assessment 1. It is deliberately constrained to the account lifecycle and access control boundaries:

- **Account Creation**: Full name, email address, and strong password registration with database-enforced email uniqueness.
- **Email Verification**: Server-generated cryptographically random verification codes sent via Nodemailer (SMTP), with server-authoritative expiration (15 minutes) and server-enforced resend cooldown (60 seconds).
- **Credentials Sign-In**: Authentication verified using bcrypt against salted hashes, requiring email verification prior to granting access.
- **Custom Server-Side Session Management**: Secure, opaque session identifiers stored in PostgreSQL and delivered to the browser exclusively through an `HttpOnly`, `SameSite=Lax`, `Secure` cookie.
- **Protected Dashboard**: A minimal server-rendered destination verifying session validity and email verification status on the server before rendering, redirecting unauthenticated requests.
- **Sign Out**: Immediate session destruction in PostgreSQL and cookie revocation.
- **Password Reset Flow**: Requesting a reset link, generating single-use cryptographically random tokens, expiring after 60 minutes, and atomic password updating with revocation of all prior sessions.
- **Server-Side Rate Limiting**: PostgreSQL-backed rate limiting across all sensitive authentication endpoints.

This slice is **not** the full StudyFlow application; study features, note management, AI processing, and profile editing are strictly out of scope.

---

## 2. How To Run It

### Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended).
- **PostgreSQL**: An accessible PostgreSQL database instance (local or hosted, e.g. Neon, Supabase, or Docker).

### Step 1: Environment Setup
Copy `.env.example` to `.env.local` (or `.env`):
```bash
cp .env.example .env.local
```
Configure the required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:password@localhost:5432/studyflow_auth`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`: Nodemailer SMTP configuration for sending emails. (In development, if left with blank/default values, verification codes and reset links will log directly to the server console).
- `EMAIL_FROM`: Sender address (e.g. `StudyFlow <no-reply@studyflow.dev>` or your verified domain).
- `NEXT_PUBLIC_APP_URL`: Base application URL (default: `http://localhost:3000`).

### Step 2: Database Migration
Generate the Prisma client and push the schema to your PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The root path will automatically redirect to `/signin`.

### Step 4: Production Build & Run
To verify and run production builds:
```bash
npm run build
npm start
```

---

## 3. The Flow, Step By Step

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant App as Next.js (App Router)
    participant DB as PostgreSQL (Prisma)
    participant SMTP as SMTP (Nodemailer)

    %% Registration Flow
    Note over User,SMTP: Flow 1: Registration & Verification
    User->>App: POST /api/auth/signup (name, email, password)
    App->>App: Validate with Zod & hash with bcrypt (12 rounds)
    App->>DB: Insert User & EmailVerification (64-char code)
    App->>SMTP: Deliver verification code to email
    App-->>User: 201 Created -> Redirect to /verify-email
    User->>App: POST /api/auth/verify-email (email, code)
    App->>DB: Verify code & check expiresAt > now
    App->>DB: Update User.emailVerified = true
    App->>DB: Insert Session (opaque token)
    App-->>User: Set HttpOnly cookie & 200 OK -> Redirect /dashboard

    %% Returning User Flow
    Note over User,SMTP: Flow 2: Returning User Sign-In
    User->>App: POST /api/auth/signin (email, password)
    App->>DB: Query User by email
    App->>App: Compare password with bcrypt hash
    App->>DB: Check User.emailVerified == true
    App->>DB: Insert new Session
    App-->>User: Set HttpOnly cookie & 200 OK -> Redirect /dashboard

    %% Protected Dashboard Flow
    Note over User,SMTP: Flow 3: Protected Route Access
    User->>App: GET /dashboard (with session cookie)
    App->>DB: Lookup Session by ID & check expiresAt > now
    alt Session Valid
        App-->>User: Render Dashboard (User greeting, Sign-Out)
    else Session Invalid or Missing
        App-->>User: Redirect 307 to /signin
    end

    %% Sign Out Flow
    Note over User,SMTP: Flow 4: Sign Out
    User->>App: POST /api/auth/signout
    App->>DB: Delete Session record
    App-->>User: Clear cookie & Redirect /signin

    %% Password Reset Flow
    Note over User,SMTP: Flow 5: Password Reset
    User->>App: POST /api/auth/forgot-password (email)
    App->>DB: Insert PasswordResetToken (60m expiry, usedAt: null)
    App->>SMTP: Deliver reset link with secure token
    User->>App: POST /api/auth/reset-password (token, newPassword)
    App->>DB: Verify token exists, usedAt is null, expiresAt > now
    App->>App: Hash new password with bcrypt
    App->>DB: Invalidate old sessions, update passwordHash, set usedAt = now
    App-->>User: 200 OK -> Redirect /signin
```

---

## 4. The Data Model

The PostgreSQL schema is defined in `prisma/schema.prisma` with 5 focused models:

### 1. `User`
- `id String @id @default(cuid())`: Unique primary key.
- `email String @unique`: Enforces uniqueness at the PostgreSQL database level (preventing race conditions).
- `passwordHash String`: Stored bcrypt hash (12 rounds) — plaintext passwords are never stored.
- `name String`: The user's full name.
- `emailVerified Boolean @default(false)`: Tracks whether email verification is complete.
- `createdAt DateTime`, `updatedAt DateTime`: Audit timestamps.
- Relations: `emailVerifications`, `passwordResetTokens`, `sessions`.

### 2. `EmailVerification`
- `id String @id @default(cuid())`: Unique record identifier.
- `userId String`: Foreign key referencing `User.id` (`onDelete: Cascade`).
- `code String`: Cryptographically random 64-character verification code.
- `expiresAt DateTime`: Server-authoritative expiration timestamp (15 minutes from generation).
- `createdAt DateTime @default(now())`: Used by server to enforce the 60-second resend cooldown.

### 3. `PasswordResetToken`
- `id String @id @default(cuid())`: Unique record identifier.
- `userId String`: Foreign key referencing `User.id` (`onDelete: Cascade`).
- `token String @unique`: Cryptographically random 256-bit opaque string (64 hex characters).
- `expiresAt DateTime`: Expiration timestamp (60 minutes from generation).
- `usedAt DateTime?`: `null` when unconsumed; updated with timestamp upon successful password change to permanently prevent reuse.
- `createdAt DateTime @default(now())`: Creation timestamp.

### 4. `Session`
- `id String @id`: Cryptographically random 256-bit token matching the browser's HttpOnly cookie value.
- `userId String`: Foreign key referencing `User.id` (`onDelete: Cascade`).
- `expiresAt DateTime`: Absolute expiration timestamp (7 days).
- `createdAt DateTime @default(now())`: Creation timestamp.

### 5. `RateLimit`
- `key String @id`: Composite identifier representing the action and client IP (e.g. `signup:192.168.1.1`).
- `count Int @default(1)`: Number of attempts recorded within the active window.
- `expiresAt DateTime`: Timestamp when the active window expires and resets.
- `createdAt DateTime`, `updatedAt DateTime`: Maintenance timestamps.

---

## 5. The Concepts

### 1. Server-Authoritative Security
The client is completely untrusted. All security constraints are enforced strictly on the server:
- Zod schemas validate every parameter server-side before execution.
- Countdown timers on the frontend are purely informational user feedback; the server queries PostgreSQL `expiresAt` and `createdAt` before accepting any verification or resend request.
- The dashboard is an async Server Component that resolves the user directly from the database session before rendering any HTML.

### 2. Adaptive Password Hashing with bcrypt
- Passwords are salted and hashed using `bcrypt` with **12 salt rounds**.
- Hashing takes ~250ms per evaluation, providing substantial resistance against offline GPU brute-force dictionaries while maintaining snappy response times for legitimate users.
- Verification uses `bcrypt.compare` to prevent timing attacks.
- Plaintext passwords and password hashes are never logged, exposed in error responses, or returned to the browser.

### 3. Custom Server-Side Sessions with HttpOnly Cookies
- No third-party session frameworks (NextAuth, iron-session) or JWTs are used.
- The browser holds only an opaque random session identifier in a cookie configured with:
  - `httpOnly: true`: Completely immune to JavaScript extraction and XSS attacks.
  - `secure: true`: Enforced in production over HTTPS.
  - `sameSite: "lax"`: Mitigates Cross-Site Request Forgery (CSRF).
  - `path: "/"`: Bound to the entire domain.
- Session revocation is immediate: deleting the session row in PostgreSQL instantly terminates access across all tabs.

### 4. Single-Use, Time-Limited Tokens
- Password reset tokens can only be used once. Enforced via the `usedAt` database column updated inside an atomic Prisma transaction.
- When a user resets their password, all existing sessions for that user are purged from the `Session` table, logging out all active devices.

### 5. PostgreSQL-Backed Rate Limiting
- Rate-limiting state is tracked directly in PostgreSQL via Prisma, avoiding external infrastructure dependencies (such as Redis) while providing persistence across server restarts and multi-instance deployments.
- Bounded table size: windows expire and reset automatically.

---

## 6. What Went Wrong & Problem Resolution

During the development and setup of this authentication slice, several real-world technical hurdles were encountered and resolved:

1. **Prisma 8.0.0-rc.13 Release Candidate Incompatibility**:
   - *Problem*: Running `npm install prisma` initially pulled an unstable release candidate (Prisma 8.0.0-rc.13) which replaced standard ORM commands (`prisma migrate`, `prisma validate`) with a new platform CLI syntax.
   - *Resolution*: Pinned and installed the stable Prisma 5 engine (`prisma@5.22.0` and `@prisma/client@5.22.0`) with `--save-exact`. All schema validations and client generations succeeded cleanly.
2. **Windows PowerShell Execution Policy**:
   - *Problem*: Running `npx` or `npm` directly inside Windows PowerShell failed due to the machine's restricted script execution policy (`UnauthorizedAccess`).
   - *Resolution*: Wrapped all node/npm/npx tooling calls inside `cmd /c "..."`, allowing reliable execution without modifying system-wide execution policies.
3. **Directory Naming in `create-next-app`**:
   - *Problem*: Bootstrapping Next.js into a workspace named `Authentication slice` failed because npm package naming forbids capital letters and spaces.
   - *Resolution*: Initialized into a temporary valid package name `studyflow-auth` and migrated files cleanly to the project root.
4. **Next.js App Router Asynchronous Cookies**:
   - *Problem*: In Next.js 15+, `cookies()` from `next/headers` is asynchronous and returns a Promise. Synchronous calls trigger runtime warnings.
   - *Resolution*: Structured all session helper methods (`createSession`, `getCurrentUser`, `destroySession`) as `async` functions with `await cookies()`.

---

## 7. What This Slice Does Not Handle

Per the PRD Non-Goals, the following capabilities are intentionally outside the boundary of Assessment 1:

- Social Authentication (OAuth with Google, GitHub, Apple).
- Two-Factor Authentication (TOTP, SMS, Authenticator apps).
- User Profile Editing (updating display name, avatar, bio).
- Account Settings (email changes, account deletion).
- Study Planning, Schedules, or Calendar integration.
- Uploads or storage of study materials.
- AI Note Processing, Summarization, or Flashcard generation.
- Marketing or Landing Pages.
- Full Dashboard analytics, metrics, or widgets.

---

## 8. If I Built This Again

With the benefit of hindsight and practical implementation experience:

1. **Session Revocation vs DB Query Overhead**:
   - Storing sessions in PostgreSQL provides instantaneous, reliable revocation without needing a token blacklist. However, every protected route read incurs a database roundtrip. In high-traffic production environments, pairing this with a Redis read-through cache or short-lived signed JWTs with a revocation list would optimize database query volume.
2. **Rate Limiting at Edge vs Database**:
   - Storing rate limits in PostgreSQL satisfies the constraint to avoid adding Redis. However, high-volume brute-force attacks generate substantial write load in PostgreSQL (`upsert` / `update`). In larger scale systems, rate limiting is best positioned at the reverse proxy or edge (e.g. Cloudflare Workers or NGINX) before requests ever reach the database.
3. **Unified Form State Machine**:
   - While React state works well for this slice, adopting a lightweight form machine (such as React Hook Form paired with Zod resolvers) would further minimize boilerplate across the 5 authentication views.
