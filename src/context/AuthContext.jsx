import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch additional profile data from our PG backend
                try {
                    const intendedRole = localStorage.getItem('intended_role');
                    const roleQuery = intendedRole ? `?role=${intendedRole}` : '';
                    const response = await fetch(`/api/auth/profile/${firebaseUser.email}${roleQuery}`);
                    const userData = await response.json();

                    if (response.ok) {
                        setUser({ ...firebaseUser, ...userData, name: userData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0] });
                    } else {
                        // Fallback: Use intended_role from localStorage or email check
                        console.warn("Profile not found or server error, using fallback role.");
                        const fallbackName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
                        const fallbackRole = intendedRole || (firebaseUser.email.toLowerCase().includes('faculty') ? 'faculty' : 'student');
                        setUser({ ...firebaseUser, role: fallbackRole, name: fallbackName });
                    }
                } catch (err) {
                    console.error("Failed to fetch profile:", err);
                    const intendedRole = localStorage.getItem('intended_role');
                    setUser({ ...firebaseUser, role: intendedRole || 'student' }); // Use intended role as safety fallback
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const signup = async (email, password) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const loginWithGoogle = async () => {
        const { signInWithPopup } = await import('firebase/auth');
        const { googleProvider } = await import('../firebase');
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
