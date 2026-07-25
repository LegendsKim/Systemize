import { describe, it, expect } from 'vitest';
import { getDirection, getHtmlLang, defaultLocale, supportedLocales } from '../locale';

describe('locale configuration', () => {
  it('getDirection returns rtl for he', () => {
    expect(getDirection('he')).toBe('rtl');
  });

  it('getDirection returns ltr for en', () => {
    expect(getDirection('en')).toBe('ltr');
  });

  it('getHtmlLang returns the locale string', () => {
    expect(getHtmlLang('he')).toBe('he');
    expect(getHtmlLang('en')).toBe('en');
  });

  it('defaultLocale matches the neutral English boilerplate copy', () => {
    expect(defaultLocale).toBe('en');
  });

  it('supportedLocales contains both he and en', () => {
    expect(supportedLocales).toContain('he');
    expect(supportedLocales).toContain('en');
  });
});
