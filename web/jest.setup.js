import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

// Global test utilities
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock Next.js Image component for jest env (avoid next/image DOM warnings)
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => {
    // Remove next/image-specific props that would create DOM warnings in JSDOM
    const { unoptimized, placeholder, blurDataURL, className, quality, priority, sizes, fill, ...rest } = props;
    return <img src={src} alt={alt} className={className} {...rest} />;
  },
}));

// Mock framer-motion to render simple DOM nodes and avoid unknown prop warnings
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { whileInView, initial, animate, exit, transition, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }) => {
      const { whileInView, initial, animate, exit, transition, variants, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    h1: ({ children, ...props }) => {
      const { whileInView, initial, animate, exit, transition, variants, ...rest } = props;
      return <h1 {...rest}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const { whileInView, initial, animate, exit, transition, variants, ...rest } = props;
      return <h2 {...rest}>{children}</h2>;
    },
    p: ({ children, ...props }) => {
      const { whileInView, initial, animate, exit, transition, variants, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));