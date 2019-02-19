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

import {NodeRef} from "@swim/client";
import {Color} from "@swim/color";
import {Transition} from "@swim/transition";
import {PopoverView} from "@swim/view";
import {MapGraphicViewController} from "@swim/map";
import {SignalPhase} from "./IntersectionModel";
import {ApproachInfo} from "./ApproachModel";
import {ApproachMapView} from "./ApproachMapView";
import {ApproachPopoverViewController} from "./ApproachPopoverViewController";

export class ApproachMapViewController extends MapGraphicViewController<ApproachMapView> {
  /** @hodden */
  _info: ApproachInfo;
  /** @hidden */
  _nodeRef: NodeRef;
  /** @hidden */
  _phase: SignalPhase;
  /** @hidden */
  _occupied: boolean;
  /** @hidden */
  _popoverView: PopoverView | null;

  constructor(info: ApproachInfo, nodeRef: NodeRef) {
    super();
    this._info = info;
    this._nodeRef = nodeRef;
    this._phase = SignalPhase.Red;
    this._occupied = true;
    this._popoverView = null;
  }

  setInfo(info: ApproachInfo): void {
    if (info.coords) {
      this._view!.setCoords(info.coords);
    }
  }

  setPhase(phase: SignalPhase): void {
    //console.log("intersection " + this._info.intersection!.id + " phase " + this._info.id + " changed from " + this._phase + " to " + phase);
    this._phase = phase;
    this.updateApproach();
  }

  setOccupied(occupied: boolean): void {
    this._occupied = occupied;
    this.updateApproach();
  }

  protected updateApproach(): void {
    const view = this._view!;
    let signalColor: Color;
    if (this._phase === SignalPhase.Red) { // red
      signalColor = view.redLightColor.value!;
    } else if (this._phase === SignalPhase.Yellow) { // yellow
      signalColor = view.yellowLightColor.value!;
    } else if (this._phase === SignalPhase.Green) { // green
      signalColor = view.greenLightColor.value!;
    } else {
      signalColor = Color.transparent();
    }
    if (this._occupied === false) {
      signalColor = signalColor.alpha(0.25);
    }
    view.fill(signalColor, Transition.duration(500));
  }

  didSetView(view: ApproachMapView): void {
    view.on("click", this.onClick.bind(this));
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this._popoverView) {
      this._popoverView = new PopoverView();
      const popoverViewController = new ApproachPopoverViewController(this._info, this._nodeRef);
      this._popoverView.setViewController(popoverViewController);
      this._popoverView.setSource(this._view!);
      this._popoverView.hidePopover();
    }
    this.appView!.togglePopover(this._popoverView, {multi: event.altKey});
  }
}
