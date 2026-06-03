import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  rol: string;
  clinic_id: number | null;
  email?: string;
}

interface JWTPayload {
  sub: string;
  rol: string;
  clinic_id: number | null;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{ access_token: string; token_type: string }>(
        'https://api.vitalisnet.synapsedev.cl/api/v1/auth/login',
        { email, password }
      );

      const token = response.data.access_token;
      
      // Decodificar el token de forma segura
      const decoded = jwtDecode<JWTPayload>(token);
      
      const loggedUser: User = {
        id: decoded.sub,
        rol: decoded.rol,
        clinic_id: decoded.clinic_id,
        email: email, // Guardamos el email que usó para iniciar sesión
      };

      setAccessToken(token);
      setUser(loggedUser);
      setIsAuthenticated(true);
      
      // Configurar token en la instancia de axios por defecto para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      // Limpiar estado en caso de error
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
