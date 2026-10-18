 # TripLog 기술 면접 준비 가이드

> 구글 지도 기반 여행 경로 플래너 - Spring Boot + React 풀스택 포트폴리오 프로젝트

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 선택 이유](#2-기술-스택-선택-이유)
3. [배포 환경 및 선택 이유](#3-배포-환경-및-선택-이유)
4. [백엔드 면접 질문 & 답변](#4-백엔드-면접-질문--답변)
5. [프론트엔드 면접 질문 & 답변](#5-프론트엔드-면접-질문--답변)
6. [공통 / 아키텍처 면접 질문 & 답변](#6-공통--아키텍처-면접-질문--답변)

---

## 1. 프로젝트 개요

**TripLog**는 여행 일정을 관리하고 구글 지도 위에 경로를 시각화하는 웹 애플리케이션입니다.

### 핵심 기능

- 날짜별 여행 경로 등록 및 지도 시각화
- Haversine 공식 기반 이동 거리 자동 계산
- 카카오 소셜 로그인 (OAuth2)
- 여행 공동 작업 (멤버 초대/관리)
- 이미지 업로드 (Cloudinary 클라우드 저장소)
- 공개 여행 탐색, 좋아요, 위시리스트
- 관리자 페이지 (회원/여행/업로드 제한 설정)

---

## 2. 기술 스택 선택 이유

### 백엔드

| 기술 | 선택 이유 | 고려한 대안 |
|------|----------|-----------|
| **Spring Boot 3.2** | Java 생태계 표준 프레임워크, 방대한 커뮤니티, Java 17 LTS 지원 | Spring MVC, Quarkus |
| **Spring Security** | 인증/인가의 업계 표준, JWT·OAuth2 통합 지원 내장 | Apache Shiro, 직접 구현 |
| **JJWT 0.11.5** | 경량 라이브러리, HS256 서명 지원, Spring Boot와 궁합 좋음 | Auth0 java-jwt, Nimbus JOSE |
| **Spring Data JPA** | ORM 표준, 반복적인 CRUD 코드 최소화, 자동 스키마 관리 | MyBatis, jOOQ, JDBC |
| **MySQL 8** | 안정성·성능 검증된 RDBMS, 조인·트랜잭션 지원 | PostgreSQL, MongoDB |
| **Cloudinary** | 이미지 CDN 통합 무료 플랜, 클라우드 저장소로 서버 의존성 제거 | AWS S3, 로컬 파일시스템 |
| **Lombok** | 보일러플레이트(getter, builder 등) 자동 생성, 코드 가독성 향상 | Record (Java 16+) |
| **Docker** | 환경 일관성 보장, CI/CD 배포 단순화, Render 플랫폼 지원 | JAR 직접 배포 |

### 프론트엔드

| 기술 | 선택 이유 | 고려한 대안 |
|------|----------|-----------|
| **React 18** | 컴포넌트 재사용성, 국내외 채용 수요 1위, Suspense·Concurrent 기능 | Vue 3, Svelte |
| **Vite 5** | Webpack 대비 10배 이상 빠른 HMR, 빌드 속도 최적화 | Create React App, Webpack |
| **MUI 5** | 접근성 내장, 풍부한 컴포넌트, Material Design 일관성 | Tailwind, Chakra UI |
| **React Router 6** | SPA 클라이언트 라우팅 표준, Nested Route 지원 | TanStack Router |
| **Axios** | 인터셉터 기능으로 JWT 자동 첨부·401 처리 구현 용이 | Fetch API |
| **@react-google-maps/api** | Google Maps JavaScript API의 React 공식 래퍼 | Mapbox, Naver Map |

---

## 3. 배포 환경 및 선택 이유

### 배포 아키텍처

```
사용자 브라우저
    │
    ├── https://trip-log-eta.vercel.app  (프론트엔드 - Vercel)
    │       └── React SPA (정적 파일)
    │
    └── https://triplog-backend-nte4.onrender.com  (백엔드 - Render)
            └── Spring Boot Docker 컨테이너
                    └── TiDB Cloud (MySQL 호환 DB)
                    └── Cloudinary (이미지 저장소)
```

### 플랫폼별 선택 이유

#### Vercel (프론트엔드)
- **선택 이유**: React/Next.js SPA 배포에 최적화, GitHub 연동 자동 배포, 전 세계 CDN 엣지, 무료 플랜 넉넉함
- **SPA 라우팅 처리**: `vercel.json`의 rewrites 설정으로 모든 경로를 `index.html`로 라우팅
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

#### Render (백엔드)
- **선택 이유**: Docker 컨테이너 지원, GitHub 연동 자동 배포, 무료 플랜 (Sleep 기능 있음)
- **Sleep 문제 해결**: 앱 초기 진입 시 헬스체크 API 선호출로 수면 해제
  ```js
  // App.jsx - 앱 진입 시 백엔드 미리 깨우기
  fetch(`${import.meta.env.VITE_API_URL}/api/auth/health`).catch(() => {});
  ```
- **헬스체크 엔드포인트**: `GET /api/auth/health` → 200 OK 반환

#### TiDB Cloud (데이터베이스)
- **선택 이유**: MySQL 100% 호환, 무료 Serverless 플랜, 글로벌 분산 처리
- **연결 유지 문제**: TiDB 유휴 커넥션 10분 타임아웃 → HikariCP 설정으로 해결
  ```yaml
  hikari:
    max-lifetime: 540000    # 9분 (10분보다 짧게)
    keepalive-time: 300000  # 5분마다 핑
  ```

#### Cloudinary (이미지 저장소)
- **선택 이유**: Render 무료 플랜은 디스크 저장 불가 (재배포 시 초기화), CDN 통합, 무료 25GB
- **대체 이유**: 기존 로컬 파일시스템(`./uploads/`) → 클라우드 저장소로 마이그레이션

### Railway에서 Render로 전환한 이유
- Railway 체험 크레딧 소진 후 유료 전환 필요 → Render의 완전 무료 플랜으로 전환

---

## 4. 백엔드 면접 질문 & 답변

---

### Q1. JWT를 왜 선택했나요? Session 방식과 비교해서 설명해주세요.

**답변:**

JWT(Stateless)를 선택한 이유는 세 가지입니다.

1. **서버 확장성**: Session은 서버 메모리나 공유 저장소(Redis)가 필요하지만, JWT는 토큰 자체에 정보가 담겨 있어 서버를 수평 확장해도 별도 동기화가 필요 없습니다.
2. **SPA/모바일 친화적**: React SPA에서는 쿠키보다 Authorization 헤더가 관리하기 편하고, 모바일 앱과도 동일한 방식으로 통신 가능합니다.
3. **OAuth2 연동 용이**: 카카오 OAuth2 인증 후 JWT를 발급해 리다이렉트하는 방식이 Session보다 구현이 단순합니다.

**트레이드오프:**
- 토큰 크기가 Session ID보다 큼 (헤더에 매 요청 포함)
- 토큰 탈취 시 만료 전까지 폐기 불가 (블랙리스트 구현 필요)
- HTTPS 필수

> **이 프로젝트에서**: 만료 시간 24시간, JWT_SECRET 환경변수 외부화, HTTPS 사용으로 보완했습니다.

---

**꼬리질문: JWT 토큰이 탈취되면 어떻게 처리하나요?**

현재 구현은 토큰 블랙리스트가 없어, 탈취 시 만료(24시간)까지 유효합니다. 실제 서비스라면:
- Redis에 블랙리스트 저장 (로그아웃 시 토큰 등록)
- Refresh Token + Access Token 이중 구조 (Access Token 수명 15분)
- 민감한 작업(비밀번호 변경 등)은 재인증 요구

포트폴리오 프로젝트 수준에서는 HTTPS와 짧은 토큰 수명으로 위험을 최소화했습니다.

---

**꼬리질문: HS256과 RS256의 차이는?**

- **HS256(HMAC-SHA256)**: 하나의 비밀키로 서명과 검증 모두 처리. 서버가 단일할 때 적합. 이 프로젝트에서 사용.
- **RS256(RSA-SHA256)**: 개인키로 서명, 공개키로 검증. 마이크로서비스 환경에서 각 서비스가 공개키만 가지고 검증 가능.

단일 백엔드 서버이므로 HS256으로 충분했습니다.

---

### Q2. Spring Security 필터 체인을 어떻게 구성했나요?

**답변:**

요청이 들어오면 다음 순서로 필터가 실행됩니다:

```
HTTP 요청
    → CORS 필터 (preflight 요청 처리)
    → JwtAuthenticationFilter (토큰 검증 및 SecurityContext 설정)
    → UsernamePasswordAuthenticationFilter (OAuth2 플로우)
    → DispatcherServlet (컨트롤러)
```

`JwtAuthenticationFilter`는 `OncePerRequestFilter`를 상속해 **요청당 한 번만 실행**되도록 보장합니다.

토큰이 유효하면 `SecurityContextHolder`에 인증 정보를 설정하고, 유효하지 않으면 예외를 로깅하고 다음 필터로 진행합니다(예외를 던지지 않는 이유: 공개 API는 인증 없이도 접근 가능해야 하므로).

---

**꼬리질문: SecurityContext는 언제 초기화되나요?**

Spring Security는 기본적으로 `SecurityContextPersistenceFilter`가 요청 시작 시 SecurityContext를 로드하고, 응답 후 초기화합니다. Stateless JWT 방식에서는 `SessionCreationPolicy.STATELESS`로 설정해 Session에 SecurityContext를 저장하지 않습니다. 따라서 매 요청마다 JWT 필터가 SecurityContext를 새로 구성합니다.

---

**꼬리질문: permitAll()과 anonymous()의 차이는?**

- `permitAll()`: 인증 여부와 상관없이 모든 요청 허용
- `anonymous()`: 인증되지 않은(익명) 사용자만 허용, 인증된 사용자는 허용 안 함 (예: 로그인 페이지)

공개 여행 조회 API는 로그인한 사용자도 비로그인 사용자도 모두 볼 수 있어야 하므로 `permitAll()`을 사용했습니다.

---

### Q3. Kakao OAuth2 로그인 흐름을 설명해주세요.

**답변:**

```
1. 프론트엔드 → /oauth2/authorization/kakao (Spring Security가 처리)
2. Spring Security → 카카오 인증 서버로 리다이렉트
3. 사용자가 카카오 동의 후 → /login/oauth2/code/kakao?code=... (콜백)
4. KakaoOAuth2UserService.loadUser() 실행
   - providerId, email, nickname 추출
   - 신규 사용자면 DB에 저장, 기존이면 조회
5. OAuth2AuthenticationSuccessHandler 실행
   - JWT 토큰 생성
   - 프론트엔드로 리다이렉트: /oauth/callback?token=...
6. 프론트엔드 OAuthCallbackPage에서 token 파싱 후 localStorage 저장
```

**이중 로그인 방식:**
- 일반 사용자: 카카오 OAuth2 전용
- 관리자: 이메일/비밀번호 (`POST /api/auth/admin/login`), 허용 IP 제한

---

**꼬리질문: 같은 이메일로 카카오와 일반 가입이 겹치면 어떻게 처리하나요?**

`KakaoOAuth2UserService`에서 이메일로 기존 사용자를 조회할 때, `provider == LOCAL`인 사용자가 이미 있으면 예외를 던져 연동을 막습니다. 이를 통해 이메일 혼용(다른 사용자 계정 접근)을 방지합니다.

실제 서비스라면 "이미 가입된 이메일입니다. 기존 계정과 연동하시겠습니까?" 같은 계정 연동 플로우를 구현할 수 있습니다.

---

**꼬리질문: 카카오 사용자의 password 필드는 어떻게 처리했나요?**

`User` 엔티티의 `password` 필드는 NOT NULL 제약이 있어, OAuth2 사용자를 저장할 때 의미 없는 값을 채워야 합니다. `{noop}KAKAO_{providerId}` 형식으로 저장하고, `{noop}` 접두사 덕분에 Spring Security가 비밀번호 인코딩 검증을 건너뜁니다.

더 깔끔한 방법은 password 컬럼을 nullable로 변경하거나, OAuth 전용 UserDetailsService를 분리하는 것입니다.

---

### Q4. Trip의 ID를 Long 대신 UUID로 선택한 이유는?

**답변:**

세 가지 이유로 UUID를 선택했습니다.

1. **보안**: Long ID는 순차적이라 URL에서 다른 사용자 데이터를 추측하기 쉽습니다 (`/trips/1`, `/trips/2`...). UUID는 예측 불가능합니다.
2. **분산 환경**: 여러 서버나 DB 샤딩 환경에서 UUID는 중앙 카운터 없이 전역 고유 ID를 생성할 수 있습니다.
3. **RESTful 설계**: 리소스 식별자가 내부 구현(DB 순번)을 노출하지 않는 것이 좋습니다.

**구현:**
```java
@UuidGenerator
@Column(columnDefinition = "VARCHAR(36)")
private UUID id;
```
`preferred_uuid_jdbc_type: varchar`로 DB에 문자열로 저장해 MySQL 호환성을 높였습니다.

---

**꼬리질문: UUID 사용 시 성능 문제는 없나요?**

UUID는 랜덤값이라 B-Tree 인덱스에서 삽입 시 페이지 분할이 자주 발생해 Long보다 느릴 수 있습니다. 해결책으로:
- **UUID v7 (Sequential UUID)**: 타임스탬프 기반 단조 증가 UUID → 인덱스 효율성 유지
- **ULID**: UUID보다 짧고 정렬 가능한 ID

포트폴리오 규모에서는 성능 차이가 무시할 수준이라 표준 UUID를 사용했습니다.

---

### Q5. N+1 문제를 어떻게 방지했나요?

**답변:**

JPA의 `FetchType.LAZY`를 기본값으로 설정하고, 필요한 경우 커스텀 JPQL 쿼리로 한 번에 조회합니다.

**예시 - 멤버 여행 목록 조회:**
```java
@Query("SELECT DISTINCT t FROM Trip t JOIN t.members m WHERE m.id = :userId ORDER BY t.createdAt DESC")
List<Trip> findMemberTripsByUserId(@Param("userId") Long userId);
```

`DISTINCT`로 ManyToMany 조인 시 중복 행을 제거합니다.

**N+1이 발생할 수 있는 곳:**
- `trip.getMembers()` 호출 시 → LAZY 로딩으로 추가 쿼리 발생
- 해결: 여행 목록 조회 시 필요한 연관 데이터를 `JOIN FETCH`로 함께 조회

---

**꼬리질문: EAGER와 LAZY 로딩의 차이와 언제 각각 사용하나요?**

- **EAGER**: 엔티티 조회 시 연관 엔티티를 즉시 조인해서 함께 로딩. 항상 필요한 데이터에 적합하지만, 불필요한 조인이 발생할 수 있습니다.
- **LAZY**: 연관 엔티티에 실제 접근할 때 추가 쿼리 실행. 기본값으로 권장됩니다.

`@ManyToOne`은 기본값이 EAGER라 명시적으로 LAZY로 변경해야 합니다. `@OneToMany`는 기본값이 LAZY입니다.

---

**꼬리질문: `ddl-auto: update`를 프로덕션에서 사용해도 되나요?**

권장하지 않습니다. `update`는 스키마를 추가만 하고 컬럼 삭제·타입 변경은 처리하지 않아 의도치 않은 상태가 될 수 있습니다. 프로덕션에서는:
- `validate`: 스키마가 엔티티와 일치하는지 검증만 (변경 안 함)
- Flyway/Liquibase: 마이그레이션 버전 관리

포트폴리오 프로젝트라 편의상 `update`를 사용했지만, 실무에서는 Flyway 사용이 표준입니다.

---

### Q6. 파일 업로드 보안을 어떻게 구현했나요?

**답변:**

세 가지 레이어로 보호합니다:

**1. 입력 검증**
```java
String contentType = file.getContentType();
if (contentType == null || !contentType.startsWith("image/")) {
    throw CustomException.badRequest("이미지 파일만 업로드 가능합니다");
}
```

**2. 크기 제한**
```yaml
multipart:
  max-file-size: 10MB
  max-request-size: 50MB
```

**3. 레이트 리미팅 (슬라이딩 윈도우 방식)**
```java
// 분당 20회 제한
private final ConcurrentHashMap<String, Deque<Long>> log = new ConcurrentHashMap<>();

public boolean tryAcquire(String userKey) {
    Deque<Long> timestamps = log.computeIfAbsent(userKey, k -> new ArrayDeque<>());
    synchronized (timestamps) {
        long cutoff = now - WINDOW_MS;
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();  // 윈도우 밖 제거
        }
        if (timestamps.size() >= MAX_UPLOADS_PER_MINUTE) return false;
        timestamps.addLast(now);
        return true;
    }
}
```

---

**꼬리질문: 고정 윈도우와 슬라이딩 윈도우 레이트 리미팅의 차이는?**

- **고정 윈도우**: 1분 단위로 카운트 초기화. 경계(59초~61초)에 2배 요청 가능.
- **슬라이딩 윈도우**: 현재 시각 기준 1분 내 실제 요청만 카운트. 더 정확한 제한.

이 프로젝트는 슬라이딩 윈도우로 구현했습니다. 메모리 누수 방지를 위해 `@Scheduled` 클린업 스케줄러가 5분마다 오래된 데이터를 정리합니다.

---

**꼬리질문: Content-Type 검증만으로 파일 타입을 신뢰할 수 있나요?**

아닙니다. Content-Type은 클라이언트가 조작할 수 있습니다. 더 안전한 방법은:
- **Magic bytes 검증**: 파일 앞 몇 바이트(시그니처)로 실제 파일 타입 확인 (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`)
- **Apache Tika** 라이브러리로 MIME 타입 자동 감지

현재 구현은 Cloudinary가 서버 측에서 이미지 처리를 시도하면서 비이미지 파일이 걸러지지만, 프로덕션에서는 Magic bytes 검증 추가를 권장합니다.

---

### Q7. 관리자 IP 제한을 어떻게 구현했나요?

**답변:**

```java
// AuthService.adminLogin()
String xForwardedFor = request.getHeader("X-Forwarded-For");
String clientIp = (xForwardedFor != null)
    ? xForwardedFor.split(",")[0].trim()  // 프록시 체인에서 첫 번째 IP
    : request.getRemoteAddr();

List<String> allowedIps = Arrays.asList(adminAllowedIps.split(","));
if (!allowedIps.contains(clientIp)) {
    throw CustomException.forbidden("접근이 허용되지 않는 IP입니다: " + clientIp);
}
```

`application.yml`에서 환경변수로 허용 IP 목록 관리:
```yaml
admin:
  allowed-ips: ${ADMIN_ALLOWED_IPS:127.0.0.1,0:0:0:0:0:0:0:1}
```

IPv4 (`127.0.0.1`)와 IPv6 (`0:0:0:0:0:0:0:1`) 로컬호스트 모두 지원합니다.

---

**꼬리질문: X-Forwarded-For 헤더를 신뢰하면 IP 위조 위험이 있지 않나요?**

맞습니다. 클라이언트가 `X-Forwarded-For` 헤더를 직접 조작할 수 있습니다. 안전한 방법:
- 신뢰할 수 있는 프록시(Nginx, Render 로드밸런서)만 이 헤더를 주입하도록 설정
- `RemoteAddr`는 직접 TCP 연결 IP라 조작 불가
- Spring Boot 2.7+에서는 `server.forward-headers-strategy: NATIVE`로 프록시 설정 위임 가능

Render 환경에서는 로드밸런서가 추가하는 헤더만 신뢰하므로 실용적 수준에서 안전합니다.

---

### Q8. 전역 예외 처리는 어떻게 설계했나요?

**답변:**

```java
// CustomException - 비즈니스 예외
public static CustomException notFound(String message)      // 404
public static CustomException badRequest(String message)    // 400
public static CustomException forbidden(String message)     // 403
public static CustomException conflict(String message)      // 409
public static CustomException tooManyRequests(String message) // 429

// GlobalExceptionHandler (@RestControllerAdvice)
@ExceptionHandler(CustomException.class)          // 비즈니스 예외 처리
@ExceptionHandler(MethodArgumentNotValidException.class) // @Valid 검증 실패
@ExceptionHandler(MaxUploadSizeExceededException.class)  // 파일 크기 초과
@ExceptionHandler(Exception.class)                // 그 외 서버 오류 (500)
```

모든 예외를 `ApiResponse` 형식으로 통일해 프론트엔드가 일관되게 처리할 수 있습니다:
```json
{ "success": false, "message": "오류 메시지", "data": null }
```

---

**꼬리질문: `@ControllerAdvice`와 `@RestControllerAdvice`의 차이는?**

- `@ControllerAdvice`: MVC 뷰를 반환하는 컨트롤러에 적용
- `@RestControllerAdvice`: `@ControllerAdvice + @ResponseBody` 조합. JSON 응답을 반환하는 REST API에 적합

이 프로젝트는 REST API이므로 `@RestControllerAdvice`를 사용했습니다.

---

### Q9. 트랜잭션을 어떻게 관리했나요?

**답변:**

Service 레이어 메서드에 `@Transactional`을 적용했습니다.

**주요 적용 사례:**

```java
// 여행 생성 - TripDay 일괄 생성과 원자적 처리
@Transactional
public TripResponse createTrip(TripRequest request, String email) {
    Trip trip = tripRepository.save(...);
    List<TripDay> tripDays = new ArrayList<>();
    // startDate ~ endDate 반복하여 TripDay 생성
    tripDayRepository.saveAll(tripDays); // 부분 실패 방지
    return mapToTripSummary(trip, email);
}

// 멤버 초대 - 멤버 추가 + 알림 생성 원자적 처리
@Transactional
public TripMemberResponse inviteMemberById(UUID tripId, Long inviteeId, String email) {
    trip.getMembers().add(invitee);
    tripRepository.save(trip);
    notificationRepository.save(notification); // 함께 커밋
}
```

**읽기 전용 최적화:**
```java
@Transactional(readOnly = true)
public List<TripResponse> getUserTrips(String email) { ... }
```
`readOnly = true`는 Hibernate의 dirty checking(변경 감지)을 비활성화해 성능을 향상시킵니다.

---

**꼬리질문: 트랜잭션 전파(Propagation)를 사용한 적이 있나요?**

기본값인 `REQUIRED`를 사용했습니다. 호출자 트랜잭션이 있으면 참여하고, 없으면 새로 생성합니다.

예를 들어 `TripService.deleteTrip()`이 내부적으로 `LocationService.deleteLocation()`을 호출할 때, 두 메서드가 같은 트랜잭션 안에서 실행됩니다.

`REQUIRES_NEW`는 별도 트랜잭션 생성(예: 감사 로그를 메인 트랜잭션 실패와 무관하게 저장할 때), `NESTED`는 중첩 트랜잭션(부분 롤백)에 사용합니다.

---

### Q10. CORS를 어떻게 처리했나요?

**답변:**

Spring Security의 `CorsConfigurationSource`로 전역 설정했습니다:

```java
configuration.setAllowedOrigins(Arrays.asList(corsAllowedOrigins.split(",")));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
configuration.setExposedHeaders(List.of("Authorization"));
configuration.setMaxAge(3600L); // preflight 캐싱 1시간
```

Origin은 `${CORS_ALLOWED_ORIGINS}` 환경변수로 외부화해, 프로덕션에서 Vercel 도메인만 허용합니다.

**개발 환경**: Vite 프록시(`/api` → `localhost:8080`)로 CORS 자체를 우회합니다.

---

**꼬리질문: preflight 요청이란 무엇인가요?**

브라우저가 Cross-Origin 요청(특히 PUT, DELETE, 커스텀 헤더 포함) 전에 먼저 `OPTIONS` 메서드로 보내는 사전 요청입니다. 서버가 이 Origin에서의 요청을 허용하는지 확인합니다.

`maxAge: 3600`은 브라우저가 preflight 응답을 1시간 캐시하도록 설정해, 같은 요청의 반복적인 OPTIONS 요청을 줄입니다.

---

### Q11. HikariCP 커넥션 풀 설정을 어떻게 했나요?

**답변:**

TiDB Cloud는 유휴 커넥션을 10분 후 강제 종료합니다. 이를 방지하기 위해:

```yaml
hikari:
  max-lifetime: 540000    # 9분 - TiDB 타임아웃(10분)보다 짧게 설정
  connection-timeout: 30000  # 커넥션 획득 최대 30초 대기
  keepalive-time: 300000  # 5분마다 테스트 쿼리로 커넥션 유지
```

- **max-lifetime**: 풀에서 커넥션의 최대 수명. DB 타임아웃보다 짧게 설정해 HikariCP가 먼저 교체
- **keepalive-time**: 유휴 커넥션에 주기적으로 `SELECT 1` 쿼리 전송

초기 배포 시 `HikariPool-1 - Connection is not available` 오류가 발생했고, 위 설정으로 해결했습니다.

---

**꼬리질문: 커넥션 풀 크기는 어떻게 결정하나요?**

HikariCP 기본값은 10개입니다. 공식에 따르면:

```
최적 풀 크기 = (CPU 코어 수 × 2) + 디스크 수
```

실제로는 애플리케이션의 동시 요청 수와 DB 쿼리 시간을 측정해 튜닝합니다. 너무 많은 커넥션은 DB 오버헤드와 메모리 낭비를 초래합니다.

Render 무료 플랜의 제한적인 리소스를 고려해 기본값(10)을 유지했습니다.

---

## 5. 프론트엔드 면접 질문 & 답변

---

### Q12. localStorage에 JWT를 저장하는 방식의 보안 위험은?

**답변:**

localStorage는 **XSS(Cross-Site Scripting)** 공격에 취약합니다. 악성 스크립트가 주입되면 `localStorage.getItem('triplog_token')`으로 토큰을 탈취할 수 있습니다.

**더 안전한 대안: HttpOnly 쿠키**
- JavaScript에서 접근 불가
- CSRF 공격에 취약 (SameSite 설정으로 완화 가능)

**이 프로젝트에서 localStorage를 선택한 이유:**
1. React SPA + REST API 구조에서 구현이 단순
2. CSRF 공격에서 자유로움
3. XSS 방지는 React가 기본적으로 지원 (dangerouslySetInnerHTML 미사용)

실제 금융·의료 서비스라면 HttpOnly 쿠키 + CSRF 토큰 방식을 권장합니다.

---

### Q13. Axios 인터셉터를 왜 사용했나요?

**답변:**

모든 API 요청에 공통 로직을 적용하기 위해 사용했습니다:

**Request 인터셉터**: 모든 요청에 JWT 헤더 자동 첨부
```js
config.headers['Authorization'] = `Bearer ${getToken()}`;
```

**Response 인터셉터**: 401 응답 시 자동 로그아웃 + 리다이렉트
```js
if (error.response?.status === 401) {
  logout();
  window.location.href = '/login';
}
```

인터셉터 없이는 모든 API 호출 코드에 반복적으로 토큰 첨부 로직을 작성해야 합니다. 관심사 분리(Separation of Concerns)로 유지보수성을 높였습니다.

---

### Q14-1. 장소 검색 API를 어떻게 설계했나요? TomTom 대신 Google Places를 선택한 이유는?

**답변:**

장소 검색은 **Google Places API (New) → TomTom → Photon** 순서의 폴백 체인으로 구성했습니다.

**TomTom에서 Google Places로 전환한 이유:**

TomTom으로 일본 음식점(예: "ハルモ 天神今泉公園前店")을 검색했을 때 전혀 무관한 결과("株式会社マルト泉店")가 반환되는 문제가 있었습니다. TomTom은 아시아 소규모 POI 데이터 품질이 낮은 반면, Google Places는 전 세계 POI 커버리지가 압도적으로 높습니다.

```js
// Google Places API (New) — POST 방식, 국가별 언어 자동 적용
const body = {
  textQuery: query,
  languageCode: COUNTRY_LANGUAGE[countryCode] || 'ko', // JP → 'ja'
  regionCode: countryCode,  // 국가 필터링
  maxResultCount: 6,
};
fetch('https://places.googleapis.com/v1/places:searchText', {
  method: 'POST',
  headers: {
    'X-Goog-Api-Key': GOOGLE_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
  },
  body: JSON.stringify(body),
});
```

**API 호출 최적화 — 두 가지 방법을 조합했습니다:**

1. **버튼 클릭 시에만 검색**: 기존에는 400ms 디바운스로 타이핑마다 API를 호출했습니다. "ハルモ 天神今泉公園前店" 같은 긴 이름을 입력하면 10회 이상 호출됩니다. 검색 버튼(또는 Enter)을 눌러야만 호출하도록 변경해 API 호출을 1회로 줄였습니다.

2. **세션 캐시**: 모듈 레벨 `Map`으로 `"쿼리|국가코드"` 키 기반 캐시를 구현했습니다. 같은 검색어를 반복 입력해도 API 재호출 없이 즉시 반환합니다.

```js
const cache = new Map();

export async function searchPlaces(query, countryCode = '') {
  const cacheKey = `${query.trim().toLowerCase()}|${countryCode}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey); // 캐시 히트
  // ... API 호출 후 cache.set(cacheKey, results)
}
```

---

**꼬리질문: 세션 캐시의 한계는 무엇인가요?**

- 페이지 새로고침 시 캐시가 초기화됩니다 (메모리 캐시이므로).
- 캐시 크기 제한이 없어 탭을 오래 켜두면 메모리가 쌓입니다. 실제 서비스라면 LRU 캐시(최대 N개 유지) 또는 TTL(만료 시간) 적용을 권장합니다.
- 장소 데이터가 실시간으로 변경될 수 있지만, 검색 결과 특성상 수분 내 변경 가능성이 낮아 세션 캐시로 충분합니다.

---

**꼬리질문: Places API (New)와 기존 Places API의 차이는?**

- **기존 (`maps.googleapis.com/maps/api/place/textsearch`)**: 브라우저 CORS 지원 없음, 서버사이드 전용
- **신규 (`places.googleapis.com/v1/places:searchText`)**: REST POST 방식, 브라우저에서 직접 호출 가능, 필드 마스크(`X-Goog-FieldMask`)로 필요한 필드만 요청해 비용 최적화

---

### Q14. Haversine 공식을 왜 선택했나요?

**답변:**

두 좌표 사이의 **구면 거리(지구 표면의 최단 거리)**를 계산하기 위해서입니다.

단순 피타고라스 거리는 평면을 가정하므로 장거리에서 오차가 커집니다. Haversine은 지구를 구체로 가정해 더 정확합니다.

```js
const R = 6371; // 지구 반지름 (km)
const a = Math.sin(dLat/2)² + Math.cos(lat1) × Math.cos(lat2) × Math.sin(dLng/2)²
const c = 2 × atan2(√a, √(1-a))
distance = R × c
```

**정확도:** GPS 좌표가 소수점 7자리면 약 1.1cm 정밀도. 최종 결과는 소수점 2자리(100m 단위)로 반올림합니다.

**한계:** 지구가 완전한 구체가 아니므로 Vincenty 공식이 더 정확하지만, 여행 경로 수준에서는 Haversine으로 충분합니다.

---

## 6. 공통 / 아키텍처 면접 질문 & 답변

---

### Q15. 프로젝트에서 가장 어려웠던 기술적 문제는?

**답변:**

**배포 시 Vercel SPA 라우팅 404 문제**가 가장 많은 시간을 소요했습니다.

**원인:** React Router는 클라이언트 사이드 라우팅입니다. `/login`으로 직접 접근하거나 새로고침하면 Vercel이 `/login`이라는 실제 파일을 찾으려다 404를 반환합니다.

**해결:** `vercel.json`에 모든 경로를 `index.html`로 리다이렉트하는 rewrites 설정 추가:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**추가 문제:** `vercel.json` 위치가 `frontend/` 하위가 아닌 **프로젝트 루트**에 있어야 Vercel이 인식한다는 것을 파악하는 데 시간이 걸렸습니다 (Vercel의 Root Directory 설정이 비어있어 repo 루트 기준).

---

### Q16. 로컬 파일 시스템에서 Cloudinary로 마이그레이션한 이유는?

**답변:**

Render 무료 플랜의 제약 때문입니다:
- **재배포 시 디스크 초기화**: Render는 매 배포마다 컨테이너를 새로 생성해 로컬 파일이 사라집니다.
- **Ephemeral 파일시스템**: 클라우드 PaaS 환경의 특성상 영속적인 디스크가 없습니다.

**마이그레이션 작업:**
1. `StorageService` 클래스 신규 생성 (Cloudinary SDK 래핑)
2. `ImageService`, `LocationImageService`에서 로컬 저장 코드 제거 → `StorageService.upload()` 호출
3. `WebConfig`에서 `/uploads/**` 정적 리소스 핸들러 제거
4. 이미지 URL이 로컬 경로(`/uploads/...`)에서 Cloudinary HTTPS URL로 변경

---

### Q17. 공동 작업 기능(멤버 초대)을 어떻게 설계했나요?

**답변:**

**데이터 모델:** `trip_members` 조인 테이블로 Trip ↔ User ManyToMany 관계 구성

**권한 모델:**
| 역할 | 가능한 작업 |
|------|-----------|
| 소유자 | 여행 CRUD, 멤버 초대/내보내기, 공개/비공개 설정 |
| 멤버 | 장소 추가/수정/삭제만 가능 |

**핵심 메서드 분리:**
```java
hasMemberAccess()  // 소유자 OR 멤버 → 장소 관련 작업
requireOwner()     // 소유자만 → 여행 삭제, 멤버 관리
```

**순환 의존성 주의:** `TripService`와 `LocationService`가 서로를 참조하면 순환 의존성이 발생합니다. `hasMemberAccess()` 메서드를 `TripService`에만 두고, `LocationService`가 `TripService`를 `@Lazy` 주입으로 참조해 해결했습니다.

---

**꼬리질문: 멤버가 탈퇴하면 여행은 어떻게 되나요?**

`DELETE /api/trips/{id}/leave` 엔드포인트로 본인이 멤버에서 제거됩니다. 소유자는 탈퇴할 수 없고, 소유자가 삭제할 때만 여행 전체가 삭제됩니다. 소유자 이전(ownership transfer) 기능은 현재 미구현입니다.

---

### Q18. 이 프로젝트를 더 개선한다면 어떤 것을 추가하겠나요?

**답변:**

**보안/성능:**
- Refresh Token 도입 (Access Token 수명 단축)
- Redis 캐싱 (공개 여행 목록, 사용자 정보)
- Flyway 마이그레이션 도입 (`ddl-auto: validate`로 변경)
- 파일 업로드 Magic bytes 검증 추가

**기능:**
- 실시간 협업 (WebSocket/SSE로 멤버 간 실시간 동기화)
- 여행 경로 Google Maps Directions API로 실제 도로 경로 표시
- 소유자 양도 기능
- 알림 시스템 고도화 (이메일 발송)

**인프라:**
- GitHub Actions CI/CD 파이프라인 (테스트 → 빌드 → 배포)
- Prometheus + Grafana 모니터링
- 로그 수집 (ELK Stack)

---

## 참고: 프로젝트 실행 방법

```bash
# 백엔드
cd backend
./gradlew bootRun

# 프론트엔드
cd frontend
npm install
npm run dev
```

**환경변수 (backend):**
- `DB_URL`: JDBC MySQL URL
- `DB_USERNAME` / `DB_PASSWORD`: DB 계정
- `JWT_SECRET`: JWT 서명 키
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`: 카카오 앱 키
- `CLOUDINARY_URL`: `cloudinary://api_key:api_secret@cloud_name`
- `FRONTEND_URL`: 프론트엔드 URL (OAuth2 리다이렉트용)
- `CORS_ALLOWED_ORIGINS`: 허용할 프론트엔드 Origin
- `ADMIN_ALLOWED_IPS`: 관리자 허용 IP 목록

**환경변수 (frontend):**
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API 키
- `VITE_API_URL`: 백엔드 URL (프로덕션 배포 시)
