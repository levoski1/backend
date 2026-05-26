import { AuthProvider, authProviderFromString } from '@domain/value-objects';

describe('AuthProvider', () => {
  it('should have email provider', () => {
    expect(AuthProvider.EMAIL).toBe('email');
  });

  it('should have google provider', () => {
    expect(AuthProvider.GOOGLE).toBe('google');
  });

  it('should have apple provider', () => {
    expect(AuthProvider.APPLE).toBe('apple');
  });
});

describe('authProviderFromString', () => {
  it('should parse "email"', () => {
    expect(authProviderFromString('email')).toBe(AuthProvider.EMAIL);
  });

  it('should parse "google"', () => {
    expect(authProviderFromString('google')).toBe(AuthProvider.GOOGLE);
  });

  it('should parse "apple"', () => {
    expect(authProviderFromString('apple')).toBe(AuthProvider.APPLE);
  });

  it('should throw for invalid provider', () => {
    expect(() => authProviderFromString('facebook')).toThrow('Invalid auth provider');
  });
});
