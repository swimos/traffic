#Dockerfile

FROM openjdk:11-jdk-stretch

WORKDIR /

EXPOSE 9001

COPY dist/swim-traffic-3.10.2 /app/swim-traffic-3.10.2/
COPY dist/ui/ /app/swim-traffic-3.10.2/ui

WORKDIR /app/swim-traffic-3.10.2/bin
ENTRYPOINT ["./swim-traffic"]
