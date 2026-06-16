import { AccountStatus, accountStatusFromString } from '@domain/value-objects';

describe('AccountStatus', () => {
  it('should have active status', () => {
    expect(AccountStatus.ACTIVE).toBe('active');
  });

  it('should have suspended status', () => {
    expect(AccountStatus.SUSPENDED).toBe('suspended');
  });

  it('should have banned status', () => {
    expect(AccountStatus.BANNED).toBe('banned');
  });
});

describe('accountStatusFromString', () => {
  it('should parse "active"', () => {
    expect(accountStatusFromString('active')).toBe(AccountStatus.ACTIVE);
  });

  it('should parse "suspended"', () => {
    expect(accountStatusFromString('suspended')).toBe(AccountStatus.SUSPENDED);
  });

  it('should parse "banned"', () => {
    expect(accountStatusFromString('banned')).toBe(AccountStatus.BANNED);
  });

  it('should throw for invalid status', () => {
    expect(() => accountStatusFromString('deleted')).toThrow('Invalid account status');
  });
});
