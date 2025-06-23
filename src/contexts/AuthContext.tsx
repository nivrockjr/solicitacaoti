import React, { createContext } from 'react';

// TODO: Implementar novo AuthContext após integração com novo backend
const AuthContext = createContext(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
