package swim.traffic.routing;

import swim.http.HttpBody;
import swim.http.HttpResponse;
import swim.http.HttpStatus;
import swim.uri.UriPath;

import java.io.File;
import java.io.IOException;

public class ResourceRouter {

    private static final String DIRECTORY_NAME = "ui";

    static UriPath directory = UriPath.parse(new File("").getAbsolutePath().replace('\\', '/')).appended(DIRECTORY_NAME);

    public ResourceRouter() {
    }

    static public HttpResponse<Object> routeRequest(UriPath path) {
        if (path.toString().equals("/")) {
            try {
                final HttpBody<Object> body = HttpBody.fromFile(directory.toString() + "/index.html");
                return HttpResponse.create(HttpStatus.OK).content(body);
            } catch (IOException error) {
                return notFound();
            }
        }
        if (path.toString().equals("/app")) {
            try {
                final HttpBody<Object> body = HttpBody.fromFile(directory.toString() + "/app.html");
                return HttpResponse.create(HttpStatus.OK).content(body);
            } catch (IOException error) {
                return notFound();
            }
        }
        if (path.toString().equals("/dist/main/swim-traffic.js")) {
            try {
                final HttpBody<Object> body = HttpBody.fromFile(directory.toString() + "/dist/main/swim-traffic.js");
                return HttpResponse.create(HttpStatus.OK).content(body);
            } catch (IOException error) {
                return notFound();
            }
        }
        if (path.toString().equals("/dist/main/swim-traffic.js.map")) {
            try {
                final HttpBody<Object> body = HttpBody.fromFile(directory.toString() + "/dist/main/swim-traffic.js.map");
                return HttpResponse.create(HttpStatus.OK).content(body);
            } catch (IOException error) {
                return notFound();
            }
        } else {
            return notFound();
        }
    }

    static public HttpResponse<Object> notFound() {
        return HttpResponse.create(HttpStatus.NOT_FOUND).content(HttpBody.empty());
    }

}
