FROM maven:3.9.7-eclipse-temurin-17 AS builder
WORKDIR /app

# First copy the pom to download dependencies (caches them)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the actual sources and build the jar
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
