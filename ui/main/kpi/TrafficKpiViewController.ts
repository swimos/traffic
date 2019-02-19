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

import {Length} from "@swim/length";
import {Color} from "@swim/color";
import {HtmlView, HtmlViewController} from "@swim/view";
import {TextRunView} from "@swim/typeset";
import {GaugeView, DialView} from "@swim/gauge";
import {PieView, SliceView} from "@swim/pie";

export abstract class TrafficKpiViewController extends HtmlViewController {
  /** @hidden */
  _updateTimer: number;

  /** @hidden */
  _title?: HtmlView;

  /** @hidden */
  _subtitle?: HtmlView;

  /** @hidden */
  _meterLegend?: TextRunView;

  /** @hidden */
  _clearLegend?: TextRunView;

  constructor() {
    super();
    this._updateTimer = 0;
  }

  abstract get primaryColor(): Color;

  abstract updateKpi(): void;

  get title(): HtmlView | undefined {
    return this._title;
  }

  get subtitle(): HtmlView | undefined {
    return this._subtitle;
  }

  get meterLegend(): TextRunView | undefined {
    return this._meterLegend;
  }

  get clearLegend(): TextRunView | undefined {
    return this._clearLegend;
  }

  get pieView(): PieView {
    return this._view!.getChildView("body")!.getChildView("canvas")!.getChildView("pie")! as PieView;
  }

  get titleView(): TextRunView {
    return this.pieView.title()! as TextRunView;
  }

  get meterView(): SliceView {
    return this.pieView.getChildView("meter")! as SliceView;
  }

  get emptyView(): SliceView {
    return this.pieView.getChildView("empty") as SliceView;
  }

  didSetView(view: HtmlView): void {
    const primaryColor = this.primaryColor;

    view.display("flex")
        .flexDirection("column")
        .padding(8)
        .fontFamily("\"Open Sans\", sans-serif")
        .fontSize(12);

    const header = view.append("div")
        .display("flex")
        .justifyContent("space-between")
        .textTransform("uppercase")
        .color(primaryColor);

    const headerLeft = header.append("div");
    this._title = headerLeft.append("span").display("block").text("Palo Alto — Pedestrian Backup");
    this._subtitle = headerLeft.append("span").display("block").text("@ Crosswalks");

    const headerRight = header.append("div");
    headerRight.append("span").text("Real-Time");

    const body = view.append("div").key("body").position("relative").flexGrow(1).width("100%");
    const bodyCanvas = body.append("canvas").key("canvas");

    const gauge = new GaugeView();
    bodyCanvas.append(gauge);

    const innerDial = new DialView()
        .arrangement("manual")
        .innerRadius(Length.pct(34))
        .outerRadius(Length.pct(37))
        .dialColor(primaryColor.alpha(0.25));
    gauge.append(innerDial);

    const outerDial = new DialView()
        .arrangement("manual")
        .innerRadius(Length.pct(37))
        .outerRadius(Length.pct(40))
        .dialColor(primaryColor.alpha(0.15));
    gauge.append(outerDial);

    const pie = new PieView()
        .key("pie")
        .innerRadius(Length.pct(34))
        .outerRadius(Length.pct(40))
        .cornerRadius(Length.pct(50))
        .tickRadius(Length.pct(45))
        .font("12px \"Open Sans\", sans-serif")
        .textColor(primaryColor);
    bodyCanvas.append(pie);

    const title = new TextRunView()
        .font("36px \"Open Sans\", sans-serif")
        .textColor(primaryColor);
    pie.title(title);

    const meter = new SliceView()
        .key("meter")
        .sliceColor(primaryColor)
        .tickColor(primaryColor);
    pie.append(meter);

    this._meterLegend = new TextRunView("Waiting").textColor(primaryColor);
    meter.legend(this._meterLegend);

    const empty = new SliceView()
        .key("empty")
        .sliceColor(Color.transparent())
        .tickColor(primaryColor.darker(3));
    pie.append(empty);

    this._clearLegend = new TextRunView("Clear").textColor(primaryColor.darker(3));
    empty.legend(this._clearLegend);
  }

  viewDidMount(view: HtmlView): void {
    // force resize after flexbox layout
    requestAnimationFrame(function () { view.cascadeResize(); });

    this._updateTimer = setInterval(this.updateKpi.bind(this), 1000) as any;
    this.updateKpi();
  }

  viewWillUnmount(view: HtmlView): void {
    clearInterval(this._updateTimer);
    this._updateTimer = 0;
  }
}
