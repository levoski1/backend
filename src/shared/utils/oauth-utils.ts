/**
 * Placeholder password hash stored for OAuth users who have no local password.
 * It is a pre-computed bcrypt hash that will never match any real password input.
 */
export const OAUTH_PLACEHOLDER_PASSWORD = '$2b$12$placeholder.oauth.user.no.password.set';

interface OAuthNameProfile {
  displayName?: string;
  name?: { givenName?: string; familyName?: string };
  email?: string;
}

export function extractName(profile: OAuthNameProfile): string {
  if (profile.displayName?.trim()) {
    return profile.displayName.trim();
  }
  if (profile.name?.givenName || profile.name?.familyName) {
    return [profile.name.givenName, profile.name.familyName].filter(Boolean).join(' ').trim();
  }
  if (profile.email) {
    return profile.email.split('@')[0];
  }
  return 'User';
}
