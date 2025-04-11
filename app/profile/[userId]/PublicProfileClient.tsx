'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './public-profile.module.css';

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosisDate: string;
  notes: string;
  createdAt: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction: string;
  createdAt: string;
}

interface ProfileInfo {
  fullName: string;
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  pastMedicalHistory: MedicalHistory[];
  allergies: Allergy[];
}

interface PublicProfileProps {
  userId: string;
}

export default function PublicProfileClient({ userId }: PublicProfileProps) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        
        if (!userId) {
          setError('User ID is required');
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile data:', profileError);
          setError('Failed to load profile data');
          return;
        }

        if (!profileData) {
          setError('Profile not found');
          return;
        }
        
        // Fetch medical history
        const { data: historyData, error: historyError } = await supabase
          .from('medical_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (historyError) {
          console.error('Error fetching medical history:', historyError);
        }
        
        // Fetch allergies
        const { data: allergiesData, error: allergiesError } = await supabase
          .from('allergies')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (allergiesError) {
          console.error('Error fetching allergies:', allergiesError);
        }

        // Transform medical history data
        const formattedMedicalHistory = historyData ? historyData.map(item => ({
          id: item.id,
          condition: item.condition,
          diagnosisDate: item.diagnosis_date,
          notes: item.notes,
          createdAt: item.created_at
        })) : [];
        
        // Transform allergies data
        const formattedAllergies = allergiesData ? allergiesData.map(item => ({
          id: item.id,
          allergen: item.allergen,
          severity: item.severity as 'Mild' | 'Moderate' | 'Severe',
          reaction: item.reaction,
          createdAt: item.created_at
        })) : [];

        setProfile({
          fullName: profileData.full_name || '',
          dateOfBirth: profileData.date_of_birth || '',
          address: profileData.address || '',
          contactNumber: profileData.contact_number || '',
          pastMedicalHistory: formattedMedicalHistory,
          allergies: formattedAllergies
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId, supabase]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return age;
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading medical profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2>Profile Not Found</h2>
        <p>{error || 'The requested medical profile could not be found.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.publicProfileContainer}>
      <div className={styles.headerBanner}>
        <div className={styles.logoContainer}>
          <span className={styles.logoText}>SympCheck</span>
        </div>
        <h1 className={styles.pageTitle}>Medical Profile</h1>
        <p className={styles.headerSubtitle}>Medical information shared for healthcare professionals</p>
      </div>
      
      <div className={styles.contentContainer}>
        <div className={styles.card}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarCircle}>
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className={styles.profileBasicInfo}>
              <h2>{profile.fullName}</h2>
              <div className={styles.demographicsInfo}>
                {profile.dateOfBirth && (
                  <div className={styles.demographicItem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{formatDate(profile.dateOfBirth)} ({calculateAge(profile.dateOfBirth)} years)</span>
                  </div>
                )}
                {profile.contactNumber && (
                  <div className={styles.demographicItem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>{profile.contactNumber}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.emergencyTag}>Medical Information</div>
          </div>
          
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Full Name</div>
                <div className={styles.infoValue}>{profile.fullName || 'Not provided'}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Date of Birth</div>
                <div className={styles.infoValue}>{formatDate(profile.dateOfBirth)}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Contact Number</div>
                <div className={styles.infoValue}>{profile.contactNumber || 'Not provided'}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Address</div>
                <div className={styles.infoValue}>{profile.address || 'Not provided'}</div>
              </div>
            </div>
          </div>
          
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Allergies
            </h3>
            {profile.allergies.length > 0 ? (
              <div className={styles.allergiesList}>
                {profile.allergies.map((allergy) => (
                  <div key={allergy.id} className={styles.allergyCard}>
                    <div className={styles.allergyTitleContainer}>
                      <h4 className={styles.allergyName}>{allergy.allergen}</h4>
                      <span className={`${styles.severityBadge} ${
                        allergy.severity === 'Severe' ? styles.severitySevere :
                        allergy.severity === 'Moderate' ? styles.severityModerate :
                        styles.severityMild
                      }`}>
                        {allergy.severity}
                      </span>
                    </div>
                    <p className={styles.allergyReaction}>{allergy.reaction || 'No reaction details provided'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                <p>No allergies recorded</p>
              </div>
            )}
          </div>
          
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Past Medical History
            </h3>
            {profile.pastMedicalHistory.length > 0 ? (
              <div className={styles.medicalHistoryList}>
                {profile.pastMedicalHistory.map((history) => (
                  <div key={history.id} className={styles.historyCard}>
                    <div className={styles.historyHeader}>
                      <h4 className={styles.historyCondition}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                        {history.condition}
                      </h4>
                      {history.diagnosisDate && (
                        <span className={styles.historyDate}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {formatDate(history.diagnosisDate)}
                        </span>
                      )}
                    </div>
                    {history.notes && (
                      <div className={styles.historyNotes}>
                        <p>{history.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                <p>No medical history recorded</p>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.disclaimerFooter}>
          <p>This information is presented as provided by the user. For medical emergencies, please call your local emergency number.</p>
          <p className={styles.poweredBy}>Powered by <a href="https://microsoft-hackathon-blond.vercel.app" target="_blank" rel="noopener noreferrer">SympCheck</a></p>
        </div>
      </div>
    </div>
  );
} 