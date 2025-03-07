import { createContext, Dispatch, useContext, useReducer } from 'react';

type AckNack = 'ack' | 'nack';

const AckNackContext = createContext<AckNack>('nack');

const AckNackDispatchContext = createContext<Dispatch<AckNackAction>>(() => {});

type AckNackAction =
  | { type: 'ack' }
  | { type: 'nack' };

const initialState: AckNack = 'nack';

function ackNackReducer(_current: AckNack, action: AckNackAction): AckNack {
  switch (action.type) {
    case 'ack': {
      return 'ack';
    }
    case 'nack': {
      return 'nack';
    }
  }
}

export function useAckNack() {
  const context = useContext(AckNackContext);
  return context;
}


export function AckNackProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(
    ackNackReducer,
    initialState
  );

  return (
    <AckNackContext.Provider value={tasks}>
      <AckNackDispatchContext.Provider value={dispatch}>
        {children}
      </AckNackDispatchContext.Provider>
    </AckNackContext.Provider>
  );
}


