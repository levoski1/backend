export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export function accountStatusFromString(value: string): AccountStatus {
  switch (value) {
    case 'active':
      return AccountStatus.ACTIVE;
    case 'suspended':
      return AccountStatus.SUSPENDED;
    case 'banned':
      return AccountStatus.BANNED;
    default:
      throw new Error(`Invalid account status: ${value}`);
  }
}
