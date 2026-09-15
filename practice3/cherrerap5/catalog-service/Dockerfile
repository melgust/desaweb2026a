FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml ./
RUN --mount=type=secret,id=java_cacerts \
    if [ -f /run/secrets/java_cacerts ]; then export MAVEN_OPTS="-Djavax.net.ssl.trustStore=/run/secrets/java_cacerts -Djavax.net.ssl.trustStorePassword=changeit"; fi; \
    mvn -B dependency:go-offline

COPY src ./src
RUN --mount=type=secret,id=java_cacerts \
    if [ -f /run/secrets/java_cacerts ]; then export MAVEN_OPTS="-Djavax.net.ssl.trustStore=/run/secrets/java_cacerts -Djavax.net.ssl.trustStorePassword=changeit"; fi; \
    mvn -B clean package

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/catalog-service-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
