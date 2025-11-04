import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  // Create state object that matches what Dashboard expects
  const state = {
    user: currentUser ? { 
      firstName: currentUser.username || 'User',
      username: currentUser.username 
    } : null,
    isAuthenticated: !!currentUser,
    loading: false
  };

  const register = async (username, password) => {
    // No backend connection - always succeed
    return { success: true, message: "Registration successful!" };
  };

  const login = async (username, password) => {
    // No backend connection - always succeed
    setCurrentUser({ username }); // store user in context
    return { success: true, message: "Login successful!" };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ register, login, logout, currentUser, state }}>
      {children}
    </AuthContext.Provider>
  );
}
