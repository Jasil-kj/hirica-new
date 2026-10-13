import { type FC, createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth as firebaseAuth } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'recruiter' | 'jobseeker' | null;
  setUserRole: (role: 'recruiter' | 'jobseeker' | null) => void;
  loading: boolean;
  firebaseAvailable: boolean;
  signup: (email: string, pass: string) => Promise<any>;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  setUserRole: () => {},
  loading: false,
  firebaseAvailable: false,
  signup: async () => {},
  login: async () => {},
  logout: async () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRoleState] = useState<'recruiter' | 'jobseeker' | null>(() => {
    return (localStorage.getItem('hirica_user_role') as 'recruiter' | 'jobseeker') || null;
  });
  const [loading, setLoading] = useState(true);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  const setUserRole = (role: 'recruiter' | 'jobseeker' | null) => {
    setUserRoleState(role);
    if (role) {
      localStorage.setItem('hirica_user_role', role);
    } else {
      localStorage.removeItem('hirica_user_role');
    }
  };

  async function signup(email: string, pass: string) {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available');
    return createUserWithEmailAndPassword(firebaseAuth, email, pass);
  }

  async function login(email: string, pass: string) {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available');
    return signInWithEmailAndPassword(firebaseAuth, email, pass);
  }

  async function logout() {
    if (!firebaseAuth) throw new Error('Firebase Auth is not available');
    setUserRole(null);
    return signOut(firebaseAuth);
  }

  useEffect(() => {
    try {
      console.log('AuthProvider: Initializing...', 'Firebase auth available:', !!firebaseAuth);
      
      if (!firebaseAuth) {
        console.warn('AuthProvider: Firebase auth is not available');
        setLoading(false);
        setFirebaseAvailable(false);
        return () => {};
      }
      
      setFirebaseAvailable(true);
      const db = getFirestore();

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        console.log('AuthProvider: Auth state changed, user:', user ? user.uid : 'logged out');
        setCurrentUser(user);
        
        if (user) {
          // Check role with retries to prevent race conditions with setDoc during registration
          let resolvedRole: 'recruiter' | 'jobseeker' | null = (localStorage.getItem('hirica_user_role') as any) || null;

          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const recruiterDoc = await getDoc(doc(db, 'recruiters', user.uid));
              if (recruiterDoc.exists()) {
                console.log('AuthProvider: User is a recruiter (from Firestore)');
                resolvedRole = 'recruiter';
                break;
              }

              const jobSeekerDoc = await getDoc(doc(db, 'jobseekers', user.uid));
              if (jobSeekerDoc.exists()) {
                console.log('AuthProvider: User is a job seeker (from Firestore)');
                resolvedRole = 'jobseeker';
                break;
              }

              // If documents not found yet and this is attempt 0 or 1, wait briefly for setDoc to complete
              if (attempt < 2 && !resolvedRole) {
                await new Promise(r => setTimeout(r, 400));
              }
            } catch (fetchErr) {
              console.warn(`AuthProvider: Role fetch attempt ${attempt + 1} error:`, fetchErr);
            }
          }

          if (resolvedRole) {
            setUserRole(resolvedRole);
          } else {
            console.warn('AuthProvider: No role found for user');
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: Cleaning up...');
        unsubscribe();
      };
    } catch (error) {
      console.error('AuthProvider: Error initializing Firebase:', error);
      setLoading(false);
      setFirebaseAvailable(false);
    }
  }, []);

  const value = {
    currentUser,
    userRole,
    setUserRole,
    loading,
    firebaseAvailable,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
 