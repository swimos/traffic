#Dockerfile

FROM openjdk:11-jdk-stretch

WORKDIR /

EXPOSE 9002

COPY dist/swim-traffic-3.11.0-SNAPSHOT /app/swim-traffic-3.11.0-SNAPSHOT/
COPY dist/ui/ /app/swim-traffic-3.11.0-SNAPSHOT/ui

WORKDIR /app/swim-traffic-3.11.0-SNAPSHOT/bin
ENTRYPOINT ["./swim-traffic"]
