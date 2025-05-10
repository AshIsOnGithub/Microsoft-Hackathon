'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { supabaseUrl, supabaseAnonKey } from '../../config';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Create Supabase client using the imported config variables
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    console.log('Attempting login with URL:', supabaseUrl);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Welcome Back</h2>
      
      <form onSubmit={handleSignIn}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.formInput}
            placeholder="your@email.com"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.formInput}
            placeholder="••••••••"
          />
        </div>
        
        <div className={styles.forgotPassword}>
          <Link href="/auth/forgot-password" className={styles.formLink}>Forgot password?</Link>
        </div>
        
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className={styles.separator}>or</div>
      
      <div className={styles.formFooter}>
        Don't have an account?{' '}
        <Link href="/auth/signup" className={styles.formLink}>Sign Up</Link>
      </div>
    </div>
  );
} 