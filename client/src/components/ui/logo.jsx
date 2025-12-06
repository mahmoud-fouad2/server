import React from 'react';
import Image from 'next/image';

export default function Logo({ className = 'w-10 h-10', color = 'white' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Use a simple img tag for now to avoid Next.js path issues in static export if not configured perfectly */}
      <img
        src="/logo.webp"
        alt="Faheemly Logo"
        className="object-contain drop-shadow-[0_0_10px_rgba(0,212,170,0.5)] w-full h-full"
      />
    </div>
  );
}
