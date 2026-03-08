# 🧭 Travel Route Planner (SPA)

## 📌 프로젝트 개요

React + Spring Boot 기반 싱글 페이지 웹 애플리케이션.

사용자가 여행 장소를 입력하면:
- Google Map에 마커가 생성된다.
- 마커는 순서를 가진다.
- 마커끼리 Polyline으로 연결된다.
- 날짜별로 여행 경로를 구분할 수 있다.
- 총 이동 거리를 자동 계산한다.
- 여행 기록은 저장된다.
- 이미지 업로드 시 갤러리형 게시판에 등록된다.

---

# 🏗 기술 스택

## Frontend
- React (Vite)
- Google Maps JavaScript API
- Axios
- React Router
- MUI or Tailwind (선택)

## Backend
- Spring Boot
- Spring Security (JWT)
- JPA (Hibernate)
- MySQL
- Multipart File Upload

## Infra (선택)
- AWS S3 (이미지 저장)
- Docker

---

# 🔐 기능 명세

## 1️⃣ 인증

### 회원가입
- 이메일
- 비밀번호
- 닉네임

### 로그인
- JWT 발급
- 토큰 기반 인증

---

## 2️⃣ 여행 기록

### 여행 생성
- 여행 제목
- 시작일
- 종료일

### 여행 상세

- 날짜별 경로 구분 가능
- 장소 추가 시:
    - 주소 검색 (Google Places API)
    - 위도/경도 자동 입력
    - 마커 순서 자동 증가

### 마커 기능

- 순서 입력 가능
- 순서 변경 시 자동 재정렬
- 마커 클릭 시 정보 표시

---

## 3️⃣ 지도 기능

### 마커 표시
- Google Map 위에 표시

### 경로 연결
- Polyline으로 마커 연결

### 거리 계산

- Haversine 공식 또는
- Google Directions API 활용

총 이동 거리:
- km 단위 표시
- 날짜별 거리 계산
- 전체 여행 거리 합산

---

## 4️⃣ 갤러리 게시판

### 게시글 작성
- 제목
- 내용
- 이미지 업로드 (다중 가능)

### 이미지 처리
- 서버 저장 후
- DB에는 이미지 URL 저장

### 게시판 UI
- 카드형 갤러리 레이아웃
- 클릭 시 상세보기

---

# 🗄 DB 설계 (ERD 초안)

## User
- id (PK)
- email
- password
- nickname
- created_at

## Trip
- id (PK)
- user_id (FK)
- title
- start_date
- end_date
- created_at

## TripDay
- id (PK)
- trip_id (FK)
- date

## Location
- id (PK)
- trip_day_id (FK)
- name
- latitude
- longitude
- order_index

## TripImage
- id (PK)
- trip_id (FK)
- image_url

---

# 📡 API 설계

## Auth

POST /api/auth/signup  
POST /api/auth/login

---

## Trip

GET /api/trips  
POST /api/trips  
GET /api/trips/{id}  
DELETE /api/trips/{id}

---

## Location

POST /api/trips/{tripId}/days/{dayId}/locations  
PUT /api/locations/{id}  
DELETE /api/locations/{id}

---

## Image

POST /api/trips/{tripId}/images  
GET /api/trips/{tripId}/images

---

# 🧠 MCP 개발용 프롬프트

아래 프롬프트를 MCP에 사용:

---

You are a senior full-stack engineer.

Build a production-ready Travel Route Planner with:

Frontend:
- React (Vite)
- Google Maps API
- Axios
- JWT authentication

Backend:
- Spring Boot
- MySQL
- JPA
- Spring Security (JWT)

Features:
1. User authentication
2. Create trips
3. Add locations per trip day
4. Assign order index to markers
5. Draw polyline between markers
6. Calculate total distance
7. Gallery-style image upload board
8. Date-based route grouping

Requirements:
- Clean architecture
- RESTful API
- Proper DTO separation
- Exception handling
- Validation
- Optimized DB indexing
- Production-ready folder structure

Generate:
- Full backend structure
- Entity classes
- Controller/Service/Repository
- Security configuration
- Frontend folder structure
- Google Maps integration example
- Distance calculation logic
- Image upload handling

---

# 🚀 추가 확장 아이디어

- 드래그로 마커 순서 변경
- 여행 공유 링크
- 좋아요 기능
- 댓글 기능
- 지도 테마 변경
- 여행 통계 시각화

---

# 📅 개발 단계 추천

1단계: 인증 + DB 연결  
2단계: 여행 CRUD  
3단계: 지도 마커 표시  
4단계: Polyline 연결  
5단계: 거리 계산  
6단계: 이미지 업로드  
7단계: UI 고도화

---

# 🎯 목표 수준

이 프로젝트는
- 주니어 서버 개발자 포트폴리오
- REST API 설계 능력 증명
- 지도 API 활용 능력 증명
- 파일 업로드 처리 경험

을 보여줄 수 있다.