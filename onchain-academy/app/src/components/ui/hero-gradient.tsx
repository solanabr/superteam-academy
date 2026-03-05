"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
        dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
        dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
  u.y);
}

float fbm(vec2 p, float t) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  vec2 drift = vec2(t * 0.08, t * 0.05);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency + drift * float(i + 1));
    amplitude *= 0.5;
    frequency *= 2.1;
    drift = drift * 1.3 + vec2(t * 0.02, -t * 0.03);
  }
  return value;
}

vec3 solPurple  = vec3(0.600, 0.271, 1.000); // #9945FF
vec3 solGreen   = vec3(0.078, 0.945, 0.596); // #14F195
vec3 deepNavy   = vec3(0.027, 0.020, 0.063); // #070514
vec3 midNavy    = vec3(0.055, 0.035, 0.110); // #0e091c
vec3 electric   = vec3(0.450, 0.100, 0.950); // vivid purple
vec3 teal       = vec3(0.050, 0.780, 0.600); // cyan-green

void main() {
  vec2 uv = vUv;
  float t = uTime;

  vec2 warpA = vec2(
    fbm(uv * 2.5 + vec2(0.0, 0.0), t),
    fbm(uv * 2.5 + vec2(5.2, 1.3), t)
  );
  vec2 warpB = vec2(
    fbm(uv * 2.0 + 4.0 * warpA + vec2(1.7, 9.2), t * 0.9),
    fbm(uv * 2.0 + 4.0 * warpA + vec2(8.3, 2.8), t * 0.9)
  );

  float f = fbm(uv * 2.2 + 4.0 * warpB, t * 0.7);

  f = (f + 1.0) * 0.5;

  float wave = sin(uv.y * 6.0 + t * 0.7 + f * 4.0) * 0.5 + 0.5;
  wave *= sin(uv.x * 4.0 - t * 0.5 + f * 3.0) * 0.5 + 0.5;

  vec3 color = mix(deepNavy, midNavy, uv.y * 0.7);

  float blob1 = smoothstep(0.1, 0.9, fbm(uv * 1.8 + vec2(0.0, 0.5), t * 0.6));
  color = mix(color, electric * 0.35, blob1 * (1.0 - uv.x * 0.5));

  float blob2 = smoothstep(0.2, 0.95, fbm(uv * 1.6 + vec2(3.0, 2.0), t * 0.55));
  color = mix(color, solGreen * 0.22, blob2 * uv.x * 0.8);

  vec3 gradColor = mix(
    mix(solPurple * 0.6, teal * 0.4, f),
    mix(solGreen * 0.35, electric * 0.5, f),
    wave * 0.5
  );
  color = mix(color, gradColor, clamp(f * 0.65 + wave * 0.15, 0.0, 0.5));

  float vignette = 1.0 - smoothstep(0.0, 1.0, length((uv - vec2(0.5, 0.2)) * vec2(1.2, 0.9)));
  color += solPurple * 0.07 * vignette;

  color = color / (color + vec3(0.4));
  color = pow(color, vec3(0.90));

  float edge = 1.0 - smoothstep(0.0, 0.45, length(uv - 0.5) - 0.1);
  color *= mix(0.72, 1.0, edge);

  gl_FragColor = vec4(color, 1.0);
}
`;

export function HeroGradient({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hasFallback, setHasFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let mat: THREE.ShaderMaterial | null = null;
    let geo: THREE.PlaneGeometry | null = null;
    let onResize: (() => void) | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });

      const updateSize = () => {
        const w = Math.max(canvas.clientWidth, 1);
        const h = Math.max(canvas.clientHeight, 1);
        renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer?.setSize(w, h, false);
        return { w, h };
      };
      const { w, h } = updateSize();

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      geo = new THREE.PlaneGeometry(2, 2);
      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
      };

      mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
      });

      scene.add(new THREE.Mesh(geo, mat));

      onResize = () => {
        const next = updateSize();
        uniforms.uResolution.value.set(next.w, next.h);
      };
      window.addEventListener("resize", onResize);

      const start = performance.now();
      const tick = () => {
        try {
          uniforms.uTime.value = (performance.now() - start) / 1000;
          renderer?.render(scene, camera);
          animRef.current = requestAnimationFrame(tick);
        } catch (err) {
          console.warn(
            "HeroGradient render failed, using fallback background.",
            err,
          );
          setHasFallback(true);
        }
      };
      tick();
    } catch (err) {
      console.warn(
        "HeroGradient setup failed, using fallback background.",
        err,
      );
      setHasFallback(true);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      if (onResize) {
        window.removeEventListener("resize", onResize);
      }
      renderer?.dispose();
      mat?.dispose();
      geo?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: hasFallback
          ? "radial-gradient(circle at 12% 8%, rgba(153, 69, 255, 0.28), transparent 40%), radial-gradient(circle at 88% 6%, rgba(20, 241, 149, 0.20), transparent 36%), #070514"
          : undefined,
      }}
    />
  );
}
