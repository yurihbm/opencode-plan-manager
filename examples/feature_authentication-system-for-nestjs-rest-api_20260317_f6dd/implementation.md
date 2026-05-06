# Implementation Plan

Phased implementation starting from project scaffolding and database schema, moving through core auth logic, security hardening, and finishing with tests and documentation. Each phase produces a shippable, independently reviewable increment.

## Phase 1 — Foundation & Database Schema

- [ ] Install dependencies: @nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt, @nestjs/throttler, class-validator, class-transformer
- [ ] Create User entity (TypeORM/Prisma): id, email, passwordHash, role, isVerified, createdAt, updatedAt
- [ ] Create RefreshToken entity: id, tokenHash, userId (FK), expiresAt, revokedAt, createdAt
- [ ] Create PasswordResetToken entity: id, tokenHash, userId (FK), expiresAt, usedAt
- [ ] Generate and run database migrations for all three new entities
- [ ] Define Role enum (USER, ADMIN, MODERATOR) and add to User entity

## Phase 2 — Core Auth Module Scaffold

- [ ] Generate AuthModule, AuthController, AuthService via NestJS CLI
- [ ] Generate UsersModule and UsersService with findByEmail and createUser methods
- [ ] Configure JwtModule (async) reading JWT_SECRET and JWT_EXPIRY from ConfigService
- [ ] Implement JwtStrategy (passport-jwt) to validate access token and attach user to request
- [ ] Create JwtAuthGuard extending AuthGuard('jwt') and register globally
- [ ] Create @Public() decorator to opt-out of global JWT guard on public endpoints

## Phase 3 — Registration & Email Verification

- [ ] Implement POST /auth/register: validate DTO, hash password (bcrypt ≥12), persist user with isVerified=false
- [ ] Generate signed email-verification token (JWT, 24h TTL) and dispatch via MailService
- [ ] Implement GET /auth/verify-email?token=... endpoint to set isVerified=true
- [ ] Add IsVerified guard/interceptor that returns 403 for unverified users on protected routes

## Phase 4 — Login & Token Issuance

- [ ] Implement POST /auth/login: validate credentials, compare bcrypt hash, reject unknown emails with generic 401
- [ ] On successful login, sign JWT access token (15 min) with userId, email, role in payload
- [ ] Generate cryptographically random refresh token, hash it (SHA-256), persist RefreshToken record (7d TTL)
- [ ] Set refresh token as HttpOnly, Secure, SameSite=Strict cookie; return access token in JSON body
- [ ] Implement GET /auth/me: return current user profile from JWT payload (protected route)

## Phase 5 — Refresh Token Rotation & Logout

- [ ] Implement POST /auth/refresh: read refresh token from cookie, hash and look up in DB, verify not revoked/expired
- [ ] On valid refresh: revoke old token, issue new access token + new refresh token (rotation)
- [ ] Detect token reuse (token already revoked): revoke all tokens in family and return 401 with security alert log
- [ ] Implement POST /auth/logout: revoke refresh token from DB, clear cookie

## Phase 6 — Password Reset Flow

- [ ] Implement POST /auth/forgot-password: look up user by email (always return 200 to prevent email enumeration)
- [ ] Generate single-use reset token (SHA-256 hash stored), dispatch reset link via MailService (1h TTL)
- [ ] Implement POST /auth/reset-password: validate token, verify not expired/used, hash new password, mark token usedAt
- [ ] On successful reset, revoke all active refresh tokens for the user to force re-login on all devices

## Phase 7 — RBAC & Security Hardening

- [ ] Create @Roles(...roles) metadata decorator using SetMetadata
- [ ] Implement RolesGuard: read roles metadata, compare against req.user.role, reject with 403 if insufficient
- [ ] Apply ThrottlerGuard to all /auth/* routes (10 req/min/IP); customise error message
- [ ] Add helmet middleware (security headers) and CORS configuration to AppModule
- [ ] Validate all incoming DTOs with class-validator pipes; strip unknown properties (whitelist: true)

## Phase 8 — Tests & Documentation

- [ ] Write unit tests for AuthService: register, login, refresh, logout, forgot/reset-password (Jest + mock repositories)
- [ ] Write unit tests for RolesGuard, JwtAuthGuard, IsVerified guard
- [ ] Write e2e tests (Supertest) for full auth flow: register → verify → login → refresh → logout
- [ ] Write e2e test for token replay attack detection and password reset expiry
- [ ] Add Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth) to all auth endpoints
- [ ] Verify test coverage report shows ≥ 80 % for auth module; update CI pipeline to enforce threshold