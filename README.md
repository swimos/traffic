# Traffic

See [Traffic in action](http://www.swim.ai/showcase/traffic).

## Prerequisites

* [Install JDK 8+](https://www.oracle.com/technetwork/java/javase/downloads/index.html).
  * Ensure that your `JAVA_HOME` environment variable is pointed to your Java installation location.
  * Ensure that your `PATH` includes `$JAVA_HOME`.

* [Install Node.js](https://nodejs.org/en/).
  * Confirm that [npm](https://www.npmjs.com/get-npm) was installed during the Node.js installation.

## Run

### Windows

Install the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

Execute the command `./run.sh` from a console pointed to the application's home directory. This will start a Swim server, seeded with the application's logic, on port 9001.
   ```console
    user@machine:~$ ./run.sh
   ```

### \*nix

Execute the command `./run.sh` from a console pointed to the application's home directory. This will start a Swim server, seeded with the application's logic, on port 9001.
   ```console
    user@machine:~$ ./run.sh
   ```

## View the UI

Open the following URL on your browser: http://localhost:9001.

## Run as a Fabric

Run two Swim instances on your local machine to distribute the applications
Web Agents between the two processes.

```sh
# Start the first fabric node in one terminal window:
server $ ./gradlew run -Dswim.config.resource=server-a.recon

# Start the second fabric node in another terminal window:
server $ ./gradlew run -Dswim.config.resource=server-b.recon
```

When both processes are up and running, you can point your browser at either
http://localhost:9008 (Server A) or http://localhost:9009 (Server B).  You
will see a live view of all Web Agents, regardless of which server you point
your browser at.  Swim transparently demultiplexes links opened by external
clients, and routes them to the appropriate server in the fabric.
