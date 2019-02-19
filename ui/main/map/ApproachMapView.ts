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
import {MapPolygonView} from "@swim/map";
import {ApproachMapViewController} from "./ApproachMapViewController";

export class ApproachMapView extends MapPolygonView {
  /** @hidden */
  _viewController: ApproachMapViewController | null;

  constructor() {
    super();
    this.fill.setState(Color.transparent());
  }

  get viewController(): ApproachMapViewController | null {
    return this._viewController;
  }

  @MemberAnimator(Color, "inherit")
  redLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  yellowLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  greenLightColor: MemberAnimator<this, Color, AnyColor>;
}
