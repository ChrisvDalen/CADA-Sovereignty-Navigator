# syntax=docker/dockerfile:1

# --- Build ---
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
# Eerst alleen de POM voor een gecachete dependency-laag.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

# --- Runtime ---
FROM eclipse-temurin:25-jre
WORKDIR /app
# Niet als root draaien.
RUN useradd --system --uid 1001 spring
COPY --from=build /app/target/cada-sovereignty-navigator-*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
