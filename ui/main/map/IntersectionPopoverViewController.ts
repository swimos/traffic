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

import {AnyValue, Value} from "@swim/structure";
import {MapDownlink, NodeRef, ValueDownlink} from "@swim/client";
import {Color} from "@swim/color";
import {HtmlView, PopoverView, PopoverViewController} from "@swim/view";
import {AreaGraphView, ChartView, LineGraphView} from "@swim/chart";
import {IntersectionInfo} from "./IntersectionModel";

export class IntersectionPopoverViewController extends PopoverViewController {
  /** @hodden */
  _info: IntersectionInfo;
  /** @hidden */
  _nodeRef: NodeRef;

  /** @hidden */
  _linkLatency?: ValueDownlink<Value, AnyValue>;

  /** @hidden */
  _linkMode?: ValueDownlink<Value, AnyValue>;

  /** @hidden */
  _linkPhase?: MapDownlink<Value, Value, AnyValue, AnyValue>;

  /** @hidden */
  _linkHistory?: MapDownlink<Value, Value, AnyValue, AnyValue>;

  /** @hidden */
  _linkFuture?: MapDownlink<Value, Value, AnyValue, AnyValue>;

  /** @hidden */
  _latencyView?: HtmlView;

  /** @hidden */
  _modeView?: HtmlView;

  /** @hidden */
  _contentView?: HtmlView;

  /** @hidden */
  _chartChildView: { [key: number]: any };

  constructor(info: IntersectionInfo, nodeRef: NodeRef) {
    super();
    this._info = info;
    this._nodeRef = nodeRef;

    this._chartChildView = {};
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

    this._contentView = view.append('div')
      .display('flex')
      .flexDirection('column')
      .flexGrow(1)
      .overflow('auto');

    // const footer = view.append('footer')
    //   .textAlign('right');
    // footer.append('span').text('test');

  }

  popoverDidShow(view: any): void {
    this.linkLatency();
    this.linkMode();
    this.linkPhase();
    this.linkHistory();
    this.linkFuture();
  }

  popoverDidHide(view: any): void {
    this.unlinkLatency();
    this.unlinkMode();
    this.unlinkPhase();
    this.unlinkHistory();
    this.unlinkFuture();
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

  didUpdatePhase(k: Value, v: Value) {
    const key = k.numberValue() as number;
    if(!this._chartChildView[key]) {
      this._contentView!.append('h3')
        .fontWeight('normal')
        .text(`Phase ${key}`);

      const canvas=  this._contentView!.append('div')
        .height(50)
        .append('canvas')
        .position('relative');

      const chart = new ChartView()
        .bottomAxis("time")
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

      const futureColor = Color.rgb('#6c6c6c').alpha(0.2);
      const plot0 = new AreaGraphView()
        .fill(futureColor);
      chart.addPlot(plot0);

      const plot1 = new LineGraphView()
        .stroke(futureColor)
        .strokeWidth(1);
      chart.addPlot(plot1);

      const plot2 = new LineGraphView()
        .stroke("#00a6ed")
        .strokeWidth(1);
      chart.addPlot(plot2);

      this._chartChildView[key] = {
        chartVew: chart,
        plot0View: plot0,
        plot1View: plot1,
        plot2View: plot2,
      };
    }
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

  didUpdateHistory(k: Value, v: Value) {
    for(const id in this._chartChildView) {
      const phaseSample = v.get('signalPhases').get(+id).get('red').numberValue() || 0;
      this._chartChildView[id].plot2View.insertDatum({x: k.numberValue(), y: phaseSample});
    }
  }

  didRemoveHistory(k: Value, v: Value) {
    for(const id in this._chartChildView) {
      this._chartChildView[id].plot2View.removeDatum( k.numberValue() );
    }
  }

  protected linkHistory() {
    if(!this._linkHistory) {
      this._linkHistory = this._nodeRef.downlinkMap()
        .laneUri("intersection/history")
        .didUpdate(this.didUpdateHistory.bind(this))
        .didRemove(this.didRemoveHistory.bind(this))
        .open();
    }
  }

  protected unlinkHistory() {
    if (this._linkHistory) {
      this._linkHistory.close();
      this._linkHistory = undefined;
    }
  }

  didUpdateFuture(k: Value, v: Value) {
    for(const id in this._chartChildView) {
      const prediction = v.get('signalPhases').get(+id).get('red').numberValue() || 0;
      const clamped = Math.round(prediction);

      this._chartChildView[id].plot0View.insertDatum({x: k.numberValue(), y: prediction, dy: clamped});
      this._chartChildView[id].plot1View.insertDatum({x: k.numberValue(), y: prediction});
    }
  }

  didRemoveFuture(k: Value, v: Value) {
    for(const id in this._chartChildView) {
      this._chartChildView[id].plot0View.removeDatum( k.numberValue() );
      this._chartChildView[id].plot1View.removeDatum( k.numberValue() );
    }
  }

  protected linkFuture() {
    if(!this._linkFuture) {
      this._linkFuture = this._nodeRef.downlinkMap()
        .laneUri("intersection/future")
        .didUpdate(this.didUpdateFuture.bind(this))
        .didRemove(this.didRemoveFuture.bind(this))
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
