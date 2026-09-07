import { describe, expect, it } from 'vitest';
import { canManageBusiness, canManageSubscription } from './permissions.js';

describe('business permissions', () => {
  it('keeps subscription control with the owner', () => {
    expect(canManageSubscription('BUSINESS_OWNER')).toBe(true);
    expect(canManageSubscription('MANAGER')).toBe(false);
  });
  it('allows managers but not staff to edit business configuration', () => {
    expect(canManageBusiness('MANAGER')).toBe(true);
    expect(canManageBusiness('STAFF')).toBe(false);
  });
});
