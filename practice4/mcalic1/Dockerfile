# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace

# Cache dependencies first.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Build the application (skip tests: they require a Docker daemon for Testcontainers).
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- Runtime stage ----------
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# Run as a non-root user.
RUN groupadd --system spring && useradd --system --gid spring spring

COPY --from=build /workspace/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring:spring

EXPOSE 8080

# Configuration is provided via environment variables (see application.yml).
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
