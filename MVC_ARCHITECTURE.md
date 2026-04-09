# 🗂️ Expense Tracker — MVC Architecture Documentation

> **Stack:** Java 21 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA · PostgreSQL · Flyway · Springdoc OpenAPI  
> **Base Package:** `com.expensetracker`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Layer Diagram](#2-layer-diagram)
3. [Model Layer](#3-model-layer)
4. [View Layer — DTOs](#4-view-layer--dtos)
5. [Controller Layer](#5-controller-layer)
6. [Service Layer](#6-service-layer)
7. [Repository Layer](#7-repository-layer)
8. [Security Infrastructure](#8-security-infrastructure)
9. [Supporting Components](#9-supporting-components)
10. [Database Schema & Migrations](#10-database-schema--migrations)
11. [Request Lifecycle — End-to-End Flow](#11-request-lifecycle--end-to-end-flow)
12. [Entity Relationship Diagram](#12-entity-relationship-diagram)
13. [API Endpoint Reference](#13-api-endpoint-reference)

---

## 1. Architecture Overview

The Expense Tracker is a **REST API backend** built on the classic layered MVC pattern, adapted for a stateless JSON API architecture:

| Traditional MVC | This Application |
|---|---|
| **Model** | JPA Entity classes (`model/`) |
| **View** | JSON responses via DTOs (`dto/`) |
| **Controller** | `@RestController` classes (`controller/`) |
| *(Business Logic)* | Service interfaces + impls (`service/`) |
| *(Data Access)* | Spring Data JPA repositories (`repository/`) |
| *(Cross-cutting)* | JWT Security Filter Chain (`security/`, `config/`) |

There is no server-side HTML rendering. The "View" is expressed as structured JSON, shaped by **Data Transfer Objects (DTOs)** using Java Records, wrapped uniformly in `ApiResponse<T>`.

---

## 2. Layer Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        HTTP CLIENT / FRONTEND                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  HTTP Request (Bearer JWT)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SECURITY FILTER CHAIN                           │
│  ┌────────────────┐   ┌─────────────┐   ┌───────────────────────┐   │
│  │ JwtAuthFilter  │──▶│   JwtUtil   │   │ UserDetailsServiceImpl │   │
│  │(OncePerRequest)│   │(parse/valid)│   │  (load by email)      │   │
│  └────────────────┘   └─────────────┘   └───────────────────────┘   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  Authenticated Principal in SecurityContext
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        CONTROLLER LAYER                              │
│  AuthController  UserController  ExpenseController                   │
│  BudgetController  CategoryController  ReportController              │
└───────────────────────────────┬──────────────────────────────────────┘
                                │  Calls Service interface
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
│  AuthServiceImpl  UserServiceImpl  ExpenseServiceImpl                │
│  BudgetServiceImpl  CategoryServiceImpl  ReportServiceImpl           │
│                                                                      │
│        (Uses Mappers to convert Entity ◀▶ DTO)                      │
│  UserMapper  ExpenseMapper  CategoryMapper  BudgetMapper             │
└──────────┬────────────────────────────────────────────┬─────────────┘
           │  Reads/Writes Entities                      │ Reads SecurityContext
           ▼                                             ▼
┌──────────────────────┐                  ┌───────────────────────────┐
│   REPOSITORY LAYER   │                  │     MODEL LAYER           │
│  UserRepository      │◀────JPA/SQL─────▶│  User  Expense  Category  │
│  ExpenseRepository   │                  │  Budget  Role             │
│  CategoryRepository  │                  └───────────────────────────┘
│  BudgetRepository    │
└──────────┬───────────┘
           │  JDBC / Flyway
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL DATABASE                              │
│  users · categories · expenses · budgets                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Model Layer

**Package:** `com.expensetracker.model`  
**Role:** JPA entities mapped to PostgreSQL tables. These are the canonical data representations persisted to the database. All entities use `@EntityListeners(AuditingEntityListener.class)` for automatic timestamp management.

---

### 3.1 `User`

**Table:** `users`

| Field | Type | Constraints |
|---|---|---|
| `id` | `Long` | `@Id`, Auto-generated |
| `firstName` | `String` | `NOT NULL` |
| `lastName` | `String` | `NOT NULL` |
| `email` | `String` | `NOT NULL`, `UNIQUE` |
| `password` | `String` | `NOT NULL` (BCrypt hashed) |
| `role` | `Role` | `NOT NULL`, `ENUM(USER, ADMIN)` |
| `createdAt` | `LocalDateTime` | `NOT NULL`, audit-managed |

```java
@Entity
@Table(name = "users")
public class User { ... }
```

> The `User` entity is the **root aggregate** — all other entities (Expense, Budget, Category) maintain a `@ManyToOne` FK reference to `User`.

---

### 3.2 `Category`

**Table:** `categories`  
**Unique Constraint:** `(name, user_id)` — category names are unique per user.

| Field | Type | Constraints |
|---|---|---|
| `id` | `Long` | `@Id`, Auto-generated |
| `name` | `String` | `NOT NULL` |
| `color` | `String` | Optional (hex color string) |
| `icon` | `String` | Optional (icon identifier) |
| `user` | `User` | `@ManyToOne LAZY`, FK `user_id` |
| `createdAt` | `LocalDateTime` | `NOT NULL`, audit-managed |

---

### 3.3 `Expense`

**Table:** `expenses`

| Field | Type | Constraints |
|---|---|---|
| `id` | `Long` | `@Id`, Auto-generated |
| `amount` | `BigDecimal` | `NOT NULL` |
| `description` | `String` | Nullable |
| `date` | `LocalDate` | `NOT NULL` |
| `category` | `Category` | `@ManyToOne LAZY`, FK `category_id` |
| `user` | `User` | `@ManyToOne LAZY`, FK `user_id` NOT NULL |
| `tags` | `String[]` | `text[]` PostgreSQL array |
| `createdAt` | `LocalDateTime` | `NOT NULL`, audit-managed |
| `updatedAt` | `LocalDateTime` | `NOT NULL`, audit-managed |

> **Notable:** Tags are stored as a native PostgreSQL `text[]` array column, accessed via Hibernate's `@JdbcTypeCode(SqlTypes.ARRAY)`.

---

### 3.4 `Budget`

**Table:** `budgets`  
**Unique Constraint:** `(user_id, category_id, month, year)` — one budget per user per category per month.

| Field | Type | Constraints |
|---|---|---|
| `id` | `Long` | `@Id`, Auto-generated |
| `monthlyLimit` | `BigDecimal` | `NOT NULL` |
| `month` | `Integer` | `NOT NULL` (1–12) |
| `year` | `Integer` | `NOT NULL`, column `budget_year` |
| `category` | `Category` | `@ManyToOne LAZY`, FK `category_id` |
| `user` | `User` | `@ManyToOne LAZY`, FK `user_id` |

---

### 3.5 `Role` (Enum)

```java
public enum Role {
    USER,
    ADMIN
}
```

Used in `User.role` to drive Spring Security authority grants (`ROLE_USER`, `ROLE_ADMIN`).

---

## 4. View Layer — DTOs

**Package:** `com.expensetracker.dto`  
**Role:** Shape the data going in (request) and out (response) of the API. Uses **Java Records** for immutability and conciseness. Decouples the internal entity model from the public API contract.

---

### 4.1 `ApiResponse<T>` — Universal Wrapper

Every controller endpoint returns `ResponseEntity<ApiResponse<T>>`.

```java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
```

**Example JSON:**
```json
{
  "success": true,
  "message": "Expense created",
  "data": { "id": 5, "amount": 49.99, ... }
}
```

---

### 4.2 `PagedResponse<T>` — Pagination Wrapper

Used by `ExpenseController` for paginated listing.

```java
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
```

---

### 4.3 Auth DTOs (`AuthDtos`)

| Record | Purpose |
|---|---|
| `AuthRequest` | Login: `email`, `password` |
| `RegisterRequest` | Registration: `firstName`, `lastName`, `email`, `password` |
| `AuthResponse` | JWT token string returned on success |

---

### 4.4 User DTOs

| Record | Purpose |
|---|---|
| `UserDTO` | Read projection: `id`, `firstName`, `lastName`, `email`, `role` |
| `UserProfileUpdateRequest` | Update name fields |
| `PasswordUpdateRequest` | `currentPassword`, `newPassword` |

---

### 4.5 Expense DTOs (`ExpenseDtos`)

| Record | Purpose |
|---|---|
| `ExpenseDTO` | Read: `id`, `amount`, `description`, `date`, `CategoryDTO`, `List<String> tags` |
| `ExpenseRequest` | Write: `@NotNull @Positive amount`, `description`, `@NotNull date`, `categoryId`, `tags` |

---

### 4.6 Budget DTOs (`BudgetDtos`)

| Record | Purpose |
|---|---|
| `BudgetDTO` | Read: `id`, `monthlyLimit`, `month`, `year`, `CategoryDTO`, spent amount |
| `BudgetRequest` | Write: `monthlyLimit`, `month`, `year`, `categoryId` |

---

## 5. Controller Layer

**Package:** `com.expensetracker.controller`  
**Role:** HTTP entry points. Each controller is a `@RestController`, handles `@RequestMapping`, validates input via `@Valid`, delegates all logic to a service, and wraps results in `ApiResponse<T>`. Controllers contain **zero business logic**.

---

### 5.1 `AuthController` — `/api/auth`

| Method | Path | Request Body | Description |
|---|---|---|---|
| `POST` | `/login` | `AuthRequest` | Authenticate and receive JWT |
| `POST` | `/register` | `RegisterRequest` | Create account and receive JWT |

---

### 5.2 `UserController` — `/api/users`

| Method | Path | Request Body | Description |
|---|---|---|---|
| `GET` | `/me` | — | Get current authenticated user profile |
| `PUT` | `/me` | `UserProfileUpdateRequest` | Update name fields |
| `PUT` | `/me/password` | `PasswordUpdateRequest` | Change password |

---

### 5.3 `ExpenseController` — `/api/expenses`

| Method | Path | Params / Body | Description |
|---|---|---|---|
| `GET` | `/` | `page`, `size`, `categoryId`, `from`, `to`, `tag` | Paginated, filtered expense list |
| `GET` | `/{id}` | — | Get single expense by ID |
| `POST` | `/` | `ExpenseRequest` | Create new expense |
| `PUT` | `/{id}` | `ExpenseRequest` | Update expense |
| `DELETE` | `/{id}` | — | Delete expense |

---

### 5.4 `BudgetController` — `/api/budgets`

| Method | Path | Request Body | Description |
|---|---|---|---|
| `GET` | `/` | — | List all budgets for current user |
| `GET` | `/{id}` | — | Get single budget |
| `POST` | `/` | `BudgetRequest` | Create budget |
| `PUT` | `/{id}` | `BudgetRequest` | Update budget |
| `DELETE` | `/{id}` | — | Delete budget |

---

### 5.5 `CategoryController` — `/api/categories`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all categories for current user |
| `GET` | `/{id}` | Get single category |
| `POST` | `/` | Create category |
| `PUT` | `/{id}` | Update category |
| `DELETE` | `/{id}` | Delete category |

---

### 5.6 `ReportController` — `/api/reports`

| Method | Path | Params | Description |
|---|---|---|---|
| `GET` | `/monthly` | `month`, `year` | Monthly summary (total, by category) |
| `GET` | `/yearly` | `year` | Yearly summary |
| `GET` | `/by-category` | `from`, `to` | Spending breakdown by category |
| `GET` | `/top-categories` | `from`, `to`, `limit` | Top N spending categories |

---

## 6. Service Layer

**Package:** `com.expensetracker.service`  
**Role:** All business logic lives here. Each domain has an **interface** (contract) and an **Impl** class (implementation), following the Dependency Inversion Principle.

---

### 6.1 `AuthService` / `AuthServiceImpl`

- `login(AuthRequest)` → validates credentials, generates JWT via `JwtUtil`
- `register(RegisterRequest)` → checks duplicate email, hashes password via `BCryptPasswordEncoder`, saves user, returns JWT

---

### 6.2 `UserService` / `UserServiceImpl`

- `getCurrentUser()` → reads from `SecurityContext`, maps to `UserDTO`
- `updateProfile(request)` → updates `firstName`/`lastName`
- `changePassword(request)` → verifies current password, encodes + saves new password

---

### 6.3 `ExpenseService` / `ExpenseServiceImpl`

- `getAllExpenses(page, size, categoryId, from, to, tag)` → builds JPA `Specification` for dynamic filtering
- `getExpenseById(id)` → ownership check
- `createExpense(request)` → resolves `Category`, links to current `User`, saves
- `updateExpense(id, request)` / `deleteExpense(id)` → ownership check then mutate

---

### 6.4 `BudgetService` / `BudgetServiceImpl`

- `getAllBudgets()` → list with computed `spent` amount pulled from `ExpenseRepository`
- `createBudget(request)` → enforces unique constraint `(user, category, month, year)`
- Standard ownership-checked CRUD

---

### 6.5 `CategoryService` / `CategoryServiceImpl`

- Full CRUD for user-scoped categories
- Enforces uniqueness of `(name, user)` at service level

---

### 6.6 `ReportService` / `ReportServiceImpl`

- `getMonthlySummary(month, year)` → total spend, per-category breakdown
- `getYearlySummary(year)` → month-by-month totals
- `getSpendingByCategory(from, to)` → category totals in date range
- `getTopCategories(from, to, limit)` → ranked top-N categories by spend

---

### 6.7 Mappers

**Package:** `com.expensetracker.mapper`

| Mapper | Converts |
|---|---|
| `UserMapper` | `User` → `UserDTO` |
| `ExpenseMapper` | `Expense` → `ExpenseDTO`, `ExpenseRequest` → `Expense` |
| `CategoryMapper` | `Category` → `CategoryDTO` |
| `BudgetMapper` | `Budget` → `BudgetDTO`, `BudgetRequest` → `Budget` |

---

## 7. Repository Layer

**Package:** `com.expensetracker.repository`  
**Role:** Data access via Spring Data JPA. All extend `JpaRepository<Entity, Long>`.

### `UserRepository`
```java
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
```

### `ExpenseRepository`
Also implements `JpaSpecificationExecutor<Expense>` for dynamic multi-criteria filtering.
```java
Page<Expense> findByUserId(Long userId, Pageable pageable);
Optional<Expense> findByIdAndUserId(Long id, Long userId);

// Budget spending calculation
@Query("SELECT SUM(e.amount) FROM Expense e WHERE ...")
BigDecimal sumAmountByUserIdAndCategoryIdAndMonthAndYear(...);

// Report aggregation
@Query("SELECT e.category.id, SUM(e.amount) ... GROUP BY e.category.id")
List<Object[]> sumAmountByCategoryAndDateRange(...);
```

### `CategoryRepository`
```java
List<Category> findByUserId(Long userId);
Optional<Category> findByIdAndUserId(Long id, Long userId);
boolean existsByNameAndUserId(String name, Long userId);
```

### `BudgetRepository`
```java
List<Budget> findByUserId(Long userId);
Optional<Budget> findByIdAndUserId(Long id, Long userId);
boolean existsByUserIdAndCategoryIdAndMonthAndYear(...);
```

---

## 8. Security Infrastructure

**Package:** `com.expensetracker.security` · `com.expensetracker.config`  
**Strategy:** Stateless JWT Bearer Token authentication. No sessions or cookies.

### JWT Filter Pipeline

```
Incoming Request
      │
      ▼
JwtAuthFilter (extends OncePerRequestFilter)
  ├─ Extract "Authorization: Bearer <token>" header
  ├─ JwtUtil.validateToken(token)
  ├─ JwtUtil.getUsernameFromToken(token) → email
  ├─ UserDetailsServiceImpl.loadUserByUsername(email)
  │     └─ Loads User from DB, wraps in CustomUserDetails
  └─ Set UsernamePasswordAuthenticationToken in SecurityContextHolder
      │
      ▼
  Controller executes with authenticated principal
```

### `CustomUserDetails`

Wraps the `User` entity to implement Spring Security's `UserDetails`:
- `getUsername()` → `user.getEmail()`
- `getAuthorities()` → `[ROLE_USER]` or `[ROLE_ADMIN]`
- `getUser()` → exposes raw entity for service use

### `SecurityConfig` — Access Rules

| Rule | Paths |
|---|---|
| **Public** | `POST /api/auth/login`, `POST /api/auth/register`, `/swagger-ui/**`, `/v3/api-docs/**` |
| **Authenticated** | All other `/api/**` routes |

---

## 9. Supporting Components

### `ExpenseTrackerApplication`
Spring Boot entry point with `@SpringBootApplication`.

### `OpenApiConfig`
Configures Springdoc/Swagger UI with global JWT `bearerAuth` security scheme. Access at `/swagger-ui/index.html`.

### `AuditConfig`
`@EnableJpaAuditing` — powers `@CreatedDate` / `@LastModifiedDate` on entities.

### Exception Handling
| Class | Behavior |
|---|---|
| `ResourceNotFoundException` | Thrown on missing / unauthorized entity; maps to HTTP 404 |

---

## 10. Database Schema & Migrations

**Tool:** Flyway (auto-runs on startup, `src/main/resources/db/migration/`)

| Version | Description |
|---|---|
| `V1` | Create `users` table |
| `V2` | Create `categories` table with `UNIQUE(name, user_id)` |
| `V3` | Create `expenses` table with `tags text[]` column |
| `V4` | Create `budgets` table with `UNIQUE(user_id, category_id, month, budget_year)` |
| `V5` | Insert default seed categories |
| `V6` | Remove default seed categories |
| `V7` | Make `expense.description` nullable |

---

## 11. Request Lifecycle — End-to-End Flow

**Example: `POST /api/expenses` (Create Expense)**

```
1. CLIENT → POST /api/expenses
   Headers: Authorization: Bearer eyJhbGci...
   Body: { "amount": 49.99, "date": "2026-04-09", "categoryId": 3, "tags": ["food"] }

2. JwtAuthFilter
   → Extracts + validates JWT
   → Loads User from DB via UserDetailsServiceImpl
   → Populates SecurityContextHolder

3. Spring routes to ExpenseController.createExpense()
   → @Valid validates ExpenseRequest (amount NotNull+Positive, date NotNull)
   → Calls expenseService.createExpense(request)

4. ExpenseServiceImpl.createExpense()
   → Gets current User from SecurityContext
   → Verifies category ownership (findByIdAndUserId)
   → Builds Expense entity, sets user + category + fields
   → Calls expenseRepository.save(expense)

5. ExpenseRepository
   → Hibernate: INSERT INTO expenses (...) VALUES (...)
   → AuditingEntityListener sets created_at, updated_at
   → Returns saved entity with generated ID

6. ExpenseMapper.toDto(expense) → ExpenseDTO

7. ExpenseController
   → ResponseEntity.status(201).body(new ApiResponse<>(true, "Expense created", dto))

8. CLIENT receives:
   HTTP 201 Created
   { "success": true, "message": "Expense created", "data": { "id": 42, ... } }
```

---

## 12. Entity Relationship Diagram

```
┌─────────────────────┐
│        users        │
│─────────────────────│
│ id (PK)             │
│ first_name          │
│ last_name           │
│ email (UNIQUE)      │
│ password            │
│ role                │
│ created_at          │
└──────────┬──────────┘
           │ 1
    ┌──────┼────────────────────────────────┐
    │ M    │ M                              │ M
    ▼      ▼                                ▼
┌──────────────────┐            ┌───────────────────────┐
│    categories    │            │       expenses        │
│──────────────────│            │───────────────────────│
│ id (PK)          │◀───────────│ id (PK)               │
│ name             │  1       M │ amount                │
│ color            │            │ description (nullable) │
│ icon             │            │ date                  │
│ user_id (FK)     │            │ category_id (FK)      │
│ created_at       │            │ user_id (FK)          │
└──────────┬───────┘            │ tags (text[])         │
           │ 1                  │ created_at            │
           │ M                  │ updated_at            │
           ▼                    └───────────────────────┘
┌──────────────────────────────┐
│           budgets            │
│──────────────────────────────│
│ id (PK)                      │
│ monthly_limit                │
│ month                        │
│ budget_year                  │
│ category_id (FK)             │
│ user_id (FK)                 │
│ UNIQUE(user,cat,month,year)  │
└──────────────────────────────┘
```

---

## 13. API Endpoint Reference

> All `/api/**` endpoints (except `/api/auth/**`) require `Authorization: Bearer <JWT>`.

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user, receive JWT |
| `POST` | `/api/auth/login` | ❌ | Login, receive JWT |

### Users — `/api/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | Get own profile |
| `PUT` | `/api/users/me` | ✅ | Update profile |
| `PUT` | `/api/users/me/password` | ✅ | Change password |

### Expenses — `/api/expenses`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/expenses` | ✅ | List expenses (paginated + filtered) |
| `GET` | `/api/expenses/{id}` | ✅ | Get single expense |
| `POST` | `/api/expenses` | ✅ | Create expense |
| `PUT` | `/api/expenses/{id}` | ✅ | Update expense |
| `DELETE` | `/api/expenses/{id}` | ✅ | Delete expense |

### Categories — `/api/categories`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/categories` | ✅ | List user's categories |
| `GET` | `/api/categories/{id}` | ✅ | Get single category |
| `POST` | `/api/categories` | ✅ | Create category |
| `PUT` | `/api/categories/{id}` | ✅ | Update category |
| `DELETE` | `/api/categories/{id}` | ✅ | Delete category |

### Budgets — `/api/budgets`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/budgets` | ✅ | List user's budgets |
| `GET` | `/api/budgets/{id}` | ✅ | Get single budget |
| `POST` | `/api/budgets` | ✅ | Create budget |
| `PUT` | `/api/budgets/{id}` | ✅ | Update budget |
| `DELETE` | `/api/budgets/{id}` | ✅ | Delete budget |

### Reports — `/api/reports`
| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/api/reports/monthly` | `month`, `year` | Monthly spending summary |
| `GET` | `/api/reports/yearly` | `year` | Year-over-year summary |
| `GET` | `/api/reports/by-category` | `from`, `to` | Spending by category |
| `GET` | `/api/reports/top-categories` | `from`, `to`, `limit` | Top N categories by spend |

---

*Generated: 2026-04-09 | Expense Tracker v1.0*
