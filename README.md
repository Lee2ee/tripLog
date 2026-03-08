# TripLog — 여행 경로 플래너

> 구글 지도 기반 여행 경로 관리 + 갤러리 게시판 웹 애플리케이션
> React + Spring Boot 풀스택 포트폴리오 프로젝트

---

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)
- [ERD](#erd)
- [API 명세](#api-명세)
- [실행 방법](#실행-방법)
- [환경 변수](#환경-변수)

---

## 프로젝트 소개

TripLog는 여행 경로를 날짜별로 관리하고, 구글 지도 위에 마커와 폴리라인으로 경로를 시각화하는 싱글 페이지 애플리케이션입니다.

- **날짜별 여행 경로 관리** — 여행 기간을 입력하면 날짜별 탭이 자동 생성됩니다.
- **구글 지도 연동** — 장소 추가 시 지도 위에 번호 마커가 표시되고 폴리라인으로 연결됩니다.
- **거리 자동 계산** — Haversine 공식으로 총 이동 거리를 km 단위로 표시합니다.
- **사진 갤러리** — 여행별 사진을 업로드·관리할 수 있습니다.
- **JWT 인증** — 회원가입/로그인 기반 인증으로 개인 데이터를 보호합니다.
- **관리자 페이지** — 회원·여행·이미지 전체 관리 기능을 제공합니다.

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 | UI 프레임워크 |
| Vite | 5 | 빌드 도구 |
| MUI (Material UI) | 5 | 컴포넌트 라이브러리 |
| React Router | 6 | 클라이언트 라우팅 |
| Axios | 1.6 | HTTP 클라이언트 |
| @react-google-maps/api | - | 구글 지도 연동 |

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Spring Boot | 3.2 | 웹 프레임워크 |
| Spring Security | - | 인증·인가 |
| Spring Data JPA | - | ORM |
| JJWT | 0.11.5 | JWT 토큰 생성·검증 |
| MySQL | 8 | 데이터베이스 |
| Lombok | - | 보일러플레이트 감소 |
| Gradle | 8.6 | 빌드 도구 |

---

## 주요 기능

### 회원 인증
- 이메일/비밀번호 회원가입 및 로그인
- JWT 액세스 토큰 발급 (만료 24시간)
- 토큰 기반 API 인증

### 여행 관리
- 여행 생성 (제목, 시작일, 종료일)
- 기간에 따라 날짜별 탭(TripDay) 자동 생성
- 여행 목록 카드 UI, 여행 삭제

### 지도 & 경로
- 날짜별 장소 추가 (이름, 위도, 경도, 순서)
- 구글 지도 위 번호 마커 표시
- 마커 클릭 시 장소 정보 팝업
- Polyline으로 경로 연결
- Haversine 공식으로 총 이동 거리 계산

### 갤러리 게시판
- 여행별 이미지 다중 업로드 (서버 로컬 저장)
- 카드형 그리드 레이아웃
- 클릭 시 이미지 확대 보기

### 관리자
- 전체 회원 목록 조회
- 회원 정보 수정 (이메일, 닉네임, 권한, 비밀번호 초기화)
- 회원 삭제 (관리자 계정 보호)
- 전체 여행·이미지 삭제
- 기본 관리자 계정 자동 생성 (`admin@triplog.com` / `admin1234`)

---

## 프로젝트 구조

```
tripLog/
├── backend/                          # Spring Boot
│   ├── build.gradle
│   └── src/main/java/com/triplog/
│       ├── TripLogApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java   # JWT + CORS 설정
│       │   ├── WebConfig.java        # 정적 리소스
│       │   └── DataInitializer.java  # 관리자 계정 초기화
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── TripController.java
│       │   ├── LocationController.java
│       │   ├── ImageController.java
│       │   └── AdminController.java
│       ├── service/
│       │   ├── AuthService.java
│       │   ├── TripService.java
│       │   ├── LocationService.java
│       │   ├── ImageService.java
│       │   └── AdminService.java
│       ├── entity/
│       │   ├── User.java
│       │   ├── Trip.java
│       │   ├── TripDay.java
│       │   ├── Location.java
│       │   ├── TripImage.java
│       │   └── Role.java
│       ├── dto/
│       │   ├── request/              # 요청 DTO
│       │   └── response/             # 응답 DTO
│       ├── repository/               # Spring Data JPA
│       ├── security/                 # JWT Filter / Provider
│       └── exception/                # 전역 예외 처리
│
└── frontend/                         # React + Vite
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                   # 라우팅 설정
        ├── main.jsx
        ├── api/axios.js              # Axios 인터셉터
        ├── store/authStore.js        # 인증 상태 (localStorage)
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── TripsPage.jsx
        │   ├── TripDetailPage.jsx
        │   ├── GalleryPage.jsx
        │   └── AdminPage.jsx
        └── components/
            ├── Map/
            │   ├── TripMap.jsx       # 구글 지도 + 폴리라인
            │   └── haversine.js      # 거리 계산
            ├── Trip/
            │   ├── CreateTripDialog.jsx
            │   └── AddLocationForm.jsx
            ├── Auth/
            │   ├── ProtectedRoute.jsx
            │   └── AdminRoute.jsx
            └── common/
                └── Navbar.jsx
```

---

## ERD

```
User (1) ──< Trip (1) ──< TripDay (1) ──< Location
                 │
                 └──< TripImage
```

| 테이블 | 주요 컬럼 |
|--------|-----------|
| `users` | id, email, password, nickname, role, created_at |
| `trip` | id, user_id(FK), title, start_date, end_date, created_at |
| `trip_day` | id, trip_id(FK), date |
| `location` | id, trip_day_id(FK), name, latitude, longitude, order_index |
| `trip_image` | id, trip_id(FK), image_url |

---

## API 명세

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) |

### 여행
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/trips` | 내 여행 목록 |
| POST | `/api/trips` | 여행 생성 |
| GET | `/api/trips/{id}` | 여행 상세 |
| DELETE | `/api/trips/{id}` | 여행 삭제 |

### 장소
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/trips/{tripId}/days/{dayId}/locations` | 장소 추가 |
| PUT | `/api/locations/{id}` | 장소 수정 |
| DELETE | `/api/locations/{id}` | 장소 삭제 |

### 이미지
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/trips/{tripId}/images` | 이미지 업로드 |
| GET | `/api/trips/{tripId}/images` | 이미지 목록 |

### 관리자 (ADMIN 권한 필요)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/users` | 전체 회원 목록 |
| GET | `/api/admin/users/{id}` | 회원 상세 |
| PUT | `/api/admin/users/{id}` | 회원 정보 수정 |
| PUT | `/api/admin/users/{id}/role` | 권한 변경 |
| DELETE | `/api/admin/users/{id}` | 회원 삭제 |
| GET | `/api/admin/trips` | 전체 여행 목록 |
| DELETE | `/api/admin/trips/{id}` | 여행 삭제 |
| GET | `/api/admin/images` | 전체 이미지 목록 |
| DELETE | `/api/admin/images/{id}` | 이미지 삭제 |

---

## 실행 방법

### 사전 요구사항

- Java 17+
- Node.js 18+
- MySQL 8+

### 1. 데이터베이스 생성

```sql
CREATE DATABASE triplog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 백엔드 설정

`backend/src/main/resources/application.yml` 수정:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/triplog?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8
    username: root
    password: YOUR_MYSQL_PASSWORD   # ← 변경
```

백엔드 실행:

```bash
cd backend
./gradlew bootRun
```

> 최초 실행 시 관리자 계정이 자동 생성됩니다.
> `admin@triplog.com` / `admin1234`

### 3. 프론트엔드 설정

```bash
cd frontend
cp .env.example .env
```

`.env` 파일 수정:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY   # ← 변경
```

프론트엔드 실행:

```bash
npm install
npm run dev
```

### 4. 접속

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:8080 |

---

## 환경 변수

### Backend (`application.yml`)

| 키 | 기본값 | 설명 |
|----|--------|------|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/triplog` | DB 연결 URL |
| `spring.datasource.username` | `root` | DB 사용자명 |
| `spring.datasource.password` | `password` | DB 비밀번호 |
| `jwt.secret` | (내장값) | JWT 서명 키 (운영환경에서 반드시 변경) |
| `jwt.expiration` | `86400000` | 토큰 만료 시간 (ms, 기본 24시간) |
| `file.upload-dir` | `./uploads` | 이미지 저장 경로 |

### Frontend (`.env`)

| 키 | 설명 |
|----|------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API 키 |

---

## 라이선스

MIT License
