'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase.auth]);

  return (
    <div className={styles.dashboardContent}>
      <section className={styles.welcomeSection}>
        <h2 className={styles.welcomeTitle}>Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h2>
        <p>How are you feeling today?</p>
      </section>

      <div className={styles.symptomsCard}>
        <h3 className={styles.cardTitle}>Check Your Symptoms</h3>
        <p>Describe your symptoms in simple language and our AI will help you find potential causes and next steps.</p>
        
        <div style={{ marginTop: '20px' }}>
          <Link href="/dashboard/symptom-checker" className={`button ${styles.checkButton}`}>
            Start Symptom Check
          </Link>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.symptomsCard}>
          <h3 className={styles.cardTitle}>Your Recent History</h3>
          <p>You haven't recorded any symptoms yet.</p>
          
          <div style={{ marginTop: '20px' }}>
            <Link href="/dashboard/history" className={`button-secondary ${styles.secondaryButton}`}>
              View History
            </Link>
          </div>
        </div>

        <div className={styles.symptomsCard}>
          <h3 className={styles.cardTitle}>Nearby Healthcare</h3>
          <p>Find pharmacies, GPs, and other healthcare services near you.</p>
          
          <div style={{ marginTop: '20px' }}>
            <Link href="/dashboard/nearby" className={`button-secondary ${styles.secondaryButton}`}>
              Find Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 