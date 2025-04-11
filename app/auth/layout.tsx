import React from 'react';
import Link from 'next/link';
import styles from './auth.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authContainer}>
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