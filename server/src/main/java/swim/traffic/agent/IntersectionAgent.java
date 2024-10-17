// Copyright 2015-2022 Swim.inc
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

package swim.traffic.agent;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import swim.api.SwimLane;
import swim.api.SwimResident;
import swim.api.agent.AbstractAgent;
import swim.api.downlink.EventDownlink;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.collections.HashTrieMap;
import swim.collections.HashTrieSet;
import swim.concurrent.TimerRef;
import swim.structure.Item;
import swim.structure.Record;
import swim.structure.Value;
import swim.traffic.model.IntersectionTensor;
import swim.traffic.model.SignalPhaseEvent;
import swim.traffic.model.SignalPhaseModel;
import swim.traffic.model.SignalPhaseTensor;
import swim.traffic.model.VehicleDetectorEvent;
import swim.traffic.model.VehicleDetectorTensor;
import swim.uri.Uri;

public class IntersectionAgent extends AbstractAgent {
  long lastScanTime;
  TimerRef sampleTimer;
  TimerRef simTimer;
  IntersectionTensor intersectionTensor;
  HashTrieMap<Integer, Long> lastSignalPhaseEvent = HashTrieMap.empty();
  HashTrieMap<Integer, SignalPhaseModel> signalPhaseModels = HashTrieMap.empty();
  EventDownlink<Value> infoLink;
  EventDownlink<Value> schematicLink;
  EventDownlink<Value> scanLink;
  EventDownlink<Value> latencyLink;


  // 4 minute window; 1 second samples
  static final Long SAMPLE_WINDOW = 1000L;
  static final int SAMPLE_COUNT = 240; // MUST BE EVEN

  static final Long SIM_START_DELAY = 5000L;
  static final Long SIM_WINDOW_DEFAULT = 3000L;
  int simCycles = 0;

  @SwimResident
  @SwimLane("intersection/info")
  public ValueLane<Value> info;

  @SwimResident
  @SwimLane("intersection/schematic")
  public ValueLane<Value> schematic;

  @SwimResident
  @SwimLane("intersection/mode")
  public ValueLane<Value> mode;

  @SwimResident
  @SwimLane("intersection/latency")
  public ValueLane<Value> latency;

  @SwimLane("intersection/history")
  public MapLane<Long, IntersectionTensor> intersectionHistory;

  @SwimResident
  @SwimLane("phase/state")
  public MapLane<Integer, Integer> signalPhaseState = this.<Integer, Integer>mapLane()
      .didUpdate(this::didUpdateSignalPhase);

  private final boolean simMode = System.getProperty("sim.mode", "false").equals("true");

  void didUpdateSignalPhase(Integer phaseId, Integer newPhase, Integer oldPhase) {
    updateSignalPhaseTensor(phaseId, newPhase, oldPhase, System.currentTimeMillis());
  }

  void updateSignalPhaseTensor(Integer phaseId, Integer newPhase, Integer oldPhase, long t1) {
    final Long t0 = lastSignalPhaseEvent.get(phaseId);
    lastSignalPhaseEvent = lastSignalPhaseEvent.updated(phaseId, t1);
    if (t0 == null || oldPhase == null) {
      return;
    }
    final long dt = t1 - t0;
    final double dw = (double) dt / (double) SAMPLE_WINDOW;
    final SignalPhaseTensor signalTensor = intersectionTensor.signalPhase(phaseId);
    if (oldPhase == 1) {
      signalTensor.red = Math.min(signalTensor.red + dw, 1.0);
    } else if (oldPhase == 2) {
      signalTensor.yellow = Math.min(signalTensor.yellow + dw, 1.0);
    } else if (oldPhase == 3) {
      signalTensor.green = Math.min(signalTensor.green + dw, 1.0);
    }
  }

  @SwimResident
  @SwimLane("phase/event")
  public MapLane<Integer, SignalPhaseEvent> signalPhaseEvents;

  @SwimResident
  @SwimLane("detector/state")
  public MapLane<Integer, Integer> vehicleDetectorState;

  @SwimResident
  @SwimLane("detector/event")
  public MapLane<Integer, VehicleDetectorEvent> vehicleDetectorEvents;

  @SwimResident
  @SwimLane("pedPhase/state")
  public MapLane<Integer, Integer> pedPhaseState;

  @SwimResident
  @SwimLane("pedCall/state")
  public MapLane<Integer, Integer> pedCallState = this.<Integer, Integer>mapLane()
      .didUpdate(this::didUpdatePedCall);

  void didUpdatePedCall(Integer phaseId, Integer newPhase, Integer oldPhase) {
    int st = 0;
    for (Integer state : pedCallState.values()) {
      st = Math.max(st, state);
    }
    pedCall.set(st);
  }

  @SwimResident
  @SwimLane("pedCall")
  public ValueLane<Integer> pedCall;

  void sampleIntersectionTensor() {
    try {
      final long t = System.currentTimeMillis();
      for (Integer phaseId : lastSignalPhaseEvent.keySet()) {
        final Integer state = signalPhaseState.get(phaseId);
        updateSignalPhaseTensor(phaseId, state, state, t);
      }
      intersectionHistory.put(t, intersectionTensor);
      try {
        while (intersectionHistory.size() > SAMPLE_COUNT + 1) {
          intersectionHistory.remove(intersectionHistory.firstKey());
        }
      } catch (Throwable cause) {
        cause.printStackTrace();
      }

      for (SignalPhaseTensor signalTensor : intersectionTensor.signalPhases.values()) {
        signalTensor.red = 0.0;
        signalTensor.yellow = 0.0;
        signalTensor.green = 0.0;
      }
      for (VehicleDetectorTensor vehicleTensor : intersectionTensor.vehicleDetectors.values()) {
        vehicleTensor.occupancy = 0.0;
        vehicleTensor.count = 0;
      }
    } catch (Throwable cause) {
      cause.printStackTrace();
    } finally {
      sampleTimer = setTimer(SAMPLE_WINDOW, this::sampleIntersectionTensor);
    }
  }

  void initIntersectionTensor() {
    intersectionTensor = new IntersectionTensor();
    for (Integer phaseId : signalPhaseState.keySet()) {
      intersectionTensor.signalPhase(phaseId);
    }
    for (Integer detectorId : vehicleDetectorState.keySet()) {
      intersectionTensor.vehicleDetector(detectorId);
    }
  }

  public void linkInfo() {
    if (infoLink == null) {
      infoLink = downlink()
          .hostUri(TRAFFIC_HOST_URI)
          .nodeUri(Uri.create(nodeUri().path()))
          .laneUri("info")
          .onEvent(this::didSetRemoteInfo)
          .keepSynced(true)
          .open();
    }
  }

  public void unlinkInfo() {
    if (infoLink != null) {
      infoLink.close();
      infoLink = null;
    }
  }

  void didSetRemoteInfo(Value newValue) {
    info.set(newValue);
  }

  public void linkSchematic() {
    if (schematicLink == null) {
      schematicLink = downlink()
          .hostUri(TRAFFIC_HOST_URI)
          .nodeUri(Uri.create(nodeUri().path()))
          .laneUri("schematic")
          .onEvent(this::didSetRemoteSchematic)
          .keepSynced(true)
          .open();
    }
  }

  public void unlinkSchematic() {
    if (schematicLink != null) {
      schematicLink.close();
      schematicLink = null;
    }
  }

  void didSetRemoteSchematic(Value newValue) {
    //System.out.println(nodeUri() + " didSetRemoteSchematic: " + Recon.toString(newValue));
    schematic.set(newValue);
  }

  public void linkScan() {
    if (scanLink == null) {
      lastScanTime = System.currentTimeMillis();
      scanLink = downlink()
          .hostUri(TRAFFIC_HOST)
          .nodeUri(Uri.create(nodeUri().path()))
          .laneUri("scan/state")
          .onEvent(this::didUpdateRemoteScan)
          .open()
          .didConnect(() -> {
            System.out.println(nodeUri() + " scan connect");
          })
          .didDisconnect(() -> {
            System.out.println(nodeUri() + " scan disconnect");
          })
          .didUnlink(() -> {
            System.out.println(nodeUri() + " scan unlink");
          });
    }
  }

  public void unlinkScan() {
    if (scanLink != null) {
      scanLink.close();
      System.out.println(nodeUri() + " Closing scan link");
      scanLink = null;
    }
  }

  private Map<Integer, Integer> phaseIds = new HashMap<>();
  private Map<Integer, Boolean> detectorIds = new HashMap<>();

  void simScan() {
    final Value approaches = this.schematic.get();
    final Iterator<Item> iterator = approaches.iterator();
    boolean hasGreenOrYellow = false;
    final Set<Integer> phases = new HashSet<>();
    final Set<Integer> detectors = new HashSet<>();
    final Map<Integer, Integer> updatedPhaseIds = new HashMap<>();

    while (iterator.hasNext()) {
      final Item item = iterator.next();
      if (item.tag() != null && item.tag().equals("approach")) {
        int phaseId = item.get("phase").intValue(-1);
        if (phaseId >= 0 && !phases.contains(phaseId)) {
          phases.add(phaseId);
          Integer prevState = this.phaseIds.getOrDefault(phaseId, 1);
          final Integer newState = simPhase(hasGreenOrYellow, prevState);
          if (newState == 3) {
            hasGreenOrYellow = true;
          }
          if (prevState.intValue() != newState.intValue()) {
            this.phaseIds.put(phaseId, newState);
            updatedPhaseIds.put(phaseId, newState);
          }
        }
        int detectorId = item.get("detector").intValue(-1);
        if (detectorId >= 0 && !detectors.contains(detectorId)) {
          detectors.add(detectorId);
          final Boolean newState = simDetector();
          this.detectorIds.put(detectorId, newState);
          this.vehicleDetectorState.put(detectorId, newState ? 1 : 0);
        }
      }
    }

    final long clk = System.currentTimeMillis() - 30;
    for (Integer phaseId: updatedPhaseIds.keySet()) {
      this.didUpdateRemoteSignalPhase(phaseId, updatedPhaseIds.get(phaseId), clk);
    }
    for (Integer detectorId: detectorIds.keySet()) {
      this.vehicleDetectorState.put(detectorId, detectorIds.get(detectorId) ? 1 : 0);
    }
    simPedCall();
    simLatency();

    if (this.simCycles == 10) {
      this.simCycles = 0;
    } else {
      this.simCycles += 1;
    }
    this.simTimer.reschedule(SIM_WINDOW_DEFAULT);
  }

  private void simPedCall() {
    if (simCycles == 0) {
      int pedCallState = Math.random() < 0.2 ? 1 : -1;
      this.pedCall.set(pedCallState);
    }
  }

  private void simLatency() {
    long tsg = System.currentTimeMillis();
    long tsm = tsg - (long) (50 + Math.random() * 500);
    this.latency.set(Record.create(2).slot("tsg", tsg).slot("tm", tsm));
  }

  private Boolean simDetector() {
    return Math.random() < 0.2;
  }

  private Integer simPhase(boolean hasGreenOrYellow, Integer prevValue) {
    // 1 is Red, 2 is Yellow, 3 is Green
    if (prevValue == 1 && this.simCycles == 0 && !hasGreenOrYellow) {
      return 3;
    } else if (prevValue == 2) {
      return 1;
    } else if (this.simCycles == 0) {
      return 2;
    } else {
      return prevValue;
    }
  }

  void didUpdateRemoteScan(Value value) {
    if (value instanceof Record) {
      final Record state = (Record) value;
      final long clk = state.get("clk").longValue(0L);

      final Value st = state.get("st");

      final Value p = state.get("p");
      if (p.isDefined()) {
        didUpdateRemoteSignalPhase(p.intValue(), st.intValue(), clk);
      }

      final Value d = state.get("d");
      if (d.isDefined()) {
        didUpdateRemoteVehicleDetector(d.intValue(), st.intValue(), clk);
      }

      final Value pp = state.get("pp");
      if (pp.isDefined()) {
        didUpdateRemotePedPhase(pp.intValue(), st.intValue(), clk);
      }

      final Value pc = state.get("pc");
      if (pc.isDefined()) {
        didUpdateRemotePedCall(pc.intValue(), st.intValue(), clk);
      }

      final String coord = state.get("coord").stringValue("");
      if (!this.mode.get().get("coord").stringValue("").equals(coord)) {
        this.mode.set(Record.create(1).slot("coord", coord));
      }
      lastScanTime = System.currentTimeMillis();
    }
  }

  static final HashTrieSet<Uri> ENABLED = HashTrieSet.of(Uri.parse("/intersection/US/CA/PaloAlto/24"));

  void
  didUpdateRemoteSignalPhase(int p, int st, long clk) {
    //System.out.println(nodeUri() + " didUpdateRemoteSignalPhase p: " + p + "; st: " + st);
    signalPhaseState.put(p, st);

    SignalPhaseModel model = signalPhaseModels.get(p);
    if (model == null) {
      model = new SignalPhaseModel(p);
      signalPhaseModels = signalPhaseModels.updated(p, model);
    }
    final long lag = System.currentTimeMillis() - clk;
    final boolean modelChanged = model.updateState(st, clk);
    if (modelChanged && model.hasCycled() && !ENABLED.contains(nodeUri())) {
      if (model.isPredictable()) {
        final long t13 = model.nextRedToGreen() + lag;
        final long t32 = model.nextGreenToYellow() + lag;
        final long t21 = model.nextYellowToRed() + lag;
        if (t13 < t32 && t13 < t21) {
          signalPhaseEvents.put(p, new SignalPhaseEvent(t13, 3));
        } else if (t32 < t21 && t32 < t13) {
          signalPhaseEvents.put(p, new SignalPhaseEvent(t32, 2));
        } else if (t21 < t13 && t21 < t32) {
          signalPhaseEvents.put(p, new SignalPhaseEvent(t21, 1));
        }
      } else if (model.isUnpredictable()) {
        // enable learning
      }
    }
  }

  void didUpdateRemoteVehicleDetector(int d, int st, long clk) {
    vehicleDetectorState.put(d, st);
  }

  void didUpdateRemotePedPhase(int pp, int st, long clk) {
    pedPhaseState.put(pp, st);
  }

  void didUpdateRemotePedCall(int pc, int st, long clk) {
    pedCallState.put(pc, st);
  }

  public void linkLatency() {
    if (latencyLink == null) {
      latencyLink = downlink()
          .hostUri(TRAFFIC_HOST_URI)
          .nodeUri(Uri.create(nodeUri().path()))
          .laneUri("latency")
          .onEvent(this::didSetRemoteLatency)
          .keepSynced(true)
          .open();
    }
  }

  public void unlinkLatency() {
    if (latencyLink != null) {
      latencyLink.close();
      latencyLink = null;
    }
  }

  void didSetRemoteLatency(Value newValue) {
    latency.set(newValue);
  }

  @Override
  public void didStart() {
    System.out.println(nodeUri() + " didStart");
    linkInfo();
    linkSchematic();
    if (simMode) {
      this.mode.set(Record.create(1).slot("coord", "SYNC"));
      simTimer = setTimer(Math.round(Math.random() * SIM_START_DELAY), this::simScan);
    } else {
      linkScan();
      linkLatency();
    }
    initIntersectionTensor();
    sampleTimer = setTimer(SAMPLE_WINDOW, this::sampleIntersectionTensor);
  }

  @Override
  public void willStop() {
    unlinkScan();
    unlinkSchematic();
    unlinkInfo();
    unlinkLatency();
    if (sampleTimer != null) {
      sampleTimer.cancel();
      sampleTimer = null;
    }
  }

  static final String TRAFFIC_HOST = System.getProperty("trafficware.api.host",
      "warps://trafficware.swim.services?key=ab21cfe05ba-7d43-69b2-0aef-94d9d54b6f65");
  static final Uri TRAFFIC_HOST_URI = Uri.parse(TRAFFIC_HOST);
}
