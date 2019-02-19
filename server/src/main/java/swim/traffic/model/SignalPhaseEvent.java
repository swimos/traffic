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

package swim.traffic.model;

import swim.structure.Form;
import swim.structure.Item;
import swim.structure.Kind;
import swim.structure.Record;
import swim.structure.Value;
import swim.util.Murmur3;

public final class SignalPhaseEvent {
  public long time;
  public int state;

  public SignalPhaseEvent(long time, int state) {
    this.time = time;
    this.state = state;
  }

  public SignalPhaseEvent() {
    this(0L, 0);
  }

  public void update(long time, SignalPhaseTensor current, SignalPhaseTensor future) {
    final int currentState = (int) Math.round(current.red);
    final int futureState = (int) Math.round(future.red);
    if (this.time == 0L && currentState != futureState && Math.abs(future.red - current.red) > 0.4) {
      this.time = time;
      this.state = futureState;
    }
  }

  public Value toValue() {
    return form().mold(this).toValue();
  }

  @Override
  public SignalPhaseEvent clone() {
    return new SignalPhaseEvent(time, state);
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    } else if (other instanceof SignalPhaseEvent) {
      final SignalPhaseEvent that = (SignalPhaseEvent) other;
      return time == that.time && state == that.state;
    } else {
      return false;
    }
  }

  @Override
  public int hashCode() {
    return Murmur3.mash(Murmur3.mix(Murmur3.mix(0x7A3554D3,
        Murmur3.hash(time)), Murmur3.hash(state)));
  }

  @Override
  public String toString() {
    return "new" + ' ' + "SignalPhaseEvent" + '(' + time + "L, " + state + ')';
  }

  private static Form<SignalPhaseEvent> form;

  @Kind
  public static Form<SignalPhaseEvent> form() {
    if (form == null) {
      form = new SignalPhaseEventForm();
    }
    return form;
  }
}

final class SignalPhaseEventForm extends Form<SignalPhaseEvent> {
  @Override
  public Class<?> type() {
    return SignalPhaseEvent.class;
  }

  @Override
  public SignalPhaseEvent unit() {
    return new SignalPhaseEvent();
  }

  @Override
  public Item mold(SignalPhaseEvent event) {
    return Record.create(2)
        .slot("clk", event.time)
        .slot("st", event.state);
  }

  @Override
  public SignalPhaseEvent cast(Item item) {
    final Value value = item.toValue();
    final long time = value.get("clk").longValue(0L);
    final int state = value.get("st").intValue(0);
    if (time != 0L && state != 0) {
      return new SignalPhaseEvent(time, state);
    } else {
      return null;
    }
  }
}
