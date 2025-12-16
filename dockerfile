FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

COPY diario-inteligente-backend ./diario-inteligente-backend

WORKDIR /app/diario-inteligente-backend

RUN mvn clean package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app

COPY --from=build /app/diario-inteligente-backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]