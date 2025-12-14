import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type GenderFilter = 'male' | 'female' | null;

interface GenderFilterContextType {
  selectedGender: GenderFilter;
  setSelectedGender: (gender: GenderFilter) => void;
}

const GenderFilterContext = createContext<GenderFilterContextType | undefined>(undefined);

export function GenderFilterProvider({ children }: { children: ReactNode }) {
  const [selectedGender, setSelectedGender] = useState<GenderFilter>(null);

  return (
    <GenderFilterContext.Provider value={{ selectedGender, setSelectedGender }}>
      {children}
    </GenderFilterContext.Provider>
  );
}

export function useGenderFilter() {
  const context = useContext(GenderFilterContext);
  if (context === undefined) {
    throw new Error('useGenderFilter must be used within a GenderFilterProvider');
  }
  return context;
}


