export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
}

export function authProviderFromString(value: string): AuthProvider {
  switch (value) {
    case 'email':
      return AuthProvider.EMAIL;
    case 'google':
      return AuthProvider.GOOGLE;
    case 'apple':
      return AuthProvider.APPLE;
    default:
      throw new Error(`Invalid auth provider: ${value}`);
  }
}
