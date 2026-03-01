"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.003 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 offset = amount * vec2(1.0, 0.0);
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
    }
  `,
};

export function ThreeHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.0, // strength
      0.4, // radius
      0.2  // threshold
    );
    composer.addPass(bloomPass);

    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    chromaticPass.uniforms.amount.value = 0.002;
    composer.addPass(chromaticPass);

    // Lighting - Solana brand colors
    const purpleLight = new THREE.PointLight(0x9945ff, 2, 100);
    purpleLight.position.set(-20, 15, 10);
    scene.add(purpleLight);

    const tealLight = new THREE.PointLight(0x14f195, 1.5, 100);
    tealLight.position.set(20, -10, 15);
    scene.add(tealLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 0, -20);
    scene.add(rimLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    // Create main tube curve - S-wave / ocean swell
    const createWaveCurve = (offset = 0, amplitude = 1) => {
      const points = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const x = 40 - t * 60; // From right to left
        const y = (Math.sin(t * Math.PI * 1.5 + offset) * 12 - 5) * amplitude;
        const z = Math.sin(t * Math.PI * 0.5 + offset) * 5;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points);
    };

    // Main tube geometry with wave
    let mainCurve = createWaveCurve(0, 1);
    const mainTubeGeometry = new THREE.TubeGeometry(mainCurve, 200, 1.2, 32, false);

    // Custom shader material for iridescence - Solana purple
    const mainTubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9945ff,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
      emissive: 0x9945ff,
      emissiveIntensity: 0.2,
    });

    const mainTube = new THREE.Mesh(mainTubeGeometry, mainTubeMaterial);
    mainTube.scale.set(1, 0.85, 1); // Flatten for ribbon-like appearance

    // Second thinner teal tube
    const createSecondaryCurve = (offset = 0) => {
      const points = [];
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const x = 38 - t * 58;
        const y = Math.sin(t * Math.PI * 1.5 + offset) * 10 - 3 + Math.sin(t * 3 + offset) * 2;
        const z = Math.sin(t * Math.PI * 0.5 + offset) * 8 + 3;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points);
    };

    let secondaryCurve = createSecondaryCurve(0);
    const secondaryTubeGeometry = new THREE.TubeGeometry(secondaryCurve, 200, 0.35, 16, false);
    const secondaryTubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x14f195,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x14f195,
      emissiveIntensity: 0.4,
    });
    const secondaryTube = new THREE.Mesh(secondaryTubeGeometry, secondaryTubeMaterial);

    // Tube group
    const tubeGroup = new THREE.Group();
    tubeGroup.add(mainTube);
    tubeGroup.add(secondaryTube);
    scene.add(tubeGroup);

    // Star particles
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 300;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;

      const brightness = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness;
      starColors[i * 3 + 2] = brightness;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Mouse tracking
    const mouse = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;

      // Wave animation - update tube geometry each frame
      const waveOffset = time * 0.8;
      
      // Recreate main tube with wave
      mainTube.geometry.dispose();
      const newMainCurve = createWaveCurve(waveOffset, 1);
      mainTube.geometry = new THREE.TubeGeometry(newMainCurve, 200, 1.2, 32, false);

      // Recreate secondary tube with wave
      secondaryTube.geometry.dispose();
      const newSecondaryCurve = createSecondaryCurve(waveOffset * 1.2);
      secondaryTube.geometry = new THREE.TubeGeometry(newSecondaryCurve, 200, 0.35, 16, false);

      // Tube gentle rotation
      tubeGroup.rotation.y += 0.0003;

      // Camera bob
      camera.position.y = Math.sin(time * 0.3) * 0.5;

      // Mouse tilt
      targetRotation.x = mouse.y * 0.05;
      targetRotation.y = mouse.x * 0.05;
      tubeGroup.rotation.x += (targetRotation.x - tubeGroup.rotation.x) * 0.02;
      tubeGroup.rotation.z += (targetRotation.y - tubeGroup.rotation.z) * 0.02;

      // Animate lights - Solana colors
      purpleLight.intensity = 2 + Math.sin(time * 0.5) * 0.5;
      tealLight.intensity = 1.5 + Math.cos(time * 0.7) * 0.3;

      // Twinkle stars
      starsMaterial.opacity = 0.6 + Math.sin(time * 2) * 0.2;

      composer.render();
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      composer.dispose();
    };
  }, [isMounted]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-20 bg-[#05050a]"
      style={{
        background: "radial-gradient(ellipse at 70% 50%, rgba(153, 69, 255, 0.15) 0%, rgba(20, 241, 149, 0.05) 40%, transparent 70%)",
      }}
    />
  );
}
