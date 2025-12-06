import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExamplesPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (target, prop) => {
      return ({ children, ...props }) => {
        const Element = prop;
        return <Element {...props}>{children}</Element>;
      };
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  ChevronLeft: () => <div data-testid="chevron-left-icon">ChevronLeft</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

// Mock UI components
jest.mock('../../../components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
}));

jest.mock('../../../components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock('../../../components/ui/logo', () => ({
  __esModule: true,
  default: () => <div data-testid="logo">Logo</div>,
}));

// Mock lib/utils
jest.mock('../../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

// Mock components
jest.mock('../../../components/ui/Components', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock('../../../components/DemoChat', () => ({
  __esModule: true,
  default: ({ conversation, onMessage }) => (
    <div data-testid="demo-chat">
      {conversation.map((msg, i) => (
        <div key={i} data-testid={`message-${i}`}>
          {msg.text}
        </div>
      ))}
    </div>
  ),
}));

// Mock constants
jest.mock('../../../constants', () => ({
  TRANSLATIONS: {
    examplesTitle: 'أمثلة تفاعلية',
    examplesSubtitle: 'شاهد كيف يعمل فهملي في سيناريوهات مختلفة',
    tryNow: 'جرب الآن',
    nextExample: 'المثال التالي',
    prevExample: 'المثال السابق',
    playConversation: 'تشغيل المحادثة',
    pauseConversation: 'إيقاف المحادثة',
    resetConversation: 'إعادة تشغيل',
    conversationSpeed: 'سرعة المحادثة',
    totalExamples: 'إجمالي الأمثلة',
    currentExample: 'المثال الحالي',
    examplesStats: {
      conversationsHandled: 'المحادثات المعالجة',
      responseTime: 'وقت الرد',
      customerSatisfaction: 'رضا العملاء',
    },
  },
}));

describe('ExamplesPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders examples page with title and subtitle', () => {
    render(<ExamplesPage />);

    expect(screen.getByText('شاهد فهملي في العمل')).toBeInTheDocument();
    expect(screen.getByText('اكتشف كيف يتكيف فهملي مع طبيعة كل عمل ليقدم أفضل خدمة ممكنة لعملائك')).toBeInTheDocument();
  });

  it('renders statistics section', () => {
    render(<ExamplesPage />);

    expect(screen.getByText('زيادة الطلبات')).toBeInTheDocument();
    expect(screen.getByText('رضا العملاء')).toBeInTheDocument();
    expect(screen.getByText('سرعة الرد')).toBeInTheDocument();
  });

  it('renders example navigation controls', () => {
    render(<ExamplesPage />);

    // Check for navigation buttons by their icons
    expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('renders conversation controls', () => {
    render(<ExamplesPage />);

    // Check for play/pause and reset buttons by their icons
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument();
  });

  it('renders demo chat component', () => {
    render(<ExamplesPage />);
    // Check for chat interface elements
    expect(screen.getByText('محادثة تجريبية')).toBeInTheDocument();
  });

  it('shows play/pause button functionality', () => {
    render(<ExamplesPage />);

    const playButton = screen.getByTestId('play-icon').closest('button');
    expect(playButton).toBeInTheDocument();

    // Initially should show play button
    expect(screen.getByTestId('play-icon')).toBeInTheDocument();
  });

  it('renders example categories', () => {
    render(<ExamplesPage />);

    // Check if example categories are rendered (use getAllByText for multiple instances)
    const restaurantExamples = screen.getAllByText('مطعم برجر');
    expect(restaurantExamples.length).toBeGreaterThan(0);
    expect(screen.getByText('متجر أزياء')).toBeInTheDocument();
    expect(screen.getByText('شركة خدمات')).toBeInTheDocument();
    expect(screen.getByText('عيادة أسنان')).toBeInTheDocument();
  });

  it('renders call-to-action button', () => {
    render(<ExamplesPage />);

    const ctaButtons = screen.getAllByText('جرب الآن');
    expect(ctaButtons.length).toBeGreaterThan(0);
  });

  it('handles conversation playback simulation', async () => {
    render(<ExamplesPage />);

    const playButton = screen.getByTestId('play-icon').closest('button');

    // Click play button
    fireEvent.click(playButton);

    // Should show pause button after clicking play
    await waitFor(() => {
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });

    // Should show pause icon
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
  });

  it('handles conversation reset', () => {
    render(<ExamplesPage />);

    const resetButton = screen.getByTestId('rotate-ccw-icon').closest('button');
    fireEvent.click(resetButton);

    // Reset should work without errors
    expect(resetButton).toBeInTheDocument();
  });

  it('handles example navigation', () => {
    render(<ExamplesPage />);

    const nextButton = screen.getByTestId('chevron-left-icon').closest('button');
    const prevButton = screen.getByTestId('chevron-right-icon').closest('button');

    // Click next
    fireEvent.click(nextButton);
    // Re-query to ensure buttons are still present after re-render
    expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();

    // Click previous
    fireEvent.click(prevButton);
    // Re-query to ensure buttons are still present after re-render
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(<ExamplesPage />);

    // Check for proper heading structure
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});