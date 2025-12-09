import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  HeroSection,
  IndustryModal,
  CoverageSection,
  IndustrySolutions,
  ComparisonSection,
  TestimonialsSection,
  WhyChooseSection,
  CTASection,
  LimitedTimeOffer,
} from '../LandingSections';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ShoppingBag: () => <div data-testid="shopping-bag-icon">ShoppingBag</div>,
  Stethoscope: () => <div data-testid="stethoscope-icon">Stethoscope</div>,
  Utensils: () => <div data-testid="utensils-icon">Utensils</div>,
  Code: () => <div data-testid="code-icon">Code</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Rocket: () => <div data-testid="rocket-icon">Rocket</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <div data-testid="next-image-mock" {...props} role="img" aria-label={alt} />,
}));

// Mock constants
jest.mock('../../../constants', () => ({
  TRANSLATIONS: {
    heroTag: '🚀 جديد',
    startTrial: 'ابدأ التجربة المجانية',
    coverageTag: '🌍 تغطية شاملة',
    coverageTitle: 'نغطي جميع الدول العربية',
    solutionsTag: '💼 الحلول',
    indTitle: 'حلول مخصصة لكل قطاع',
    testimonialsTag: '⭐ آراء العملاء',
    testimonialsTitle: 'ماذا يقول عملاؤنا',
    whyTag: 'لماذا فهملي؟',
    whyFast: 'سرعة فائقة',
    whySecure: 'أمان تام',
    whySupport: 'دعم فني 24/7',
    ctaTitle: 'ابدأ رحلتك الرقمية اليوم',
    ctaButton: 'ابدأ الآن',
    ctaContact: 'تواصل معنا',
    offerTag: '⏰ عرض محدود',
    offerTitle: 'خصم 50%',
    offerButton: 'استفد من العرض',
    startFreeTrial: 'ابدأ التجربة المجانية',
    closeBtn: 'إغلاق',
  },
  SEO_DATA: {},
  REGIONAL_CONTENT: {
    heroTitle: 'فهملي - مساعد ذكي للأعمال',
    heroSubtitle: 'أتمتة خدمة العملاء باستخدام الذكاء الاصطناعي',
  },
  COMPARISON_DATA: {
    old: {
      title: 'البوتات التقليدية',
      points: ['ردود بطيئة', 'فهم محدود', 'تكلفة عالية'],
    },
    fahimo: {
      title: 'فهملي',
      points: ['ردود فورية', 'فهم ذكي', 'توفير التكاليف'],
    },
    human: {
      title: 'الموظف البشري',
      points: ['متاح 24/7', 'فهم كامل', 'تكلفة مرتفعة'],
    },
  },
}));

// Mock components
jest.mock('../../DemoChat', () => ({
  __esModule: true,
  default: () => <div data-testid="demo-chat">DemoChat</div>,
}));

jest.mock('../../ui/Components', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

describe('LandingSections Components', () => {
  const mockProps = {
    regionContent: {
      heroTitle: 'فهملي - مساعد ذكي للأعمال',
      heroSubtitle: 'أتمتة خدمة العملاء باستخدام الذكاء الاصطناعي',
    },
    t: {
      heroTag: '🚀 جديد',
      startTrial: 'ابدأ التجربة المجانية',
      coverageTag: '🌍 تغطية شاملة',
      coverageTitle: 'نغطي جميع الدول العربية',
      solutionsTag: '💼 الحلول',
      indTitle: 'حلول مخصصة لكل قطاع',
      indRestTitle: 'مطاعم',
      indClinicTitle: 'عيادات',
      indRetailTitle: 'تجزئة',
      indCorpTitle: 'شركات',
      indEduTitle: 'تعليم',
      indFinTitle: 'عقارات',
      testimonialsTag: '⭐ آراء العملاء',
      testimonialsTitle: 'ماذا يقول عملاؤنا',
      whyTag: 'لماذا فهملي؟',
      whyFast: 'سرعة فائقة',
      whySecure: 'أمان تام',
      whySupport: 'دعم فني 24/7',
      ctaTitle: 'ابدأ رحلتك الرقمية اليوم',
      ctaButton: 'ابدأ الآن',
      ctaContact: 'تواصل معنا',
      offerTag: '⏰ عرض محدود',
      offerTitle: 'خصم 50%',
      offerButton: 'استفد من العرض',
      startFreeTrial: 'ابدأ التجربة المجانية',
      closeBtn: 'إغلاق',
    },
    activeCountry: 'sa',
    isDark: false,
  };

  describe('HeroSection', () => {
    it('renders hero content correctly', () => {
      render(<HeroSection {...mockProps} />);

      expect(screen.getByText('فهملي - مساعد ذكي للأعمال')).toBeInTheDocument();
      expect(screen.getByText('أتمتة خدمة العملاء باستخدام الذكاء الاصطناعي')).toBeInTheDocument();
      expect(screen.getByText('🚀 جديد')).toBeInTheDocument();
      expect(screen.getByText('ابدأ التجربة المجانية')).toBeInTheDocument();
    });

    it('renders demo chat component', () => {
      render(<HeroSection {...mockProps} />);
      expect(screen.getByTestId('demo-chat')).toBeInTheDocument();
    });
  });

  describe('CoverageSection', () => {
    it('renders coverage section with all countries', () => {
      render(<CoverageSection {...mockProps} />);

      expect(screen.getByText('🌍 تغطية شاملة')).toBeInTheDocument();
      expect(screen.getByText('نغطي جميع الدول العربية')).toBeInTheDocument();
      expect(screen.getByText('السعودية')).toBeInTheDocument();
      expect(screen.getByText('مصر')).toBeInTheDocument();
      expect(screen.getByText('الإمارات')).toBeInTheDocument();
    });
  });

  describe('IndustrySolutions', () => {
    it('renders industry solutions section', () => {
      render(<IndustrySolutions {...mockProps} />);

      expect(screen.getByText('💼 الحلول')).toBeInTheDocument();
      expect(screen.getByText('حلول مخصصة لكل قطاع')).toBeInTheDocument();
    });

    it('renders all industry cards', () => {
      render(<IndustrySolutions {...mockProps} />);

      expect(screen.getByText('مطاعم')).toBeInTheDocument();
      expect(screen.getByText('عيادات')).toBeInTheDocument();
      expect(screen.getByText('تجزئة')).toBeInTheDocument();
    });
  });

  describe('ComparisonSection', () => {
    it('renders comparison section with all three columns', () => {
      render(<ComparisonSection {...mockProps} />);

      expect(screen.getByText('البوتات التقليدية')).toBeInTheDocument();
      expect(screen.getByText('فهملي')).toBeInTheDocument();
      expect(screen.getByText('الموظف البشري')).toBeInTheDocument();
    });
  });

  describe('TestimonialsSection', () => {
    it('renders testimonials section', () => {
      render(<TestimonialsSection {...mockProps} />);

      expect(screen.getByText('⭐ آراء العملاء')).toBeInTheDocument();
      expect(screen.getByText('ماذا يقول عملاؤنا')).toBeInTheDocument();
      expect(screen.getByText('أحمد السالم')).toBeInTheDocument();
      expect(screen.getByText('فاطمة محمد')).toBeInTheDocument();
    });
  });

  describe('WhyChooseSection', () => {
    it('renders why choose section with features', () => {
      render(<WhyChooseSection {...mockProps} />);

      expect(screen.getByText('لماذا فهملي؟')).toBeInTheDocument();
      expect(screen.getByText('سرعة فائقة')).toBeInTheDocument();
      expect(screen.getByText('أمان تام')).toBeInTheDocument();
      expect(screen.getByText('دعم فني 24/7')).toBeInTheDocument();
    });

    it('renders zap icons', () => {
      render(<WhyChooseSection {...mockProps} />);
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('CTASection', () => {
    it('renders call-to-action section', () => {
      render(<CTASection {...mockProps} />);

      expect(screen.getByText('ابدأ رحلتك الرقمية اليوم')).toBeInTheDocument();
      expect(screen.getByText('ابدأ الآن')).toBeInTheDocument();
      expect(screen.getByText('تواصل معنا')).toBeInTheDocument();
    });
  });

  describe('LimitedTimeOffer', () => {
    it('renders limited time offer for Saudi Arabia', () => {
      render(<LimitedTimeOffer {...mockProps} />);

      expect(screen.getByText('⏰ عرض محدود')).toBeInTheDocument();
      expect(screen.getByText(/خصم 50% 99 ريال فقط/)).toBeInTheDocument();
      expect(screen.getByText('استفد من العرض')).toBeInTheDocument();
    });

    it('renders correct pricing for different countries', () => {
      const egyptProps = { ...mockProps, activeCountry: 'eg' };
      const { rerender } = render(<LimitedTimeOffer {...egyptProps} />);

      expect(screen.getByText(/خصم 50% 372 جنيه فقط/)).toBeInTheDocument();

      const uaeProps = { ...mockProps, activeCountry: 'ae' };
      rerender(<LimitedTimeOffer {...uaeProps} />);
      expect(screen.getByText(/خصم 50% 99 درهم فقط/)).toBeInTheDocument();
    });
  });

  describe('IndustryModal', () => {
    const mockSetSelectedIndustry = jest.fn();

    it('renders modal when industry is selected', () => {
      const selectedIndustry = {
        title: 'مطاعم',
        modalTitle: 'حلول فهملي للمطاعم',
        modalDesc: 'وصف تفصيلي للحلول',
        color: 'orange',
        image: '/test-image.jpg',
      };

      render(
        <IndustryModal
          selectedIndustry={selectedIndustry}
          setSelectedIndustry={mockSetSelectedIndustry}
          isDark={false}
          t={mockProps.t}
        />
      );

      expect(screen.getByText('حلول فهملي للمطاعم')).toBeInTheDocument();
      expect(screen.getByText('وصف تفصيلي للحلول')).toBeInTheDocument();
    });

    it('does not render when no industry is selected', () => {
      const { container } = render(
        <IndustryModal
          selectedIndustry={null}
          setSelectedIndustry={mockSetSelectedIndustry}
          isDark={false}
          t={mockProps.t}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('calls setSelectedIndustry when close button is clicked', () => {
      const selectedIndustry = {
        title: 'مطاعم',
        modalTitle: 'حلول فهملي للمطاعم',
        modalDesc: 'وصف تفصيلي للحلول',
        color: 'orange',
        image: '/test-image.jpg',
      };

      render(
        <IndustryModal
          selectedIndustry={selectedIndustry}
          setSelectedIndustry={mockSetSelectedIndustry}
          isDark={false}
          t={mockProps.t}
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton);
      expect(mockSetSelectedIndustry).toHaveBeenCalledWith(null);
    });
  });
});