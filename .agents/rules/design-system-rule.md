---
trigger: glob
---

# Design System Rules

## Purpose

These rules govern the interface of the StudyFlow Assessment 1 authentication slice.

The source of truth for visual tokens is:

`design-tokens.json`

The interface must follow the established StudyFlow custom purple Material Design 3-based visual direction and Roboto typography.


## 1. Scope

These rules apply only to:

- Create Account
- Sign In
- Forgot Password
- Reset Password
- Email Verification
- Minimal Protected Dashboard

Do not design interfaces for unrelated StudyFlow features.


## 2. Design Tokens Are the Source of Truth

Use `design-tokens.json` for established:

- Colours
- Typography
- Spacing
- Shape
- Border radius
- Elevation
- Interaction states
- Focus states

Do not create a competing token system.


## 3. Colour

Use the established purple semantic colour system.

Prefer semantic tokens instead of raw colour values.

Do not introduce arbitrary colours when an appropriate design token exists.

If a genuinely required visual role is missing:

1. Check whether an existing token can be reused.
2. If not, add a consistent token.
3. Use the new token consistently.

Do not create one-off colour values throughout the interface.


## 4. Typography

Roboto is the primary typeface.

Use the typography roles defined in the design-token system.

Do not introduce arbitrary font sizes when an appropriate typography token exists.

Do not introduce another primary typeface without explicit justification.


## 5. Spacing

Use the established spacing tokens.

Do not create arbitrary spacing values when an appropriate token exists.

Authentication screens should use consistent spacing relationships.


## 6. Shape and Elevation

Use the established shape and elevation tokens.

Do not introduce arbitrary:

- Border-radius values
- Shadows
- Elevation values

when an existing token is appropriate.

If a new token is genuinely required, add it to the design system rather than bypassing the system with a one-off value.


## 7. Component Consistency

Equivalent components must behave consistently across authentication screens.

Examples include:

- Text inputs
- Password inputs
- Buttons
- Error messages
- Focus states
- Loading states

Do not create multiple visual implementations of the same component without a real requirement.


## 8. Form Accessibility

Every authentication input group must include:

- A visible label.
- A programmatic relationship between the label and input.
- A visible keyboard focus state.

Do not rely on placeholder text as the only label.

Do not remove focus indicators for visual simplicity.

Do not communicate important errors through colour alone.


## 9. Authentication States

Authentication interfaces must account for relevant states such as:

- Default
- Focus
- Error
- Disabled
- Loading/submitting
- Success where applicable

The interface must accurately represent the actual application state.

Do not create a visual state that claims an operation is permitted when the server would reject it.


## 10. Responsive Behaviour

Authentication screens must remain usable across supported viewport sizes.

Do not create fixed layouts that make:

- Inputs inaccessible
- Buttons inaccessible
- Error messages unreadable
- Required actions difficult to use

on smaller screens.


## 11. Dashboard

The dashboard is a placeholder protected destination.

It should contain only the information required to demonstrate:

- Successful authentication
- The signed-in user's name
- Sign out

Do not turn it into a full StudyFlow dashboard.


## 12. No Visual Scope Creep

Do not add:

- Marketing sections
- Landing-page sections
- Study widgets
- Analytics
- Profile cards
- Settings panels
- Future-feature navigation
- Unrelated product sections

The interface exists to support the authentication slice.


## 13. Token Discipline

Before hard-coding a visual value:

1. Check `design-tokens.json`.
2. Check whether an existing semantic token can be reused.
3. Only add a new token when genuinely required.

Do not bypass the design system because hard-coding is faster.


## 14. Scope

These design rules apply only to Assessment 1.

Do not create visual patterns for future StudyFlow features outside the authentication slice.