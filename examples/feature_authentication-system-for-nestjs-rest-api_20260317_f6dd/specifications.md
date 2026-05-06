# Specifications

The authentication system must be secure, stateless, and extensible. It will use JWT access tokens (short-lived) combined with opaque refresh tokens (long-lived, stored in the database) to balance security and usability. Passwords are hashed with bcrypt. All sensitive routes are protected by guards. RBAC uses NestJS custom decorators and a metadata-driven guard.

## Functional Requirements

- POST /auth/register — create a new user account with email + password; send email verification link
- POST /auth/login — authenticate with credentials; return signed JWT access token + refresh token cookie
- POST /auth/refresh — issue a new access token using a valid refresh token (rotation: old token invalidated)
- POST /auth/logout — revoke the current refresh token from the database
- POST /auth/forgot-password — send a one-time password-reset link to the registered email
- POST /auth/reset-password — validate reset token and update the user's hashed password
- GET /auth/me — return the authenticated user's profile (requires valid JWT)
- Role-based guards protecting admin-only routes via @Roles() decorator and RolesGuard
- Email verification gate: unverified users receive 403 on protected endpoints

## Non-Functional Requirements

- JWT access token TTL: 15 minutes; refresh token TTL: 7 days
- Passwords hashed with bcrypt, cost factor ≥ 12
- Refresh tokens stored as SHA-256 hashes in the database (never plain-text)
- Rate limiting on /auth/* endpoints: max 10 requests/minute per IP (using @nestjs/throttler)
- All auth endpoints must respond in < 300 ms (p99) under normal load
- HTTPS-only; refresh token delivered via HttpOnly, Secure, SameSite=Strict cookie
- Secrets (JWT_SECRET, JWT_REFRESH_SECRET) loaded from environment variables — never hard-coded
- Unit test coverage ≥ 80 % for AuthService and AuthController
- OpenAPI / Swagger documentation generated for all auth endpoints

## Acceptance Criteria

- A newly registered user can log in and receive a valid JWT access token
- An expired access token is rejected with 401; a valid refresh token issues a new access token
- Using a refresh token twice (replay attack) invalidates the entire token family and logs the user out
- A user with role USER is denied access to admin-only routes with 403
- Password reset link expires after 1 hour and is single-use
- All /auth/* routes appear in the Swagger UI with correct request/response schemas
- Running `npm test` passes all auth-related unit and e2e tests with ≥ 80 % coverage

## Out of Scope

- OAuth2 / social login providers (Google, GitHub, etc.) — planned for a future iteration
- Multi-factor authentication (TOTP / SMS) — separate feature card
- Session-based (stateful) authentication — project is strictly JWT/stateless
- Frontend implementation — API contract only
- Account deletion or GDPR data-erasure flows