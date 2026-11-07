import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { useBackendConnection } from '@/features/be-connection/provider';
import { shipperNames, type ShipperName } from '@/features/order/model';
import { canUseStaffOrders, staffApi, type StaffIdentity } from '@/features/order/staff-api';

import type { Role } from './model';
import { getEntryScreen, type Audience, type CustomerPath, type EntryScreen } from './navigation';

type RoleSession = {
  role: Role | null;
  shipperIdentity: ShipperName | null;
  chooseShipperIdentity: (name: ShipperName) => void;
  activeScreen: EntryScreen;
  chooseAudience: (audience: Exclude<Audience, null>) => void;
  chooseCustomerPath: (path: Exclude<CustomerPath, null>) => void;
  chooseEmployeeRole: (role: Exclude<Role, 'customer'>) => void;
  continueFromConnection: () => void;
  goBack: () => void;
  clearRole: () => void;
  staffLoginOpen: boolean;
  staffIdentity: StaffIdentity | null;
  loginStaff: (username: string, password: string) => Promise<void>;
  cancelStaffLogin: () => void;
  staffSessionExpired: () => void;
};

const RoleSessionContext = createContext<RoleSession | null>(null);

export function RoleSessionProvider({ children }: PropsWithChildren) {
  const { brandThemeEnabled } = useBackendConnection();
  const [audience, setAudience] = useState<Audience>(null);
  const [customerPath, setCustomerPath] = useState<CustomerPath>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [shipperIdentity, setShipperIdentity] = useState<ShipperName | null>(null);
  const [connectionVisible, setConnectionVisible] = useState(false);
  const [employeeVerified, setEmployeeVerified] = useState(false);
  const [staffLoginOpen, setStaffLoginOpen] = useState(false);
  const [staffIdentity, setStaffIdentity] = useState<StaffIdentity | null>(null);
  const activeScreen = getEntryScreen(brandThemeEnabled, audience, customerPath, role, connectionVisible, shipperIdentity, employeeVerified);

  const chooseAudience = useCallback((next: Exclude<Audience, null>) => {
    if (!brandThemeEnabled) return;
    if (next === 'employee') {
      setStaffLoginOpen(true);
      staffApi.me().then(identity => {
        if (canUseStaffOrders(identity)) {
          setStaffIdentity(identity);
          setEmployeeVerified(true);
          setStaffLoginOpen(false);
          setAudience('employee');
          setRole('staff');
        }
      }).catch(() => {});
      return;
    }
    setEmployeeVerified(false);
    setStaffLoginOpen(false);
    setAudience(next);
    setCustomerPath(null);
    setRole(null);
    setShipperIdentity(null);
  }, [brandThemeEnabled]);
  const loginStaff = useCallback(async (username: string, password: string) => {
    const identity = await staffApi.login(username, password);
    if (!canUseStaffOrders(identity)) throw new Error('Tài khoản không có quyền xem đơn nhân viên.');
    setStaffIdentity(identity);
    setEmployeeVerified(true);
    setStaffLoginOpen(false);
    setAudience('employee');
    setCustomerPath(null);
    setRole('staff');
    setShipperIdentity(null);
  }, []);
  const cancelStaffLogin = useCallback(() => setStaffLoginOpen(false), []);
  const staffSessionExpired = useCallback(() => {
    setStaffIdentity(null);
    setEmployeeVerified(false);
    setRole(null);
    setAudience(null);
    setStaffLoginOpen(true);
  }, []);
  const chooseCustomerPath = useCallback((next: Exclude<CustomerPath, null>) => {
    if (brandThemeEnabled && audience === 'customer') {
      setCustomerPath(next);
      setRole(next === 'guest' ? 'customer' : null);
    }
  }, [brandThemeEnabled, audience]);
  const chooseEmployeeRole = useCallback((next: Exclude<Role, 'customer'>) => {
    if (brandThemeEnabled && audience === 'employee' && employeeVerified) {
      setShipperIdentity(null);
      setRole(next);
    }
  }, [brandThemeEnabled, audience, employeeVerified]);
  const chooseShipperIdentity = useCallback((name: ShipperName) => {
    if (brandThemeEnabled && audience === 'employee' && employeeVerified && role === 'shipper' && shipperNames.includes(name)) {
      setShipperIdentity(name);
    }
  }, [brandThemeEnabled, audience, role, employeeVerified]);
  const continueFromConnection = useCallback(() => {
    if (brandThemeEnabled) setConnectionVisible(false);
  }, [brandThemeEnabled]);
  const goBack = useCallback(() => {
    if (activeScreen === 'roles') setConnectionVisible(true);
    else if (activeScreen === 'customer-options' || activeScreen === 'employee-roles') {
      setAudience(null);
      setEmployeeVerified(false);
    }
    else if (activeScreen === 'customer-account' || activeScreen === 'customer') {
      setCustomerPath(null);
      setRole(null);
    } else if (activeScreen === 'staff') {
      setRole(null);
      setAudience(null);
      setEmployeeVerified(false);
      setStaffIdentity(null);
    } else if (activeScreen === 'shipper') setShipperIdentity(null);
    else if (['staff', 'shipper-identity', 'boss'].includes(activeScreen)) {
      setRole(null);
      setShipperIdentity(null);
    }
  }, [activeScreen]);
  const clearRole = useCallback(() => {
    setShipperIdentity(null);
    setAudience(null);
    setCustomerPath(null);
    setRole(null);
    setEmployeeVerified(false);
    setStaffLoginOpen(false);
  }, []);
  const value = useMemo(() => ({
    role,
    shipperIdentity,
    chooseShipperIdentity,
    activeScreen,
    chooseAudience,
    chooseCustomerPath,
    chooseEmployeeRole,
    continueFromConnection,
    goBack,
    clearRole,
    staffLoginOpen,
    staffIdentity,
    loginStaff,
    cancelStaffLogin,
    staffSessionExpired,
  }), [role, shipperIdentity, chooseShipperIdentity, activeScreen, chooseAudience, chooseCustomerPath, chooseEmployeeRole, continueFromConnection, goBack, clearRole, staffLoginOpen, staffIdentity, loginStaff, cancelStaffLogin, staffSessionExpired]);

  return <RoleSessionContext.Provider value={value}>{children}</RoleSessionContext.Provider>;
}

export function useRoleSession() {
  const context = useContext(RoleSessionContext);
  if (!context) throw new Error('Role session requires RoleSessionProvider.');
  return context;
}
