import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import i18n from '../i18n';

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
afterEach(() => cleanup());
beforeEach(async () => { await i18n.changeLanguage('en'); });
