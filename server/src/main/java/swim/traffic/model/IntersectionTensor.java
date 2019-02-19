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
import swim.math.TensorDims;
import swim.math.TensorForm;
import swim.structure.Item;
import swim.structure.Kind;
import swim.structure.Num;
import swim.structure.Record;
import swim.structure.Value;
import swim.util.Murmur3;

public class IntersectionTensor {
  public HashTrieMap<Integer, SignalPhaseTensor> signalPhases;
  public HashTrieMap<Integer, VehicleDetectorTensor> vehicleDetectors;

  public IntersectionTensor(HashTrieMap<Integer, SignalPhaseTensor> signalPhases,
                            HashTrieMap<Integer, VehicleDetectorTensor> vehicleDetectors) {
    this.signalPhases = signalPhases;
    this.vehicleDetectors = vehicleDetectors;
  }

  public IntersectionTensor() {
    this(HashTrieMap.empty(), HashTrieMap.empty());
  }

  public SignalPhaseTensor signalPhase(int id) {
    SignalPhaseTensor tensor = signalPhases.get(id);
    if (tensor == null) {
      tensor = new SignalPhaseTensor();
      signalPhases = signalPhases.updated(id, tensor);
    }
    return tensor;
  }

  public VehicleDetectorTensor vehicleDetector(int id) {
    VehicleDetectorTensor tensor = vehicleDetectors.get(id);
    if (tensor == null) {
      tensor = new VehicleDetectorTensor();
      vehicleDetectors = vehicleDetectors.updated(id, tensor);
    }
    return tensor;
  }

  public int tensorSize() {
    return signalPhases.size() * SignalPhaseTensor.TENSOR_SIZE
        + vehicleDetectors.size() * VehicleDetectorTensor.TENSOR_SIZE;
  }

  public void toTensor(double[] array, int offset) {
    for (SignalPhaseTensor signalTensor : signalPhases.values()) {
      array[offset++] = signalTensor.red;
      array[offset++] = signalTensor.yellow;
      array[offset++] = signalTensor.green;
    }
    for (VehicleDetectorTensor vehicleTensor : vehicleDetectors.values()) {
      array[offset++] = vehicleTensor.occupancy;
    }
  }

  public void fromTensor(double[] array, int offset) {
    for (SignalPhaseTensor signalTensor : signalPhases.values()) {
      signalTensor.red = array[offset++];
      signalTensor.yellow = array[offset++];
      signalTensor.green = array[offset++];
    }
    for (VehicleDetectorTensor vehicleTensor : vehicleDetectors.values()) {
      vehicleTensor.occupancy = array[offset++];
    }
  }

  public void fromTensor(float[] array, int offset) {
    for (SignalPhaseTensor signalTensor : signalPhases.values()) {
      signalTensor.red = (double) array[offset++];
      signalTensor.yellow = (double) array[offset++];
      signalTensor.green = (double) array[offset++];
    }
    for (VehicleDetectorTensor vehicleTensor : vehicleDetectors.values()) {
      vehicleTensor.occupancy = (double) array[offset++];
    }
  }

  public Value toValue() {
    return form().mold(this).toValue();
  }

  @Override
  public IntersectionTensor clone() {
    HashTrieMap<Integer, SignalPhaseTensor> signalPhases = HashTrieMap.empty();
    for (HashTrieMap.Entry<Integer, SignalPhaseTensor> entry : this.signalPhases) {
      signalPhases = signalPhases.updated(entry.getKey(), entry.getValue().clone());
    }
    HashTrieMap<Integer, VehicleDetectorTensor> vehicleDetectors = HashTrieMap.empty();
    for (HashTrieMap.Entry<Integer, VehicleDetectorTensor> entry : this.vehicleDetectors) {
      vehicleDetectors = vehicleDetectors.updated(entry.getKey(), entry.getValue().clone());
    }
    return new IntersectionTensor(signalPhases, vehicleDetectors);
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    } else if (other instanceof IntersectionTensor) {
      final IntersectionTensor that = (IntersectionTensor) other;
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
    return "new" + ' ' + "IntersectionTensor" + '('
        + signalPhases + ", " + vehicleDetectors + ')';
  }

  private static TensorForm<IntersectionTensor> form;

  @Kind
  public static TensorForm<IntersectionTensor> form() {
    if (form == null) {
      form = new IntersectionTensorForm();
    }
    return form;
  }
}

final class IntersectionTensorForm extends TensorForm<IntersectionTensor> {
  @Override
  public Class<?> type() {
    return IntersectionTensor.class;
  }

  @Override
  public Item mold(IntersectionTensor tensor) {
    final Record signalPhases = Record.of();
    for (HashTrieMap.Entry<Integer, SignalPhaseTensor> entry : tensor.signalPhases) {
      signalPhases.slot(Num.from(entry.getKey()), entry.getValue().toValue());
    }

    final Record vehicleDetectors = Record.of();
    for (HashTrieMap.Entry<Integer, VehicleDetectorTensor> entry : tensor.vehicleDetectors) {
      vehicleDetectors.slot(Num.from(entry.getKey()), entry.getValue().toValue());
    }

    return Record.create(2)
        .slot("signalPhases", signalPhases)
        .slot("vehicleDetectors", vehicleDetectors);
  }

  @Override
  public IntersectionTensor cast(Item item) {
    final Value value = item.toValue();
    HashTrieMap<Integer, SignalPhaseTensor> signalPhases = HashTrieMap.empty();
    for (Item member : value.get("signalPhases")) {
      final int id = member.key().intValue();
      final SignalPhaseTensor tensor = member.toValue().coerce(SignalPhaseTensor.form());
      signalPhases = signalPhases.updated(id, tensor);
    }

    HashTrieMap<Integer, VehicleDetectorTensor> vehicleDetectors = HashTrieMap.empty();
    for (Item member : value.get("vehicleDetectors")) {
      final int id = member.key().intValue();
      final VehicleDetectorTensor tensor = member.toValue().coerce(VehicleDetectorTensor.form());
      vehicleDetectors = vehicleDetectors.updated(id, tensor);
    }
    return new IntersectionTensor(signalPhases, vehicleDetectors);
  }

  @Override
  public void toTensor(IntersectionTensor object, TensorDims dims, float[] tensor, int offset) {
    for (SignalPhaseTensor signalPhaseTensor : object.signalPhases.values()) {
      SignalPhaseTensor.form().toTensor(signalPhaseTensor, dims, tensor, offset);
      offset += SignalPhaseTensor.TENSOR_SIZE * dims.stride();
    }
    for (VehicleDetectorTensor vehicleDetectorTensor : object.vehicleDetectors.values()) {
      VehicleDetectorTensor.form().toTensor(vehicleDetectorTensor, dims, tensor, offset);
      offset += VehicleDetectorTensor.TENSOR_SIZE * dims.stride();
    }
  }

  @Override
  public void toTensor(IntersectionTensor object, TensorDims dims, double[] tensor, int offset) {
    for (SignalPhaseTensor signalPhaseTensor : object.signalPhases.values()) {
      SignalPhaseTensor.form().toTensor(signalPhaseTensor, dims, tensor, offset);
      offset += SignalPhaseTensor.TENSOR_SIZE * dims.stride();
    }
    for (VehicleDetectorTensor vehicleDetectorTensor : object.vehicleDetectors.values()) {
      VehicleDetectorTensor.form().toTensor(vehicleDetectorTensor, dims, tensor, offset);
      offset += VehicleDetectorTensor.TENSOR_SIZE * dims.stride();
    }
  }

  @Override
  public IntersectionTensor fromTensor(TensorDims dims, float[] tensor, int offset) {
    return null;
  }

  @Override
  public IntersectionTensor fromTensor(TensorDims dims, double[] tensor, int offset) {
    return null;
  }
}
