import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// The global jest.setup.js should have applied a mock for next/image
import Image from 'next/image'
import { motion } from 'framer-motion'

const MotionTest = () => (
  <div>
    <motion.div data-testid="motion-el" whileInView={{ opacity: 1 }}>
      Motion
    </motion.div>
    <Image src="/test.png" alt="test-image" unoptimized priority />
  </div>
)

describe('Global mocks behavior', () => {
  it('should not expose next/image specific boolean attribute to the DOM', () => {
    render(<MotionTest />)

    const img = screen.getByRole('img', { name: /test-image/i })
    // unoptimized is boolean, should not appear as attribute in DOM
    expect(img.hasAttribute('unoptimized')).toBe(false)
    expect(img.hasAttribute('priority')).toBe(false)
  })

  it('should not forward framer-motion animation props to DOM', () => {
    render(<MotionTest />)
    const motionEl = screen.getByTestId('motion-el')
    // whileInView prop should be stripped and not appear in DOM attributes
    expect(motionEl.hasAttribute('whileInView')).toBe(false)
    expect(motionEl.hasAttribute('whileinview')).toBe(false)
  })
})
