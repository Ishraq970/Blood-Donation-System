import React, { useEffect, useRef } from 'react';

declare const THREE: any;

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof THREE === 'undefined') return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle blood-drop network
    const COUNT = window.innerWidth < 768 ? 220 : 450;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random();
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.5) * (1.6 + 1.2 * Math.sin(t * Math.PI));
      pos[i * 3] = Math.cos(ang) * rad + 2.2;
      pos[i * 3 + 1] = (t - 0.5) * 6;
      pos[i * 3 + 2] = Math.sin(ang) * rad * 0.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xdc2626,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Glowing core sphere
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.14 })
    );
    core.position.set(2.2, 0, 0);
    scene.add(core);

    const coreWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 1),
      new THREE.MeshBasicMaterial({ color: 0xb91c1c, wireframe: true, transparent: true, opacity: 0.28 })
    );
    coreWire.position.copy(core.position);
    scene.add(coreWire);

    // Floating orbiters
    const orbiters: any[] = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.09 + Math.random() * 0.08, 12, 12),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xfca5a5 : 0xef4444,
          transparent: true,
          opacity: 0.9,
        })
      );
      m.userData = {
        r: 2 + Math.random() * 1.6,
        sp: 0.3 + Math.random() * 0.5,
        ph: Math.random() * Math.PI * 2,
        tilt: Math.random() * 0.9,
      };
      scene.add(m);
      orbiters.push(m);
    }

    let mx = 0;
    let my = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let animId: number;

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      points.rotation.y = t * 0.08 + mx * 0.25;
      points.rotation.x = my * 0.15 + Math.sin(t * 0.3) * 0.05;

      core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.06);
      coreWire.rotation.y = t * 0.25;
      coreWire.rotation.x = t * 0.12;
      coreWire.scale.setScalar(1 + Math.sin(t * 1.4 + 1) * 0.05);

      orbiters.forEach((o) => {
        const u = o.userData;
        const a = t * u.sp + u.ph;
        o.position.set(
          2.2 + Math.cos(a) * u.r,
          Math.sin(a * 1.3) * Math.sin(u.tilt) * u.r * 0.55,
          Math.sin(a) * u.r * 0.5
        );
      });

      camera.position.x += (mx * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(2.2, 0, 0);

      renderer.render(scene, camera);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return <canvas id="hero-canvas" ref={canvasRef} />;
};

export default HeroCanvas;
