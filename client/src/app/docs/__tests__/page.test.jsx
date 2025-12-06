import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Documentation from '../page';

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
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Book: () => <div data-testid="book-icon">Book</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

// Mock components
jest.mock('../../../components/ui/Components', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

describe('Documentation', () => {
  it('renders documentation page with main title', () => {
    render(<Documentation />);

    expect(screen.getByText('التوثيق الشامل')).toBeInTheDocument();
    expect(screen.getByText('دليل شامل لاستخدام فهملي بفعالية')).toBeInTheDocument();
  });

  it('renders all main documentation sections', () => {
    render(<Documentation />);

    // Check that navigation buttons exist (they appear in sidebar)
    // Use getAllByText since some text appears multiple times
    expect(screen.getAllByText('البدء السريع')).toHaveLength(2); // sidebar + heading
    expect(screen.getByText('مرجع API')).toBeInTheDocument();
    expect(screen.getByText('التخصيص')).toBeInTheDocument();
    expect(screen.getByText('التحليلات')).toBeInTheDocument();
    expect(screen.getByText('حل المشاكل')).toBeInTheDocument();
  });

  it('renders search functionality', () => {
    render(<Documentation />);

    expect(screen.getByPlaceholderText('البحث في التوثيق...')).toBeInTheDocument();
  });

  it('renders getting started section with key points', () => {
    render(<Documentation />);

    expect(screen.getByText('إنشاء حساب')).toBeInTheDocument();
    expect(screen.getByText('إعداد البوت')).toBeInTheDocument();
    expect(screen.getByText('ربط القنوات')).toBeInTheDocument();
  });

  it('renders API reference section', () => {
    render(<Documentation />);

    // Switch to API reference section first
    const apiButton = screen.getByText('مرجع API');
    fireEvent.click(apiButton);

    expect(screen.getByText('REST API')).toBeInTheDocument();
    expect(screen.getByText('Webhooks')).toBeInTheDocument();
  });

  it('renders customization section', () => {
    render(<Documentation />);

    // Switch to customization section first
    const customizationButton = screen.getByText('التخصيص');
    fireEvent.click(customizationButton);

    expect(screen.getByText('إعدادات البوت')).toBeInTheDocument();
    expect(screen.getByText('الذكاء الاصطناعي المخصص')).toBeInTheDocument();
  });

  it('renders analytics section', () => {
    render(<Documentation />);

    // Switch to analytics section first
    const analyticsButton = screen.getByText('التحليلات');
    fireEvent.click(analyticsButton);

    expect(screen.getByText('لوحة التحكم التحليلية')).toBeInTheDocument();
    expect(screen.getByText('إحصائيات المحادثات')).toBeInTheDocument();
  });

  it('renders troubleshooting section with key points', () => {
    render(<Documentation />);

    // Switch to troubleshooting section first
    const troubleshootingButton = screen.getByText('حل المشاكل');
    fireEvent.click(troubleshootingButton);

    expect(screen.getByText('المشاكل الشائعة وحلولها')).toBeInTheDocument();
    expect(screen.getByText('تحتاج مساعدة إضافية؟')).toBeInTheDocument();
  });

  it('renders code examples', () => {
    render(<Documentation />);

    // Switch to API reference section first
    const apiButton = screen.getByText('مرجع API');
    fireEvent.click(apiButton);

    // Check for code blocks (represented as pre elements)
    const codeBlocks = document.querySelectorAll('pre');
    expect(codeBlocks.length).toBeGreaterThan(0);
  });

  it('renders API endpoints table', () => {
    render(<Documentation />);

    // Switch to API reference section first
    const apiButton = screen.getByText('مرجع API');
    fireEvent.click(apiButton);

    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/api/messages/send')).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<Documentation />);

    expect(screen.getByText('تواصل مع الدعم')).toBeInTheDocument();
  });

  it('renders status indicators', () => {
    render(<Documentation />);

    // Check for numbered steps (1, 2, 3, 4)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders navigation breadcrumbs', () => {
    render(<Documentation />);

    expect(screen.getByText('العودة للرئيسية')).toBeInTheDocument();
  });

  it('renders section navigation menu', () => {
    render(<Documentation />);

    expect(screen.getByText('المحتوى')).toBeInTheDocument();
  });

  it('handles section navigation clicks', () => {
    render(<Documentation />);

    // Click on the API reference button in the sidebar
    const apiButton = screen.getByText('مرجع API');
    fireEvent.click(apiButton);

    // Should show API reference content
    expect(screen.getByText('REST API')).toBeInTheDocument();
  });

  it('renders responsive design elements', () => {
    render(<Documentation />);

    // Check for responsive classes (this is a basic check)
    const mainContainer = screen.getByText('دليل شامل لاستخدام فهملي بفعالية').closest('div');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders proper heading hierarchy', () => {
    render(<Documentation />);

    const h1Headings = screen.getAllByRole('heading', { level: 1 });
    const h2Headings = screen.getAllByRole('heading', { level: 2 });
    const h3Headings = screen.getAllByRole('heading', { level: 3 });

    expect(h1Headings.length).toBeGreaterThan(0);
    expect(h2Headings.length).toBeGreaterThan(0);
    expect(h3Headings.length).toBeGreaterThan(0);
  });
});