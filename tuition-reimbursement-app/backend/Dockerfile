# Built from the project root, because the backend's API interfaces are generated
# from contract/openapi.yaml (ADR 0004).
FROM maven:3.9.12-eclipse-temurin-25 AS build
WORKDIR /build
COPY backend/pom.xml backend/pom.xml
COPY contract/openapi.yaml contract/openapi.yaml
RUN cd backend && mvn -B -q -Dmaven.test.skip=true dependency:go-offline || true
COPY backend/src backend/src
RUN cd backend && mvn -B -q -DskipTests package && cp target/*.jar /build/app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /build/app.jar app.jar
COPY backend/entrypoint.sh entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
