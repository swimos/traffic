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

import swim.collections.HashTrieMap;
import swim.structure.Form;
import swim.structure.Item;
import swim.structure.Kind;
import swim.structure.Num;
import swim.structure.Record;
import swim.structure.Value;
import swim.util.Murmur3;

public class IntersectionEvent {
  public HashTrieMap<Integer, SignalPhaseEvent> signalPhases;
  public HashTrieMap<Integer, VehicleDetectorEvent> vehicleDetectors;

  public IntersectionEvent(HashTrieMap<Integer, SignalPhaseEvent> signalPhases,
      HashTrieMap<Integer, VehicleDetectorEvent> vehicleDetectors) {
    this.signalPhases = signalPhases;
    this.vehicleDetectors = vehicleDetectors;
  }

  public IntersectionEvent() {
    this(HashTrieMap.empty(), HashTrieMap.empty());
  }

  public SignalPhaseEvent signalPhase(int id) {
    SignalPhaseEvent event = signalPhases.get(id);
    if (event == null) {
      event = new SignalPhaseEvent();
      signalPhases = signalPhases.updated(id, event);
    }
    return event;
  }

  public VehicleDetectorEvent vehicleDetector(int id) {
    VehicleDetectorEvent event = vehicleDetectors.get(id);
    if (event == null) {
      event = new VehicleDetectorEvent();
      vehicleDetectors = vehicleDetectors.updated(id, event);
    }
    return event;
  }

  public void update(long time, IntersectionTensor current, IntersectionTensor future) {
    for (HashTrieMap.Entry<Integer, SignalPhaseTensor> entry : current.signalPhases) {
      final SignalPhaseEvent event = signalPhase(entry.getKey());
      event.update(time, entry.getValue(), future.signalPhase(entry.getKey()));
    }
    for (HashTrieMap.Entry<Integer, VehicleDetectorTensor> entry : current.vehicleDetectors) {
      final VehicleDetectorEvent event = vehicleDetector(entry.getKey());
      event.update(time, entry.getValue(), future.vehicleDetector(entry.getKey()));
    }
  }

  public Value toValue() {
    return form().mold(this).toValue();
  }

  @Override
  public IntersectionEvent clone() {
    HashTrieMap<Integer, SignalPhaseEvent> signalPhases = HashTrieMap.empty();
    for (HashTrieMap.Entry<Integer, SignalPhaseEvent> entry : this.signalPhases) {
      signalPhases = signalPhases.updated(entry.getKey(), entry.getValue().clone());
    }
    HashTrieMap<Integer, VehicleDetectorEvent> vehicleDetectors = HashTrieMap.empty();
    for (HashTrieMap.Entry<Integer, VehicleDetectorEvent> entry : this.vehicleDetectors) {
      vehicleDetectors = vehicleDetectors.updated(entry.getKey(), entry.getValue().clone());
    }
    return new IntersectionEvent(signalPhases, vehicleDetectors);
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    } else if (other instanceof IntersectionEvent) {
      final IntersectionEvent that = (IntersectionEvent) other;
      return signalPhases.equals(that.signalPhases)
          && vehicleDetectors.equals(that.vehicleDetectors);
    } else {
      return false;
    }
  }

  @Override
  public int hashCode() {
    return Murmur3.mash(Murmur3.mix(Murmur3.mix(0xE3A15A3B,
      signalPhases.hashCode()), vehicleDetectors.hashCode()));
  }

  @Override
  public String toString() {
    return "new" + ' ' + "IntersectionEvent" + '('
        + signalPhases + ", " + vehicleDetectors + ')';
  }

  private static Form<IntersectionEvent> form;

  @Kind
  public static Form<IntersectionEvent> form() {
    if (form == null) {
      form = new IntersectionEventForm();
    }
    return form;
  }
}

final class IntersectionEventForm extends Form<IntersectionEvent> {
  @Override
  public Class<?> type() {
    return IntersectionEvent.class;
  }

  @Override
  public Item mold(IntersectionEvent event) {
    final Record signalPhases = Record.of();
    for (HashTrieMap.Entry<Integer, SignalPhaseEvent> entry : event.signalPhases) {
      signalPhases.slot(Num.from(entry.getKey()), entry.getValue().toValue());
    }

    final Record vehicleDetectors = Record.of();
    for (HashTrieMap.Entry<Integer, VehicleDetectorEvent> entry : event.vehicleDetectors) {
      vehicleDetectors.slot(Num.from(entry.getKey()), entry.getValue().toValue());
    }

    return Record.create(2)
        .slot("signalPhases", signalPhases)
        .slot("vehicleDetectors", vehicleDetectors);
  }

  @Override
  public IntersectionEvent cast(Item item) {
    final Value value = item.toValue();
    HashTrieMap<Integer, SignalPhaseEvent> signalPhases = HashTrieMap.empty();
    for (Item member : value.get("signalPhases")) {
      final int id = member.key().intValue();
      final SignalPhaseEvent event = member.toValue().coerce(SignalPhaseEvent.form());
      signalPhases = signalPhases.updated(id, event);
    }

    HashTrieMap<Integer, VehicleDetectorEvent> vehicleDetectors = HashTrieMap.empty();
    for (Item member : value.get("vehicleDetectors")) {
      final int id = member.key().intValue();
      final VehicleDetectorEvent event = member.toValue().coerce(VehicleDetectorEvent.form());
      vehicleDetectors = vehicleDetectors.updated(id, event);
    }
    return new IntersectionEvent(signalPhases, vehicleDetectors);
  }
}
