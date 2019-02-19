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

public class SignalPhaseModel {
  public final int phaseId;
  int state;
  long t13; // time of last red to green transition
  long t32; // time of last green to yellow transition
  long t21; // time of last yellow to red transition
  long dt13; // time delta between consecutive red to green transitions
  long dt32; // time delta between consecutive green to yellow transitions
  long dt21; // time delta between consecutive yellow to red transitions
  long predictCount; // number of correct predictions
  long failureCount; // number of incorrect predictions

  public SignalPhaseModel(int phaseId) {
    this.phaseId = phaseId;
  }

  public boolean updateState(int state, long time) {
    if (this.state != state) {
      if (this.state == 1 && state == 3) {
        this.dt13 = this.t13 != 0L ? time - this.t13 : 0L;
        this.t13 = time;
      } else if (this.state == 3 && state == 2) {
        this.dt32 = this.t32 != 0L ? time - this.t32 : 0L;
        this.t32 = time;
      } else if (this.state == 2 && state == 1) {
        this.dt21 = this.t21 != 0L ? time - this.t21 : 0L;
        this.t21 = time;
      }
      this.state = state;
      if (hasCycled()) {
        if (isCoordinated()) {
          this.predictCount += 1L;
          if (predictCount >= FLUKE_TOLERANCE) {
            this.failureCount = 0L; // seems predictable; discard fluke errors
          }
        } else {
          this.failureCount += 1L;
          if (this.failureCount > FLUKE_TOLERANCE) {
            this.predictCount = 0L; // seems unpredictable; discard fluke predictions
          }
        }
      }
      return true;
    } else {
      return false;
    }
  }

  public long nextRedToGreen() {
    return this.dt13 != 0L ? this.t13 + this.dt13 : 0L;
  }

  public long nextGreenToYellow() {
    return this.dt32 != 0L ? this.t32 + this.dt32 : 0L;
  }

  public long nextYellowToRed() {
    return this.dt21 != 0L ? this.t21 + this.dt21 : 0L;
  }

  public boolean hasCycled() {
    return this.dt13 != 0L && this.dt32 != 0L && this.dt21 != 0L;
  }

  public long cycleTime() {
    return (long) ((double) (this.dt13 + this.dt32 + this.dt21) / 3.0);
  }

  public double cycleDeviation() {
    final double ct = (double) (this.dt13 + this.dt32 + this.dt21) / 3.0;
    final double e13 = (dt13 - ct) * (dt13 - ct);
    final double e32 = (dt32 - ct) * (dt32 - ct);
    final double e21 = (dt21 - ct) * (dt21 - ct);
    return (e13 + e32 + e21) / 3.0;
  }

  public boolean isCoordinated() {
    // predictable if cycle times deviation is less than acceptable error
    return cycleDeviation() < CYCLE_EPSILON;
  }

  public boolean isPredictable() {
    return this.predictCount >= FLUKE_TOLERANCE;
  }

  public boolean isUnpredictable() {
    return this.failureCount >= FLUKE_TOLERANCE;
  }

  static final long CYCLE_EPSILON = 1000L;
  static final long FLUKE_TOLERANCE = 10L;
}
