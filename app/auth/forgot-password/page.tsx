'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      setMessage('Password reset link sent to your email');
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={styles.formTitle}>Reset Your Password</h2>
      
      <p className={styles.resetInstructions}>
        Enter your email address below and we'll send you a link to reset your password.
      </p>
      
      <form onSubmit={handlePasswordReset}>
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