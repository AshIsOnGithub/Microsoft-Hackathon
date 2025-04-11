'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage('Check your email for the password reset link');
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Reset Your Password</h2>
      
      <form onSubmit={handlePasswordReset}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {message && <div className={styles.successMessage}>{message}</div>}
        
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
        
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Sending reset link...' : 'Send Reset Link'}
        </button>
      </form>
      
      <div className={styles.formFooter}>
        <Link href="/auth/signin" className={styles.formLink}>Back to Sign In</Link>
      </div>
    </div>
  );
} 