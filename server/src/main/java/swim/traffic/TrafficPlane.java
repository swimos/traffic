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

package swim.traffic;

import swim.api.SwimAgent;
import swim.api.SwimRoute;
import swim.api.agent.AgentRoute;
import swim.api.plane.AbstractPlane;
import swim.api.space.Space;
import swim.kernel.Kernel;
import swim.server.ServerLoader;
import swim.structure.Value;
import swim.traffic.agent.CityAgent;
import swim.traffic.agent.IntersectionAgent;

public class TrafficPlane extends AbstractPlane {
  @SwimAgent("city")
  @SwimRoute("/city/:id")
  AgentRoute<CityAgent> cityAgent;

  @SwimAgent("intersection")
  @SwimRoute("/intersection/:country/:state/:city/:id")
  AgentRoute<IntersectionAgent> intersectionAgent;

  public static void main(String[] args) {
    final Kernel kernel = ServerLoader.loadServer();
    final Space space = kernel.getSpace("traffic");

    kernel.start();
    System.out.println("Running TrafficPlane ...");

    space.command("/city/PaloAlto_CA_US", "wake", Value.absent());

    kernel.run(); // blocks until termination
  }
}
