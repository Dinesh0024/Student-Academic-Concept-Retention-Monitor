import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    getRedirectResult
} from 'firebase/auth';

const encodeBase64Url = (buffer) => {
    let binary = '';
    new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const passkeyResponse = (credential) => ({
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    response: {
        clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
        authenticatorData: encodeBase64Url(credential.response.authenticatorData),
        signature: encodeBase64Url(credential.response.signature),
        userHandle: credential.response.userHandle ? encodeBase64Url(credential.response.userHandle) : null,
        attestationObject: credential.response.attestationObject ? encodeBase64Url(credential.response.attestationObject) : undefined,
        transports: credential.response.getTransports?.()
    }
});

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearPersistedAuthState = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('intended_role');
        sessionStorage.removeItem('faculty_passkey_user');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    useEffect(() => {
        clearPersistedAuthState();

        const savedToken = sessionStorage.getItem('token');
        let restoredTokenUser = null;
        if (savedToken) {
            try {
                const base64 = savedToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
                const payload = JSON.parse(atob(padded));
                if (payload?.email) {
                    restoredTokenUser = {
                        id: payload.id || payload.email,
                        email: payload.email,
                        name: payload.name || payload.email.split('@')[0],
                        role: payload.role || sessionStorage.getItem('intended_role') || 'student'
                    };
                    setUser(restoredTokenUser);
                }
            } catch (err) {
                console.warn('Saved JWT could not be parsed:', err.message);
                sessionStorage.removeItem('token');
            }
        }

        // Set persistence to session (per tab) to allow multiple accounts
        import('firebase/auth').then(({ setPersistence, browserSessionPersistence }) => {
            setPersistence(auth, browserSessionPersistence);
        });

        // Handle redirect result from Google sign-in (fallback flow)
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                console.log('Redirect sign-in completed for:', result.user.email);
            }
        }).catch((err) => {
            console.error('Redirect result error:', err);
        });

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch additional profile data from our PG backend
                try {
                    const intendedRole = sessionStorage.getItem('intended_role');
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
                    const intendedRole = sessionStorage.getItem('intended_role');
                    setUser({ ...firebaseUser, role: intendedRole || 'student' }); // Use intended role as safety fallback
                }
            } else {
                const biometricUser = sessionStorage.getItem('faculty_passkey_user');
                if (biometricUser) {
                    setUser(JSON.parse(biometricUser));
                } else if (!restoredTokenUser) {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password, role = sessionStorage.getItem('intended_role') || 'student') => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        if (data.twoFactorRequired) {
            return { requiresTwoFactor: true, challengeToken: data.challengeToken };
        }

        const userData = {
            ...data.user,
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            role: data.user.role || role
        };

        sessionStorage.setItem('intended_role', userData.role);
        sessionStorage.setItem('token', data.token);
        setUser(userData);
        return userData;
    };

    const verifyTwoFactorLogin = async (challengeToken, code) => {
        const response = await fetch('/api/auth/login/2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challengeToken, code })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Two-factor verification failed.');
        }

        const userData = {
            ...data.user,
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            role: data.user.role
        };
        sessionStorage.setItem('intended_role', userData.role);
        sessionStorage.setItem('token', data.token);
        setUser(userData);
        return userData;
    };

    const signup = async (email, password) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const loginWithGoogle = async () => {
        const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');
        const { googleProvider } = await import('../firebase');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (err) {
            // If popup is blocked or COOP prevents communication, fall back to redirect
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
                console.warn('Popup blocked, falling back to redirect sign-in...');
                await signInWithRedirect(auth, googleProvider);
                // The page will reload and getRedirectResult above will handle the result
            } else {
                throw err;
            }
        }
    };

    const loginWithBiometric = async (email) => {
        const optionsResponse = await fetch('/api/auth/passkey/login/options', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
        });
        const options = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(options.error || 'Biometric login is unavailable.');
        const { startAuthentication } = await import('@simplewebauthn/browser');
        const credential = await startAuthentication({ optionsJSON: options });
        const verifyResponse = await fetch('/api/auth/passkey/login/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, response: passkeyResponse(credential) })
        });
        const result = await verifyResponse.json();
        if (!verifyResponse.ok) throw new Error(result.error || 'Biometric login failed.');
        sessionStorage.setItem('intended_role', 'faculty');
        sessionStorage.setItem('faculty_passkey_user', JSON.stringify(result.user));
        sessionStorage.setItem('token', result.token);
        setUser(result.user);
        return result.user;
    };

    const enrollBiometric = async (email) => {
        const optionsResponse = await fetch('/api/auth/passkey/register/options', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
        });
        const options = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(options.error || 'Could not start biometric enrollment.');
        const { startRegistration } = await import('@simplewebauthn/browser');
        const credential = await startRegistration({ optionsJSON: options });
        const verifyResponse = await fetch('/api/auth/passkey/register/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, response: credential })
        });
        const result = await verifyResponse.json();
        if (!verifyResponse.ok) throw new Error(result.error || 'Biometric enrollment failed.');
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('intended_role');
        sessionStorage.removeItem('faculty_passkey_user');
        sessionStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyTwoFactorLogin, signup, loginWithGoogle, loginWithBiometric, enrollBiometric, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
