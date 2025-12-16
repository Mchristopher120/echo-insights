# --- Etapa 1: Build (Compilação) ---
# Usamos uma imagem do Maven que já tenha o JDK 25 instalado
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copia os arquivos do projeto
COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Comando para iniciar
ENTRYPOINT ["java", "-jar", "app.jar"]