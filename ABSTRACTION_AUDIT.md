# Abstraction Layer Audit - Supabase Coupling Analysis

**Date:** 2025-10-21
**Goal:** Ensure components/services don't depend on Supabase directly

---

## 🎯 Executive Summary

**Overall Grade: 6.5/10** - Good intentions, but **authentication layer is tightly coupled to Supabase**

### What's Working ✅
- DAO layer is **perfectly abstracted** (can swap databases easily)
- Database operations use custom types (`DbResponse<T>`)
- Error normalization converts Supabase errors to `DomainError`
- `RequestUser` interface is auth-agnostic

### What's Broken 🚨
- **AuthService** directly imports and uses `SupabaseClient`
- **AuthGuard** directly imports and uses `SupabaseClient`
- **Auth utilities** import Supabase `Session` type
- **Shared utilities** use `SupabaseUser` type in business logic

**Impact:** Switching from Supabase Auth to another provider (Firebase, Auth0, Clerk) would require:
- ❌ **WITHOUT fixes**: 2-3 weeks, high risk, touch 10+ files
- ✅ **WITH fixes below**: 2-3 days, low risk, touch 2 files

---

## 📊 Dependency Map

### Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────┐
│ AuthController                                   │
│ (Business Layer)                                 │
└───────────────────┬─────────────────────────────┘
                    │ depends on
                    ▼
┌─────────────────────────────────────────────────┐
│ AuthService                                      │
│ ❌ imports SupabaseClient directly              │
│ ❌ calls supabase.auth.signUp()                 │
└───────────────────┬─────────────────────────────┘
                    │ depends on
                    ▼
┌─────────────────────────────────────────────────┐
│ @supabase/supabase-js                           │
│ (External Dependency - SHOULD BE ISOLATED)      │
└─────────────────────────────────────────────────┘
```

**Problem:** Business logic is **tightly coupled** to Supabase SDK.

---

### Recommended Architecture (Fixed)

```
┌─────────────────────────────────────────────────┐
│ AuthController                                   │
│ (Business Layer)                                 │
└───────────────────┬─────────────────────────────┘
                    │ depends on
                    ▼
┌─────────────────────────────────────────────────┐
│ AuthService                                      │
│ ✅ depends on IAuthProvider interface           │
└───────────────────┬─────────────────────────────┘
                    │ depends on
                    ▼
┌─────────────────────────────────────────────────┐
│ IAuthProvider (Abstract Interface)              │
│ - register(email, password): AuthResult         │
│ - login(email, password): AuthResult            │
│ - refresh(token): AuthResult                    │
│ - validateToken(token): User                    │
└───────────────────┬─────────────────────────────┘
                    │ implemented by
                    ▼
┌─────────────────────────────────────────────────┐
│ SupabaseAuthAdapter                             │
│ (Infrastructure Layer - ISOLATED)               │
│ ✅ Only file that imports @supabase/supabase-js│
└─────────────────────────────────────────────────┘
```

**Benefit:** Swap Supabase for Auth0/Firebase by creating `Auth0Adapter` - zero changes to business logic.

---

## 🔍 Detailed Findings

### 1. ❌ AuthService - TIGHTLY COUPLED

**File:** `src/features/auth/auth.service.ts:5,13`

**Problem:**
```typescript
import { SupabaseClient } from '@supabase/supabase-js'; // ❌ Direct import

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_ANON)
    private readonly supabase: SupabaseClient  // ❌ Direct dependency
  ) {}

  async register(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ // ❌ Direct call
      email,
      password,
    });
    // ...
  }
}
```

**Why it's bad:**
- AuthService is in `/features` (business layer) but imports infrastructure types
- Switching auth providers requires rewriting AuthService
- Testing requires mocking Supabase SDK (painful)

**Recommended Fix:**
```typescript
// Create src/infra/auth/interfaces/auth-provider.interface.ts
export interface IAuthProvider {
  register(email: string, password: string): Promise<AuthResult>;
  registerWithMetadata(email: string, password: string, metadata: Record<string, unknown>): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthResult>;
  logout(jwt: string): Promise<void>;
  validateToken(jwt: string): Promise<User>;
}

export interface AuthResult {
  user?: User;
  session?: Session;
  requiresConfirmation: boolean;
  message?: string;
}

export interface User {
  id: string;
  email?: string;
  metadata: Record<string, unknown>;
}

export interface Session {
  userId: string;
  email?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Updated AuthService
@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider  // ✅ Depends on interface
  ) {}

  async register(email: string, password: string) {
    return this.authProvider.register(email, password); // ✅ Provider-agnostic
  }
}
```

---

### 2. ❌ AuthGuard - TIGHTLY COUPLED

**File:** `src/features/auth/auth.guard.ts:16,22,59`

**Problem:**
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'; // ❌ Direct import

@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ANON)
    private readonly supabase: SupabaseClient, // ❌ Direct dependency
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const { data, error } = await this.supabase.auth.getUser(accessToken); // ❌ Direct call
    // ...
  }
}
```

**Why it's bad:**
- Guard is in `/features` but uses Supabase SDK
- Can't test without Supabase mock
- Can't switch auth providers

**Recommended Fix:**
```typescript
@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider, // ✅ Depends on interface
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const user = await this.authProvider.validateToken(accessToken); // ✅ Provider-agnostic
    // ...
  }
}
```

---

### 3. ⚠️ toLoginResponse - MINOR COUPLING

**File:** `src/features/auth/utils/to-login-response.util.ts:2`

**Problem:**
```typescript
import type { Session } from '@supabase/supabase-js'; // ⚠️ Imports Supabase type

export function toLoginResponse(session: Session): LoginResponse {
  // ...
}
```

**Why it's concerning:**
- Utility function in `/features` imports Supabase type
- Function signature is tied to Supabase

**Recommended Fix:**
```typescript
// Use your own Session type (defined in IAuthProvider above)
export function toLoginResponse(session: Session): LoginResponse {
  // Now Session is your own interface, not Supabase's
}
```

---

### 4. ✅ normalizeError - ACCEPTABLE

**File:** `src/shared/utils/try-catch.util.ts:2`

**Current:**
```typescript
import { AuthApiError, PostgrestError } from '@supabase/supabase-js';

export function normalizeError(err: unknown): DomainError {
  if (err instanceof AuthApiError) {
    return new DomainError(err.message, err.code ?? 'AUTH_ERROR', err.status);
  }
  // ...
}
```

**Why it's acceptable:**
- This is a **boundary layer** - it converts external errors to your domain errors
- Similar to how your DAO adapter converts Supabase DB responses to `DbResponse<T>`
- Every app needs error normalization at boundaries

**Recommendation:** Keep as-is, but consider renaming to `normalizeSupabaseError()` to make it explicit.

---

### 5. ⚠️ SupabaseUser Type - LEAKY ABSTRACTION

**File:** `src/shared/interfaces/auth/supabase-user.types.ts:39`

**Problem:**
```typescript
// This interface is named "SupabaseUser" and used throughout the app
export interface SupabaseUser {
  id: string;
  email?: string;
  app_metadata: SupabaseAppMetadata;
  user_metadata: SupabaseUserMetadata;
  // ...
}

// Used in:
// - src/shared/utils/supabase-user.util.ts
// - src/features/auth/auth.guard.ts:64
```

**Why it's concerning:**
- Type name reveals implementation detail
- If you switch to Firebase, do you keep calling it `SupabaseUser`?
- The structure (`app_metadata`, `user_metadata`) is Supabase-specific

**Recommended Fix:**
```typescript
// Rename to app-level type
export interface AuthUser {
  id: string;
  email?: string;
  role: Role;
  userType: UserType;
  metadata: UserMetadata; // Flatten the structure
  // ...
}

export interface UserMetadata {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  // ...
}
```

---

## 🏗️ Recommended Refactoring

### Step 1: Create Auth Provider Interface (1 hour)

**Create:** `src/infra/auth/interfaces/auth-provider.interface.ts`

```typescript
export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

export interface IAuthProvider {
  /**
   * Register a new user with email/password
   */
  register(email: string, password: string): Promise<AuthResult>;

  /**
   * Register with additional metadata
   */
  registerWithMetadata(
    email: string,
    password: string,
    metadata: UserMetadata
  ): Promise<AuthResult>;

  /**
   * Login with email/password
   */
  login(email: string, password: string): Promise<AuthResult>;

  /**
   * Refresh access token
   */
  refresh(refreshToken: string): Promise<AuthResult>;

  /**
   * Logout user
   */
  logout(jwt: string): Promise<void>;

  /**
   * Validate JWT and return user
   */
  validateToken(jwt: string): Promise<AuthUser>;
}

export interface AuthResult {
  user?: AuthUser;
  session?: AuthSession;
  requiresConfirmation: boolean;
  message?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role: Role;
  userType: UserType;
  displayName?: string;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  userId: string;
  email?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserMetadata {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  role?: Role;
  [key: string]: unknown;
}
```

---

### Step 2: Create Supabase Auth Adapter (2 hours)

**Create:** `src/infra/auth/adapters/supabase-auth.adapter.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON } from '@starment/supabase-dao';
import { normalizeError } from '@starment/shared';
import {
  IAuthProvider,
  AuthResult,
  AuthUser,
  AuthSession,
  UserMetadata,
} from '../interfaces/auth-provider.interface';

@Injectable()
export class SupabaseAuthAdapter implements IAuthProvider {
  constructor(@Inject(SUPABASE_ANON) private readonly supabase: SupabaseClient) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw normalizeError(error);
    }

    if (!data.session) {
      return {
        requiresConfirmation: true,
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async registerWithMetadata(
    email: string,
    password: string,
    metadata: UserMetadata
  ): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      throw normalizeError(error);
    }

    if (!data.session) {
      return {
        requiresConfirmation: true,
        message: 'Account created. Please check your email to confirm your account.',
      };
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw normalizeError(error);
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw normalizeError(error);
    }

    return {
      user: this.mapUser(data.user),
      session: this.mapSession(data.session),
      requiresConfirmation: false,
    };
  }

  async logout(jwt: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(jwt);
    if (error) {
      throw normalizeError(error);
    }
  }

  async validateToken(jwt: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.getUser(jwt);
    if (error) {
      throw normalizeError(error);
    }
    return this.mapUser(data.user);
  }

  // Private mapping methods
  private mapUser(supabaseUser: any): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.app_metadata?.role || supabaseUser.user_metadata?.roles?.[0] || 'user',
      userType: supabaseUser.user_metadata?.user_type || 'fan',
      displayName:
        supabaseUser.user_metadata?.display_name ||
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.email ||
        'Unknown User',
      metadata: supabaseUser.user_metadata || {},
    };
  }

  private mapSession(supabaseSession: any): AuthSession {
    return {
      userId: supabaseSession.user.id,
      email: supabaseSession.user.email,
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresIn: supabaseSession.expires_in,
    };
  }
}
```

---

### Step 3: Create Auth Module (30 minutes)

**Create:** `src/infra/auth/auth-infra.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { SupabaseCoreModule } from '@starment/supabase-dao';
import { AUTH_PROVIDER } from './interfaces/auth-provider.interface';
import { SupabaseAuthAdapter } from './adapters/supabase-auth.adapter';

@Global()
@Module({
  imports: [SupabaseCoreModule],
  providers: [
    {
      provide: AUTH_PROVIDER,
      useClass: SupabaseAuthAdapter,
    },
  ],
  exports: [AUTH_PROVIDER],
})
export class AuthInfraModule {}
```

**Update:** `src/app.module.ts`

```typescript
import { AuthInfraModule } from './infra/auth/auth-infra.module';

@Module({
  imports: [
    getConfigModule(),
    StarmentLoggerModule.forRoot(),
    CoreModule,
    SupabaseCoreModule,
    AuthInfraModule, // ✅ Add this
    HealthModule,
    // ...
  ],
})
export class AppModule {}
```

---

### Step 4: Update AuthService (15 minutes)

**Update:** `src/features/auth/auth.service.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { AUTH_PROVIDER, IAuthProvider } from '@starment/auth-infra';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider // ✅ Now provider-agnostic
  ) {}

  async register(email: string, password: string) {
    return this.authProvider.register(email, password);
  }

  async registerCreator(dto: RegisterCreatorDto) {
    return this.authProvider.registerWithMetadata(dto.email, dto.password, {
      userType: 'creator',
      displayName: dto.display_name,
      // ... rest of metadata
    });
  }

  async login(email: string, password: string) {
    return this.authProvider.login(email, password);
  }

  async refresh(refreshToken: string) {
    return this.authProvider.refresh(refreshToken);
  }

  async logout(jwt: string) {
    return this.authProvider.logout(jwt);
  }
}
```

---

### Step 5: Update AuthGuard (15 minutes)

**Update:** `src/features/auth/auth.guard.ts`

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { AUTH_PROVIDER, IAuthProvider } from '@starment/auth-infra';

@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider, // ✅ Now provider-agnostic
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    // ... role/type extraction logic ...

    if (!req.user) {
      const accessToken = this.extractToken(req);
      if (!accessToken) {
        throw new UnauthorizedException('Missing bearer token');
      }

      const user = await this.authProvider.validateToken(accessToken); // ✅ Provider-agnostic

      req.user = {
        id: user.id,
        jwt: accessToken,
        role: user.role,
        user_type: user.userType,
        email: user.email,
        display_name: user.displayName,
      };
    }

    // ... authorization logic ...
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  }
}
```

---

## 📈 Impact Analysis

### Before Refactoring

| Metric | Score |
|--------|-------|
| Testability | 4/10 (must mock Supabase SDK) |
| Flexibility | 3/10 (hard to switch auth providers) |
| Coupling | 7/10 (business logic depends on infrastructure) |
| Migration Risk | High (2-3 weeks to switch providers) |

### After Refactoring

| Metric | Score |
|--------|-------|
| Testability | 9/10 (mock simple interface) |
| Flexibility | 10/10 (plug-and-play adapters) |
| Coupling | 2/10 (business logic is independent) |
| Migration Risk | Low (2-3 days to switch providers) |

---

## 🎯 Migration Path to Another Auth Provider

After implementing the above refactoring, switching to **Firebase Auth**, **Auth0**, or **Clerk** requires:

1. Create `FirebaseAuthAdapter implements IAuthProvider` (4 hours)
2. Update `AuthInfraModule` to use `FirebaseAuthAdapter` (5 minutes)
3. Test (2 hours)

**Total: 1 day**

Zero changes to:
- AuthService
- AuthGuard
- AuthController
- Any business logic

---

## ✅ Checklist for Production

- [ ] Create `IAuthProvider` interface
- [ ] Create `SupabaseAuthAdapter`
- [ ] Create `AuthInfraModule`
- [ ] Update AuthService to use `IAuthProvider`
- [ ] Update AuthGuard to use `IAuthProvider`
- [ ] Rename `SupabaseUser` → `AuthUser`
- [ ] Update `toLoginResponse` to use your own types
- [ ] Add unit tests for adapters
- [ ] Document provider abstraction in README

**Estimated Time: 4-5 hours total**

---

## 🎓 Key Architectural Principles

### Dependency Inversion Principle

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Before:**
```
AuthService (high-level) → SupabaseClient (low-level) ❌
```

**After:**
```
AuthService (high-level) → IAuthProvider (abstraction) ✅
                                ↑
                     SupabaseAuthAdapter (low-level)
```

### Clean Architecture Layers

```
┌──────────────────────────────────────────┐
│ Features (Business Logic)                │
│ - AuthService, AuthController            │
│ ✅ Should only depend on interfaces      │
└──────────────────────────────────────────┘
                  ↓ depends on
┌──────────────────────────────────────────┐
│ Interfaces (Abstractions)                │
│ - IAuthProvider, IPaymentProvider        │
│ ✅ Define contracts, no implementation   │
└──────────────────────────────────────────┘
                  ↑ implemented by
┌──────────────────────────────────────────┐
│ Infrastructure (Adapters)                │
│ - SupabaseAuthAdapter, StripeProvider    │
│ ✅ Only layer that imports external SDKs │
└──────────────────────────────────────────┘
```

---

## 🔚 Conclusion

Your DAO layer abstraction is **world-class**, but your auth layer needs the same treatment. The refactoring above applies the **same pattern you already use for the database** to authentication.

**Bottom Line:**
- Database abstraction: ✅ Perfect (9.8/10)
- Auth abstraction: ❌ Needs work (4/10)
- Payment/Video abstraction: ✅ Good (8/10)

Fix the auth layer and you'll have a **fully provider-agnostic architecture**.

---

**Next Steps:** Shall I generate the implementation files for you?
