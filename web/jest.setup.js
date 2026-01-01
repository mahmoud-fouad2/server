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
process.env.NEXT_PUBLIC_API_URL = 'https://fahimo-api.onrender.com/api'

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

const stripImageProps = (props) => {
  const sanitized = { ...props };
  const blocked = ['unoptimized', 'placeholder', 'blurDataURL', 'quality', 'priority', 'sizes', 'fill'];
  blocked.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

const MOTION_PROPS = ['whileInView', 'initial', 'animate', 'exit', 'transition', 'variants'];
const stripMotionProps = (props) => {
  const sanitized = { ...props };
  MOTION_PROPS.forEach(key => {
    if (key in sanitized) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

const createMockMotionElement = (Tag) => {
  const MockComponent = ({ children, ...props }) => {
    const Component = Tag;
    const safeProps = stripMotionProps(props);
    return <Component {...safeProps}>{children}</Component>;
  };
  MockComponent.displayName = `MockMotion${Tag}`;
  return MockComponent;
};

// Mock Next.js Image component for jest env (avoid next/image DOM warnings)
jest.mock('next/image', () => ({
  __esModule: true,
  default: Object.assign(({ src, alt, ...props }) => {
    const sanitized = stripImageProps(props);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...sanitized} />;
  }, { displayName: 'MockNextImage' }),
}));

// Mock framer-motion to render simple DOM nodes and avoid unknown prop warnings
jest.mock('framer-motion', () => ({
  motion: {
    div: createMockMotionElement('div'),
    button: createMockMotionElement('button'),
    h1: createMockMotionElement('h1'),
    h2: createMockMotionElement('h2'),
    p: createMockMotionElement('p'),
  },
  AnimatePresence: Object.assign(({ children }) => <>{children}</>, {
    displayName: 'MockAnimatePresence',
  }),
}));