    # PRD — StudyFlow: Assessment 1 Authentication Slice

## 1. Product Overview

### Product Name
StudyFlow

### Purpose
StudyFlow is a study-support application. For Assessment 1, this project focuses only on building the authentication slice of StudyFlow.

The slice allows users to create an account, verify their email, sign in, reset a forgotten password, access a protected placeholder dashboard, and sign out.

This assessment does not require the full StudyFlow product or its study features to be built. The dashboard exists only to confirm that authentication and session protection work correctly.

---

## 2. Problem Statement

StudyFlow will eventually support students in their learning workflow. Before users can securely access their personal study information, the application needs a reliable authentication system.

The authentication system must support the complete account lifecycle:
- Account creation
- Email verification
- Sign in
- Forgotten password requests
- Password reset
- Session management
- Protected access
- Sign out

The system must also protect against common implementation failures such as storing plain-text passwords, relying only on client-side validation, allowing unlimited authentication attempts, accepting expired verification codes, and allowing unauthorised access to protected routes.

---

## 3. Goals

The goal of this assessment is to build a secure and complete authentication flow where:
- A new user can create an account.
- The user can verify their email.
- A verified user can reach the dashboard.
- A returning user can sign in.
- A user can request a password reset.
- Password reset tokens are time-limited and single-use.
- Unauthenticated users cannot access the dashboard.
- Users can sign out properly.

---

## 4. Non-Goals

The following are deliberately outside the scope of Assessment 1:
- Study planning features
- Study material uploads
- AI processing
- Notes or summaries
- Landing pages
- Marketing pages
- Full dashboard features
- Profile editing
- Settings
- Social sign-in
- Two-factor authentication

The dashboard should contain only:
- A confirmation that the user is signed in
- The user's name
- A sign-out button

---

## 5. Users

### New User
A person creating a StudyFlow account for the first time.

They should be able to:
1. Create an account.
2. Receive an email verification code.
3. Enter the verification code.
4. Resend a code when permitted.
5. Access the dashboard after successful authentication.

### Returning User
A person who already has a StudyFlow account.

They should be able to:
1. Sign in with valid credentials.
2. Access the protected dashboard.
3. Sign out.

### User Who Forgot Their Password
They should be able to:
1. Request a password reset.
2. Receive a reset link or token.
3. Create a new password.
4. Sign in using the new password.

---

## 6. Screens

The authentication slice must include:
1. Create Account
2. Sign In
3. Forgot Password
4. Reset Password
5. Email Verification
6. Placeholder Dashboard

---

## 7. Functional Requirements

### FR-01: Account Creation
The system must allow a new user to create an account.

The signup process must be idempotent so that a double submission does not create multiple accounts.

The email must be unique at the database level.

### FR-02: Password Security
Passwords must never be stored as plain text.

Passwords must be hashed using an adaptive password-hashing algorithm.

### FR-03: Validation
Every user input must be validated on the server.

Validation rules must be declared as schemas rather than scattered throughout handlers.

Client-side validation should mirror the validation rules to provide immediate feedback, but the server remains the final authority.

### FR-04: Rate Limiting
Rate limiting must be implemented on:
- Sign in
- Sign up
- Password reset requests
- Verification-code resend

### FR-05: Email Verification
The system must:
- Generate verification codes.
- Store verification-code expiry in the database.
- Reject expired codes.
- Allow users to resend verification codes.
- Enforce a resend cooldown on the server.

### FR-06: Sign In
A returning user must be able to sign in using valid credentials.

Successful authentication must create a properly configured session.

### FR-07: Session Management
Authenticated users must have an active session.

The session cookie must be configured correctly.

Signing out must properly end the session.

### FR-08: Password Reset
A user must be able to request a password reset.

Password-reset tokens must:
- Be time-limited.
- Be single-use.
- Become invalid after successful use.

After resetting the password, the user must be able to sign in using the new password.

### FR-09: Protected Dashboard
The dashboard must be inaccessible without a valid session.

If a signed-out user directly enters the dashboard URL, they must be redirected to the sign-in page.

### FR-10: Sign Out
Users must be able to sign out.

Signing out must properly terminate the authenticated session.

---

## 8. Security and Engineering Requirements

The implementation must include:
- Adaptive password hashing
- Schema-based server-side validation
- Mirrored client-side validation for user feedback
- Rate limiting on required authentication endpoints
- Correct session management
- Database-based verification-code expiry
- Server-enforced resend cooldown
- Single-use, time-limited password reset tokens
- Database-level unique email constraint
- Idempotent signup
- Protected route handling

---

## 9. Accessibility Requirements

All input groups must include:
- A visible label
- A programmatic association between the label and its input
- Visible keyboard focus states

---

## 10. Design Requirements

The interface will use a custom purple design system structured around Material Design 3 principles.

The design system defines:
- Semantic colour roles
- Typography roles
- Spacing
- Shape and border radius
- Elevation
- Component states
- Focus states
- Accessibility requirements

The design token source of truth is:

`design-tokens.json`

The implementation must not introduce arbitrary colours, typography values, spacing, shadows, or border-radius values outside the established token system unless justified by a requirement.

Roboto is the primary typeface.

---

## 11. User Flows

### Flow 1: New User Registration

Create Account
→ Submit Registration Details
→ Server Validates Input
→ Account Created
→ Verification Code Generated
→ User Enters Verification Code
→ Email Verified
→ Authenticated Session
→ Dashboard

### Flow 2: Returning User

Sign In
→ Submit Credentials
→ Server Validates Credentials
→ Session Created
→ Dashboard

### Flow 3: Forgot Password

Forgot Password
→ Submit Email Address
→ Server Processes Request
→ Password Reset Token Generated
→ User Opens Reset Link
→ Reset Password
→ New Password Saved Securely
→ User Can Sign In

### Flow 4: Protected Route

User Attempts Dashboard Access
→ Valid Session?
→ Yes: Dashboard
→ No: Sign In

---

## 12. Success Criteria

The authentication slice is complete when:
- All required authentication screens work.
- A user can successfully complete the registration flow.
- Email verification works.
- Sign in works.
- Password reset works.
- Protected routes reject unauthenticated users.
- Sign out properly ends the session.
- All required engineering requirements are implemented.

---

## 13. Required Evidence

The final documentation must include:
1. A users-table screenshot showing that passwords are stored as hashes rather than plain text.
2. A curl request sent directly to the signup endpoint, bypassing browser validation, and the server's response.
3. Evidence that rate limiting triggers and returns the appropriate status.
4. A verification-code database record and evidence showing the record after expiry.

---

## 14. Constraints

This is a single authentication slice of StudyFlow, not the full StudyFlow application.

No features outside the Assessment 1 brief should be added.

The project should remain focused on demonstrating that the authentication flow is correctly designed and engineered.

---

## 15. Context Engineering Direction

This PRD is the source of truth for what must be built.

The next layers should be derived from it:

PRD
→ Design Tokens
→ Project Rules
→ AGENTS.md
→ Skills, only where genuinely needed
→ Scaffolding and Implementation

Potential rule areas for this authentication slice:
- design-system.md
- authentication-security.md
- validation.md
- database.md
- coding-standards.md

Each rule should exist because it represents a recurring constraint or decision required by the project, not simply because another application has a similarly named rule file.

    
