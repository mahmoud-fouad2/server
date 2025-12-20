import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../Navigation';

// Mocks used by Navigation
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

jest.mock('lucide-react', () => ({
  Moon: () => <div>Moon</div>,
  Sun: () => <div>Sun</div>,
  Globe: () => <div>Globe</div>,
  X: () => <div>X</div>,
}));

jest.mock('../../../components/ui/Components', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

describe('Navigation render', () => {
  it('renders navigation without crashing', () => {
    render(
      <Navigation
        lang={'ar'}
        setLang={() => {}}
        activeCountry={'sa'}
        changeCountry={() => {}}
        isDark={false}
        toggleTheme={() => {}}
        scrolled={false}
        mobileMenuOpen={false}
        setMobileMenuOpen={() => {}}
        t={{ loginBtn: 'Login', startTrial: 'Start' }}
      />
    );
  });
});
