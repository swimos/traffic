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
import {IntersectionMapViewController} from "./IntersectionMapViewController";

export class IntersectionMapView extends MapGraphicView {
  /** @hidden */
  _viewController: IntersectionMapViewController | null;

  get viewController(): IntersectionMapViewController | null {
    return this._viewController;
  }

  @MemberAnimator(Color, "inherit")
  intersectionMarkerColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  pedestrianMarkerColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  redLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  yellowLightColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Color, "inherit")
  greenLightColor: MemberAnimator<this, Color, AnyColor>;

  protected onCull(): void {
    super.onCull();
    if (this._hitBounds === null) {
      this.setCulled(true);
    }
  }
}
