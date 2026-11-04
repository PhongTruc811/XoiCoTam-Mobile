// UI prototype only. Backend authorization must validate employee access separately.
export const EMPLOYEE_DEMO_PIN = '246810';

export function isEmployeePinValid(pin: string) {
  return /^\d{6}$/.test(pin) && pin === EMPLOYEE_DEMO_PIN;
}
