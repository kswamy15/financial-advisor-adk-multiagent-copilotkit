import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: 'google' | 'microsoft' | 'email';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithMicrosoft: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                console.log('👤 User restored from storage');
            } catch (e) {
                console.error('Failed to restore user:', e);
            }
        }
    }, []);

    // Save user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_user');
        }
    }, [user]);

    const login = async (email: string, password: string) => {
        // Mock validation - check if user exists in localStorage
        const usersKey = 'auth_users';
        const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
        const existingUser = users.find((u: any) => u.email === email && u.password === password);

        if (existingUser) {
            const { password: _, ...userWithoutPassword } = existingUser;
            setUser(userWithoutPassword);
            console.log('✅ User logged in:', userWithoutPassword.email);
        } else {
            throw new Error('Invalid email or password');
        }
    };

    const loginWithGoogle = async () => {
        // Mock Google OAuth
        const mockUser: User = {
            id: `google_${Date.now()}`,
            name: 'Google User',
            email: 'user@gmail.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
            provider: 'google'
        };
        setUser(mockUser);
        console.log('✅ Logged in with Google:', mockUser.email);
    };

    const loginWithMicrosoft = async () => {
        // Mock Microsoft OAuth
        const mockUser: User = {
            id: `microsoft_${Date.now()}`,
            name: 'Microsoft User',
            email: 'user@outlook.com',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft',
            provider: 'microsoft'
        };
        setUser(mockUser);
        console.log('✅ Logged in with Microsoft:', mockUser.email);
    };

    const register = async (name: string, email: string, password: string) => {
        // Mock registration - save to localStorage
        const usersKey = 'auth_users';
        const users = JSON.parse(localStorage.getItem(usersKey) || '[]');

        // Check if email already exists
        if (users.find((u: any) => u.email === email)) {
            throw new Error('Email already registered');
        }

        const newUser = {
            id: `email_${Date.now()}`,
            name,
            email,
            password, // In real app, this would be hashed
            provider: 'email' as const
        };

        users.push(newUser);
        localStorage.setItem(usersKey, JSON.stringify(users));

        // Log in the new user
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        console.log('✅ User registered and logged in:', userWithoutPassword.email);
    };

    const logout = () => {
        setUser(null);
        console.log('👋 User logged out');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                loginWithGoogle,
                loginWithMicrosoft,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
