import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

export async function seed(knex: Knex): Promise<void> {
  await knex('audit_logs').del();
  await knex('refresh_tokens').del();
  await knex('profiles').del();
  await knex('users').del();

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Grace Wilson',
      email: 'grace@example.com',
      password_hash: '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z',
      auth_provider: 'email',
      account_status: 'active',
      email_verified: true,
      privacy_settings: JSON.stringify({ profileVisibility: 'public', showFaithInfo: true }),
      created_at: new Date('2026-05-01'),
      updated_at: new Date('2026-05-01'),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'David Shepherd',
      email: 'david@example.com',
      password_hash: '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z',
      auth_provider: 'email',
      account_status: 'active',
      email_verified: true,
      privacy_settings: JSON.stringify({ profileVisibility: 'public', showFaithInfo: true }),
      created_at: new Date('2026-05-02'),
      updated_at: new Date('2026-05-02'),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Sarah Hope',
      email: 'sarah@example.com',
      password_hash: '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z',
      auth_provider: 'google',
      account_status: 'active',
      email_verified: true,
      privacy_settings: JSON.stringify({ profileVisibility: 'public', showFaithInfo: true }),
      created_at: new Date('2026-05-03'),
      updated_at: new Date('2026-05-03'),
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      full_name: 'Michael Faith',
      email: 'michael@example.com',
      password_hash: '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z',
      auth_provider: 'email',
      account_status: 'active',
      email_verified: true,
      privacy_settings: JSON.stringify({ profileVisibility: 'public', showFaithInfo: true }),
      created_at: new Date('2026-05-04'),
      updated_at: new Date('2026-05-04'),
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      full_name: 'Rebecca Peace',
      email: 'rebecca@example.com',
      password_hash: '$2b$12$LJ3m4ys3Lk5x7D8k9n0Ae.1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z',
      auth_provider: 'apple',
      account_status: 'active',
      email_verified: true,
      privacy_settings: JSON.stringify({ profileVisibility: 'public', showFaithInfo: true }),
      created_at: new Date('2026-05-05'),
      updated_at: new Date('2026-05-05'),
    },
  ];

  await knex('users').insert(users);

  const profiles = [
    {
      id: randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      display_name: 'GraceWilson',
      bio: 'Finding strength in scripture and community.',
      denomination: 'Non-denominational',
      spiritual_interests: JSON.stringify(['prayer', 'bible-study', 'worship']),
      timezone: 'America/New_York',
    },
    {
      id: randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000002',
      display_name: 'DavidShepherd',
      bio: 'Walking in faith one day at a time.',
      denomination: 'Baptist',
      spiritual_interests: JSON.stringify(['discipleship', 'prayer', 'missions']),
      timezone: 'America/Chicago',
    },
    {
      id: randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000003',
      display_name: 'SarahHope',
      bio: 'Leading prayer circles and building community.',
      denomination: 'Catholic',
      spiritual_interests: JSON.stringify(['prayer', 'community', 'worship', 'mentorship']),
      timezone: 'America/Denver',
    },
    {
      id: randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000004',
      display_name: 'MichaelFaith',
      bio: 'Sharing devotionals and curated spiritual content.',
      denomination: 'Protestant',
      spiritual_interests: JSON.stringify(['bible-study', 'teaching', 'writing']),
      timezone: 'America/Los_Angeles',
    },
    {
      id: randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000005',
      display_name: 'RebeccaPeace',
      bio: 'Licensed Christian counselor providing professional support.',
      denomination: 'Methodist',
      spiritual_interests: JSON.stringify(['counseling', 'mental-health', 'prayer', 'healing']),
      timezone: 'America/New_York',
    },
  ];

  await knex('profiles').insert(profiles);
}
