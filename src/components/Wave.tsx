'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const LavaLampMaterial = shaderMaterial(
  { 
    uTime: 0, 
    uResolution: new THREE.Vector2(),
    uBackgroundColor: new THREE.Vector3(0.0, 0.0, 0.0), // Background color
    uGlassOverlay: new THREE.Vector3(0.0, 0.0, 0.0), // Glass overlay color
    uGlassOpacity: 0.0 // Glass overlay opacity
  },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `precision highp float;
   uniform float uTime;
   uniform vec2 uResolution;
   uniform vec3 uBackgroundColor;
   uniform vec3 uGlassOverlay;
   uniform float uGlassOpacity;
   varying vec2 vUv;
   vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
   vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
   vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
   float snoise(vec2 v) {
     const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
     vec2 i = floor(v + dot(v, C.yy));
     vec2 x0 = v - i + dot(i, C.xx);
     vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
     vec4 x12 = x0.xyxy + C.xxzz;
     x12.xy -= i1;
     i = mod289(i);
     vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
     vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
     m = m*m; m = m*m;
     vec3 x = 2.0 * fract(p * C.www) - 1.0;
     vec3 h = abs(x) - 0.5;
     vec3 ox = floor(x + 0.5);
     vec3 a0 = x - ox;
     m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
     vec3 g;
     g.x  = a0.x * x0.x + h.x * x0.y;
     g.yz = a0.yz * x12.xz + h.yz * x12.yw;
     return 130.0 * dot(m, g);
   }
   
   // Multi-octave noise for more complex patterns
   float fbm(vec2 p) {
     float value = 0.0;
     float amplitude = 0.5;
     float frequency = 1.0;
     for (int i = 0; i < 4; i++) {
       value += amplitude * snoise(p * frequency);
       amplitude *= 0.5;
       frequency *= 2.0;
     }
     return value;
   }
   void main() {
     vec2 uv = vUv;
     vec3 finalColor = uBackgroundColor;
     
     // Add subtle pulsing effect
     float pulse = 0.9 + 0.1 * sin(uTime * 0.5);
     
     // Layer 1: Large VU meter style waves
     for (float i = 0.0; i < 4.0; i += 1.0) {
       float waveSpeed = 0.3 + i * 0.05;
       float waveHeight = 0.005 + i * 0.01;
       float waveFreq = 1.2 + i * 0.2;
       
       // Create ultra-smooth flowing wave
       float wave = sin(uv.x * waveFreq + uTime * waveSpeed) * waveHeight;
       wave += sin(uv.x * waveFreq * 0.3 + uTime * waveSpeed * 0.6) * waveHeight * 0.6;
       wave += sin(uv.x * waveFreq * 1.7 + uTime * waveSpeed * 1.2) * waveHeight * 0.3;
       wave += sin(uv.x * waveFreq * 0.8 + uTime * waveSpeed * 0.9) * waveHeight * 0.4;
       wave += sin(uv.x * waveFreq * 2.3 + uTime * waveSpeed * 1.5) * waveHeight * 0.15;
       
       // Add multiple layers of flowing noise
       wave += fbm(vec2(uv.x * 1.2, uTime * 0.06 + i)) * 0.02;
       wave += fbm(vec2(uv.x * 2.5, uTime * 0.04 + i * 0.7)) * 0.015;
       
       // Position waves starting from bottom, optimized for viewport
       float waveY = 0.0 + wave;
       float waveMask = smoothstep(0.0, 0.05, uv.y) * (1.0 - smoothstep(waveY + 0.3, waveY + 0.5, uv.y));
       // Skip if completely outside visible area
       if (waveMask < 0.001) continue;
       
       vec3 color = mod(i, 2.0) < 1.0 ? vec3(0.941, 0.949, 0.941) : vec3(0.000, 0.047, 0.251);
       float brightness = (i == 0.0) ? 0.4 : 0.8; // Dim the first wave
       finalColor += color * waveMask * brightness * pulse;
     }
     
     // Layer 2: Medium waves for depth
     for (float i = 0.0; i < 3.0; i += 1.0) {
       float waveSpeed = 0.4 + i * 0.08;
       float waveHeight = 0.012 + i * 0.008;
       float waveFreq = 2.0 + i * 0.3;
       
       float wave = sin(uv.x * waveFreq + uTime * waveSpeed) * waveHeight;
       wave += sin(uv.x * waveFreq * 0.7 + uTime * waveSpeed * 0.9) * waveHeight * 0.7;
       wave += sin(uv.x * waveFreq * 2.1 + uTime * waveSpeed * 1.3) * waveHeight * 0.4;
       wave += sin(uv.x * waveFreq * 0.4 + uTime * waveSpeed * 0.7) * waveHeight * 0.5;
       wave += sin(uv.x * waveFreq * 3.2 + uTime * waveSpeed * 1.6) * waveHeight * 0.2;
       
       float waveY = 0.0 + wave;
       float waveMask = smoothstep(0.0, 0.05, uv.y) * (1.0 - smoothstep(waveY + 0.3, waveY + 0.5, uv.y));
       // Skip if completely outside visible area
       if (waveMask < 0.001) continue;
       
       vec3 color = mod(i, 2.0) < 1.0 ? vec3(0.941, 0.949, 0.941) : vec3(0.000, 0.047, 0.251);
       finalColor += color * waveMask * 0.7 * pulse;
     }
     
     // Enhanced color mixing zones - more mixing layers
     for (float j = 0.0; j < 3.0; j += 1.0) {
       float mixFreq = 1.0 + j * 0.3;
       float mixSpeed = 0.25 + j * 0.06;
       float mixWave = sin(uv.x * mixFreq + uTime * mixSpeed) * 0.04;
       mixWave += sin(uv.x * mixFreq * 1.6 + uTime * mixSpeed * 1.2) * 0.025;
       mixWave += sin(uv.x * mixFreq * 0.6 + uTime * mixSpeed * 0.8) * 0.02;
       
       float mixY = 0.0 + mixWave;
       float mixMask = smoothstep(0.0, 0.03, uv.y) * (1.0 - smoothstep(mixY + 0.25 + j * 0.03, mixY + 0.45 + j * 0.03, uv.y));
       // Skip if completely outside visible area
       if (mixMask < 0.001) continue;
       
       // Enhanced dynamic color mixing with multiple blend layers
       float colorBlend1 = sin(uTime * 0.1 + uv.x * 2.0 + j) * 0.5 + 0.5;
       float colorBlend2 = cos(uTime * 0.08 + uv.x * 1.5 + j * 2.0) * 0.5 + 0.5;
       float colorBlend3 = sin(uTime * 0.12 + uv.y * 3.0 + j * 0.5) * 0.5 + 0.5;
       
       colorBlend1 = smoothstep(0.3, 0.7, colorBlend1);
       colorBlend2 = smoothstep(0.2, 0.8, colorBlend2);
       colorBlend3 = smoothstep(0.1, 0.9, colorBlend3);
       
       vec3 baseColor1 = vec3(0.941, 0.949, 0.941);
       vec3 baseColor2 = vec3(0.000, 0.047, 0.251);
       vec3 baseColor3 = vec3(0.471, 0.498, 0.596);
       
       vec3 mixColor = mix(mix(baseColor1, baseColor2, colorBlend1), baseColor3, colorBlend2 * colorBlend3);
       
       // Blend between #F0F2F0 and #000C40
       if (j == 0.0) mixColor = vec3(0.941, 0.949, 0.941); // #F0F2F0
       if (j == 1.0) mixColor = vec3(0.000, 0.047, 0.251); // #000C40
       if (j == 2.0) mixColor = vec3(0.471, 0.498, 0.596); // Perfect middle blend
       
       finalColor += mixColor * mixMask * 0.6 * pulse;
     }
     
     gl_FragColor = vec4(finalColor, 1.0);
   }`
)

extend({ LavaLampMaterial })

interface LavaLampMaterialType extends THREE.ShaderMaterial {
  uTime: number
  uResolution: THREE.Vector2
  uBackgroundColor: THREE.Vector3
  uGlassOverlay: THREE.Vector3
  uGlassOpacity: number
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    lavaLampMaterial: React.RefAttributes<LavaLampMaterialType>
  }
}

function LavaLampEffect() {
  const ref = useRef<LavaLampMaterialType>(null)

  useFrame(({ clock, size }) => {
    if (ref.current) {
      ref.current.uTime = clock.getElapsedTime()
      ref.current.uResolution.set(size.width, size.height)
      ref.current.uBackgroundColor = new THREE.Vector3(0.0, 0.0, 0.0)
      ref.current.uGlassOverlay = new THREE.Vector3(0.0, 0.0, 0.0)
      ref.current.uGlassOpacity = 0.0
    }
  })

  return (
    <mesh scale={[12, 12, 1]}>
      <planeGeometry args={[2, 2]} />
      <lavaLampMaterial ref={ref} />
    </mesh>
  )
}

export default function Wave() {
  const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1

  return (
    <div className="lava-background" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true }}
        dpr={pixelRatio}
        frameloop="always"
        performance={{ min: 0.5 }}
        style={{ width: '100%', height: '100%', background: '#000000' }}
      >
        <LavaLampEffect />
      </Canvas>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'none'
      }} />
    </div>
  )
}