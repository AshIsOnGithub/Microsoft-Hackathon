import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.landing}>
      <div className={styles.heroSection}>
        <div className={styles.container}>
          <h1 className={styles.title}>SympCheck</h1>
          <p className={styles.tagline}>Feel something? Check it fast. Stress-free care starts here.</p>
          <div className={styles.buttonGroup}>
            <Link href="/auth/signin" className={`button ${styles.ctaButton}`}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={`button-secondary ${styles.ctaButton}`}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How SympCheck Helps You</h2>
          
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <h3>AI Symptom Checker</h3>
              <p>Describe your symptoms in natural language and get instant guidance.</p>
            </div>
            
            <div className={styles.featureCard}>
              <h3>Smart Triage</h3>
              <p>Automatic recommendations for self-care or when to seek professional help.</p>
            </div>
            
            <div className={styles.featureCard}>
              <h3>Medication Guidance</h3>
              <p>Get suggestions for over-the-counter medications with dosage info.</p>
            </div>
            
            <div className={styles.featureCard}>
              <h3>Health History</h3>
              <p>Keep track of your symptoms and share with healthcare providers when needed.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; {new Date().getFullYear()} SympCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 