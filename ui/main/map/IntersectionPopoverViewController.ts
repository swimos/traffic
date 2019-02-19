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

import {Value} from "@swim/structure";
import {MapDownlink, NodeRef, ValueDownlink} from "@swim/client";
import {Color} from "@swim/color";
import {HtmlView, PopoverView, PopoverViewController} from "@swim/view";
import {ChartView, LineGraphView} from "@swim/chart";
import {IntersectionInfo} from "./IntersectionModel";

export class IntersectionPopoverViewController extends PopoverViewController {
  /** @hodden */
  _info: IntersectionInfo;
  /** @hidden */
  _nodeRef: NodeRef;

  /** @hidden */
  _linkLatency?: ValueDownlink<Value>;

  /** @hidden */
  _linkMode?: ValueDownlink<Value>;

  /** @hidden */
  _linkPhase?: MapDownlink<Value, Value>;

  /** @hidden */
  _linkHistory?: MapDownlink<Value, Value>;

  /** @hidden */
  _linkFuture?: MapDownlink<Value, Value>;

  /** @hidden */
  _latencyView?: HtmlView;

  /** @hidden */
  _modeView?: HtmlView;

  constructor(info: IntersectionInfo, nodeRef: NodeRef) {
    super();
    this._info = info;
    this._nodeRef = nodeRef;
  }

  didSetView(view: PopoverView): void {
    view.width(240)
        .height(360)
        .display('flex')
        .flexDirection('column')
        .borderRadius(5)
        .padding(10)
        .backgroundColor(Color.parse("#071013").alpha(0.9))
        .backdropFilter("blur(2px)")
        .color("#ffffff");

    const intersection = this._info;

    const header = view.append("header")
      .display('flex')
      .alignItems('center');
    header.append("div")
      .borderRadius(20)
      .backgroundColor('#00a6ed')
      .padding([3,6,3,6])
      .marginRight(5)
      .fontSize(15)
      .color("#000000")
      .text(`${intersection.id}`);
    header.append("h2").key("name")
      .margin(0)
      .fontSize(15)
      .color("#00a6ed")
      .text(intersection.name);

    const status = view.append('ul')
      .display('flex')
      .alignItems('center')
      .padding(0)
      .textAlign('center')
      .color('#000000');

    this._latencyView = status.append('li')
      .display('inline-block')
      .width(50)
      .backgroundColor('#00a6ed')
      .fontSize(11)
      .lineHeight('1.5em')
      .borderRadius('20px')
      .marginRight(10)
      .text('746ms');
    this._latencyView.setStyle('list-style', 'none');

    this._modeView = status.append('li')
      .display('inline-block')
      .width(50)
      .backgroundColor('#00a6ed')
      .fontSize(11)
      .lineHeight('1.5em')
      .borderRadius('20px')
      .marginRight(10)
      .text('--');
    this._modeView.setStyle('list-style', 'none');

    const content = view.append('div')
      .display('flex')
      .flexDirection('column')
      .flexGrow(1)
      .overflow('auto');

    content.append('h3')
      .fontWeight('normal')
      .text('Phase');
    const canvas = content.append('div')
      .height(60)
      .append('canvas');
    const chart = new ChartView()
      .bottomAxis("linear")
      .leftAxis("linear")
      .bottomGesture(true)
      .leftDomainPadding([0.1, 0.1])
      .topGutter(0)
      .rightGutter(0)
      .bottomGutter(20)
      .leftGutter(-1)
      .domainColor("#4a4a4a")
      .tickMarkColor("#4a4a4a")
      .font("12px sans-serif")
      .textColor("#4a4a4a");
    canvas.append(chart);

    const plot = new LineGraphView()
      .stroke("#4a4a4a")
      .strokeWidth(2);
    chart.addPlot(plot);

    // const footer = view.append('footer')
    //   .textAlign('right');
    // footer.append('span').text('test');

  }

  popoverDidShow(view: any): void {
    this.linkLatency();
    this.linkMode();
  }

  popoverDidHide(view: any): void {
    this.unlinkLatency();
    this.unlinkMode();
  }

  didUpdateLatency(v: Value) {
    const tsg = v.get('tsg').numberValue() || 0;
    const tm = v.get('tm').numberValue() || 0;
    const latency = Math.abs( tsg - tm ) || 0;
    this._latencyView!.text(`${latency} ms`);
  }

  protected linkLatency() {
    if(!this._linkLatency) {
      this._linkLatency = this._nodeRef.downlinkValue()
        .laneUri("intersection/latency")
        .didSet(this.didUpdateLatency.bind(this))
        .open();
    }
  }

  protected unlinkLatency() {
    if (this._linkLatency) {
      this._linkLatency.close();
      this._linkLatency = undefined;
    }
  }

  didUpdateMode(v: Value) {
    this._modeView!.text(`${v.getItem(0).stringValue() || '--' }`);
  }

  protected linkMode() {
    if(!this._linkMode) {
      this._linkMode = this._nodeRef.downlinkValue()
        .laneUri("intersection/mode")
        .didSet(this.didUpdateMode.bind(this))
        .open();
    }
  }

  protected unlinkMode() {
    if (this._linkMode) {
      this._linkMode.close();
      this._linkMode = undefined;
    }
  }

  didUpdatePhase(key: Value, value: Value) {
    // for each phase have a chart and grab out of history and futrue map lane
  }

  protected linkPhase() {
    if(!this._linkPhase) {
      this._linkPhase = this._nodeRef.downlinkMap()
        .laneUri("phase/state")
        .didUpdate(this.didUpdatePhase.bind(this))
        .open();
    }
  }

  protected unlinkPhase() {
    if (this._linkPhase) {
      this._linkPhase.close();
      this._linkPhase = undefined;
    }
  }

  didUpdateHistory(key: Value, value: Value) {
    // for each phase have a chart and grab out of history and futrue map lane
  }

  protected linkHistory() {
    if(!this._linkHistory) {
      this._linkHistory = this._nodeRef.downlinkMap()
        .laneUri("intersection/history")
        .didUpdate(this.didUpdateHistory.bind(this))
        .open();
    }
  }

  protected unlinkHistory() {
    if (this._linkHistory) {
      this._linkHistory.close();
      this._linkHistory = undefined;
    }
  }

  didUpdateFuture(key: Value, value: Value) {
    // for each phase have a chart and grab out of history and futrue map lane
  }

  protected linkFuture() {
    if(!this._linkFuture) {
      this._linkFuture = this._nodeRef.downlinkMap()
        .laneUri("intersection/future")
        .didUpdate(this.didUpdateFuture.bind(this))
        .open();
    }
  }

  protected unlinkFuture() {
    if (this._linkFuture) {
      this._linkFuture.close();
      this._linkFuture = undefined;
    }
  }

}
