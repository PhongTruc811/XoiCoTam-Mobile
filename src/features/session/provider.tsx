import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { useBackendConnection } from '@/features/be-connection/provider';
import { shipperNames, type ShipperName } from '@/features/order/model';

import type { Role } from './model';
import { getEntryScreen, type Audience, type CustomerPath, type EntryScreen } from './navigation';
import { isEmployeePinValid } from './employee-pin';

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
  pinPromptOpen: boolean;
  verifyEmployeePin: (pin: string) => boolean;
  cancelEmployeePin: () => void;
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
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const activeScreen = getEntryScreen(brandThemeEnabled, audience, customerPath, role, connectionVisible, shipperIdentity, employeeVerified);

  const chooseAudience = useCallback((next: Exclude<Audience, null>) => {
    if (!brandThemeEnabled) return;
    if (next === 'employee') {
      setPinPromptOpen(true);
      return;
    }
    setEmployeeVerified(false);
    setPinPromptOpen(false);
    setAudience(next);
    setCustomerPath(null);
    setRole(null);
    setShipperIdentity(null);
  }, [brandThemeEnabled]);
  const verifyEmployeePin = useCallback((pin: string) => {
    if (!brandThemeEnabled || !pinPromptOpen || !isEmployeePinValid(pin)) return false;
    setEmployeeVerified(true);
    setPinPromptOpen(false);
    setAudience('employee');
    setCustomerPath(null);
    setRole(null);
    setShipperIdentity(null);
    return true;
  }, [brandThemeEnabled, pinPromptOpen]);
  const cancelEmployeePin = useCallback(() => setPinPromptOpen(false), []);
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
    setPinPromptOpen(false);
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
    pinPromptOpen,
    verifyEmployeePin,
    cancelEmployeePin,
  }), [role, shipperIdentity, chooseShipperIdentity, activeScreen, chooseAudience, chooseCustomerPath, chooseEmployeeRole, continueFromConnection, goBack, clearRole, pinPromptOpen, verifyEmployeePin, cancelEmployeePin]);

  return <RoleSessionContext.Provider value={value}>{children}</RoleSessionContext.Provider>;
}

export function useRoleSession() {
  const context = useContext(RoleSessionContext);
  if (!context) throw new Error('Role session requires RoleSessionProvider.');
  return context;
}
