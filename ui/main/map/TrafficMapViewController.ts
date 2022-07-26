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

import {AnyValue, Value} from "@swim/structure";
import {MapDownlink, NodeRef} from "@swim/client";
import {MapGraphicViewController} from "@swim/map";
import {TrafficMapView} from "./TrafficMapView";
import {IntersectionInfo} from "./IntersectionModel";
import {IntersectionMapView} from "./IntersectionMapView";
import {IntersectionMapViewController} from "./IntersectionMapViewController";

export class TrafficMapViewController extends MapGraphicViewController<TrafficMapView> {
  /** @hidden */
  _nodeRef: NodeRef;
  /** @hidden */
  _intersectionsLink: MapDownlink<Value, Value, AnyValue, AnyValue> | null;

  constructor(nodeRef: NodeRef) {
    super();
    this._nodeRef = nodeRef;
    this._intersectionsLink = null;
  }

  protected didUpdateIntersection(key: Value, value: Value): void {
    const intersectionInfo = value.toAny() as unknown as IntersectionInfo;
    const intersectionId = "" + intersectionInfo.id;
    //console.log("didUpdateIntersection:", intersectionInfo);

    let intersectionMapView = this.getChildView(intersectionId);
    if (!intersectionMapView) {
      const intersectionNodeUri = key.stringValue()!;
      const intersectionNodeRef = this._nodeRef.nodeRef(intersectionNodeUri);

      intersectionMapView = new IntersectionMapView();
      const intersectionMapViewController = new IntersectionMapViewController(intersectionInfo, intersectionNodeRef);
      intersectionMapView.setViewController(intersectionMapViewController);
      this.setChildView(intersectionId, intersectionMapView);
    }
  }

  viewDidMount(view: TrafficMapView): void {
    this.linkIntersections();
  }

  viewWillUnmount(view: TrafficMapView): void {
    this.unlinkIntersections();
  }

  protected linkIntersections(): void {
    if (!this._intersectionsLink) {
      this._intersectionsLink = this._nodeRef.downlinkMap()
          .laneUri("intersections")
          .didUpdate(this.didUpdateIntersection.bind(this))
          .open();
    }
  }

  protected unlinkIntersections(): void {
    if (this._intersectionsLink) {
      this._intersectionsLink.close();
      this._intersectionsLink = null;
    }
  }
}
