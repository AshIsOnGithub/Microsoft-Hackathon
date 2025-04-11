'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  return (
    <div className={styles.landing}>
      <ThemeToggle />

      <div className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
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
      </div>

      <div className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Intelligent Healthcare Guidance</h2>
          
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3>AI Symptom Checker</h3>
              <p>Describe your symptoms naturally and receive immediate guidance on possible causes and next steps.</p>
            </div>
            
            <div className={styles.featureCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <path d="M9 2h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"></path>
                <path d="m9 14 2 2 4-4"></path>
              </svg>
              <h3>Smart Triage</h3>
              <p>Get automatic recommendations for self-care or when to seek professional help from your GP, NHS 111, or A&E.</p>
            </div>
            
            <div className={styles.featureCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="m9 12 2 2 4-4"></path>
                <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z"></path>
                <path d="M9 3h6v4H9z"></path>
              </svg>
              <h3>Medication Suggestions</h3>
              <p>Receive appropriate over-the-counter medication recommendations with dosage information and find nearby open pharmacies.</p>
            </div>
            
            <div className={styles.featureCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>Health Profiles</h3>
              <p>Maintain profiles for yourself and family members to track symptoms and share history with healthcare providers.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.useCaseSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Who Benefits from SympCheck?</h2>
          
          <div className={styles.useCases}>
            <div className={styles.useCaseCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>Residents with Non-urgent Issues</h3>
              <p>Get clarity on your symptoms and appropriate care options without unnecessary NHS visits.</p>
            </div>
            
            <div className={styles.useCaseCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M7 10h3m7 0h-3m-4-3v6m4-6v6"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              <h3>Elderly Users & Carers</h3>
              <p>Simplified interface for older adults with options for carer support and profile management.</p>
            </div>
            
            <div className={styles.useCaseCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path>
                <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"></path>
              </svg>
              <h3>Parents</h3>
              <p>Peace of mind for concerned parents needing night-time symptom clarity for their children.</p>
            </div>
            
            <div className={styles.useCaseCard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8"></path>
                <path d="M12 8v8"></path>
              </svg>
              <h3>Unregistered Individuals</h3>
              <p>Healthcare guidance even if you don't have a registered GP or are new to an area.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.accessSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Accessible Healthcare</h2>
          <div className={styles.accessFeatures}>
            <div className={styles.accessFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="m5 8 6 6"></path>
                <path d="m4 14 6-6 2-3"></path>
                <path d="M2 5h12"></path>
                <path d="M7 2h1"></path>
                <path d="m22 22-5-10-5 10"></path>
                <path d="M14 18h6"></path>
              </svg>
              <h3>Multi-language Support</h3>
              <p>Access symptom guidance in multiple languages through our translation services.</p>
            </div>
            <div className={styles.accessFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
              <h3>Voice-enabled Input</h3>
              <p>Easily describe symptoms using voice commands for those who prefer not to type.</p>
            </div>
            <div className={styles.accessFeature}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <h3>Privacy Focused</h3>
              <p>End-to-end encrypted data with GDPR compliance and NHS-aligned security protocols.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ctaSection}>
        <div className={styles.container}>
          <h2>Ready to take control of your health journey?</h2>
          <p>Create your account today to access personalised health guidance.</p>
          <Link href="/auth/signup" className={`button ${styles.ctaButtonLarge}`}>
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
} 