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

import {Item, AnyValue, Value} from "@swim/structure";
import {MapDownlink, ValueDownlink, NodeRef} from "@swim/client";
import {Length} from "@swim/length";
import {Color} from "@swim/color";
import {Transition} from "@swim/transition";
import {PopoverView} from "@swim/view";
import {LngLat, MapGraphicViewController, MapCircleView} from "@swim/map";
import {IntersectionInfo, SignalPhase} from "./IntersectionModel";
import {IntersectionMapView} from "./IntersectionMapView";
import {IntersectionPopoverViewController} from "./IntersectionPopoverViewController";
import {ApproachInfo} from "./ApproachModel";
import {ApproachMapView} from "./ApproachMapView";
import {ApproachMapViewController} from "./ApproachMapViewController";

const APPROACH_ZOOM = 14;

export class IntersectionMapViewController extends MapGraphicViewController<IntersectionMapView> {
  /** @hodden */
  _info: IntersectionInfo;
  /** @hidden */
  _nodeRef: NodeRef;
  /** @hidden */
  _schematicLink: ValueDownlink<Value, AnyValue> | null;
  /** @hidden */
  _phasesLink: MapDownlink<Value, Value, AnyValue, AnyValue> | null;
  /** @hidden */
  _detectorsLink: MapDownlink<Value, Value, AnyValue, AnyValue> | null;
  /** @hidden */
  _pedCallLink: ValueDownlink<Value, AnyValue> | null;
  /** @hidden */
  _popoverView: PopoverView | null;
  /** @hidden */
  _pedCall: boolean;

  constructor(info: IntersectionInfo, nodeRef: NodeRef) {
    super();
    this._info = info;
    this._nodeRef = nodeRef;
    this._schematicLink = null;
    this._phasesLink = null;
    this._detectorsLink = null;
    this._pedCallLink = null;
    this._popoverView = null;
    this._pedCall = false;
  }

  protected initMarkerView(): void {
    let markerView = this.getChildView("marker") as MapCircleView | null;
    if (!markerView) {
      markerView = new MapCircleView();
      markerView.center.setState(new LngLat(this._info.lng, this._info.lat));
      markerView.radius.setState(Length.px(5));
      markerView.fill.setState(this._view!.intersectionMarkerColor.value!);
      markerView.on("click", this.onMarkerClick.bind(this));
      this.setChildView("marker", markerView);
    }
  }

  protected onMarkerClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this._popoverView) {
      this._popoverView = new PopoverView();
      const popoverViewController = new IntersectionPopoverViewController(this._info, this._nodeRef);
      this._popoverView.setViewController(popoverViewController);
      this._popoverView.setSource(this.getChildView("marker"));
      this._popoverView.hidePopover();
    }
    this.appView!.togglePopover(this._popoverView, {multi: event.altKey});
  }

  protected didSetSchematic(value: Value): void {
    value.forEach(function (item: Item): void {
      if (item.tag() === "approach") {
        this.didUpdateApproach(item.toAny() as unknown as ApproachInfo);
      }
    }, this);
  }

  protected didUpdateApproach(approachInfo: ApproachInfo): void {
    //console.log("intersection " + this._info.id + " didUpdateApproach:", approachInfo);
    const approachId = "approach-" + approachInfo.id;
    approachInfo.intersection = this._info;

    let approachMapView = this.getChildView(approachId) as ApproachMapView | null;
    if (!approachMapView) {
      approachMapView = new ApproachMapView();
      const intersectionMapViewController = new ApproachMapViewController(approachInfo, this._nodeRef);
      approachMapView.setViewController(intersectionMapViewController);
      this.setChildView(approachId, approachMapView);
    }
    const approachMapViewController = approachMapView.viewController!;
    approachMapViewController.setInfo(approachInfo);
  }

  protected didUpdatePhase(key: Value, value: Value): void {
    //console.log("intersection " + this._info.id + " didUpdatePhase " + key + ": " + value);
    const phaseId = key.toAny();
    const phase = value.numberValue() as SignalPhase;

    const childViews = this.childViews;
    for (let i = 0, n = childViews.length; i < n ; i += 1) {
      const childView = childViews[i];
      if (childView instanceof ApproachMapView) {
        const approachMapViewController = childView.viewController!;
        if (approachMapViewController._info.phase === phaseId) {
          approachMapViewController.setPhase(phase);
        }
      }
    }
  }

  protected didUpdateDetector(key: Value, value: Value): void {
    //console.log("intersection " + this._info.id + " didUpdateDetector " + key + ": " + value);
    const detectorId = key.toAny();
    const occupied = value.booleanValue(false);

    const childViews = this.childViews;
    for (let i = 0, n = childViews.length; i < n ; i += 1) {
      const childView = childViews[i];
      if (childView instanceof ApproachMapView) {
        const approachMapViewController = childView.viewController!;
        if (approachMapViewController._info.detector === detectorId) {
          approachMapViewController.setOccupied(occupied);
        }
      }
    }

    if (occupied) {
      this.ripple(this._view!.intersectionMarkerColor.value!);
    } 
  }

  protected didSetPedCall(key: Value, value: Value): void {
    //console.log("intersection " + this._info.id + " didSetPedCall " + key + ": " + value);
    const view = this._view!;
    this._pedCall = value.isDefined();
    const marker = this.getChildView("marker") as MapCircleView | null;
    if (marker) {
      marker.fill.setState(this._pedCall ? view.pedestrianMarkerColor.value! : view.intersectionMarkerColor.value!,
                           Transition.duration(500));
    }

    if (this._pedCall) {
      this.ripple(view.pedestrianMarkerColor.value!);
    } 
  }

  protected ripple(color: Color): void {
    if (document.hidden || this.culled) {
      return;
    }
    const ripple = new MapCircleView()
        .center(new LngLat(this._info.lng, this._info.lat))
        .radius(0)
        .fill(null)
        .stroke(color.alpha(1))
        .strokeWidth(1);
    this.appendChildView(ripple);
    const radius = Math.min(this.bounds.width, this.bounds.height) / 8;
    const tween = Transition.duration<any>(5000);
    ripple.stroke(color.alpha(0), tween)
          .radius(radius, tween.onEnd(function () { ripple.remove(); }));
  }

  viewDidMount(view: IntersectionMapView): void {
    this.initMarkerView();
    this.linkSchematic();
  }

  viewWillUnmount(view: IntersectionMapView): void {
    this.unlinkSchematic();
    this.unlinkPhases();
    this.unlinkDetectors();
    this.unlinkPedCall();
  }

  viewDidSetZoom(newZoom: number, oldZoom: number, view: IntersectionMapView): void {
    const childViews = this.childViews;
    for (let i = 0, n = childViews.length; i < n ; i += 1) {
      const childView = childViews[i];
      if (childView instanceof ApproachMapView) {
        childView.setHidden(newZoom < APPROACH_ZOOM);
      }
    }
  }

  viewDidSetCulled(culled: boolean, view: IntersectionMapView): void {
    //console.log("intersection " + this._info.id + " viewDidSetCulled: " + culled);
    if (culled || this.zoom < APPROACH_ZOOM) {
      this.unlinkPhases();
    } else if (view._hitBounds !== null) {
      this.linkPhases();
    }
    if (culled) {
      this.unlinkDetectors();
      this.unlinkPedCall();
    } else if (view._hitBounds !== null) {
      this.linkDetectors();
      this.linkPedCall();
    }
  }

  protected linkSchematic(): void {
    if (!this._schematicLink) {
      this._schematicLink = this._nodeRef.downlinkValue()
          .laneUri("intersection/schematic")
          .didSet(this.didSetSchematic.bind(this))
          .open();
    }
  }

  protected unlinkSchematic(): void {
    if (this._schematicLink) {
      this._schematicLink.close();
      this._schematicLink = null;
    }
  }

  protected linkPhases(): void {
    if (!this._phasesLink) {
      //console.log("intersection " + this._info.id + " linkPhases");
      this._phasesLink = this._nodeRef.downlinkMap()
          .laneUri("phase/state")
          .didUpdate(this.didUpdatePhase.bind(this))
          .open();
    }
  }

  protected unlinkPhases(): void {
    if (this._phasesLink) {
      //console.log("intersection " + this._info.id + " unlinkPhases");
      this._phasesLink.close();
      this._phasesLink = null;
    }
  }

  protected linkDetectors(): void {
    if (!this._detectorsLink) {
      this._detectorsLink = this._nodeRef.downlinkMap()
          .laneUri("detector/state")
          .didUpdate(this.didUpdateDetector.bind(this))
          .open();
    }
  }

  protected unlinkDetectors(): void {
    if (this._detectorsLink) {
      this._detectorsLink.close();
      this._detectorsLink = null;
    }
  }

  protected linkPedCall(): void {
    if (!this._pedCallLink) {
      this._pedCallLink = this._nodeRef.downlinkValue()
          .laneUri("pedCall")
          .didSet(this.didSetPedCall.bind(this))
          .open();
    }
  }

  protected unlinkPedCall(): void {
    if (this._pedCallLink) {
      this._pedCallLink.close();
      this._pedCallLink = null;
    }
  }
}
