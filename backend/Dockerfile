# ==========================================
# Stage 1: Build — compila el JAR con Maven
# ==========================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Primero copiamos solo el pom.xml para cachear dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Luego copiamos el código fuente
COPY src ./src

# Compilamos sin tests (los tests requieren BD)
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Runtime — imagen mínima con JRE
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiamos solo el JAR generado
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
