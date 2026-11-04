import { createContext, useContext, useReducer, type Dispatch, type PropsWithChildren } from 'react';

import { createDemoState, demoReducer, type DemoAction, type DemoState } from './model';

const DemoContext = createContext<(DemoState & { dispatch: Dispatch<DemoAction> }) | null>(null);

export function OrderDemoProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createDemoState);
  return <DemoContext.Provider value={{ ...state, dispatch }}>{children}</DemoContext.Provider>;
}

export function useOrderDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('Order demo requires OrderDemoProvider.');
  return context;
}
