import { createContext, Dispatch, useReducer } from 'react';

type AckNack = 'ack' | 'nack';

const AckNonackContext = createContext<AckNack>('nack');

const AckNonackDispatchContext = createContext<Dispatch<AckNackAction>>(() => {});

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

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, dispatch] = useReducer(
    ackNackReducer,
    initialState
  );

  return (
    <AckNonackContext.Provider value={tasks}>
      <AckNonackDispatchContext.Provider value={dispatch}>
        {children}
      </AckNonackDispatchContext.Provider>
    </AckNonackContext.Provider>
  );
}


