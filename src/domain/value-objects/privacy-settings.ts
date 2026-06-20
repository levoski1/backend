export interface PrivacySettingsParams {
  profileVisibility: 'public' | 'private';
  showFaithInfo: boolean;
  anonymousPosting?: boolean;
}

export class PrivacySettings {
  public readonly profileVisibility: 'public' | 'private';
  public readonly showFaithInfo: boolean;
  public readonly anonymousPosting: boolean;

  constructor(params: PrivacySettingsParams) {
    this.profileVisibility = params.profileVisibility;
    this.showFaithInfo = params.showFaithInfo;
    this.anonymousPosting = params.anonymousPosting ?? false;
  }

  static defaults(): PrivacySettings {
    return new PrivacySettings({
      profileVisibility: 'public',
      showFaithInfo: true,
      anonymousPosting: false,
    });
  }

  equals(other: PrivacySettings): boolean {
    return (
      this.profileVisibility === other.profileVisibility &&
      this.showFaithInfo === other.showFaithInfo &&
      this.anonymousPosting === other.anonymousPosting
    );
  }
}
