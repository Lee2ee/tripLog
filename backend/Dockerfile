# ── 1단계: 빌드 ────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# 의존성 캐시 활용을 위해 Gradle 래퍼 + 설정 파일 먼저 복사
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q

# 소스 복사 후 JAR 빌드
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# ── 2단계: 실행 ────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
