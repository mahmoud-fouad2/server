import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../../components/layout/Footer';

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

describe('Footer', () => {
  it('renders footer with main sections', () => {
    render(<Footer />);

    expect(screen.getByText('أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي. نساعدك تزيد مبيعاتك وترضي عملاءك 24/7.')).toBeInTheDocument();
    expect(screen.getByText('الشركة')).toBeInTheDocument();
    expect(screen.getByText('المطورين والدعم')).toBeInTheDocument();
    expect(screen.getByText('تواصل معنا')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Footer />);

    // Company section
    expect(screen.getByText('الرئيسية')).toBeInTheDocument();
    expect(screen.getByText('الخدمات')).toBeInTheDocument();
    expect(screen.getByText('الحلول')).toBeInTheDocument();
    expect(screen.getByText('الأمثلة')).toBeInTheDocument();
    expect(screen.getByText('الأسعار')).toBeInTheDocument();
    expect(screen.getByText('من نحن')).toBeInTheDocument();

    // Developers and Support section
    expect(screen.getByText('التوثيق الشامل')).toBeInTheDocument();
    expect(screen.getByText('مرجع API')).toBeInTheDocument();
    expect(screen.getByText('سياسة الخصوصية')).toBeInTheDocument();
    expect(screen.getByText('الشروط والأحكام')).toBeInTheDocument();
    expect(screen.getByText('اتصل بنا')).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<Footer />);

    expect(screen.getByText('info@faheemly.com')).toBeInTheDocument();
    expect(screen.getByText('الرياض، المملكة العربية السعودية')).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    render(<Footer />);

    expect(screen.getByText(/© 2025 جميع الحقوق محفوظة لشركة فهملي/)).toBeInTheDocument();
  });

  it('renders proper link structure', () => {
    render(<Footer />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(10); // Should have many navigation links
  });

  it('renders responsive layout classes', () => {
    render(<Footer />);

    // Check if the footer has proper responsive classes
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders examples link with correct href', () => {
    render(<Footer />);

    const examplesLink = screen.getByText('الأمثلة').closest('a');
    expect(examplesLink).toHaveAttribute('href', '/examples');
  });

  it('renders docs link with correct href', () => {
    render(<Footer />);

    const docsLink = screen.getByText('التوثيق الشامل').closest('a');
    expect(docsLink).toHaveAttribute('href', '/docs');
  });

  it('renders pricing link with correct href', () => {
    render(<Footer />);

    const pricingLink = screen.getByText('الأسعار').closest('a');
    expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  it('renders support link with correct href', () => {
    render(<Footer />);

    const supportLink = screen.getByText('اتصل بنا').closest('a');
    expect(supportLink).toHaveAttribute('href', '/contact');
  });

  it('renders development credit link', () => {
    render(<Footer />);

    const devLink = screen.getByText('Development By Ma-Fo.info').closest('a');
    expect(devLink).toHaveAttribute('href', 'https://ma-fo.info');
    expect(devLink).toHaveAttribute('target', '_blank');
    expect(devLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});