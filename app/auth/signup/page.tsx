'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { supabaseUrl, supabaseAnonKey } from '../../config';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  
  // Create Supabase client using the imported config variables
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    // Password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage('Check your email for the confirmation link');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Create Your Account</h2>
      
      <form onSubmit={handleSignUp}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {message && <div className={styles.successMessage}>{message}</div>}
        
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
          <p className={styles.passwordHint}>At least 6 characters</p>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.formInput}
            placeholder="••••••••"
          />
        </div>
        
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      
      <div className={styles.separator}>or</div>
      
      <div className={styles.formFooter}>
        Already have an account?{' '}
        <Link href="/auth/signin" className={styles.formLink}>Sign In</Link>
      </div>
    </div>
  );
} 