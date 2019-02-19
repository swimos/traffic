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

import {AnyColor, Color} from "@swim/color";
import {MemberAnimator} from "@swim/view";
import {MapGraphicView} from "@swim/map";
import {TrafficMapViewController} from "./TrafficMapViewController";

export class TrafficMapView extends MapGraphicView {
  /** @hidden */
  _viewController: TrafficMapViewController | null;

  constructor() {
    super();
    this.intersectionMarkerColor.setState(Color.parse("#00a6ed"));
    this.pedestrianMarkerColor.setState(Color.parse("#c200fa"));
    this.redLightColor.setState(Color.parse("#a50f21"));
    this.yellowLightColor.setState(Color.parse("#fccf20"));
    this.greenLightColor.setState(Color.parse("#54e218"));
  }

  get viewController(): TrafficMapViewController | null {
    return this._viewController;
  }

  @MemberAnimator(Color)
  intersectionMarkerColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color)
  pedestrianMarkerColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color)
  redLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color)
  yellowLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color)
  greenLightColor: MemberAnimator<this, Color, AnyColor>;
}
