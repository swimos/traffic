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

package swim.traffic;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Objects;
import swim.api.plane.AbstractPlane;
import swim.api.space.Space;
import swim.kernel.Kernel;
import swim.recon.Recon;
import swim.server.ServerLoader;
import swim.structure.Value;
import swim.uri.Uri;

public class TrafficPlane extends AbstractPlane {
  private static final boolean SIM_MODE = System.getProperty("sim.mode", "true").equals("true");
  private static final Uri CITY_NODE  = Uri.parse("/city/PaloAlto_CA_US");
  private static final Uri INFO_LANE  = Uri.parse("addInfo");
  private static final Uri SCHEMATIC_LANE  = Uri.parse("addSchematic");

  public static void main(String[] args) {
    final Kernel kernel = ServerLoader.loadServer();
    final Space space = kernel.getSpace("traffic");

    kernel.start();
    System.out.println("Running TrafficPlane ...");

    space.command(CITY_NODE, Uri.parse("wake"), Value.absent());
    kernel.run(); // blocks until termination
    if (SIM_MODE) {
      loadIntersectionInfos(space);
      loadIntersectionSchematicss(space);
    }
   }

  private static void loadIntersectionInfos(Space space) {
    try (InputStream is = TrafficPlane.class.getClassLoader().getResourceAsStream("intersection-info")) {
      final BufferedReader br = new BufferedReader(new InputStreamReader(Objects.requireNonNull(is)));
      String line;
      while ((line = br.readLine()) != null) {
        final Value intersection = Recon.parse(line);
        final Uri intersectionUri = Uri.parse(intersection.get("key").stringValue());
        space.command(intersectionUri, INFO_LANE, intersection);
        space.command(CITY_NODE, INFO_LANE, intersection);
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  private static void loadIntersectionSchematicss(Space space) {
    try (InputStream is = TrafficPlane.class.getClassLoader().getResourceAsStream("intersection-schematics")) {
      final BufferedReader br = new BufferedReader(new InputStreamReader(Objects.requireNonNull(is)));
      String line;
      while ((line = br.readLine()) != null) {
        final int index = line.indexOf(":");
        final String uri = line.substring(0, index);
        final String schematic = line.substring(index + 1);
        space.command(Uri.parse(uri), SCHEMATIC_LANE, Recon.parse(schematic));
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

}


