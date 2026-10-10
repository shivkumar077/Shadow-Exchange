# ==========================================
# Stage 1: Build stage (Java 21 JDK + Maven)
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copy Maven wrapper and POM configuration
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Normalize line endings and grant execution permission
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copy source code
COPY src/ ./src/

# Compile, test, and package application into JAR
RUN ./mvnw clean package

# ==========================================
# Stage 2: Runtime stage (Lightweight JRE 21)
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as dedicated non-root user
RUN groupadd -r spring && useradd -r -g spring spring

# Copy compiled JAR from build stage
COPY --from=build /app/target/shadow-exchange-0.0.1-SNAPSHOT.jar /app/app.jar
RUN chown -R spring:spring /app

USER spring

# Expose server port (Render injects PORT dynamically; defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Activate prod profile by default (PostgreSQL + production configuration)
ENV SPRING_PROFILES_ACTIVE=prod

# Launch application using Render's PORT
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
