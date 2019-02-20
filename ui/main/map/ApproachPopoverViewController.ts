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
import {PopoverView, PopoverViewController, HtmlView} from "@swim/view";
import {ApproachInfo} from "./ApproachModel";

export class ApproachPopoverViewController extends PopoverViewController {
  /** @hodden */
  _info: ApproachInfo;
  /** @hidden */
  _nodeRef: NodeRef;

  /** @hidden */
  _linkLatency?: ValueDownlink<Value>;

  /** @hidden */
  _linkMode?: ValueDownlink<Value>;

  /** @hidden */
  _phaseEvent?: MapDownlink<Value, Value>;

  /** @hidden */
  _latencyView?: HtmlView;

  /** @hidden */
  _modeView?: HtmlView;

  /** @hidden */
  _redView?: HtmlView;

  /** @hidden */
  _yellowView?: HtmlView;

  /** @hidden */
  _greenView?: HtmlView;

  constructor(info: ApproachInfo, nodeRef: NodeRef) {
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

    const approach = this._info;
    const intersection = approach.intersection!;

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
      .text('-- ms');
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
      .flexGrow(1)
      .flexDirection('column')
      .alignItems('center')
      .overflow('auto');

    const boxSide = 80;
    const boxFontSize = 23;
    this._redView = content.append('div')
      .width(boxSide)
      .height(boxSide)
      .display('flex')
      .justifyContent('center')
      .alignItems('center')
      .margin(5)
      .opacity(0.5)
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .text('0')
      .backgroundColor('#a50f21');

    this._yellowView = content.append('div')
      .width(boxSide)
      .height(boxSide)
      .display('flex')
      .justifyContent('center')
      .alignContent('center')
      .margin(5)
      .opacity(0.5)
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .text('')
      .backgroundColor('#fccf20');

    this._greenView = content.append('div')
      .width(boxSide)
      .height(boxSide)
      .display('flex')
      .justifyContent('center')
      .alignContent('center')
      .margin(5)
      .opacity(0.5)
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .text('')
      .backgroundColor('#54e218');

    const footer = view.append('footer')
      .textAlign('right');
    footer.append('span').text('test');
  }

  popoverDidShow(view: any): void {
    this.linkLatency();
    this.linkMode();
    this.linkPhaseEvent();
  }

  popoverDidHide(view: any): void {
    this.unlinkLatency();
    this.unlinkMode();
    this.unlinkPhaseEvent();
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

  didUpdatePhaseEvent(k: Value, v: Value) {
    // const phase = this._info.phase;
    const nextPhase = v.get('st').numberValue();
    const clk = v.get('clk').numberValue() || 0;
    // const countdown = Math.min( clk, 0 )
    console.log('nextPhase: ', nextPhase, ' clk: ', clk);
    console.log('k: ', k, ' v: ', v);
    console.log('info: ', this._info);
    // todo
  }

  protected linkPhaseEvent() {
    if(!this._phaseEvent) {
      this._phaseEvent = this._nodeRef.downlinkMap()
        .laneUri("phase/event")
        .didUpdate(this.didUpdatePhaseEvent.bind(this))
        .open();
    }
  }

  protected unlinkPhaseEvent() {
    if (this._phaseEvent) {
      this._phaseEvent.close();
      this._phaseEvent = undefined;
    }
  }

}
