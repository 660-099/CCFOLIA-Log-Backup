import { useRef, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

export const useUIState = () => {
  const store = useUIStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep the sync behavior for tempTitle when pageTitle updates externally
  useEffect(() => {
    store.setTempTitle(store.pageTitle);
  }, [store.pageTitle]);

  return {
    ...store,
    searchInputRef
  };
};
