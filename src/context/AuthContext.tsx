import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';

interface AuthContextType {
  user: any;
  setUser: (u: any) => void;
  role: string | null;
  setRole: (r: string | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('role');
        const tokenKey =
          storedRole === 'student'
            ? 'token'
            : storedRole === 'tutor'
            ? 'tutorToken'
            : 'adminToken';
        const token = await AsyncStorage.getItem(tokenKey);

        // In the init() function inside AuthContext
  if (token && storedRole === 'student') {
    try {
      const res = await axiosInstance.get('/students/me');
      setUser(res.data);
      setRole('student');
    } catch (err: any) {
      // Only log out on 401 Unauthorized — not on network errors
      if (err?.response?.status === 401) {
        await AsyncStorage.multiRemove([
          'token', 'tutorToken', 'adminToken', 'role',
          'userName', 'tutorName', 'userData',
        ]);
      } else {
        // Network error — still set the role so the app opens
        setRole('student');
      }
    }
  } else if (storedRole) {
    setRole(storedRole);
  }

      } catch {
        await AsyncStorage.multiRemove([
          'token', 'tutorToken', 'adminToken', 'role',
          'userName', 'tutorName', 'userData',
        ]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove([
      'token', 'tutorToken', 'adminToken', 'role',
      'userName', 'tutorName', 'userData',
    ]);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{user, setUser, role, setRole, loading, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
