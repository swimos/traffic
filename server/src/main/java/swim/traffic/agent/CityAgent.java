// Copyright 2015-2019 SWIM.AI inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package swim.traffic.agent;

import swim.api.SwimLane;
import swim.api.SwimResident;
import swim.api.agent.AbstractAgent;
import swim.api.downlink.MapDownlink;
import swim.api.lane.JoinValueLane;
import swim.structure.Value;
import swim.uri.Uri;

public class CityAgent extends AbstractAgent {
  MapDownlink<Uri, Value> intersectionsLink;

  @SwimLane("intersections")
  @SwimResident
  public JoinValueLane<Uri, Value> intersections;

  public void linkIntersections() {
    if (intersectionsLink == null) {
      intersectionsLink = downlinkMap()
          .keyForm(Uri.form())
          .hostUri(TRAFFIC_HOST)
          .nodeUri(Uri.from(nodeUri().path()))
          .laneUri("intersections")
          .didUpdate(this::didUpdateRemoteIntersection)
          .open();
    }
  }

  public void unlinkIntersections() {
    if (intersectionsLink != null) {
      intersectionsLink.close();
      intersectionsLink = null;
    }
  }

  void didUpdateRemoteIntersection(Uri intersectionUri, Value newValue, Value oldValue) {
    //System.out.println(nodeUri() + " didUpdateRemoteIntersection: " + intersectionUri);
    if (!intersections.containsKey(intersectionUri)) {
      intersections.downlink(intersectionUri)
          .nodeUri(intersectionUri)
          .laneUri(INTERSECTION_INFO)
          .open();
    }
  }

  public void didStart() {
    System.out.println(nodeUri() + " didStart");
    linkIntersections();
  }

  public void willStop() {
    unlinkIntersections();
  }

  static final Uri TRAFFIC_HOST = Uri.parse("warps://trafficware.swim.services?key=ab21cfe05ba-7d43-69b2-0aef-94d9d54b6f65");
  static final Uri INTERSECTION_INFO = Uri.parse("intersection/info");
  static final Uri NEIGHBOR_ADD = Uri.parse("neighbor/add");
  static final Uri NEIGHBOR_REMOVE = Uri.parse("neighbor/remove");
}
