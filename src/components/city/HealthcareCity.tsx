"use client";
/* eslint-disable react-compiler/react-compiler */
// @ts-nocheck — R3F JSX intrinsics need this with strict TS

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
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
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={building.color}
          emissive={building.color}
          emissiveIntensity={0}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>

      {building.type === "hospital" && (
        <>
          <mesh position={[0, h + 0.25, 0]}>
            <boxGeometry args={[1, 0.5, 0.25]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, h + 0.25, 0]}>
            <boxGeometry args={[0.25, 0.5, 1]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}

      <Text
        position={[0, h + (building.type === "hospital" ? 1 : 0.5), 0]}
        fontSize={0.32}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.03}
        outlineColor="#000"
        maxWidth={5}
        textAlign="center"
      >
        {building.label}
      </Text>

      <Text
        position={[0, h / 2, d / 2 + 0.02]}
        fontSize={0.6}
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
// Ms. Jones — player character
// ---------------------------------------------------------------------------
function PlayerCharacter(props: {
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  moving: boolean;
  name: string;
}) {
  "use no memo";
  const groupRef = useRef<THREE.Group>(null!);
  const currentPos = useRef(props.position.clone());
  const bobRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    currentPos.current.lerp(props.targetPosition, 0.03);
    groupRef.current.position.copy(currentPos.current);
    if (props.moving) {
      bobRef.current += delta * 8;
      groupRef.current.position.y = currentPos.current.y + Math.abs(Math.sin(bobRef.current)) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={props.position}>
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 8, 12]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.15} />
      </mesh>
      <Text position={[0, 1.6, 0]} fontSize={0.28} color="#06b6d4" anchorX="center" anchorY="bottom" outlineWidth={0.03} outlineColor="#000">
        {props.name}
      </Text>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Road + Ground
// ---------------------------------------------------------------------------
function Road(props: { from: [number, number, number]; to: [number, number, number] }) {
  "use no memo";
  const start = new THREE.Vector3(props.from[0], 0.015, props.from[2]);
  const end = new THREE.Vector3(props.to[0], 0.015, props.to[2]);
  const mid = start.clone().lerp(end, 0.5);
  const dir = end.clone().sub(start);
  const length = dir.length();
  const angle = Math.atan2(dir.x, dir.z);
  return (
    <mesh position={[mid.x, 0.02, mid.z]} rotation={[-Math.PI / 2, 0, -angle]}>
      <planeGeometry args={[0.8, length]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function Ground() {
  "use no memo";
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
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
  playerPos: THREE.Vector3;
  playerTarget: THREE.Vector3;
  playerMoving: boolean;
  showPlayer: boolean;
}) {
  "use no memo";
  const { buildings, activeBuildings, selectedId, onSelect, playerPos, playerTarget, playerMoving, showPlayer } = props;

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of buildings) map[b.id] = b;
    return map;
  }, [buildings]);

  // Roads between all buildings that share a story step
  const roads = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: [number, number, number]; to: [number, number, number]; key: string }[] = [];
    // Connect all buildings to patient home with roads
    const patient = buildingMap["patient"];
    if (!patient) return result;
    for (const b of buildings) {
      if (b.id === "patient") continue;
      const key = ["patient", b.id].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ from: patient.position, to: b.position, key });
      }
    }
    // Also connect buildings to each other
    for (let i = 0; i < buildings.length; i++) {
      for (let j = i + 1; j < buildings.length; j++) {
        const a = buildings[i], b = buildings[j];
        if (a.id === "patient" || b.id === "patient") continue;
        const dist = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
        if (dist < 12) { // only connect nearby buildings
          const key = [a.id, b.id].sort().join("-");
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ from: a.position, to: b.position, key });
          }
        }
      }
    }
    return result;
  }, [buildings, buildingMap]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 25, 8]} intensity={1} castShadow />
      <pointLight position={[0, 15, 0]} intensity={0.2} color="#7c3aed" />
      <fog attach="fog" args={["#0a0a1a", 40, 70]} />
      <Ground />
      {roads.map((r) => <Road key={r.key} from={r.from} to={r.to} />)}
      {buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          active={activeBuildings.has(b.id)}
          selected={selectedId === b.id}
          onSelect={() => onSelect(b.id)}
        />
      ))}
      {showPlayer && (
        <PlayerCharacter position={playerPos} targetPosition={playerTarget} moving={playerMoving} name="Ms. Jones" />
      )}
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
  const [selected, setSelected] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([PATIENT_BUILDING, INSURANCE_BUILDING, ...DEFAULT_BUILDINGS]);
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [cityName, setCityName] = useState("Springfield, IL");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [loadingCity, setLoadingCity] = useState(false);

  // Fetch providers on load
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data.providers?.length) {
          const providerBuildings = data.providers.map(providerToBuilding);
          setBuildings([PATIENT_BUILDING, INSURANCE_BUILDING, ...providerBuildings]);
        }
      })
      .catch(() => {});
  }, []);

  // Travel to a new city
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
        const newBuildings: Building[] = [
          { ...PATIENT_BUILDING, label: "Ms. Jones (Visiting)", description: `Gloria Jones visiting ${data.location}` },
          INSURANCE_BUILDING,
          ...data.buildings.map((b: any) => ({
            id: b.id,
            label: b.name,
            type: b.type,
            position: b.position,
            size: [2.5, b.height, 2] as [number, number, number],
            color: b.color,
            description: `${b.specialty}. ${b.address.city}, ${b.address.state}. ${b.address.phone || ""}`,
            npi: b.npi,
            tagline: b.specialty,
          })),
        ];
        setBuildings(newBuildings);
        setCityName(data.location);
        if (data.scenarios?.length) {
          setStories(data.scenarios);
          setStoryIndex(0);
        }
        setStepIndex(-1);
        setPlaying(false);
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

  const getPos = useCallback((buildingId: string) => {
    const b = buildingMap[buildingId];
    if (!b) return new THREE.Vector3(0, 0, 10);
    return new THREE.Vector3(b.position[0], 0, b.position[2]);
  }, [buildingMap]);

  const playerTarget = useMemo(() => {
    if (!currentStep) return getPos("patient");
    return getPos(currentStep.to);
  }, [currentStep, getPos]);

  const playerStart = useMemo(() => {
    if (!currentStep) return getPos("patient");
    return getPos(currentStep.from);
  }, [currentStep, getPos]);

  const activeBuildings = useMemo(() => {
    const set = new Set<string>();
    if (currentStep) { set.add(currentStep.from); set.add(currentStep.to); }
    return set;
  }, [currentStep]);

  // Auto-advance
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!playing || !currentStep) return;
    timerRef.current = setTimeout(() => {
      if (stepIndex < story.steps.length - 1) setStepIndex((s) => s + 1);
      else { setStepIndex(story.steps.length); setPlaying(false); }
    }, currentStep.duration * 1000);
    return () => clearTimeout(timerRef.current);
  }, [playing, stepIndex, currentStep, story]);

  const handlePlay = useCallback(() => {
    if (!story) return;
    if (stepIndex < 0 || stepIndex >= story.steps.length) setStepIndex(0);
    setPlaying(true);
  }, [stepIndex, story]);

  const handleStep = useCallback((dir: number) => {
    if (!story) return;
    setPlaying(false);
    setStepIndex((s) => {
      const next = s + dir;
      if (next < 0) return 0;
      if (next >= story.steps.length) return story.steps.length - 1;
      return next;
    });
  }, [story]);

  const handleReset = useCallback(() => { setPlaying(false); setStepIndex(-1); }, []);

  const handleStoryChange = useCallback((i: number) => {
    setPlaying(false); setStoryIndex(i); setStepIndex(-1);
  }, []);

  const selectedBuilding = selected ? buildings.find((b) => b.id === selected) : null;

  return (
    <div className="relative h-screen w-screen bg-[#0a0a1a] overflow-hidden select-none">
      <Canvas shadows camera={{ position: [0, 28, 22], fov: 40 }} onPointerMissed={() => {}}>
        <Scene
          buildings={buildings}
          activeBuildings={activeBuildings}
          selectedId={selected}
          onSelect={setSelected}
          playerPos={playerStart}
          playerTarget={playerTarget}
          playerMoving={playing && !!currentStep}
          showPlayer={stepIndex >= 0}
        />
      </Canvas>

      {/* === TOP LEFT: Title + Travel === */}
      <div className="absolute left-4 top-4 w-56">
        <h1 className="text-lg font-bold text-white tracking-tight">Healthcare City</h1>
        <p className="text-[10px] text-zinc-500">{cityName}</p>

        {/* Travel mode */}
        <div className="mt-3 rounded-lg bg-white/5 border border-white/10 p-2.5">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5 font-semibold">Travel to a City</p>
          <div className="flex gap-1.5">
            <input
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="City"
              className="flex-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              onKeyDown={(e) => e.key === "Enter" && travelToCity()}
            />
            <input
              value={searchState}
              onChange={(e) => setSearchState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="ST"
              className="w-10 rounded bg-white/5 border border-white/10 px-1.5 py-1 text-[11px] text-white text-center placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              onKeyDown={(e) => e.key === "Enter" && travelToCity()}
            />
          </div>
          <button
            onClick={travelToCity}
            disabled={loadingCity || !searchState}
            className="mt-1.5 w-full rounded bg-white/10 py-1 text-[10px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-30"
          >
            {loadingCity ? "Loading..." : "Go"}
          </button>
        </div>

        <a href="/shop" className="mt-2 inline-block text-[10px] text-zinc-600 hover:text-white transition">
          + Join City (NPI Lookup)
        </a>
      </div>

      {/* === TOP RIGHT: Building info (sticky — doesn't close on click-out) === */}
      {selectedBuilding && (
        <div className="absolute right-4 top-4 w-60 rounded-xl bg-black/85 p-3.5 text-white backdrop-blur-lg border border-white/10">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedBuilding.color }} />
              <h2 className="text-xs font-bold leading-tight">{selectedBuilding.label}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-white text-xs ml-2">x</button>
          </div>
          {selectedBuilding.tagline && (
            <p className="text-[10px] text-zinc-400 italic mb-1">{selectedBuilding.tagline}</p>
          )}
          <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedBuilding.description}</p>
          {selectedBuilding.npi && (
            <p className="text-[9px] text-zinc-600 font-mono mt-2">NPI {selectedBuilding.npi}</p>
          )}
        </div>
      )}

      {/* === BOTTOM LEFT: Scenario picker (moved from top to avoid overlap) === */}
      <div className="absolute left-4 bottom-28 flex flex-col gap-1">
        <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">Scenarios</p>
        {stories.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleStoryChange(i)}
            className={`rounded-lg px-3 py-1.5 text-left text-[11px] font-medium transition-all max-w-[180px] truncate ${
              storyIndex === i
                ? "bg-white/15 text-white border border-white/20"
                : "bg-white/5 text-zinc-500 hover:bg-white/10 border border-transparent"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* === BOTTOM CENTER: Dialogue + Controls === */}
      {story && (
        <div className="absolute bottom-16 left-1/2 w-[560px] max-w-[80vw] -translate-x-1/2">
          <div className="rounded-xl bg-black/85 backdrop-blur-lg border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/5 bg-white/5">
              {currentStep ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: currentStep.color }} />
                    <span className="text-[11px] font-bold text-white">{currentStep.label}</span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono">{stepIndex + 1}/{story.steps.length}</span>
                </>
              ) : (
                <span className="text-[11px] font-bold text-white">{story.title}</span>
              )}
            </div>
            <div className="px-4 py-2.5 min-h-[56px]">
              {stepIndex < 0 ? (
                <>
                  <p className="text-[10px] text-zinc-400 mb-0.5">{story.patient}</p>
                  <p className="text-[12px] text-zinc-200 leading-relaxed">{story.summary}</p>
                </>
              ) : finished ? (
                <p className="text-[12px] text-emerald-400 font-semibold">Story complete. Press Reset to replay.</p>
              ) : currentStep ? (
                <p className="text-[12px] text-zinc-200 leading-relaxed">{currentStep.narration}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Transport */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button onClick={handleReset} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-white/20 transition">Reset</button>
        <button onClick={() => handleStep(-1)} disabled={stepIndex <= 0} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">Prev</button>
        {playing ? (
          <button onClick={() => setPlaying(false)} className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition">Pause</button>
        ) : (
          <button onClick={handlePlay} className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition">Play</button>
        )}
        <button onClick={() => handleStep(1)} disabled={!currentStep || stepIndex >= (story?.steps.length ?? 0) - 1} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">Next</button>
        {story && (
          <div className="ml-1 flex gap-0.5">
            {story.steps.map((s, i) => (
              <button key={s.id} onClick={() => { setPlaying(false); setStepIndex(i); }}
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
