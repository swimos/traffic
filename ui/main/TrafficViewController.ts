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

import * as mapboxgl from "mapbox-gl";
import {NodeRef} from "@swim/client";
import {Color} from "@swim/color";
import {SvgView, HtmlView, HtmlViewController} from "@swim/view";
import {MapboxView} from "@swim/mapbox";
import {TrafficMapView} from "./map/TrafficMapView";
import {TrafficMapViewController} from "./map/TrafficMapViewController";
import {VehicleFlowKpiViewController} from "./kpi/VehicleFlowKpiViewController";
import {VehicleBackupKpiViewController} from "./kpi/VehicleBackupKpiViewController";
import {PedestrianBackupKpiViewController} from "./kpi/PedestrianBackupKpiViewController";

export class TrafficViewController extends HtmlViewController {
  /** @hidden */
  _nodeRef: NodeRef;
  /** @hidden */
  _map: mapboxgl.Map | null;

  constructor(nodeRef: NodeRef) {
    super();
    this._nodeRef = nodeRef;
    this._map = null;
  }

  didSetView(view: HtmlView): void {
    this._map = new mapboxgl.Map({
      container: view.node,
      style: "mapbox://styles/swimit/cjs5h20wh0fyf1gocidkpmcvm",
      center: {lng: -122.16, lat: 37.445},
      pitch: 70,
      zoom: 15.5,
    });

    const mapboxView = new MapboxView(this._map);
    mapboxView.overlayCanvas();

    const trafficMapView = new TrafficMapView();
    const trafficMapViewController = new TrafficMapViewController(this._nodeRef);
    trafficMapView.setViewController(trafficMapViewController);
    mapboxView.setChildView("map", trafficMapView);

    const header = view.append("div")
        .key("header")
        .pointerEvents("none")
        .zIndex(10);

    const logo = header.append("div")
        .key("logo")
        .position("absolute")
        .left(8)
        .top(8)
        .width(156)
        .height(68);
    logo.append(this.createLogo());

    view.append(this.createKpiStack(trafficMapView));
    this.layoutKpiStack();
  }

  viewDidResize(): void {
    this.layoutKpiStack();
  }

  protected createKpiStack(trafficMapView: TrafficMapView): HtmlView {
    const kpiStack = HtmlView.fromTag("div")
        .key("kpiStack")
        .position("absolute")
        .right(0)
        .top(0)
        .bottom(0)
        .zIndex(9)
        .pointerEvents("none");

    const vehicleFlowKpi = kpiStack.append("div")
        .key("vehicleFlowKpi")
        .position("absolute")
        .borderRadius(8)
        .boxSizing("border-box")
        .backgroundColor(Color.parse("#070813").alpha(0.33))
        .backdropFilter("blur(2px)")
        .pointerEvents("auto");
    const vehicleFlowKpiViewController = new VehicleFlowKpiViewController(this._nodeRef, trafficMapView);
    vehicleFlowKpi.setViewController(vehicleFlowKpiViewController);

    const vehicleBackupKpi = kpiStack.append("div")
        .key("vehicleBackupKpi")
        .position("absolute")
        .borderRadius(8)
        .boxSizing("border-box")
        .backgroundColor(Color.parse("#070813").alpha(0.33))
        .backdropFilter("blur(2px)")
        .pointerEvents("auto");
    const vehicleBackupKpiViewController = new VehicleBackupKpiViewController(this._nodeRef, trafficMapView);
    vehicleBackupKpi.setViewController(vehicleBackupKpiViewController);

    const pedestrianBackupKpi = kpiStack.append("div")
        .key("pedestrianBackupKpi")
        .position("absolute")
        .borderRadius(8)
        .boxSizing("border-box")
        .backgroundColor(Color.parse("#070813").alpha(0.33))
        .backdropFilter("blur(2px)")
        .pointerEvents("auto");
    const pedestrianBackupKpiViewController = new PedestrianBackupKpiViewController(this._nodeRef, trafficMapView);
    pedestrianBackupKpi.setViewController(pedestrianBackupKpiViewController);

    return kpiStack;
  }

  protected layoutKpiStack(): void {
    const kpiMargin = 16;

    const view = this._view!;
    const kpiStack = view.getChildView("kpiStack") as HtmlView;

    const kpiViews = kpiStack.childViews;
    const kpiViewCount = kpiViews.length;
    const kpiViewHeight = (view.node.offsetHeight - kpiMargin * (kpiViewCount + 1)) / (kpiViewCount || 1);
    const kpiViewWidth = 1.5 * kpiViewHeight;

    const kpiStackWidth = kpiViewWidth + 2 * kpiMargin;
    kpiStack.width(kpiStackWidth);
    for (let i = 0; i < kpiViewCount; i += 1) {
      const kpiView = kpiViews[i] as HtmlView;
      kpiView.right(kpiMargin)
             .top(kpiViewHeight * i + kpiMargin * (i + 1))
             .width(kpiViewWidth)
             .height(kpiViewHeight);
    }

    if (kpiStackWidth > 240 && view.node.offsetWidth >= 2 * kpiStackWidth) {
      kpiStack.display("block");
    } else {
      kpiStack.display("none");
    }
  }

  protected createLogo(): SvgView {
    const logo = SvgView.fromTag("svg").width(156).height(68).viewBox("0 0 156 68");
    logo.append("polygon").fill("#008ac5").points("38.262415 60.577147 45.7497674 67.9446512 41.4336392 66.3395349");
    logo.append("polygon").fill("#004868").points("30.6320304 56.7525259 35.7395349 55.9824716 41.4304178 66.3390957");
    logo.append("polygon").fill("#1db0ef").points("45.8577521 43.5549215 35.7395349 55.9813953 30.895331 54.807418");
    logo.append("polygon").fill("#008ac5").points("45.8604651 43.5549215 41.760398 48.5902277 50.5169298 42.7788873");
    logo.append("polygon").fill("#008ac5").points("26.3271825 57.4036063 35.7395349 55.9813953 19.2251161 51.7639132");
    logo.append("polygon").fill("#008ac5").points("21.8522892 56.6610604 26.3302326 57.4059108 24.8674419 60.4330233");
    logo.append("polygon").fill("#46c7ff").points("25.8602519 50.1512126 21.9749543 52.4673682 26.296682 53.5765239");
    logo.append("polygon").fill("#004868").points("8.22304588 54.4 26.3302326 57.4046512 10.7431892 45.0311035");
    logo.append("polygon").fill("#008ac5").points("13.8293387 33.5634807 4.10372093 35.5972093 8.22325581 54.4");
    logo.append("polygon").fill("#004868").points("8.22099482 54.4011969 0.0941817913 35.6005706 4.10375191 35.6005706");
    logo.append("polygon").fill("#004a6a").points("29.0049687 26.1913296 29.4164365 29.8907151 13.8293023 33.5651163 4.10372093 35.5972093");
    logo.append("polygon").fill("#46c7ff").points("29.0062121 26.1911555 4.10372093 35.5972093 18.5813833 12.4933152");
    logo.append("polygon").fill("#008ac5").points("11.2792478 19.5948645 18.5832775 12.4930233 4.10372093 35.5972093");
    logo.append("polygon").fill("#0076a9").points("0.0976972893 35.6005706 11.6715695 18.9158345 4.10403655 35.6005706");
    logo.append("polygon").fill("#46c7ff").points("24.2487055 31.1058385 29.4139535 29.8876265 26.2195349 45.5916279");
    logo.append("polygon").fill("#004868").points("34.5718675 26.2202296 36.2830885 37.7346648 31.9099624 28.1109897");
    logo.append("polygon").fill("#00557a").points("29.0034364 26.1884581 42.3712871 20.6741037 29.4139535 29.8883721");
    logo.append("polygon").fill("#008ac5").points("26.68 13.7746077 29.0062121 26.1911555 18.5813953 12.4930233");
    logo.append("polygon").fill("#004868").points("11.6715695 2.42510699 18.5775948 12.4930233 11.083087 19.8858773");
    logo.append("polygon").fill("#46c7ff").points("9.61188076 0 26.6831512 13.7746077 18.5788496 12.4908901");
    logo.append("path").fill("#0076a9").d("M26.6778731,13.7746077 L38.8232486,18.8943879 L37.5870837,22.6477526 L29.0035088,26.187907 L26.6778731,13.7746077 Z M35.3244186,20.5976744 C35.7065226,20.5976744 36.0162791,20.2879179 36.0162791,19.905814 C36.0162791,19.52371 35.7065226,19.2139535 35.3244186,19.2139535 C34.9423146,19.2139535 34.6325581,19.52371 34.6325581,19.905814 C34.6325581,20.2879179 34.9423146,20.5976744 35.3244186,20.5976744 Z");
    logo.append("polygon").fill("#46c7ff").points("38.8232558 18.9003694 64.0007929 11.9315264 37.5863839 22.647813");
    const text = logo.append("text").fill("#ffffff").fontFamily("Orbitron").fontSize(32);
    text.append("tspan").x(58).y(42).text("swim");
    return logo;
  }
}
