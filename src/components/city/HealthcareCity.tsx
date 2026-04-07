"use client";
/* eslint-disable react-compiler/react-compiler */
// @ts-nocheck — R3F JSX intrinsics need this with strict TS

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  DEFAULT_BUILDINGS,
  PATIENT_BUILDING,
  INSURANCE_BUILDING,
  STORIES,
  providerToBuilding,
  type Building,
  type StoryStep,
  type Story,
} from "./buildings";

// ---------------------------------------------------------------------------
// Building mesh
// ---------------------------------------------------------------------------
function BuildingMesh(props: {
  building: Building;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  "use no memo";
  const { building, active, selected, onSelect } = props;
  const meshRef = useRef<THREE.Mesh>(null!);
  const hovered = useRef(false);
  const [w, h, d] = building.size;

  useFrame(() => {
    if (!meshRef.current) return;
    const s = hovered.current || selected ? 1.05 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.12);
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = active ? 0.4 + Math.sin(Date.now() / 250) * 0.2 : selected ? 0.15 : 0;
  });

  return (
    <group position={building.position}>
      <mesh
        ref={meshRef}
        position={[0, h / 2, 0]}
        onClick={(e: any) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => { hovered.current = true; document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { hovered.current = false; document.body.style.cursor = "default"; }}
        castShadow receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={building.color} emissive={building.color} emissiveIntensity={0} metalness={0.1} roughness={0.7} />
      </mesh>
      {building.type === "hospital" && (
        <>
          <mesh position={[0, h + 0.25, 0]}><boxGeometry args={[1, 0.5, 0.25]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, h + 0.25, 0]}><boxGeometry args={[0.25, 0.5, 1]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} /></mesh>
        </>
      )}
      <Text position={[0, h + (building.type === "hospital" ? 1 : 0.5), 0]} fontSize={0.32} color="white" anchorX="center" anchorY="bottom" outlineWidth={0.03} outlineColor="#000" maxWidth={5} textAlign="center">
        {building.label}
      </Text>
      <Text position={[0, h / 2, d / 2 + 0.02]} fontSize={0.6} color="white" anchorX="center" anchorY="middle">
        {building.type === "doctor" ? "+" : building.type === "pharmacy" ? "Rx" : building.type === "hospital" ? "H" : building.type === "lab" ? "LAB" : building.type === "insurance" ? "$" : "HOME"}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Message bubble — flies between buildings with a label
// ---------------------------------------------------------------------------
function MessageBubble(props: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  label: string;
  progress: number;
  method: string;
}) {
  "use no memo";
  const { from, to, color, label, progress, method } = props;

  const fromV = useMemo(() => new THREE.Vector3(from[0], 3, from[2]), [from[0], from[2]]);
  const toV = useMemo(() => new THREE.Vector3(to[0], 3, to[2]), [to[0], to[2]]);
  const mid = useMemo(() => {
    const m = fromV.clone().lerp(toV, 0.5);
    m.y += 5;
    return m;
  }, [fromV, toV]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(fromV, mid, toV), [fromV, mid, toV]);
  const linePoints = useMemo(() => curve.getPoints(40), [curve]);

  const t = Math.max(0, Math.min(1, progress));
  const pos = curve.getPointAt(t);

  // Method icon
  const icon = method === "call" ? "CALL" : method === "fax" ? "FAX" : method === "erx" ? "eRx" : method === "claim" ? "CLM" : method === "alert" ? "!" : method === "walk" ? "GO" : "MSG";

  return (
    <>
      {/* Signal line (dashed look via opacity) */}
      <Line points={linePoints} color={color} lineWidth={1.5} transparent opacity={0.2} />
      {/* Trail up to current position */}
      {t > 0.01 && (
        <Line points={curve.getPoints(Math.floor(t * 40)).slice(0, Math.floor(t * 40) + 1)} color={color} lineWidth={2} transparent opacity={0.5} />
      )}
      {/* Message envelope/bubble */}
      <group position={[pos.x, pos.y, pos.z]}>
        {/* Bubble body */}
        <mesh>
          <boxGeometry args={[0.6, 0.35, 0.15]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.15} toneMapped={false} />
        </mesh>
        {/* Method label */}
        <Text position={[0, 0, 0.09]} fontSize={0.15} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
          {icon}
        </Text>
        {/* Label above */}
        <Text position={[0, 0.6, 0]} fontSize={0.22} color="white" anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000" maxWidth={4}>
          {label}
        </Text>
      </group>
      {/* Delivered indicator at destination */}
      {t > 0.95 && (
        <Text position={[to[0], 4.5, to[2]]} fontSize={0.25} color="#22c55e" anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000">
          Delivered
        </Text>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Ms. Jones — stays at home, only moves for "walk" steps
// ---------------------------------------------------------------------------
function PatientSprite(props: { position: THREE.Vector3; target: THREE.Vector3; moving: boolean }) {
  "use no memo";
  const groupRef = useRef<THREE.Group>(null!);
  const currentPos = useRef(props.position.clone());
  const bobRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    currentPos.current.lerp(props.target, props.moving ? 0.03 : 0.08);
    groupRef.current.position.copy(currentPos.current);
    if (props.moving) {
      bobRef.current += delta * 8;
      groupRef.current.position.y = currentPos.current.y + Math.abs(Math.sin(bobRef.current)) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={props.position}>
      <mesh position={[0, 0.5, 0]}><capsuleGeometry args={[0.2, 0.4, 8, 12]} /><meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, 1.05, 0]}><sphereGeometry args={[0.22, 12, 12]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.15} /></mesh>
      <Text position={[0, 1.6, 0]} fontSize={0.25} color="#06b6d4" anchorX="center" anchorY="bottom" outlineWidth={0.03} outlineColor="#000">Ms. Jones</Text>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.35, 16]} /><meshStandardMaterial color="#000" transparent opacity={0.3} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Ground + Roads
// ---------------------------------------------------------------------------
function Road(props: { from: [number, number, number]; to: [number, number, number] }) {
  "use no memo";
  const start = new THREE.Vector3(props.from[0], 0.015, props.from[2]);
  const end = new THREE.Vector3(props.to[0], 0.015, props.to[2]);
  const mid = start.clone().lerp(end, 0.5);
  const dir = end.clone().sub(start);
  return (
    <mesh position={[mid.x, 0.02, mid.z]} rotation={[-Math.PI / 2, 0, -Math.atan2(dir.x, dir.z)]}>
      <planeGeometry args={[0.6, dir.length()]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function Ground() {
  "use no memo";
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <gridHelper args={[60, 30, "#1a2332", "#111827"]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
function Scene(props: {
  buildings: Building[];
  activeBuildings: Set<string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentStep: StoryStep | null;
  messageProgress: number;
  patientTarget: THREE.Vector3;
  patientMoving: boolean;
}) {
  "use no memo";
  const { buildings, activeBuildings, selectedId, onSelect, currentStep, messageProgress, patientTarget, patientMoving } = props;

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of buildings) map[b.id] = b;
    return map;
  }, [buildings]);

  const roads = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: [number, number, number]; to: [number, number, number]; key: string }[] = [];
    const patient = buildingMap["patient"];
    if (!patient) return result;
    for (const b of buildings) {
      if (b.id === "patient") continue;
      const key = ["patient", b.id].sort().join("-");
      if (!seen.has(key)) { seen.add(key); result.push({ from: patient.position, to: b.position, key }); }
    }
    for (let i = 0; i < buildings.length; i++) {
      for (let j = i + 1; j < buildings.length; j++) {
        const a = buildings[i], b = buildings[j];
        if (a.id === "patient" || b.id === "patient") continue;
        const dist = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
        if (dist < 14) {
          const key = [a.id, b.id].sort().join("-");
          if (!seen.has(key)) { seen.add(key); result.push({ from: a.position, to: b.position, key }); }
        }
      }
    }
    return result;
  }, [buildings, buildingMap]);

  const patientHome = useMemo(() => {
    const p = buildingMap["patient"];
    return p ? new THREE.Vector3(p.position[0], 0, p.position[2]) : new THREE.Vector3(0, 0, 12);
  }, [buildingMap]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 25, 8]} intensity={1} castShadow />
      <pointLight position={[0, 15, 0]} intensity={0.2} color="#7c3aed" />
      <fog attach="fog" args={["#0a0a1a", 40, 70]} />
      <Ground />
      {roads.map((r) => <Road key={r.key} from={r.from} to={r.to} />)}
      {buildings.map((b) => (
        <BuildingMesh key={b.id} building={b} active={activeBuildings.has(b.id)} selected={selectedId === b.id} onSelect={() => onSelect(b.id)} />
      ))}
      {/* Message bubble between buildings */}
      {currentStep && buildingMap[currentStep.from] && buildingMap[currentStep.to] && (
        <MessageBubble
          from={buildingMap[currentStep.from].position}
          to={buildingMap[currentStep.to].position}
          color={currentStep.color}
          label={currentStep.label}
          progress={messageProgress}
          method={currentStep.method}
        />
      )}
      {/* Ms. Jones — always visible */}
      <PatientSprite position={patientHome} target={patientTarget} moving={patientMoving} />
      <OrbitControls makeDefault minDistance={12} maxDistance={50} minPolarAngle={0.2} maxPolarAngle={Math.PI / 3} enablePan />
    </>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export default function HealthcareCity() {
  "use no memo";
  const [storyIndex, setStoryIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [messageProgress, setMessageProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([PATIENT_BUILDING, INSURANCE_BUILDING, ...DEFAULT_BUILDINGS]);
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [cityName, setCityName] = useState("Springfield, IL");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [loadingCity, setLoadingCity] = useState(false);

  useEffect(() => {
    fetch("/api/providers").then((r) => r.json()).then((data) => {
      if (data.providers?.length) setBuildings([PATIENT_BUILDING, INSURANCE_BUILDING, ...data.providers.map(providerToBuilding)]);
    }).catch(() => {});
  }, []);

  const travelToCity = useCallback(async () => {
    if (!searchState) return;
    setLoadingCity(true);
    try {
      const params = new URLSearchParams();
      if (searchCity) params.set("city", searchCity);
      params.set("state", searchState);
      const res = await fetch(`/api/city?${params}`);
      const data = await res.json();
      if (data.buildings?.length) {
        setBuildings([
          { ...PATIENT_BUILDING, label: "Ms. Jones (Visiting)", description: `Gloria Jones visiting ${data.location}` },
          INSURANCE_BUILDING,
          ...data.buildings.map((b: any) => ({ id: b.id, label: b.name, type: b.type, position: b.position, size: [2.5, b.height, 2] as [number, number, number], color: b.color, description: `${b.specialty}. ${b.address.city}, ${b.address.state}.`, npi: b.npi, tagline: b.specialty })),
        ]);
        setCityName(data.location);
        if (data.scenarios?.length) { setStories(data.scenarios); setStoryIndex(0); }
        setStepIndex(-1); setPlaying(false);
      }
    } catch {}
    setLoadingCity(false);
  }, [searchCity, searchState]);

  const story = stories[storyIndex];
  const currentStep = story && stepIndex >= 0 && stepIndex < story.steps.length ? story.steps[stepIndex] : null;
  const finished = story ? stepIndex >= story.steps.length : false;

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of buildings) map[b.id] = b;
    return map;
  }, [buildings]);

  const activeBuildings = useMemo(() => {
    const set = new Set<string>();
    if (currentStep) { set.add(currentStep.from); set.add(currentStep.to); }
    return set;
  }, [currentStep]);

  // Ms. Jones position — only moves for "walk" method steps
  const patientHome = useMemo(() => {
    const p = buildingMap["patient"];
    return new THREE.Vector3(p?.position[0] || 0, 0, p?.position[2] || 12);
  }, [buildingMap]);

  const patientTarget = useMemo(() => {
    if (!currentStep) return patientHome;
    if (currentStep.method === "walk") {
      const dest = buildingMap[currentStep.to];
      if (dest) return new THREE.Vector3(dest.position[0], 0, dest.position[2]);
    }
    // If patient is the "from" on a non-walk step, she's at home on the phone
    return patientHome;
  }, [currentStep, buildingMap, patientHome]);

  // Animate message progress
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!playing || !currentStep) return;
    startTimeRef.current = Date.now();
    setMessageProgress(0);

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / currentStep.duration, 1);
      setMessageProgress(progress);
      if (progress >= 1) {
        // Pause briefly at "delivered" then advance
        setTimeout(() => {
          if (stepIndex < story.steps.length - 1) setStepIndex((s) => s + 1);
          else { setStepIndex(story.steps.length); setPlaying(false); }
        }, 600);
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, stepIndex, currentStep, story]);

  const handlePlay = useCallback(() => {
    if (!story) return;
    if (stepIndex < 0 || stepIndex >= story.steps.length) setStepIndex(0);
    setPlaying(true);
  }, [stepIndex, story]);

  const handleStep = useCallback((dir: number) => {
    if (!story) return;
    setPlaying(false);
    setStepIndex((s) => Math.max(0, Math.min(story.steps.length - 1, s + dir)));
    setMessageProgress(1);
  }, [story]);

  const handleReset = useCallback(() => { setPlaying(false); setStepIndex(-1); setMessageProgress(0); }, []);

  const selectedBuilding = selected ? buildings.find((b) => b.id === selected) : null;

  return (
    <div className="relative h-screen w-screen bg-[#0a0a1a] overflow-hidden select-none">
      <Canvas shadows camera={{ position: [0, 30, 24], fov: 40 }} onPointerMissed={() => {}}>
        <Scene
          buildings={buildings}
          activeBuildings={activeBuildings}
          selectedId={selected}
          onSelect={setSelected}
          currentStep={currentStep}
          messageProgress={messageProgress}
          patientTarget={patientTarget}
          patientMoving={playing && currentStep?.method === "walk"}
        />
      </Canvas>

      {/* TOP LEFT: Coordra branding + Travel */}
      <div className="absolute left-4 top-4 w-52">
        <h1 className="text-lg font-bold text-white tracking-tight">Coordra</h1>
        <p className="text-[10px] text-zinc-500">{cityName} &middot; Healthcare Communication</p>
        <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-2">
          <p className="text-[8px] text-zinc-600 uppercase tracking-wider font-semibold mb-1">Travel to City</p>
          <div className="flex gap-1">
            <input value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="City" className="flex-1 rounded bg-white/5 border border-white/10 px-1.5 py-1 text-[10px] text-white placeholder:text-zinc-600 focus:outline-none" onKeyDown={(e) => e.key === "Enter" && travelToCity()} />
            <input value={searchState} onChange={(e) => setSearchState(e.target.value.toUpperCase().slice(0, 2))} placeholder="ST" className="w-8 rounded bg-white/5 border border-white/10 px-1 py-1 text-[10px] text-white text-center placeholder:text-zinc-600 focus:outline-none" onKeyDown={(e) => e.key === "Enter" && travelToCity()} />
          </div>
          <button onClick={travelToCity} disabled={loadingCity || !searchState} className="mt-1 w-full rounded bg-white/10 py-0.5 text-[9px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-30">
            {loadingCity ? "Loading..." : "Go"}
          </button>
        </div>
        <a href="/shop" className="mt-1.5 inline-block text-[9px] text-zinc-600 hover:text-white transition">+ Claim a Building</a>
      </div>

      {/* TOP RIGHT: Building info (sticky) */}
      {selectedBuilding && (
        <div className="absolute right-4 top-4 w-56 rounded-xl bg-black/85 p-3 text-white backdrop-blur-lg border border-white/10">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedBuilding.color }} />
              <h2 className="text-[11px] font-bold leading-tight">{selectedBuilding.label}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white text-[10px]">x</button>
          </div>
          {selectedBuilding.tagline && <p className="text-[9px] text-zinc-400 italic mb-1">{selectedBuilding.tagline}</p>}
          <p className="text-[10px] text-zinc-300 leading-relaxed">{selectedBuilding.description}</p>
          {selectedBuilding.npi && <p className="text-[8px] text-zinc-600 font-mono mt-1.5">NPI {selectedBuilding.npi}</p>}
        </div>
      )}

      {/* BOTTOM LEFT: Scenarios */}
      <div className="absolute left-4 bottom-24 max-h-[200px] overflow-y-auto flex flex-col gap-0.5">
        <p className="text-[8px] text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">Scenarios</p>
        {stories.map((s, i) => (
          <button key={s.id} onClick={() => { setPlaying(false); setStoryIndex(i); setStepIndex(-1); setMessageProgress(0); }}
            className={`rounded px-2 py-1 text-left text-[10px] font-medium transition-all max-w-[170px] truncate ${storyIndex === i ? "bg-white/15 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"}`}>
            {s.title}
          </button>
        ))}
      </div>

      {/* BOTTOM CENTER: Dialogue */}
      {story && (
        <div className="absolute bottom-14 left-1/2 w-[520px] max-w-[75vw] -translate-x-1/2">
          <div className="rounded-xl bg-black/85 backdrop-blur-lg border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/5 bg-white/5">
              {currentStep ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: currentStep.color }} />
                    <span className="text-[10px] font-bold text-white">{currentStep.label}</span>
                    <span className="text-[8px] text-zinc-500 uppercase">{currentStep.method}</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-mono">{stepIndex + 1}/{story.steps.length}</span>
                </>
              ) : (
                <span className="text-[10px] font-bold text-white">{story.title}</span>
              )}
            </div>
            <div className="px-3 py-2 min-h-[44px]">
              {stepIndex < 0 ? (
                <>
                  <p className="text-[9px] text-zinc-400 mb-0.5">{story.patient}</p>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">{story.summary}</p>
                </>
              ) : finished ? (
                <p className="text-[11px] text-emerald-400 font-semibold">Story complete. Press Reset to replay.</p>
              ) : currentStep ? (
                <p className="text-[11px] text-zinc-200 leading-relaxed">{currentStep.narration}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Transport controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <button onClick={handleReset} className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] text-zinc-300 hover:bg-white/20 transition">Reset</button>
        <button onClick={() => handleStep(-1)} disabled={stepIndex <= 0} className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">Prev</button>
        {playing ? (
          <button onClick={() => setPlaying(false)} className="rounded-full bg-white px-4 py-1.5 text-[11px] font-bold text-black hover:bg-zinc-200 transition">Pause</button>
        ) : (
          <button onClick={handlePlay} className="rounded-full bg-white px-4 py-1.5 text-[11px] font-bold text-black hover:bg-zinc-200 transition">Play</button>
        )}
        <button onClick={() => handleStep(1)} disabled={!currentStep || stepIndex >= (story?.steps.length ?? 0) - 1} className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">Next</button>
        {story && (
          <div className="ml-1 flex gap-0.5">
            {story.steps.map((s, i) => (
              <button key={s.id} onClick={() => { setPlaying(false); setStepIndex(i); setMessageProgress(1); }}
                className="h-1.5 w-1.5 rounded-full transition-all hover:scale-150"
                style={{ backgroundColor: i === stepIndex ? s.color : i < stepIndex ? s.color + "50" : "#334155" }}
                title={`${i + 1}. ${s.label}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
