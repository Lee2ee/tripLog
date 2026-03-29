# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Spring Boot)
```bash
cd backend
./gradlew bootRun       # Start dev server on :8080
./gradlew build         # Build JAR
./gradlew test          # Run all tests
./gradlew test --tests "com.triplog.SomeTest"  # Run single test class
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev             # Start dev server on :5173
npm run build           # Production build
npm run preview         # Preview production build
```

### Database Setup (first time only)
```sql
CREATE DATABASE triplog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Default credentials in `application.yml`: root / 1234. Update as needed.

Default admin account auto-created on first run: `admin@triplog.com` / `admin1234`

## Architecture

### Request Flow
```
Browser (:5173) → Vite proxy → Spring Boot (:8080) → MySQL
```
Vite proxies `/api/*` and `/uploads/*` to `localhost:8080` during development, so there are no CORS issues in dev.

### Authentication
- Stateless JWT (HS256, 24h expiry) stored in `localStorage` under keys `triplog_token` and `triplog_user`
- All `/api/**` routes require a valid JWT except `/api/auth/**` and `/uploads/**`
- JWT filter (`JwtAuthenticationFilter`) runs before `UsernamePasswordAuthenticationFilter`
- Frontend auth state managed in `frontend/src/store/authStore.js` (plain module, no Redux/Zustand)
- `ProtectedRoute` wraps user routes; `AdminRoute` wraps `/admin` (checks `user.role === 'ADMIN'`)

### Data Model
```
User (1) ──< Trip (1) ──< TripDay (1) ──< Location
     └──< TripImage
```
JPA DDL auto-mode is `update` — schema changes are applied automatically on startup.

### File Uploads
- Images uploaded via multipart POST, stored on disk at `./uploads/` (relative to backend root)
- Served publicly at `/uploads/**` with no auth required
- Max file: 10MB, max request: 50MB

### Key Directories
- `backend/src/main/java/com/triplog/security/` — JWT provider + filter + UserDetailsService
- `backend/src/main/java/com/triplog/config/` — SecurityConfig (CORS, route rules), WebConfig
- `backend/src/main/java/com/triplog/exception/` — CustomException + GlobalExceptionHandler
- `frontend/src/store/authStore.js` — client-side auth state (localStorage)
- `frontend/src/api/axios.js` — Axios instance with JWT header injection
- `frontend/src/components/Map/` — Google Maps integration + Haversine distance calc
