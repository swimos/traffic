package swim.traffic.routing;

import swim.uri.UriPath;
import swim.web.WebRequest;
import swim.web.WebResponse;
import swim.web.WebRoute;

public class MainRouter implements WebRoute {
    @Override
    public WebResponse routeRequest(WebRequest request) {
        UriPath path = request.routePath();

        if (path.toString().equals("/app")) {
            if (request.getHttpHeader("identity") != null && !request.getHttpHeader("identity").value().isEmpty()) {
                return request.respond(ResourceRouter.routeRequest(UriPath.of("/app")));
            } else {
                return request.respond(ResourceRouter.routeRequest(UriPath.of("/")));
            }
        } else {
            return request.respond(ResourceRouter.routeRequest(path));
        }
    }
}
