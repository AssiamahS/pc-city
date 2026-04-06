"use client";
/* eslint-disable react-compiler/react-compiler */
// @ts-nocheck — R3F JSX intrinsics (mesh, boxGeometry, etc.) need this with strict TS

import { useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { BUILDINGS, SCENARIOS, type Building, type MessageFlow } from "./buildings";

// ---------------------------------------------------------------------------
// Single building mesh
// ---------------------------------------------------------------------------
function BuildingMesh(props: {
  building: Building;
  selected: boolean;
  onSelect: () => void;
}) {
  "use no memo";
  const { building, selected, onSelect } = props;
  const meshRef = useRef<THREE.Mesh>(null!);
  const hovered = useRef(false);
  const [w, h, d] = building.size;

  useFrame(() => {
    if (!meshRef.current) return;
    const s = hovered.current || selected ? 1.04 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
  });

  return (
    <group position={building.position}>
      <mesh
        ref={meshRef}
        position={[0, h / 2, 0]}
        onClick={(e: any) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { hovered.current = true; }}
        onPointerOut={() => { hovered.current = false; }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={building.color}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {building.type === "hospital" && (
        <mesh position={[0, h + 0.25, 0]}>
          <boxGeometry args={[w * 0.3, 0.5, d * 0.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
      {building.type === "patient" && (
        <mesh position={[0, h + 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
          <coneGeometry args={[1.6, 0.8, 4]} />
          <meshStandardMaterial color="#0891b2" />
        </mesh>
      )}

      <Text
        position={[0, h + (building.type === "patient" ? 1.5 : 0.8), 0]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {building.label}
      </Text>

      <Text
        position={[0, h / 2, d / 2 + 0.01]}
        fontSize={0.7}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {building.type === "doctor" ? "+" :
         building.type === "pharmacy" ? "Rx" :
         building.type === "hospital" ? "H" :
         building.type === "lab" ? "LAB" :
         building.type === "insurance" ? "$" :
         "HOME"}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Animated message orb — pure imperative, no per-frame state updates
// ---------------------------------------------------------------------------
function MessageOrb(props: {
  flow: MessageFlow & { fromPos: [number, number, number]; toPos: [number, number, number] };
  staggerDelay: number;
}) {
  "use no memo";
  const { flow, staggerDelay } = props;
  const orbRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const labelRef = useRef<THREE.Group>(null!);
  const startTime = useRef(Date.now() + staggerDelay * 1000);

  const from = useMemo(
    () => new THREE.Vector3(flow.fromPos[0], flow.fromPos[1] + 1, flow.fromPos[2]),
    [flow.fromPos[0], flow.fromPos[1], flow.fromPos[2]]
  );
  const to = useMemo(
    () => new THREE.Vector3(flow.toPos[0], flow.toPos[1] + 1, flow.toPos[2]),
    [flow.toPos[0], flow.toPos[1], flow.toPos[2]]
  );
  const mid = useMemo(() => {
    const m = from.clone().lerp(to, 0.5);
    m.y += 3;
    return m;
  }, [from, to]);

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(from, mid, to), [from, mid, to]);
  const linePoints = useMemo(() => curve.getPoints(30), [curve]);

  useFrame(() => {
    if (!orbRef.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed < 0) {
      orbRef.current.visible = false;
      glowRef.current.visible = false;
      return;
    }
    const loopTime = elapsed % (flow.speed + 1);
    const t = Math.min(loopTime / flow.speed, 1);

    if (t >= 1) {
      orbRef.current.visible = false;
      glowRef.current.visible = false;
      return;
    }

    orbRef.current.visible = true;
    glowRef.current.visible = true;
    const pos = curve.getPointAt(t);
    orbRef.current.position.copy(pos);
    glowRef.current.position.copy(pos);
  });

  return (
    <>
      <Line
        points={linePoints}
        color={flow.color}
        lineWidth={1}
        transparent
        opacity={0.25}
      />
      <mesh ref={orbRef} visible={false}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial
          color={flow.color}
          emissive={flow.color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={glowRef} visible={false}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial
          color={flow.color}
          emissive={flow.color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Ground + grid
// ---------------------------------------------------------------------------
function Ground() {
  "use no memo";
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <gridHelper args={[40, 20, "#334155", "#1e293b"]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Road between two buildings
// ---------------------------------------------------------------------------
function Road(props: { from: [number, number, number]; to: [number, number, number] }) {
  "use no memo";
  const start = new THREE.Vector3(props.from[0], 0.01, props.from[2]);
  const end = new THREE.Vector3(props.to[0], 0.01, props.to[2]);
  const midpoint = start.clone().lerp(end, 0.5);
  const dir = end.clone().sub(start);
  const length = dir.length();
  const angle = Math.atan2(dir.x, dir.z);

  return (
    <mesh position={[midpoint.x, 0.02, midpoint.z]} rotation={[-Math.PI / 2, 0, -angle]}>
      <planeGeometry args={[0.6, length]} />
      <meshStandardMaterial color="#334155" />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
function Scene(props: {
  scenarioIndex: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  "use no memo";
  const { scenarioIndex, selectedId, onSelect } = props;
  const scenario = SCENARIOS[scenarioIndex];

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of BUILDINGS) map[b.id] = b;
    return map;
  }, []);

  const roads = useMemo(() => {
    const seen = new Set<string>();
    return scenario.flows
      .map((f) => {
        const key = [f.from, f.to].sort().join("-");
        if (seen.has(key)) return null;
        seen.add(key);
        return { from: buildingMap[f.from].position, to: buildingMap[f.to].position };
      })
      .filter(Boolean) as { from: [number, number, number]; to: [number, number, number] }[];
  }, [scenario, buildingMap]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.3} />
      <fog attach="fog" args={["#0a0a1a", 25, 55]} />

      <Ground />
      {roads.map((r, i) => (
        <Road key={`road-${i}`} from={r.from} to={r.to} />
      ))}

      {BUILDINGS.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          selected={selectedId === b.id}
          onSelect={() => onSelect(selectedId === b.id ? null : b.id)}
        />
      ))}

      {scenario.flows.map((flow, i) => (
        <MessageOrb
          key={`${scenarioIndex}-${flow.id}`}
          flow={{
            ...flow,
            fromPos: buildingMap[flow.from].position,
            toPos: buildingMap[flow.to].position,
          }}
          staggerDelay={i * 1.5}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.2}
        enablePan
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export default function HealthcareCity() {
  "use no memo";
  const [scenario, setScenario] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBuilding = selected ? BUILDINGS.find((b) => b.id === selected) : null;

  return (
    <div className="relative h-screen w-screen bg-[#0a0a1a]">
      <Canvas
        shadows
        camera={{ position: [0, 14, 18], fov: 50 }}
        onPointerMissed={() => setSelected(null)}
      >
        <Scene scenarioIndex={scenario} selectedId={selected} onSelect={setSelected} />
      </Canvas>

      {/* Title */}
      <div className="pointer-events-none absolute left-6 top-6">
        <h1 className="text-2xl font-bold text-white">Healthcare City</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every building is a healthcare entity. Watch messages flow between them.
        </p>
      </div>

      {/* Scenario picker */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.name}
            onClick={() => { setScenario(i); setSelected(null); }}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              scenario === i
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Info panel */}
      {selectedBuilding && (
        <div className="absolute right-6 top-6 w-72 rounded-xl bg-black/80 p-5 text-white backdrop-blur">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: selectedBuilding.color }}
            />
            <h2 className="text-lg font-semibold">{selectedBuilding.label}</h2>
          </div>
          <p className="text-sm text-zinc-300">{selectedBuilding.description}</p>
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="text-xs font-medium text-zinc-400">
              Connections in &quot;{SCENARIOS[scenario].name}&quot;:
            </p>
            <ul className="mt-1 space-y-1">
              {SCENARIOS[scenario].flows
                .filter((f) => f.from === selected || f.to === selected)
                .map((f) => (
                  <li key={f.id} className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                    {f.from === selected ? `-> ${f.label}` : `<- ${f.label}`}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
