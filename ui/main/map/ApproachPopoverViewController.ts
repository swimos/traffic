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
// import {Transition} from '@swim/transition';
import {ApproachInfo} from "./ApproachModel";

export class ApproachPopoverViewController extends PopoverViewController {
  /** @hodden */
  _info: ApproachInfo;
  /** @hidden */
  _nodeRef: NodeRef;

  /** @hidden */
  _linkphases?: MapDownlink<Value, Value, AnyValue, AnyValue>;

  /** @hidden */
  _linkLatency?: ValueDownlink<Value, AnyValue>;

  /** @hidden */
  _linkMode?: ValueDownlink<Value, AnyValue>;

  /** @hidden */
  _phaseEvent?: MapDownlink<Value, Value, AnyValue, AnyValue>;

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

  /** @hidden */
  _curPhases: number = 0;

  /** @hidden */
  _countDown?: any;

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
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .opacity(0.2)
      .text('')
      .backgroundColor('#a50f21');

    this._yellowView = content.append('div')
      .width(boxSide)
      .height(boxSide)
      .display('flex')
      .justifyContent('center')
      .alignItems('center')
      .margin(5)
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .opacity(0.2)
      .text('')
      .backgroundColor('#fccf20');

    this._greenView = content.append('div')
      .width(boxSide)
      .height(boxSide)
      .display('flex')
      .justifyContent('center')
      .alignItems('center')
      .margin(5)
      .borderRadius(boxSide/2)
      .fontSize(boxFontSize)
      .opacity(0.2)
      .text('')
      .backgroundColor('#54e218');

    // const footer = view.append('footer')
    //   .textAlign('right');
    // footer.append('span').text('test');
  }

  popoverDidShow(view: any): void {
    this.linkphases();
    this.linkLatency();
    this.linkMode();
    this.linkPhaseEvent();
  }

  popoverDidHide(view: any): void {
    this.unlinkphases();
    this.unlinkLatency();
    this.unlinkMode();
    this.unlinkPhaseEvent();
  }

  didUpdatephases(k: Value, v: Value) {
    if(k.numberValue() === this._info.phase) {
      this._curPhases = v.numberValue() as number;
      this.updateLight();
    }
  }

  protected linkphases() {
    if(!this._linkphases) {
      this._linkphases = this._nodeRef.downlinkMap()
        .laneUri("phase/state")
        .didUpdate(this.didUpdatephases.bind(this))
        .open();
    }
  }

  protected unlinkphases() {
    if (this._linkphases) {
      this._linkphases.close();
      this._linkphases = undefined;
    }
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

  countDown(element: HtmlView | null, nextPhase: number): void {
    const now = new Date(); // computer time
    const phaseDate = new Date(nextPhase); // downlink time
    let countdown = Math.round( (phaseDate.getTime() - now.getTime()) / 1000 );
    if(countdown < 0) { countdown = 0; }
    element!.text(`${ countdown }`);
  }

  updateLight(nextPhase?: number) {
    let element: HtmlView | null = null;

    // Current Light
    switch( this._curPhases ) {
      case 1:
        element = this._redView!;
        break;
      case 2:
        element = this._yellowView!;
        break;
      case 3:
        element = this._greenView!;
        break;
    }
    // Reset
    this._redView!.opacity(0.2).text('');
    this._yellowView!.opacity(0.2).text('');
    this._greenView!.opacity(0.2).text('');
    clearInterval(this._countDown);
    this._countDown = undefined;

    element!.opacity(1);

    if(!nextPhase) {
      element!.text('0');
    } else {
      this.countDown(element, nextPhase);
      this._countDown = setInterval(() => {
        this.countDown(element, nextPhase);
      }, 100);
    }
  }

  changeLight(nextPhase: number) {
    this.updateLight(nextPhase);
  }

  didUpdatePhaseEvent(k: Value, v: Value) {
    if(this._info.phase === k.numberValue() ) {
      const nextPhase = v.get('clk').numberValue() as number;
      this.changeLight(nextPhase);
    }
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
