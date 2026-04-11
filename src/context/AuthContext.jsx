import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (event === 'USER_UPDATED')      setIsRecovery(false);
      if (event === 'SIGNED_OUT')        setIsRecovery(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp   = (email, password) => supabase.auth.signUp({ email, password });
  const signIn   = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut  = () => supabase.auth.signOut();

  // Send a 6-digit OTP to the email (magic link disabled, OTP enabled)
  const sendOtp  = (email) =>
    supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });

  // Verify the OTP code the user typed
  const verifyOtp = (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' });

  // Send password-reset email
  const forgotPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

  // Called from the ResetPasswordPage after user clicks their reset link
  const updatePassword = (password) => supabase.auth.updateUser({ password });

  return (
    <AuthContext.Provider value={{
      user, loading, isRecovery,
      signUp, signIn, signOut,
      sendOtp, verifyOtp,
      forgotPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
