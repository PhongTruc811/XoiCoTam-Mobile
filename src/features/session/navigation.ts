import type { Role } from './model';
import type { ShipperName } from '../order/model';

export type Audience = 'customer' | 'employee' | null;
export type CustomerPath = 'guest' | 'account' | null;

export const entryScreens = [
  'index', 'roles', 'customer-options', 'customer-account', 'employee-roles',
  'customer', 'staff', 'shipper-identity', 'shipper', 'boss',
] as const;
export type EntryScreen = (typeof entryScreens)[number];

export function getEntryScreen(
  connected: boolean,
  audience: Audience,
  customerPath: CustomerPath,
  role: Role | null,
  connectionVisible = false,
  shipperIdentity: ShipperName | null = null,
  employeeVerified = false,
): EntryScreen {
  if (!connected || connectionVisible) return 'index';
  if (audience === 'customer') {
    if (customerPath === 'guest') return 'customer';
    return customerPath === 'account' ? 'customer-account' : 'customer-options';
  }
  if (audience === 'employee') {
    if (!employeeVerified) return 'roles';
    if (role === 'shipper' && !shipperIdentity) return 'shipper-identity';
    return role && role !== 'customer' ? role : 'employee-roles';
  }
  return 'roles';
}
