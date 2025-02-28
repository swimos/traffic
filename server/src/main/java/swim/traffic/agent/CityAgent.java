// Copyright 2015-2022 Swim.inc
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
import swim.api.lane.CommandLane;
import swim.api.lane.JoinValueLane;
import swim.structure.Value;
import swim.uri.Uri;

public class CityAgent extends AbstractAgent {

  private final boolean simMode = System.getProperty("sim.mode", "true").equals("true");

  MapDownlink<Uri, Value> intersectionsLink;

  @SwimLane("intersections")
  @SwimResident
  public JoinValueLane<Uri, Value> intersections;

  public void linkIntersections() {
    if (intersectionsLink == null) {
      intersectionsLink = downlinkMap()
          .keyForm(Uri.form())
          .hostUri(TRAFFIC_HOST)
          .nodeUri(Uri.create(nodeUri().path()))
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

  @SwimLane("addInfo")
  public CommandLane<Value> addInfo = this.<Value>commandLane().onCommand(value -> {
    final Uri uri = Uri.parse(value.get("key").stringValue());
    didUpdateRemoteIntersection(uri, value, value);
  });

  public void didStart() {
    System.out.println(nodeUri() + " didStart");
    if (!simMode) {
      linkIntersections();
    }
  }

  public void willStop() {
    if (!simMode) {
      unlinkIntersections();
    }
  }

  static final Uri TRAFFIC_HOST = Uri.parse("warps://trafficware.swim.services?key=ab21cfe05ba-7d43-69b2-0aef-94d9d54b6f65");
  static final Uri INTERSECTION_INFO = Uri.parse("intersection/info");

}
