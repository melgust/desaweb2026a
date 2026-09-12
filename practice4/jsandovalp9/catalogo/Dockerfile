FROM eclipse-temurin:25-jdk

WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw mvnw
COPY pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw -q dependency:go-offline

COPY src ./src

EXPOSE 8080

CMD ["./mvnw", "spring-boot:run"]
