'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Sign In</h2>
      
      <form onSubmit={handleSignIn}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>Email</label>
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
      
      <div className={styles.formFooter}>
        Don't have an account?{' '}
        <Link href="/auth/signup" className={styles.formLink}>Sign Up</Link>
      </div>
    </div>
  );
} 