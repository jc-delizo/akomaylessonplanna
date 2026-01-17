'use client'

import './curved-loop-hero.css'

export function CurvedLoopHero() {
  const marqueeText = " Quality Lesson Plans from Filipino Teachers✦Discover Quality Educational Resources From Verified Teachers✦"
  
  return (
    <div className="curved-loop-hero-container bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden">
      <div className="curved-loop-hero-wrapper">
        <div className="curved-loop-marquee">
          <div className="curved-loop-marquee-content">
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
