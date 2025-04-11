'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './profile.module.css';

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

interface Profile {
  fullName: string;
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  pastMedicalHistory: MedicalHistory[];
  allergies: Allergy[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    dateOfBirth: '',
    address: '',
    contactNumber: '',
    pastMedicalHistory: [],
    allergies: []
  });

  const [newHistory, setNewHistory] = useState<Omit<MedicalHistory, 'id' | 'createdAt'>>({
    condition: '',
    diagnosisDate: '',
    notes: ''
  });

  const [newAllergy, setNewAllergy] = useState<Omit<Allergy, 'id' | 'createdAt'>>({
    allergen: '',
    severity: 'Mild',
    reaction: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addingHistory, setAddingHistory] = useState(false);
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'allergies'>('profile');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setLoading(false);
          return;
        }
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // Fetch medical history
        const { data: historyData, error: historyError } = await supabase
          .from('medical_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (historyError) {
          throw historyError;
        }
        
        // Fetch allergies
        const { data: allergiesData, error: allergiesError } = await supabase
          .from('allergies')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (allergiesError) {
          throw allergiesError;
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
          fullName: profileData?.full_name || '',
          dateOfBirth: profileData?.date_of_birth || '',
          address: profileData?.address || '',
          contactNumber: profileData?.contact_number || '',
          pastMedicalHistory: formattedMedicalHistory,
          allergies: formattedAllergies
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const profileData = {
        user_id: session.user.id,
        full_name: profile.fullName,
        date_of_birth: profile.dateOfBirth,
        address: profile.address,
        contact_number: profile.contactNumber,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;
      
      setMessage({ text: 'Profile saved successfully', type: 'success' });
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ text: 'Failed to save profile', type: 'error' });
    } finally {
      setSaving(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const addMedicalHistory = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const medicalHistoryData = {
        user_id: session.user.id,
        condition: newHistory.condition,
        diagnosis_date: newHistory.diagnosisDate,
        notes: newHistory.notes,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('medical_history')
        .insert(medicalHistoryData)
        .select();

      if (error) throw error;
      
      // Update local state with the new history item
      const newHistoryItem = {
        id: data[0].id,
        condition: data[0].condition,
        diagnosisDate: data[0].diagnosis_date,
        notes: data[0].notes,
        createdAt: data[0].created_at
      };
      
      setProfile({
        ...profile,
        pastMedicalHistory: [
          newHistoryItem,
          ...profile.pastMedicalHistory
        ]
      });
      
      // Reset form
      setNewHistory({
        condition: '',
        diagnosisDate: '',
        notes: ''
      });
      
      setMessage({ text: 'Medical history added successfully', type: 'success' });
      setAddingHistory(false);
    } catch (error) {
      console.error('Error adding medical history:', error);
      setMessage({ text: 'Failed to add medical history', type: 'error' });
    } finally {
      setSaving(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const addAllergy = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const allergyData = {
        user_id: session.user.id,
        allergen: newAllergy.allergen,
        severity: newAllergy.severity,
        reaction: newAllergy.reaction,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('allergies')
        .insert(allergyData)
        .select();

      if (error) throw error;
      
      // Update local state with the new allergy item
      const newAllergyItem = {
        id: data[0].id,
        allergen: data[0].allergen,
        severity: data[0].severity as 'Mild' | 'Moderate' | 'Severe',
        reaction: data[0].reaction,
        createdAt: data[0].created_at
      };
      
      setProfile({
        ...profile,
        allergies: [
          newAllergyItem,
          ...profile.allergies
        ]
      });
      
      // Reset form
      setNewAllergy({
        allergen: '',
        severity: 'Mild',
        reaction: ''
      });
      
      setMessage({ text: 'Allergy added successfully', type: 'success' });
      setAddingAllergy(false);
    } catch (error) {
      console.error('Error adding allergy:', error);
      setMessage({ text: 'Failed to add allergy', type: 'error' });
    } finally {
      setSaving(false);
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteMedicalHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setProfile({
        ...profile,
        pastMedicalHistory: profile.pastMedicalHistory.filter(h => h.id !== id)
      });
      
      setMessage({ text: 'Medical history deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting medical history:', error);
      setMessage({ text: 'Failed to delete medical history', type: 'error' });
    } finally {
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteAllergy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('allergies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setProfile({
        ...profile,
        allergies: profile.allergies.filter(a => a.id !== id)
      });
      
      setMessage({ text: 'Allergy deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting allergy:', error);
      setMessage({ text: 'Failed to delete allergy', type: 'error' });
    } finally {
      // Clear message after a delay
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.pageTitle}>Your Medical Profile</h1>
      
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'profile' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Personal Information
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'medical' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          Medical History
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'allergies' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('allergies')}
        >
          Allergies
        </button>
      </div>
      
      {activeTab === 'profile' && (
        <div className={styles.profileSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className={styles.editButton}
              >
                Edit
              </button>
            ) : (
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setEditMode(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          
          <div className={styles.card}>
            {editMode ? (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={profile.contactNumber}
                    onChange={(e) => setProfile({...profile, contactNumber: e.target.value})}
                    placeholder="Your contact number"
                  />
                </div>
                
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                    placeholder="Your current address"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.profileDetails}>
                <div className={styles.profileAvatar}>
                  <div className={styles.avatarCircle}>
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                
                <div className={styles.profileInfo}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Full Name</span>
                    <span className={styles.detailValue}>{profile.fullName || 'Not set'}</span>
                  </div>
                  
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date of Birth</span>
                      <span className={styles.detailValue}>{formatDate(profile.dateOfBirth) || 'Not set'}</span>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Contact Number</span>
                      <span className={styles.detailValue}>{profile.contactNumber || 'Not set'}</span>
                    </div>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Address</span>
                    <span className={styles.detailValue}>{profile.address || 'Not set'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'medical' && (
        <div className={styles.profileSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Past Medical History</h2>
            <button
              onClick={() => setAddingHistory(true)}
              className={styles.addButton}
              disabled={addingHistory}
            >
              Add New
            </button>
          </div>
          
          {addingHistory && (
            <div className={styles.card}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="condition">Medical Condition</label>
                  <input
                    id="condition"
                    type="text"
                    value={newHistory.condition}
                    onChange={(e) => setNewHistory({...newHistory, condition: e.target.value})}
                    placeholder="Enter medical condition"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="diagnosisDate">Date of Diagnosis</label>
                  <input
                    id="diagnosisDate"
                    type="date"
                    value={newHistory.diagnosisDate}
                    onChange={(e) => setNewHistory({...newHistory, diagnosisDate: e.target.value})}
                  />
                </div>
                
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    value={newHistory.notes}
                    onChange={(e) => setNewHistory({...newHistory, notes: e.target.value})}
                    placeholder="Additional details about the condition"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setAddingHistory(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={addMedicalHistory}
                  className={styles.saveButton}
                  disabled={saving || !newHistory.condition}
                >
                  {saving ? 'Adding...' : 'Add History'}
                </button>
              </div>
            </div>
          )}
          
          {profile.pastMedicalHistory.length === 0 ? (
            <div className={styles.card}>
              <p className={styles.emptyState}>No medical history added yet. Click "Add New" to record your medical history.</p>
            </div>
          ) :
            <div className={styles.medicalHistoryList}>
              {profile.pastMedicalHistory.map((item) => (
                <div key={item.id} className={styles.historyCard}>
                  <div className={styles.historyHeader}>
                    <h3 className={styles.historyCondition}>{item.condition}</h3>
                    <button
                      onClick={() => deleteMedicalHistory(item.id)}
                      className={styles.deleteButton}
                      aria-label="Delete history item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className={styles.historyDetails}>
                    <div className={styles.historyDetail}>
                      <span className={styles.detailLabel}>Diagnosed:</span>
                      <span className={styles.detailValue}>{formatDate(item.diagnosisDate)}</span>
                    </div>
                    
                    {item.notes && (
                      <div className={styles.historyNotes}>
                        <span className={styles.detailLabel}>Notes:</span>
                        <p>{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}
      
      {activeTab === 'allergies' && (
        <div className={styles.profileSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Allergies</h2>
            <button
              onClick={() => setAddingAllergy(true)}
              className={styles.addButton}
              disabled={addingAllergy}
            >
              Add New
            </button>
          </div>
          
          {addingAllergy && (
            <div className={styles.card}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="allergen">Allergen</label>
                  <input
                    id="allergen"
                    type="text"
                    value={newAllergy.allergen}
                    onChange={(e) => setNewAllergy({...newAllergy, allergen: e.target.value})}
                    placeholder="Enter allergen (e.g., peanuts, penicillin)"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="severity">Severity</label>
                  <select
                    id="severity"
                    value={newAllergy.severity}
                    onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value as 'Mild' | 'Moderate' | 'Severe'})}
                    className={styles.selectInput}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="reaction">Reaction</label>
                  <textarea
                    id="reaction"
                    value={newAllergy.reaction}
                    onChange={(e) => setNewAllergy({...newAllergy, reaction: e.target.value})}
                    placeholder="Describe your allergic reaction"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setAddingAllergy(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={addAllergy}
                  className={styles.saveButton}
                  disabled={saving || !newAllergy.allergen}
                >
                  {saving ? 'Adding...' : 'Add Allergy'}
                </button>
              </div>
            </div>
          )}
          
          {profile.allergies.length === 0 ? (
            <div className={styles.card}>
              <p className={styles.emptyState}>No allergies added yet. Click "Add New" to record your allergies.</p>
            </div>
          ) :
            <div className={styles.medicalHistoryList}>
              {profile.allergies.map((item) => (
                <div key={item.id} className={styles.allergyCard}>
                  <div className={styles.historyHeader}>
                    <div className={styles.allergyTitleContainer}>
                      <h3 className={styles.historyCondition}>{item.allergen}</h3>
                      <span className={`${styles.severityBadge} ${styles[`severity${item.severity}`]}`}>
                        {item.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAllergy(item.id)}
                      className={styles.deleteButton}
                      aria-label="Delete allergy item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  
                  {item.reaction && (
                    <div className={styles.historyNotes}>
                      <span className={styles.detailLabel}>Reaction:</span>
                      <p>{item.reaction}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
} 