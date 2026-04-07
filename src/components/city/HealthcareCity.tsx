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
} from "./buildings";
import type { CityProvider } from "@/lib/types";

// ---------------------------------------------------------------------------
// Building mesh — top-down city block style
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
      {/* Building body */}
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

      {/* Hospital cross */}
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

      {/* Building name */}
      <Text
        position={[0, h + (building.type === "hospital" ? 1 : 0.5), 0]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#000"
        maxWidth={4.5}
        textAlign="center"
      >
        {building.label}
      </Text>

      {/* Icon on building face */}
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
// Ms. Jones — the player character! Pokemon-style sprite
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

    // Smooth lerp toward target
    currentPos.current.lerp(props.targetPosition, 0.03);
    groupRef.current.position.copy(currentPos.current);

    // Walk bob animation
    if (props.moving) {
      bobRef.current += delta * 8;
      groupRef.current.position.y = currentPos.current.y + Math.abs(Math.sin(bobRef.current)) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={props.position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 8, 12]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.15} />
      </mesh>
      {/* Name above */}
      <Text
        position={[0, 1.6, 0]}
        fontSize={0.28}
        color="#06b6d4"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.03}
        outlineColor="#000"
      >
        {props.name}
      </Text>
      {/* Shadow circle on ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Road paths between buildings
// ---------------------------------------------------------------------------
function Road(props: { from: [number, number, number]; to: [number, number, number]; active?: boolean }) {
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
      <meshStandardMaterial color={props.active ? "#475569" : "#1e293b"} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------
function Ground() {
  "use no memo";
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <gridHelper args={[50, 25, "#1a2332", "#111827"]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
function Scene(props: {
  buildings: Building[];
  activeBuildings: Set<string>;
  activeRoad: [string, string] | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  playerPos: THREE.Vector3;
  playerTarget: THREE.Vector3;
  playerMoving: boolean;
  playerName: string;
  showPlayer: boolean;
}) {
  "use no memo";
  const { buildings, activeBuildings, activeRoad, selectedId, onSelect, playerPos, playerTarget, playerMoving, playerName, showPlayer } = props;

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of buildings) map[b.id] = b;
    return map;
  }, [buildings]);

  const roads = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: [number, number, number]; to: [number, number, number]; key: string }[] = [];
    for (const story of STORIES) {
      for (const step of story.steps) {
        const key = [step.from, step.to].sort().join("-");
        if (!seen.has(key) && buildingMap[step.from] && buildingMap[step.to]) {
          seen.add(key);
          result.push({ from: buildingMap[step.from].position, to: buildingMap[step.to].position, key });
        }
      }
    }
    return result;
  }, [buildingMap]);

  const activeRoadKey = activeRoad ? [...activeRoad].sort().join("-") : null;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 25, 8]} intensity={1} castShadow />
      <pointLight position={[0, 15, 0]} intensity={0.2} color="#7c3aed" />
      <fog attach="fog" args={["#0a0a1a", 35, 65]} />

      <Ground />

      {roads.map((r) => (
        <Road key={r.key} from={r.from} to={r.to} active={activeRoadKey === r.key} />
      ))}

      {buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          active={activeBuildings.has(b.id)}
          selected={selectedId === b.id}
          onSelect={() => onSelect(selectedId === b.id ? null : b.id)}
        />
      ))}

      {showPlayer && (
        <PlayerCharacter
          position={playerPos}
          targetPosition={playerTarget}
          moving={playerMoving}
          name={playerName}
        />
      )}

      <OrbitControls
        makeDefault
        minDistance={12}
        maxDistance={45}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 3}
        enablePan
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Dialogue box — RPG style
// ---------------------------------------------------------------------------
function DialogueBox(props: {
  step: StoryStep | null;
  stepNum: number;
  totalSteps: number;
  storyTitle: string;
  patient: string;
  summary: string;
  started: boolean;
  finished: boolean;
}) {
  const { step, stepNum, totalSteps, storyTitle, patient, summary, started, finished } = props;

  return (
    <div className="absolute bottom-28 left-1/2 w-[620px] max-w-[92vw] -translate-x-1/2">
      <div className="rounded-xl bg-black/85 backdrop-blur-lg border border-white/10 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
          {started && step ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: step.color }} />
                <span className="text-xs font-bold text-white">{step.label}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {stepNum}/{totalSteps}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold text-white">{storyTitle}</span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 min-h-[80px]">
          {!started ? (
            <>
              <p className="text-xs text-zinc-400 mb-1">{patient}</p>
              <p className="text-sm text-zinc-200 leading-relaxed">{summary}</p>
              <p className="mt-2 text-[10px] text-zinc-600">Press Play to start the story.</p>
            </>
          ) : finished ? (
            <>
              <p className="text-sm font-semibold text-emerald-400 mb-1">Story Complete</p>
              <p className="text-xs text-zinc-400">
                {patient}'s journey through the healthcare system. Press Reset to replay, or pick another story.
              </p>
            </>
          ) : step ? (
            <p className="text-sm text-zinc-200 leading-relaxed">{step.narration}</p>
          ) : null}
        </div>
      </div>
    </div>
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
  const [buildings, setBuildings] = useState<Building[]>([
    PATIENT_BUILDING, INSURANCE_BUILDING, ...DEFAULT_BUILDINGS,
  ]);

  // Fetch opted-in providers from API
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data.providers?.length) {
          const providerBuildings = data.providers.map(providerToBuilding);
          setBuildings([PATIENT_BUILDING, INSURANCE_BUILDING, ...providerBuildings]);
        }
      })
      .catch(() => {}); // fall back to defaults
  }, []);

  const story = STORIES[storyIndex];
  const currentStep = stepIndex >= 0 && stepIndex < story.steps.length ? story.steps[stepIndex] : null;
  const finished = stepIndex >= story.steps.length;

  const buildingMap = useMemo(() => {
    const map: Record<string, Building> = {};
    for (const b of buildings) map[b.id] = b;
    return map;
  }, [buildings]);

  // Player position — she starts at her home, then walks to each "to" building
  const getPos = useCallback((buildingId: string) => {
    const b = buildingMap[buildingId];
    if (!b) return new THREE.Vector3(0, 0, 7);
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
    if (currentStep) {
      set.add(currentStep.from);
      set.add(currentStep.to);
    }
    return set;
  }, [currentStep]);

  const activeRoad: [string, string] | null = currentStep ? [currentStep.from, currentStep.to] : null;

  // Auto-advance when playing
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!playing || !currentStep) return;

    timerRef.current = setTimeout(() => {
      if (stepIndex < story.steps.length - 1) {
        setStepIndex((s) => s + 1);
      } else {
        setStepIndex(story.steps.length); // mark finished
        setPlaying(false);
      }
    }, currentStep.duration * 1000);

    return () => clearTimeout(timerRef.current);
  }, [playing, stepIndex, currentStep, story]);

  const handlePlay = useCallback(() => {
    if (stepIndex < 0 || stepIndex >= story.steps.length) {
      setStepIndex(0);
    }
    setPlaying(true);
  }, [stepIndex, story]);

  const handlePause = useCallback(() => setPlaying(false), []);

  const handleStep = useCallback((dir: number) => {
    setPlaying(false);
    setStepIndex((s) => {
      const next = s + dir;
      if (next < 0) return 0;
      if (next >= story.steps.length) return story.steps.length - 1;
      return next;
    });
  }, [story]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setStepIndex(-1);
  }, []);

  const handleStoryChange = useCallback((i: number) => {
    setPlaying(false);
    setStoryIndex(i);
    setStepIndex(-1);
    setSelected(null);
  }, []);

  const selectedBuilding = selected ? buildings.find((b) => b.id === selected) : null;

  return (
    <div className="relative h-screen w-screen bg-[#0a0a1a] overflow-hidden select-none">
      <Canvas
        shadows
        camera={{ position: [0, 28, 18], fov: 40 }}
        onPointerMissed={() => setSelected(null)}
      >
        <Scene
          buildings={buildings}
          activeBuildings={activeBuildings}
          activeRoad={activeRoad}
          selectedId={selected}
          onSelect={setSelected}
          playerPos={playerStart}
          playerTarget={playerTarget}
          playerMoving={playing && !!currentStep}
          playerName="Ms. Jones"
          showPlayer={stepIndex >= 0}
        />
      </Canvas>

      {/* Title */}
      <div className="absolute left-4 top-4">
        <h1 className="text-lg font-bold text-white tracking-tight pointer-events-none">Healthcare City</h1>
        <p className="text-[10px] text-zinc-600 pointer-events-none">v1 — Patient Journey Simulator</p>
        <a
          href="/shop"
          className="mt-2 inline-block rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-white/20 transition"
        >
          + Join City (NPI Lookup)
        </a>
      </div>

      {/* Story picker */}
      <div className="absolute left-4 top-14 flex flex-col gap-1">
        {STORIES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => handleStoryChange(i)}
            className={`rounded-lg px-3 py-1.5 text-left text-[11px] font-medium transition-all ${
              storyIndex === i
                ? "bg-white/15 text-white border border-white/20"
                : "bg-white/5 text-zinc-500 hover:bg-white/10 border border-transparent"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* RPG Dialogue */}
      <DialogueBox
        step={currentStep}
        stepNum={stepIndex + 1}
        totalSteps={story.steps.length}
        storyTitle={story.title}
        patient={story.patient}
        summary={story.summary}
        started={stepIndex >= 0}
        finished={finished}
      />

      {/* Transport controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <button onClick={handleReset} className="rounded-full bg-white/10 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/20 transition">
          Reset
        </button>
        <button onClick={() => handleStep(-1)} disabled={stepIndex <= 0} className="rounded-full bg-white/10 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">
          Prev
        </button>

        {playing ? (
          <button onClick={handlePause} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition">
            Pause
          </button>
        ) : (
          <button onClick={handlePlay} className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition">
            Play
          </button>
        )}

        <button onClick={() => handleStep(1)} disabled={!currentStep || stepIndex >= story.steps.length - 1} className="rounded-full bg-white/10 px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/20 transition disabled:opacity-25">
          Next
        </button>

        {/* Step dots */}
        <div className="ml-2 flex gap-1">
          {story.steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setPlaying(false); setStepIndex(i); }}
              className="h-1.5 w-1.5 rounded-full transition-all hover:scale-150"
              style={{
                backgroundColor: i === stepIndex ? s.color : i < stepIndex ? s.color + "50" : "#334155",
              }}
              title={`${i + 1}. ${s.label}`}
            />
          ))}
        </div>
      </div>

      {/* Building info on click */}
      {selectedBuilding && (
        <div className="absolute right-4 top-4 w-60 rounded-xl bg-black/85 p-3.5 text-white backdrop-blur-lg border border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedBuilding.color }} />
            <h2 className="text-xs font-bold">{selectedBuilding.label}</h2>
          </div>
          {selectedBuilding.tagline && (
            <p className="text-[10px] text-zinc-400 italic mb-1">{selectedBuilding.tagline}</p>
          )}
          <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedBuilding.description}</p>
          {selectedBuilding.npi && (
            <p className="text-[9px] text-zinc-600 font-mono mt-2">NPI {selectedBuilding.npi}</p>
          )}
          {selectedBuilding.npi && (
            <a
              href={`/shop`}
              className="mt-2 inline-block text-[10px] text-zinc-500 hover:text-white transition"
            >
              Customize this building &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}
