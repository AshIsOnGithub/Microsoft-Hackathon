import React from 'react';
import Link from 'next/link';
import styles from './auth.module.css';
import ThemeToggle from '../components/ThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authContainer}>
      <ThemeToggle />
      <div className={styles.authCard}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <h1 className={styles.logo}>SympCheck</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
} 