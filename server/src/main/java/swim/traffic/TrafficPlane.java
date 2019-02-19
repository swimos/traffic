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

import java.io.IOException;
import swim.api.SwimAgent;
import swim.api.SwimRoute;
import swim.api.agent.AgentType;
import swim.api.plane.AbstractPlane;
import swim.api.plane.PlaneContext;
import swim.api.server.ServerContext;
import swim.loader.ServerLoader;
import swim.structure.Value;
import swim.traffic.agent.CityAgent;
import swim.traffic.agent.IntersectionAgent;

public class TrafficPlane extends AbstractPlane {
  @SwimAgent(name = "city")
  @SwimRoute("/city/:id")
  final AgentType<?> cityAgent = agentClass(CityAgent.class);

  @SwimAgent(name = "intersection")
  @SwimRoute("/intersection/:country/:state/:city/:id")
  final AgentType<?> intersectionAgent = agentClass(IntersectionAgent.class);

  public static void main(String[] args) throws IOException {
    final ServerContext server = ServerLoader.load(TrafficPlane.class.getModule()).serverContext();
    final PlaneContext plane = server.getPlane("traffic").planeContext();

    server.start();
    System.out.println("Running TrafficPlane ...");

    plane.command("/city/PaloAlto_CA_US", "wake", Value.absent());

    server.run(); // blocks until termination
  }
}
