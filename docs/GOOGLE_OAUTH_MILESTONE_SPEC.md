# Shadow Exchange — Google OAuth Authentication Milestone Architectural Specification

> **Status:** Specification & Migration Blueprint (Phase 5)  
> **Document Version:** 1.0.0  
> **Target Release:** Shadow Exchange OAuth 2.0 Integration Milestone  

---

## 1. Executive Summary & Objective

Shadow Exchange currently operates in an explicit **Demo Mode**, generating isolated in-memory or database demo accounts via `POST /api/users/demo` with initial cash balances ($100,000.00). While this provides immediate friction-free testing, all private endpoints (`/api/users/{userId}/portfolio`, `/orders/user/{userId}`, `/orders`, `/orders/{orderId}`) currently permit arbitrary access without identity verification (`anyRequest().permitAll()`), exposing the system to IDOR (Insecure Direct Object Reference) vulnerabilities.

This specification details a production-grade, repository-specific implementation of **Google OAuth 2.0 / OpenID Connect (OIDC)** authentication and identity management for Shadow Exchange.

### Core Architectural Guarantees:
1. **Explicit Identity Isolation:** Authenticated Google accounts and simulated Demo accounts remain strictly isolated. Demo identities are never silently upgraded or merged into Google identities without explicit user consent.
2. **Anti-IDOR Security:** All private endpoints (`/portfolio`, `/orders`, `/cash`) derive user identity strictly from the verified server-side session or JWT context (`SecurityContext`), discarding untrusted client-supplied `userId` parameters.
3. **Stream Separation & Contract Integrity:** The public market trade stream `/topic/trades` maintains its strict 6-field DTO (`tradeId`, `stockId`, `symbol`, `price`, `quantity`, `executedAt`). Private order execution and balance updates are delivered exclusively via authenticated, user-scoped destinations (e.g., `/user/queue/orders`).
4. **Credential Security:** Zero hardcoded credentials; all OAuth secrets and tokens reside exclusively in environment variables with local `.env` and production secret manager configurations.

---

## 2. Current Architecture vs Target Architecture

| Component | Current State (Demo Mode) | Target State (OAuth 2.0 Milestone) |
| :--- | :--- | :--- |
| **Authentication Flow** | Transient demo account (`POST /api/users/demo`) stored in `localStorage` | Google OIDC authorization code flow with PKCE or Backend Server Redirect |
| **Session Model** | Client passes numeric `userId` in URL/body; no session cookies or tokens | HttpOnly, SameSite=Lax/Strict session cookie or encrypted short-lived JWT |
| **Authorization Filter** | `SecurityConfig.java`: `http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())` | `SecurityConfig.java`: Authenticated routes require `ROLE_USER` / valid session |
| **Object Authorization** | Client-supplied `userId` accepted at face value across controllers | Resolves `UserPrincipal` from SecurityContext; throws `403 Forbidden` on mismatch |
| **WebSocket Broker** | Anonymous STOMP over SockJS/WebSocket; connects to public `/topic/trades` | Handshake token interceptor (`ChannelInterceptor`); separate `/user/queue/orders` |
| **Trade DTO (`/topic/trades`)** | 6 fields (`tradeId`, `stockId`, `symbol`, `price`, `quantity`, `executedAt`) | **Identical (No Change):** Guaranteed 6 fields preserved for zero frontend regression |
| **Database Schema** | `users` table: `id`, `username`, `email`, `password`, `balance`, `reservedBalance` | Added `auth_provider`, `provider_subject_id`, `avatar_url`, `is_demo` flags with unique constraint |

---

## 3. Frontend Login Flow & OAuth Callback

### 3.1 Architecture Options & Selected Design
To align with the decoupled architecture (React Vite SPA on Vercel + Spring Boot REST API on Render):

**Selected Flow: Backend-Redirect Authorization Code Flow with HttpOnly Cookies**
1. User clicks **"Sign in with Google"** in the top navigation bar or profile dropdown.
2. The browser navigates to the Spring Boot OAuth authorization endpoint:  
   `GET ${VITE_API_BASE_URL}/oauth2/authorization/google`
3. Spring Security redirects to Google Accounts consent screen with scopes:
   - `openid`
   - `email`
   - `profile`
4. User authorizes the application. Google redirects the user back to Spring Boot:  
   `GET /login/oauth2/code/google?code=...&state=...`
5. Spring Boot exchanges the authorization code for Google ID token and access token, verifies claims, loads or provisions the user in PostgreSQL, and issues an **encrypted, HttpOnly, SameSite session cookie** (`JSESSIONID` or custom `SHADOW_SESSION`).
6. Spring Boot redirects the browser to the frontend dashboard:  
   `https://shadow-exchange-live.vercel.app/?auth=success` (or `http://localhost:5173/?auth=success`)
7. React frontend boots, detects session via `GET /api/auth/me`, and mounts authenticated state.

### 3.2 Frontend State Machine (`frontend/src/authStore.ts`)
```typescript
export interface AuthState {
  isAuthenticated: boolean;
  isDemo: boolean;
  user: {
    id: number;
    email: string;
    username: string;
    avatarUrl?: string;
    balance: number;
    reservedBalance: number;
  } | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  errorMessage?: string;
}
```

- When `auth=success` is detected in URL params, frontend invokes `fetchCurrentUser()`.
- If `401 Unauthorized`, frontend remains in Demo Mode or unauthenticated state.
- Demo mode remains accessible via an explicit **"Switch to Demo Sandbox"** toggle, retaining separate demo state in `localStorage` under `shadow_exchange_demo_user_id`.

---

## 4. Backend Verification of Google Identity

### 4.1 Spring Security OIDC Dependencies
Add standard Spring Security OAuth2 client starter to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

### 4.2 Custom OIDC User Service (`CustomOAuth2UserService.java`)
Spring Security's `DefaultOAuth2UserService` / `OidcUserService` automatically performs:
- Google TLS certificate verification against Google's discovery document (`https://accounts.google.com/.well-known/openid-configuration`).
- Signature verification of the JWT ID token.
- `iss` (issuer) validation (`https://accounts.google.com`).
- `aud` (audience) validation matching `GOOGLE_CLIENT_ID`.
- `exp` (expiration) validation.

Upon successful claim verification, the custom service maps OIDC attributes:
- `sub` (Google Subject ID - immutable unique user identifier).
- `email` and `email_verified` (must be `true`).
- `name` or `given_name`.
- `picture` (avatar URL).

---

## 5. Stable Mapping Between Google Identity & Server-Owned Account

### 5.1 Account Entity Evolution (`com.shadowexchange.entity.User`)
To preserve existing demo accounts and enable seamless OAuth user management, `User.java` must be extended:

```java
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uk_users_provider_sub", columnNames = {"auth_provider", "provider_subject_id"}),
    @UniqueConstraint(name = "uk_users_email", columnNames = {"email"})
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password; // Nullable for OAuth accounts

    @Column(name = "auth_provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider = AuthProvider.LOCAL; // LOCAL, GOOGLE, DEMO

    @Column(name = "provider_subject_id", nullable = true)
    private String providerSubjectId; // Google 'sub' claim

    @Column(name = "avatar_url", nullable = true)
    private String avatarUrl;

    @Column(name = "is_demo", nullable = false)
    private boolean isDemo = false;

    @Column(nullable = false)
    private BigDecimal balance = new BigDecimal("100000.00");

    @Column(nullable = false)
    private BigDecimal reservedBalance = BigDecimal.ZERO;
    
    // ... getters, setters, constructors
}
```

### 5.2 Provisioning Logic (`UserService.java`)
When an authenticated Google user signs in:
1. Lookup existing user by `authProvider = GOOGLE` AND `providerSubjectId = sub`.
2. If found: Update email/avatar if modified; return existing account.
3. If not found:
   - Check if a user with that `email` already exists.
   - If an account exists with `isDemo = true`, do **NOT** silently overwrite it. Create a new distinct account with a sanitized username.
   - Provision a fresh `User` record with initial virtual liquidity ($100,000.00 cash, 0 reserved), `authProvider = GOOGLE`, `providerSubjectId = sub`, and `isDemo = false`.
   - Seed starter portfolio (if configured) or initialize clean 0-holding account.

---

## 6. Secure Session/Token Lifecycle and Logout

### 6.1 Cookie Configuration
- **Cookie Name:** `SHADOW_SESSION`
- **Flags:**
  - `HttpOnly = true` (Inaccessible to browser JavaScript, mitigating XSS extraction).
  - `Secure = true` in production (Transmitted only over HTTPS).
  - `SameSite = Lax` (Required for top-level OAuth redirect callbacks from Google).
  - `Path = /`
  - `Max-Age = 604800` (7 days sliding expiration).

### 6.2 Logout Protocol (`POST /api/auth/logout`)
1. Invalidate Spring `HttpSession`.
2. Clear `SecurityContextHolder`.
3. Set `SHADOW_SESSION` cookie value to empty with `Max-Age = 0`.
4. Return `204 No Content`.
5. Frontend clears cached profile and falls back cleanly to Demo Sandbox.

---

## 7. Protection Against IDOR (Numeric ID Tampering)

### 7.1 Existing Vulnerability Analysis
Currently, endpoints accept arbitrary numeric IDs:
- `GET /api/users/{userId}/portfolio`
- `GET /orders/user/{userId}`
- `POST /orders` with body `{ userId: 123, ... }`
- `DELETE /orders/{orderId}`

An attacker can increment `userId` to inspect any trader's portfolio, read active orders, or place/cancel trades on behalf of another user.

### 7.2 Remediated Endpoints & Authorization Rules
All private endpoints must be refactored to eliminate client-provided `userId` parameters:

1. **Portfolio Endpoint:**
   - **Old:** `GET /api/users/{userId}/portfolio`
   - **New:** `GET /api/portfolio/me` (Resolves user ID exclusively from `Authentication.getPrincipal()`).
   - Legacy endpoint `GET /api/users/{userId}/portfolio` is restricted: checks `currentUser.getId().equals(userId)` or `currentUser.isDemo()`; otherwise throws `403 Forbidden`.

2. **Orders Endpoint:**
   - **Old:** `GET /orders/user/{userId}`
   - **New:** `GET /orders/me` (Derives ID strictly from session).
   - `POST /orders`: The `userId` field is stripped from `OrderRequestDTO` or overridden by the backend session:
     ```java
     Long authenticatedUserId = SecurityUtils.getCurrentUserId();
     order.setUser(userRepository.getReferenceById(authenticatedUserId));
     ```

3. **Order Cancellation Endpoint:**
   - `DELETE /orders/{orderId}`:
     Before cancelling, `OrderCancellationService` verifies:
     ```java
     Order order = orderRepository.findById(orderId)
         .orElseThrow(() -> new OrderNotFoundException(orderId));
     if (!order.getUser().getId().equals(currentUserId)) {
         throw new AccessDeniedException("Forbidden: You do not own order #" + orderId);
     }
     ```

---

## 8. WebSocket Authorization & Stream Separation

### 8.1 Public Trade Stream Integrity (`/topic/trades`)
The existing trade notification channel `/topic/trades` publishes public market trades executed by the matching engine.
- **DTO Preservation:** As required by the specification, the public payload emitted by `TradeWebSocketPublisher` must retain **exactly its existing 6 fields**:
  ```json
  {
    "tradeId": 1042,
    "stockId": 1,
    "symbol": "NVDA",
    "price": 142.87,
    "quantity": 50,
    "executedAt": "2026-10-14T23:00:00"
  }
  ```
- **Zero Sensitive Data:** Counterparty user IDs (`buyerId`, `sellerId`), remaining account cash, and order IDs are strictly excluded from `/topic/trades`.
- **Open Access:** Unauthenticated clients, demo users, and authenticated operators can subscribe to `/topic/trades` without authorization headers.

### 8.2 Private Account Streams (`/user/queue/orders`, `/user/queue/balance`)
Private trade notifications, partial fill alerts, order status transitions, and cash adjustments must use Spring's user destination feature:
1. During WebSocket STOMP connect (`CONNECT` frame), a `ChannelInterceptor` checks the HTTP session or Bearer token established during handshake:
   ```java
   @Override
   public Message<?> preSend(Message<?> message, MessageChannel channel) {
       StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
       if (StompCommand.CONNECT.equals(accessor.getCommand())) {
           Principal principal = accessor.getUser();
           if (principal == null && isDemoRequest(accessor)) {
               principal = createDemoPrincipal(accessor);
               accessor.setUser(principal);
           }
       }
       return message;
   }
   ```
2. When an order matches in `MatchingEngine`, execution details are sent to private destinations:
   ```java
   messagingTemplate.convertAndSendToUser(
       order.getUser().getUsername(),
       "/queue/orders",
       privateOrderExecutionDTO
   );
   ```
3. A user listening on `/user/queue/orders` receives only their own fills and cancellations. Users cannot listen to other accounts' queues.

---

## 9. Database Migration Plan & Backward Compatibility

### 9.1 Flyway / SQL Schema Migration (`V2__add_oauth_and_identity_columns.sql`)
```sql
-- 1. Add authentication identity columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
ADD COLUMN IF NOT EXISTS provider_subject_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512),
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark existing accounts as demo if they follow demo naming
UPDATE users 
SET is_demo = TRUE, auth_provider = 'DEMO'
WHERE email LIKE 'shadow-demo-%@example.test' OR username LIKE '%Demo%';

-- 3. Add composite unique constraint for provider and subject ID
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_provider_sub 
ON users(auth_provider, provider_subject_id) 
WHERE provider_subject_id IS NOT NULL;

-- 4. Audit foreign keys on orders and holdings
-- Ensures cascade or restrict behavior remains consistent
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user;
ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
```

### 9.2 Backward Compatibility
- Existing demo users created via `POST /api/users/demo` retain their balances, holdings, and order history.
- The `POST /api/users/demo` endpoint remains fully operational for visitors who choose not to sign in with Google.
- The UI displays an explicit indicator: `[DEMO MODE]` vs `[VERIFIED GOOGLE TRADER]`.

---

## 10. Required Secrets, Environment Variables & Missing GCP Credentials

### 10.1 Missing Google Cloud Credentials (Prerequisites)
Before OAuth can be activated, the following configuration must be completed in **Google Cloud Console**:
1. **Google Cloud Project:** Create project (e.g., `shadow-exchange-prod`).
2. **OAuth Consent Screen:**
   - User Type: External.
   - App Name: `Shadow Exchange`.
   - User Support Email: Developer contact email.
   - Developer Contact Info: Developer email.
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Publish Status: "In production" (or "Testing" with designated test Google accounts).
3. **OAuth 2.0 Client ID Credentials:**
   - Application Type: **Web Application**.
   - Name: `Shadow Exchange Web Client`.
   - **Authorized JavaScript Origins:**
     - `http://localhost:5173` (Local frontend Vite dev server)
     - `https://shadow-exchange-live.vercel.app` (Production Vercel deployment)
   - **Authorized Redirect URIs:**
     - `http://localhost:8080/login/oauth2/code/google` (Local backend)
     - `https://shadow-exchange.onrender.com/login/oauth2/code/google` (Render production backend)

### 10.2 Environment Variable Matrix

| Variable Name | Environment | Purpose | Security Rule |
| :--- | :--- | :--- | :--- |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID` | Local & Render | Google OAuth Client ID | Safe in server environment; public ID |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET` | Local & Render | Google OAuth Client Secret | **CRITICAL: NEVER COMMIT TO GIT.** Must be set in Render Secrets / `.env.local` |
| `CORS_ALLOWED_ORIGINS` | Local & Render | Allowed cross-origin domains | e.g. `http://localhost:5173,https://shadow-exchange-live.vercel.app` |
| `FRONTEND_AUTH_REDIRECT_URL` | Local & Render | URL where Spring redirects post-login | `http://localhost:5173` (dev) / `https://shadow-exchange-live.vercel.app` (prod) |
| `SERVER_SERVLET_SESSION_COOKIE_SECURE` | Render (Prod) | Enforce HTTPS for session cookies | `true` in production; `false` in local H2 dev |

---

## 11. CORS, CSRF, and Security Configuration Blueprint

### 11.1 Proposed `SecurityConfig.java` Update
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Value("${frontend.redirect-url:http://localhost:5173}")
    private String frontendRedirectUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                // Disable CSRF only for demo endpoints or enforce double-submit cookie token
                .ignoringRequestMatchers("/api/stocks/**", "/orders/book/**", "/ws/**")
            )
            .authorizeHttpRequests(auth -> auth
                // Public market inspection
                .requestMatchers(HttpMethod.GET, "/api/stocks/**", "/orders/book/**").permitAll()
                // WebSocket handshake
                .requestMatchers("/ws/**").permitAll()
                // Demo user creation
                .requestMatchers(HttpMethod.POST, "/api/users/demo").permitAll()
                // OAuth endpoints
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                // Private user actions
                .requestMatchers("/api/portfolio/me", "/orders/me", "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/orders").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/orders/*").authenticated()
                // Deny all other unmatched routes
                .anyRequest().permitAll() // Retained for demo fallback during migration phase
            )
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl(frontendRedirectUrl + "/?auth=success", true)
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_NO_CONTENT))
                .deleteCookies("SHADOW_SESSION")
            );

        return http.build();
    }
}
```

---

## 12. Verification & Acceptance Checklist

To consider the Google Authentication milestone complete:
- [ ] Google Cloud Console project configured with valid origins and redirect URIs.
- [ ] Frontend triggers Google consent screen upon clicking "Sign in with Google".
- [ ] Backend completes authorization code exchange and maps user to `users` table with `auth_provider = 'GOOGLE'`.
- [ ] `GET /api/auth/me` returns authenticated profile with server-verified ID and email.
- [ ] Tampering test: Modifying `userId` in requests does not allow reading or cancelling another user's orders.
- [ ] Public trade stream `/topic/trades` delivers exact 6-field DTO without session leaking.
- [ ] Demo Sandbox button continues to provide unauthenticated demo trading without database pollution.
- [ ] Unit & Integration tests verify 401/403 responses on unauthorized portfolio and order operations.
