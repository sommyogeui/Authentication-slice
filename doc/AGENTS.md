# AGENTS.md

## Project Instructions for AI Coding Agents

This file defines how AI coding agents must behave while working on the StudyFlow Assessment 1 project.

---

# 1. Source of Truth

Before making product or implementation decisions:

- Read `PRD.md`.
- Treat the PRD as the source of truth for product requirements and scope.
- Do not contradict, replace, or silently change requirements defined in the PRD.
- If a requirement is unclear, inspect the existing project context before making assumptions.
- Do not invent product requirements that are not supported by the PRD.

The PRD defines **what is being built and why**.

This file defines **how the AI agent must behave while building it**.

If the PRD and existing project context do not provide enough information to make a significant product, security, or architectural decision:

- Do not invent a requirement.
- Do not silently choose an interpretation that changes the intended behaviour.
- Ask for clarification or explicitly identify the unresolved decision before proceeding.

---

# 2. Project Scope

StudyFlow Assessment 1 is a focused **authentication slice**.

It is not the complete StudyFlow application.

Keep all work strictly within the authentication scope defined in the PRD.

Do not introduce unrelated features or expand the product scope.

Do not build features such as:

- Study planning
- Study schedules
- Study material uploads
- AI study assistance
- Note processing
- Summaries
- Flashcards
- Marketing pages
- Profile management
- Settings
- Social authentication
- Two-factor authentication
- Any other StudyFlow product functionality outside the assessment

The dashboard is a minimal protected destination used to demonstrate successful authentication.

Do not turn the placeholder dashboard into a full StudyFlow dashboard.

Explicit user instructions may modify project scope only when they clearly and intentionally change the project requirements.

Do not interpret casual suggestions, examples, or ambiguous requests as permission to expand the Assessment 1 scope.

---

# 3. Planning Before Implementation

Before creating or modifying code:

1. Read the relevant requirements in the PRD.
2. Inspect the existing project structure.
3. Identify existing patterns and conventions.
4. Check whether the required functionality already exists.
5. Reuse existing structures where appropriate.
6. Avoid creating duplicate files, components, utilities, or configurations.

Do not immediately generate large amounts of code without understanding the current project structure.

Do not replace existing architecture without a clear reason.

For significant changes, determine the smallest implementation that satisfies the requirement before writing code.

---

# 4. Scope Discipline

Keep the implementation minimal and focused.

The goal is to build a complete authentication slice, not a larger application.

Do not add features simply because they may be useful in the future.

Do not add unnecessary dependencies, services, abstractions, or infrastructure.

Every significant implementation decision must support at least one of the following:

- A requirement in the PRD
- Authentication security
- Required accessibility
- Required testing or verification
- Necessary project infrastructure

Avoid speculative development.

Do not build infrastructure for future StudyFlow features that are outside the current authentication slice.

---

# 5. Authentication Security

Authentication functionality must be treated as security-sensitive.

Do not take shortcuts that weaken:

- Password security
- User authentication
- Session management
- Email verification
- Password reset security
- Rate limiting
- Protected routes
- Server-side validation

Passwords must never be stored or exposed as plain text.

Sensitive authentication operations must be implemented according to the requirements defined in the PRD.

Do not rely on client-side logic to enforce security-critical rules.

The server must remain authoritative for security decisions.

Do not expose sensitive authentication details through:

- Client responses
- Error messages
- Logs
- Debugging output
- UI state

unless explicitly required by the PRD.

---

# 6. Validation

Validate all authentication input on the server.

Client-side validation may be used to improve the user experience, but it must not be treated as the final authority.

Follow these principles:

- Server-side validation is required.
- Validation logic should be consistent across the application.
- Avoid scattering validation rules throughout unrelated files.
- Use clear validation structures that can be maintained and reused.
- Display useful validation feedback to users.
- Never assume browser validation is sufficient protection.

When client-side and server-side validation are both implemented, the server-side validation must remain authoritative.

The implementation must be testable independently of browser validation.

---

# 7. Database Integrity

Protect important data constraints at the database level where required.

Do not rely solely on application-level checks for data integrity.

The implementation must respect the database requirements defined in the PRD, including the uniqueness and security requirements associated with authentication data.

Account creation must safely handle repeated or duplicate submissions without creating multiple accounts for the same request or violating the unique email constraint.

Avoid creating duplicate or conflicting records during repeated submissions.

Where a requirement depends on database state, enforce that requirement using the database rather than relying only on interface behaviour.

---

# 8. Sessions and Protected Access

Authentication state must be handled securely and consistently.

Protected pages must not depend only on hidden navigation links or client-side UI checks.

Access control must be enforced properly.

When working on authentication or protected routes:

- Verify whether the user has a valid authenticated session.
- Prevent unauthenticated access to protected areas.
- Handle sign-out correctly.
- Ensure authentication state is updated appropriately.
- Ensure session behaviour is enforced on the server where required.

Do not assume a user is authenticated simply because the client interface says they are.

---

# 9. Email Verification and Password Reset

Verification and password-reset functionality must be treated as security-sensitive.

Do not implement verification or reset flows as purely visual interactions.

Security rules relating to:

- Expiry
- Validity
- Reuse
- Single-use behaviour
- Server-side enforcement

must be respected.

Do not allow client-side timers or interface state to become the authority for whether a verification code or password-reset token is valid.

Security-sensitive expiry and validity decisions must be enforced server-side.

---

# 10. Rate Limiting

Authentication endpoints that require rate limiting must not be left unprotected.

Do not remove, bypass, or weaken rate-limiting behaviour merely to make testing easier.

Rate limiting must be implemented and verified according to the requirements in the PRD.

Do not implement rate limiting only as a client-side countdown or disabled button.

Server-side enforcement is required.

---

# 11. Design System

The application must follow the established StudyFlow design system.

`design-tokens.json` is the visual source of truth.

When implementing the interface:

- Use the defined design tokens.
- Follow the purple Material Design 3-based design direction.
- Use Roboto as the primary typeface.
- Use semantic colour roles defined in the token system.
- Use the established typography roles.
- Use the defined spacing values.
- Use the defined shape and border-radius values.
- Use the established elevation values.
- Use defined interaction and focus states.

Do not introduce arbitrary:

- Colours
- Font sizes
- Font families
- Spacing values
- Shadows
- Border-radius values

outside the established design system unless there is a clear and justified requirement.

Do not hard-code visual values when an appropriate design token already exists.

If a required visual value does not exist in `design-tokens.json`:

1. Check whether an existing token can be reused.
2. Do not introduce an arbitrary hard-coded value.
3. If a new token is genuinely required, add it consistently to the design system before using it throughout the application.

Do not create one-off visual values that bypass the design system.

---

# 12. Accessibility

Accessibility is a required part of the implementation.

When creating or modifying forms and interactive components:

- Ensure inputs have visible labels.
- Ensure labels are programmatically associated with their inputs.
- Provide visible keyboard focus states.
- Do not communicate errors using colour alone.
- Ensure interactive elements can be understood and used appropriately.

Accessibility requirements must not be removed for visual convenience.

---

# 13. Separation of Responsibilities

Keep responsibilities reasonably separated throughout the codebase.

Avoid unnecessarily mixing:

- UI rendering
- Validation logic
- Authentication logic
- Database operations
- Session management
- Business logic

Do not create unnecessary complexity or excessive abstraction.

Use clear separation where it improves maintainability and understanding.

Prefer the simplest structure that satisfies the requirements.

Do not create abstractions merely for the sake of abstraction.

---

# 14. Existing Code and Project Conventions

Before creating new files or structures:

- Inspect the existing codebase.
- Look for existing patterns.
- Reuse existing conventions where appropriate.
- Avoid duplicate implementations.
- Avoid creating competing architectural patterns.

Do not rewrite working code unnecessarily.

Make focused changes rather than broad unrelated modifications.

If an existing implementation conflicts with the PRD or a required security behaviour, identify the conflict and correct it rather than preserving the existing implementation merely because it already exists.

---

# 15. Technology and Architecture Decisions

Do not silently introduce major architectural decisions that are not supported by the project requirements.

Do not add new technologies, services, or dependencies unnecessarily.

A dependency may be added when it is genuinely required to:

- Satisfy a PRD requirement
- Satisfy a security requirement
- Support the established project architecture
- Provide necessary project functionality that cannot reasonably be implemented with existing capabilities

Before adding a dependency:

- Check whether the project already provides a suitable solution.
- Check whether a native platform capability is sufficient.
- Check whether an existing dependency can be reused.
- Avoid adding overlapping libraries that solve the same problem.
- Keep the dependency justified and minimal.

Do not silently replace the established technology stack.

If a major architectural or technology decision is not supported by the PRD or existing project context, do not make the decision silently.

---

# 16. Verification and Testing

Do not assume functionality works because code has been written successfully.

Verify important behaviour.

When implementing authentication functionality:

- Test expected successful behaviour.
- Test invalid input.
- Test unauthorised access.
- Test security-related restrictions.
- Test relevant failure states.
- Test repeated or duplicate submissions where relevant.
- Test server-side behaviour independently of client-side validation where required.

Verification must include both functional testing and the specific assessment evidence required by the PRD.

Do not treat a successful UI interaction as sufficient proof of server-side behaviour.

Fix implementation problems rather than hiding them with UI changes.

---

# 17. Assessment Evidence

The project requires evidence demonstrating that important requirements actually work.

Preserve and support the ability to demonstrate required evidence relating to:

- Password hashing
- Server-side validation
- Rate limiting
- Verification-code expiry

Required evidence must reflect the actual implementation.

Do not create fake, simulated, or misleading evidence.

Do not implement functionality in a way that makes required assessment verification impossible.

The implementation must be demonstrable, not merely claimed to be correct.

---

# 18. Working Style

When performing work:

1. Understand the relevant requirement.
2. Inspect the existing implementation.
3. Identify applicable project instructions and rules.
4. Plan the smallest appropriate change.
5. Implement the change.
6. Verify the result.
7. Check that no unrelated functionality was affected.

Avoid making large, unrelated changes in a single task.

Keep changes focused and traceable to the project requirements.

If an implementation decision has significant security, architectural, or scope implications, make the reasoning explicit rather than silently changing direction.

---

# 19. Instruction Hierarchy

Follow project instructions in this order:

1. Explicit user instructions
2. The PRD for product requirements and scope
3. Relevant detailed project rules for the task being performed
4. This `AGENTS.md` for project-wide behaviour
5. Existing project conventions

More specific instructions may refine general instructions but must not contradict higher-priority requirements.

If instructions conflict:

- Do not silently choose an interpretation that changes product requirements.
- Do not weaken security requirements.
- Do not expand the project scope without explicit authorization.
- Identify the conflict and request clarification when necessary.

When detailed rule files exist in the `rules/` directory, identify and read the rule files relevant to the current task before implementation.

---

# 20. Assessment Boundaries

Do not create:

- Skills for this assessment
- Unrelated AI agents
- Unnecessary automation
- Features outside the authentication slice
- A full StudyFlow product
- A full-featured dashboard

Do not begin speculative work outside the defined assessment requirements.

Do not create infrastructure for future features unless it is necessary for the current authentication slice.

---

# 21. Completion Standard

Before considering a task complete, confirm that:

- The change supports the PRD.
- The authentication slice scope has been preserved.
- Security requirements have not been weakened.
- Server-side authority has been maintained where required.
- The design system has been followed.
- Accessibility requirements have been considered.
- No unnecessary features were introduced.
- Relevant functionality has been verified.
- Required assessment evidence remains obtainable.

The objective is not simply to produce code.

The objective is to produce a focused, secure, verifiable authentication implementation that satisfies Assessment 1 without expanding StudyFlow beyond its required scope.