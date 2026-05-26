export interface PrivacySettingsParams {
  profileVisibility: 'public' | 'private';
  showFaithInfo: boolean;
}

export class PrivacySettings {
  public readonly profileVisibility: 'public' | 'private';
  public readonly showFaithInfo: boolean;

  constructor(params: PrivacySettingsParams) {
    this.profileVisibility = params.profileVisibility;
    this.showFaithInfo = params.showFaithInfo;
  }

  static defaults(): PrivacySettings {
    return new PrivacySettings({
      profileVisibility: 'public',
      showFaithInfo: true,
    });
  }

  equals(other: PrivacySettings): boolean {
    return (
      this.profileVisibility === other.profileVisibility &&
      this.showFaithInfo === other.showFaithInfo
    );
  }
}
