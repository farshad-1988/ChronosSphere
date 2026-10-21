'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Globe,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  Sun,
  Cloud,
} from 'lucide-react';
import {
  generatePrecisionEarthColorMap,
  generatePrecisionBumpMap,
  generatePrecisionRoughnessMap,
  latLngToVector3,
  MapStyle,
} from './earthCartography';

export { latLngToVector3 };
export type { MapStyle };

export interface GlobeEvent {
  _id?: string;
  title: string;
  slug: string;
  category: string;
  importance: string;
  date: {
    start: string;
    solarHijriDate?: string;
  };
  location: {
    name: string;
    country: string;
    region: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  tags?: string[];
  description?: string;
}

interface GlobeSceneProps {
  events: GlobeEvent[];
  selectedEventId?: string | null;
  onSelectEvent: (event: GlobeEvent) => void;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, number> = {
  festival: 0xf59e0b, // Amber Gold
  cultural: 0xec4899, // Rose Pink
  historical: 0x3b82f6, // Royal Blue
  astronomical: 0xa855f7, // Deep Violet
  sports: 0x10b981, // Emerald
  geopolitical: 0x06b6d4, // Cyan
  science: 0x6366f1, // Indigo
};

const CATEGORY_HEX: Record<string, string> = {
  festival: '#f59e0b',
  cultural: '#ec4899',
  historical: '#3b82f6',
  astronomical: '#a855f7',
  sports: '#10b981',
  geopolitical: '#06b6d4',
  science: '#6366f1',
};

/**
 * Procedural atmospheric cloud texture
 */
function createProceduralCloudsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Wispy organic cloud systems
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 240; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const rad = 30 + Math.random() * 80;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.22)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cyclonic swirls
  for (let i = 0; i < 6; i++) {
    const sx = Math.random() * canvas.width;
    const sy = 0.25 * canvas.height + Math.random() * (0.5 * canvas.height);
    const rad = 90 + Math.random() * 70;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  activeCategory = 'all',
  onSelectCategory,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<GlobeEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Map Visual Style State
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');

  // Graphical Layer Toggles
  const [showBorders, setShowBorders] = useState(true);
  const [showNightLights, setShowNightLights] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glowMeshRef = useRef<THREE.Mesh | null>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const pinMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  const EARTH_RADIUS = 5;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x040714, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6.8;
    controls.maxDistance = 24;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Sun directional key light with slight warm sunlight tint
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(16, 12, 14);
    scene.add(sunLight);

    // Cool celestial rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-14, -8, -12);
    scene.add(rimLight);

    // Earth Globe Group with Earth's real 23.44° axial tilt
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = (23.44 * Math.PI) / 180;
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 1. High-Precision Earth Sphere (High polygon density: 96x96)
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    const colorTex = generatePrecisionEarthColorMap({
      showBorders,
      showNightLights,
      showGraticule,
    });
    const bumpTex = generatePrecisionBumpMap();
    const roughnessTex = generatePrecisionRoughnessMap();

    const earthMat = new THREE.MeshStandardMaterial({
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.08,
      roughnessMap: roughnessTex,
      roughness: 0.82,
      metalness: 0.12,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMeshRef.current = earthMesh;
    globeGroup.add(earthMesh);

    // 2. Dynamic Clouds Layer
    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.08, 64, 64);
    const cloudsTex = createProceduralCloudsTexture();
    const cloudsMat = new THREE.MeshStandardMaterial({
      alphaMap: cloudsTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      roughness: 1,
      depthWrite: false,
    });
    cloudsMatRef.current = cloudsMat;
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // 3. Multi-Stage Atmospheric Halo & Fresnel Rim
    const glowGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.42, 48, 48);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          vec3 atmosphereColor = mix(uColorInner, uColorOuter, intensity);
          gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 0.95;
        }
      `,
      uniforms: {
        uColorInner: { value: new THREE.Color(0x06b6d4) },
        uColorOuter: { value: new THREE.Color(0x3b82f6) },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    glowMatRef.current = glowMat;
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMeshRef.current = glowMesh;
    globeGroup.add(glowMesh);

    // Deep Space Starfield Background
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 38 + Math.random() * 25;
      starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = r * Math.cos(phi);

      // Star color temperatures (blue-white to warm amber)
      const t = Math.random();
      starColors[i] = 0.8 + t * 0.2;
      starColors[i + 1] = 0.85 + (1 - t) * 0.15;
      starColors[i + 2] = 0.95;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow orbital diurnal rotation
      if (globeGroupRef.current && isRotating && !targetCamPosRef.current) {
        globeGroupRef.current.rotation.y += 0.0016;
      }
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0022;
      }

      // Smooth camera interpolation towards target event
      if (targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.06);
        if (targetLookAtRef.current) {
          controlsRef.current.target.lerp(targetLookAtRef.current, 0.06);
        }
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.08) {
          targetCamPosRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Re-generate texture and configure 3D engine PBR properties when visual style or toggles change
  useEffect(() => {
    if (!earthMeshRef.current) return;

    const newColorTex = generatePrecisionEarthColorMap({
      style: mapStyle,
      showBorders,
      showNightLights,
      showGraticule,
    });

    const mat = earthMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.map) {
      mat.map.dispose();
    }
    mat.map = newColorTex;

    // Adapt 3D Engine material properties to the selected visual style
    if (mapStyle === 'satellite') {
      mat.roughness = 0.72;
      mat.metalness = 0.08;
      mat.bumpScale = 0.12;
      if (cloudsMatRef.current) cloudsMatRef.current.opacity = 0.45;
      if (glowMatRef.current) {
        glowMatRef.current.uniforms.uColorInner.value.set(0x0ea5e9);
        glowMatRef.current.uniforms.uColorOuter.value.set(0x1d4ed8);
      }
    } else if (mapStyle === 'minimalist') {
      mat.roughness = 0.94;
      mat.metalness = 0.28;
      mat.bumpScale = 0.03;
      if (cloudsMatRef.current) cloudsMatRef.current.opacity = 0.16;
      if (glowMatRef.current) {
        glowMatRef.current.uniforms.uColorInner.value.set(0x94a3b8);
        glowMatRef.current.uniforms.uColorOuter.value.set(0x334155);
      }
    } else if (mapStyle === 'antique') {
      mat.roughness = 0.95;
      mat.metalness = 0.02;
      mat.bumpScale = 0.07;
      if (cloudsMatRef.current) cloudsMatRef.current.opacity = 0.22;
      if (glowMatRef.current) {
        glowMatRef.current.uniforms.uColorInner.value.set(0xd97706);
        glowMatRef.current.uniforms.uColorOuter.value.set(0x78350f);
      }
    } else {
      // Dark Mode (Default)
      mat.roughness = 0.82;
      mat.metalness = 0.12;
      mat.bumpScale = 0.08;
      if (cloudsMatRef.current) cloudsMatRef.current.opacity = 0.38;
      if (glowMatRef.current) {
        glowMatRef.current.uniforms.uColorInner.value.set(0x06b6d4);
        glowMatRef.current.uniforms.uColorOuter.value.set(0x3b82f6);
      }
    }

    mat.needsUpdate = true;
  }, [mapStyle, showBorders, showNightLights, showGraticule]);

  // Toggle clouds and atmosphere visibility
  useEffect(() => {
    if (cloudsMeshRef.current) {
      cloudsMeshRef.current.visible = showClouds;
    }
  }, [showClouds]);

  useEffect(() => {
    if (glowMeshRef.current) {
      glowMeshRef.current.visible = showAtmosphere;
    }
  }, [showAtmosphere]);

  // Update 3D Pins whenever `events`, `activeCategory` or `selectedEventId` changes
  useEffect(() => {
    const globeGroup = globeGroupRef.current;
    if (!globeGroup) return;

    // Clean up old pin groups
    pinMeshesRef.current.forEach((pinGroup) => {
      globeGroup.remove(pinGroup);
      pinGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    pinMeshesRef.current.clear();

    const filtered = events.filter((e) =>
      activeCategory === 'all' ? true : e.category === activeCategory
    );

    filtered.forEach((event) => {
      const [lng, lat] = event.location.coordinates.coordinates;
      const surfacePos = latLngToVector3(lat, lng, EARTH_RADIUS);
      const elevatedPos = latLngToVector3(lat, lng, EARTH_RADIUS + 0.42);

      const pinGroup = new THREE.Group();
      pinGroup.userData = { event };

      const catColor = CATEGORY_COLORS[event.category] || 0x38bdf8;
      const isSelected = selectedEventId === event._id || selectedEventId === event.slug;

      // 1. Dual concentric base rings flush on Earth surface
      const ringGeo = new THREE.RingGeometry(0.08, 0.16, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: catColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.65,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(surfacePos);
      ringMesh.lookAt(surfacePos.clone().multiplyScalar(2));
      pinGroup.add(ringMesh);

      // Outer pulse ring if selected
      if (isSelected) {
        const outerRingGeo = new THREE.RingGeometry(0.2, 0.28, 24);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.position.copy(surfacePos);
        outerRing.lookAt(surfacePos.clone().multiplyScalar(2));
        pinGroup.add(outerRing);
      }

      // 2. High-precision luminous pin stem
      const stemCurve = new THREE.LineCurve3(surfacePos, elevatedPos);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 3, 0.022, 8, false);
      const stemMat = new THREE.MeshStandardMaterial({
        color: catColor,
        emissive: catColor,
        emissiveIntensity: 0.6,
        roughness: 0.3,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      pinGroup.add(stemMesh);

      // 3. Faceted crystal beacon head (Octahedron with bevel shine)
      const headGeo = new THREE.OctahedronGeometry(isSelected ? 0.24 : 0.15, 0);
      const headMat = new THREE.MeshStandardMaterial({
        color: catColor,
        emissive: catColor,
        emissiveIntensity: isSelected ? 1.0 : 0.55,
        roughness: 0.15,
        metalness: 0.85,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.copy(elevatedPos);
      pinGroup.add(headMesh);

      globeGroup.add(pinGroup);
      pinMeshesRef.current.set(event.slug, pinGroup);
    });
  }, [events, activeCategory, selectedEventId]);

  // Raycasting for interactive hover and click selection
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = mountRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!container || !camera || !scene) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const pinGroups = Array.from(pinMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(pinGroups, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.userData?.event && parent !== scene) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.event) {
          const clickedEvent = parent.userData.event as GlobeEvent;
          onSelectEvent(clickedEvent);
          focusOnEvent(clickedEvent);
        }
      }
    },
    [onSelectEvent]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const pinGroups = Array.from(pinMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(pinGroups, true);

    if (intersects.length > 0) {
      let parent = intersects[0].object.parent;
      while (parent && !parent.userData?.event && parent !== scene) {
        parent = parent.parent;
      }
      if (parent && parent.userData?.event) {
        setHoveredEvent(parent.userData.event as GlobeEvent);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';
        return;
      }
    }

    setHoveredEvent(null);
    setTooltipPos(null);
    container.style.cursor = 'grab';
  }, []);

  const focusOnEvent = (event: GlobeEvent) => {
    const [lng, lat] = event.location.coordinates.coordinates;
    const globe = globeGroupRef.current;
    if (!globe) return;

    const localPos = latLngToVector3(lat, lng, EARTH_RADIUS);
    const worldPos = localPos.clone().applyEuler(globe.rotation);

    const camDistance = 9.2;
    targetCamPosRef.current = worldPos.clone().normalize().multiplyScalar(camDistance);
    targetLookAtRef.current = new THREE.Vector3(0, 0, 0);
  };

  const resetCamera = () => {
    targetCamPosRef.current = new THREE.Vector3(0, 3.5, 14);
    targetLookAtRef.current = new THREE.Vector3(0, 0, 0);
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'festival', label: 'Festivals' },
    { id: 'cultural', label: 'Cultural' },
    { id: 'historical', label: 'Historical' },
    { id: 'astronomical', label: 'Astronomical' },
    { id: 'sports', label: 'Sports' },
    { id: 'science', label: 'Science' },
    { id: 'geopolitical', label: 'Geopolitical' },
  ];

  return (
    <div
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[640px] rounded-2xl overflow-hidden'
      } border border-slate-800 bg-[#040714] select-none`}
    >
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Hover Tooltip */}
      {hoveredEvent && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x + 16}px`,
            top: `${tooltipPos.y - 48}px`,
            pointerEvents: 'none',
          }}
          className="z-30 bg-slate-900/95 border border-slate-700/80 px-3.5 py-2.5 rounded-lg shadow-2xl backdrop-blur-md max-w-xs transition-opacity duration-150"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: CATEGORY_HEX[hoveredEvent.category] || '#38bdf8' }}
            />
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {hoveredEvent.title}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            <span className="truncate">{hoveredEvent.location.name}</span>
            <span className="text-slate-600">·</span>
            <span>{new Date(hoveredEvent.date.start).getFullYear()}</span>
          </div>
        </div>
      )}

      {/* Top Cartographic Spec & View Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/85 border border-slate-800 rounded-lg backdrop-blur-md text-xs text-slate-300 shadow-lg">
          <Globe className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white tracking-tight">High-Precision Earth</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-300 font-mono text-[11px] capitalize">{mapStyle} View</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono tabular-nums">{events.length} Coordinates</span>
        </div>

        {/* Map Visual Style Switcher */}
        <div className="pointer-events-auto flex items-center bg-slate-900/85 border border-slate-800 rounded-lg p-1 backdrop-blur-md shadow-lg text-xs">
          <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Map Style:</span>
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'dark' as MapStyle, label: 'Dark' },
              { id: 'satellite' as MapStyle, label: 'Satellite' },
              { id: 'minimalist' as MapStyle, label: 'Minimalist' },
              { id: 'antique' as MapStyle, label: 'Vintage' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setMapStyle(s.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  mapStyle === s.id
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 border border-slate-800 rounded-lg p-1 backdrop-blur-md shadow-lg">
          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause rotation' : 'Resume rotation'}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetCamera}
            title="Reset perspective"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[95vw] w-fit z-20 pointer-events-auto flex flex-col items-center">
        {/* Collapse Toggle Tab */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-full text-[11px] font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 backdrop-blur-md shadow-md"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Cartographic & Filter Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Dock Surface */}
        {!isDockCollapsed && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 overflow-x-auto max-w-full">
            {/* Visual Cartographic Layers */}
            <div className="flex items-center gap-1 border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 sm:pr-3 shrink-0 text-xs">
              <span className="text-slate-500 font-medium text-[11px] mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Layers:</span>
              </span>

              <button
                type="button"
                onClick={() => setShowBorders(!showBorders)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  showBorders
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Borders
              </button>

              <button
                type="button"
                onClick={() => setShowNightLights(!showNightLights)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  showNightLights
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Lights</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClouds(!showClouds)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  showClouds
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Cloud className="w-3 h-3" />
                <span>Clouds</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAtmosphere(!showAtmosphere)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  showAtmosphere
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Halo
              </button>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto shrink-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeScene;
