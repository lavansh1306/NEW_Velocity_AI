import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export function Background() {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!meshRef.current) return;
    
    const blobs = meshRef.current.children;
    
    Array.from(blobs).forEach((blob) => {
      gsap.set(blob, {
        xPercent: gsap.utils.random(-20, 20),
        yPercent: gsap.utils.random(-20, 20),
        scale: gsap.utils.random(0.8, 1.2),
        rotation: gsap.utils.random(0, 360),
      });

      function wander() {
        if (!blob) return;
        
        gsap.to(blob, {
          xPercent: gsap.utils.random(-40, 40),
          yPercent: gsap.utils.random(-40, 40),
          rotation: `+=${gsap.utils.random(-90, 90)}`,
          scale: gsap.utils.random(0.8, 1.4),
          duration: gsap.utils.random(15, 25),
          ease: 'sine.inOut',
          onComplete: wander
        });
      }

      wander();
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="fixed inset-0 -z-50 h-full w-full bg-stone-50 overflow-hidden pointer-events-none">
      
      {/* Mesh Gradient Container */}
      <div ref={meshRef} className="absolute inset-0 mix-blend-multiply">
        {/* Blob 1: Soft Indigo - Top Left */}
        <div 
          className="absolute top-[-10%] left-[-10%] h-[70vh] w-[80vh] bg-indigo-200/50 blur-[80px]" 
          style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
        />
        
        {/* Blob 2: Muted Rose - Top Right */}
        <div 
          className="absolute top-[-5%] right-[-10%] h-[80vh] w-[70vh] bg-rose-200/40 blur-[80px]" 
          style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
        />
        
        {/* Blob 3: Pale Cyan - Bottom Left */}
        <div 
          className="absolute bottom-[-10%] left-[-5%] h-[70vh] w-[70vh] bg-cyan-200/40 blur-[80px]" 
          style={{ borderRadius: '50% 50% 20% 80% / 25% 80% 20% 75%' }}
        />
        
        {/* Blob 4: Warm Amber - Bottom Right */}
        <div 
          className="absolute bottom-[-10%] right-[-10%] h-[80vh] w-[90vh] bg-orange-100/50 blur-[80px]" 
          style={{ borderRadius: '70% 30% 60% 40% / 50% 60% 30% 50%' }}
        />
        
        {/* Blob 5: Violet Accent - Center */}
        <div 
          className="absolute top-[25%] left-[25%] h-[60vh] w-[60vh] bg-violet-200/40 blur-[90px]" 
          style={{ borderRadius: '40% 60% 60% 40% / 50% 50% 50% 50%' }}
        />
      </div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.025] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Light Overlay for blending */}
      <div className="absolute inset-0 bg-white/30" />
    </div>
  );
}
