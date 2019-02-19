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

import swim.math.TensorDims;
import swim.math.TensorForm;
import swim.structure.Item;
import swim.structure.Kind;
import swim.structure.Record;
import swim.structure.Value;
import swim.util.Murmur3;

public final class VehicleDetectorTensor {
  public double occupancy;
  public int count;

  public VehicleDetectorTensor(double occupancy, int count) {
    this.occupancy = occupancy;
    this.count = count;
  }

  public VehicleDetectorTensor() {
    this(0.0, 0);
  }

  public Value toValue() {
    return form().mold(this).toValue();
  }

  @Override
  public VehicleDetectorTensor clone() {
    return new VehicleDetectorTensor(occupancy, count);
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    } else if (other instanceof VehicleDetectorTensor) {
      final VehicleDetectorTensor that = (VehicleDetectorTensor) other;
      return occupancy == that.occupancy && count == that.count;
    } else {
      return false;
    }
  }

  @Override
  public int hashCode() {
    return Murmur3.mash(Murmur3.mix(Murmur3.mix(0x84B2D172,
        Murmur3.hash(occupancy)), Murmur3.hash(count)));
  }

  @Override
  public String toString() {
    return "new" + ' ' + "VehicleDetectorTensor" + '(' + occupancy + ", " + count + ')';
  }

  public static final int TENSOR_SIZE = 1;

  private static TensorForm<VehicleDetectorTensor> form;

  @Kind
  public static TensorForm<VehicleDetectorTensor> form() {
    if (form == null) {
      form = new VehicleDetectorTensorForm();
    }
    return form;
  }
}

final class VehicleDetectorTensorForm extends TensorForm<VehicleDetectorTensor> {
  @Override
  public Class<?> type() {
    return VehicleDetectorTensor.class;
  }

  @Override
  public VehicleDetectorTensor unit() {
    return new VehicleDetectorTensor();
  }

  @Override
  public Item mold(VehicleDetectorTensor tensor) {
    return Record.create(2)
        .slot("occupancy", tensor.occupancy)
        .slot("count", tensor.count);
  }

  @Override
  public VehicleDetectorTensor cast(Item item) {
    final Value value = item.toValue();
    final double occupancy = value.get("occupancy").doubleValue(Double.NaN);
    final int count = value.get("count").intValue(-1);
    if (!Double.isNaN(occupancy) && count >= 0) {
      return new VehicleDetectorTensor(occupancy, count);
    } else {
      return null;
    }
  }

  @Override
  public void toTensor(VehicleDetectorTensor object, TensorDims dims, float[] tensor, int offset) {
    tensor[offset] = (float) object.occupancy;
  }

  @Override
  public void toTensor(VehicleDetectorTensor object, TensorDims dims, double[] tensor, int offset) {
    tensor[offset] = object.occupancy;
  }

  @Override
  public VehicleDetectorTensor fromTensor(TensorDims dims, float[] tensor, int offset) {
    final double occupancy = tensor[offset];
    return new VehicleDetectorTensor(occupancy, 0);
  }

  @Override
  public VehicleDetectorTensor fromTensor(TensorDims dims, double[] tensor, int offset) {
    final double occupancy = tensor[offset];
    return new VehicleDetectorTensor(occupancy, 0);
  }
}
