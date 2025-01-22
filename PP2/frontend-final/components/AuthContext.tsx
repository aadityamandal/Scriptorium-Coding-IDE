import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  loggedIn: boolean;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  setLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  firstName: '',
  lastName: '',
  isAdmin: false,
  setLoggedIn: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  let logoutTimer: NodeJS.Timeout | null = null;

  // Helper function to decode JWT and calculate expiration time
  const getTokenExpirationTime = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      return payload.exp - currentTime; // Time until expiration in seconds
    } catch (error) {
      console.error('Failed to decode token:', error);
      return 0; // Token is invalid or malformed
    }
  };

  const setLogoutTimer = (expiryTime: number) => {
    if (logoutTimer) clearTimeout(logoutTimer); // Clear any existing timer

    logoutTimer = setTimeout(() => {
      console.log('Access token expired, logging out...');
      handleLogout();
    }, expiryTime);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      setLoggedIn(true);
      setFirstName(payload.firstName);
      setLastName(payload.lastName);
      setIsAdmin(payload.isAdmin || false);

      // Calculate time until token expires
      const timeUntilExpiry = getTokenExpirationTime(token) * 1000; // Convert seconds to milliseconds
      if (timeUntilExpiry > 0) {
        setLogoutTimer(timeUntilExpiry);
      } else {
        handleLogout(); // Logout immediately if token is already expired
      }
    }

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer); // Cleanup on unmount
    };
  }, []);

  const handleLogout = () => {
    setLoggedIn(false);
    setFirstName('');
    setLastName('');
    setIsAdmin(false);
    localStorage.removeItem('token'); // Remove token from localStorage
    if (logoutTimer) clearTimeout(logoutTimer); // Clear the timer
    window.location.href = '/login'; // Redirect to login page
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        firstName,
        lastName,
        isAdmin,
        setLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
