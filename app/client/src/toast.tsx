import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'ok' | 'bad';
const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: ToastTone }[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, tone: ToastTone = 'ok') => {
    const id = ++seq.current;
    setItems((x) => [...x, { id, msg, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), tone === 'bad' ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => <div key={i.id} className={`toast ${i.tone}`} style={{ whiteSpace: 'pre-wrap' }}>{i.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
