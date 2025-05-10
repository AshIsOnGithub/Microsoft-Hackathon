'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './history.module.css';

interface HistoryItem {
  id: string;
  created_at: string;
  symptoms: string;
  result: any;
  user_id: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Access environment variables with NEXT_PUBLIC prefix which are safe to expose to the browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchHistory(user.id);
      } else {
        setLoading(false);
        setError('Please log in to view your history');
      }
    };
    
    getUser();
  }, [supabase.auth]);
  
  const fetchHistory = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('symptom_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Check if result column needs to be parsed from JSON string
      const processedData = (data || []).map(item => {
        // Check if result is a string, then parse it
        if (item.result && typeof item.result === 'string') {
          try {
            item.result = JSON.parse(item.result);
          } catch (e) {
            console.error('Failed to parse result JSON:', e);
          }
        }
        return item;
      });
      
      console.log('Fetched history data:', processedData);
      setHistory(processedData || []);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-UK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  const toggleExpand = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };
  
  const getSeverityClass = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'urgent':
        return styles.urgent;
      case 'soon':
        return styles.soon;
      case 'routine':
      default:
        return styles.routine;
    }
  };
  
  return (
    <div className={styles.historyPage}>
      <div className={styles.historyHeader}>
        <h1 className={styles.historyTitle}>Your Symptom History</h1>
        <Link href="/dashboard" className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
          </svg>
          Back to Checker
        </Link>
      </div>
      
      <div className={styles.historyContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading your history...</p>
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <Link href="/login" className={styles.actionButton}>Log In</Link>
          </div>
        ) : history.length > 0 ? (
          <div className={styles.historyList}>
            {history.map((item) => (
              <div 
                key={item.id} 
                className={styles.historyCard}
              >
                <div className={styles.historyCardHeader}>
                  <div className={styles.dateSection}>
                    <span className={styles.itemDate}>{formatDate(item.created_at)}</span>
                  </div>
                  {item.result?.escalation?.level && (
                    <span className={`${styles.severityBadge} ${getSeverityClass(item.result.escalation.level)}`}>
                      {item.result.escalation.level}
                    </span>
                  )}
                </div>
                
                <h3 className={styles.itemSymptoms}>{item.symptoms}</h3>
                
                {item.result?.escalation && (
                  <div className={styles.careAdviceSection}>
                    <h4 className={styles.sectionTitle}>Care Advice</h4>
                    <div className={`${styles.escalationCard} ${getSeverityClass(item.result.escalation.level)}`}>
                      <h5 className={styles.escalationTitle}>{item.result.escalation.title || 'Care Recommendation'}</h5>
                      <p className={styles.escalationMessage}>{item.result.escalation.message}</p>
                    </div>
                  </div>
                )}
                
                {/* Only show first condition directly in the card if available */}
                {item.result?.conditions && item.result.conditions.length > 0 && (
                  <div className={styles.conditionsSection}>
                    <h4 className={styles.sectionTitle}>Possible Conditions</h4>
                    <ul className={styles.conditionsPreview}>
                      {item.result.conditions.slice(0, 2).map((condition: any, index: number) => (
                        <li key={index} className={styles.conditionPreviewItem}>
                          <span className={styles.conditionName}>{condition.name}</span>
                          {condition.url && (
                            <a 
                              href={condition.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={styles.nhsLink}
                              onClick={(e) => e.stopPropagation()}
                            >
                              NHS info →
                            </a>
                          )}
                        </li>
                      ))}
                      {item.result.conditions.length > 2 && (
                        <div className={styles.moreConditions}>
                          +{item.result.conditions.length - 2} more conditions
                        </div>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Add medications section if available */}
                {item.result?.medications && (
                  <div className={styles.medicationsSection}>
                    <h4 className={styles.sectionTitle}>Medications</h4>
                    <div className={styles.medicationsPreview}>
                      {typeof item.result.medications === 'string' ? (
                        <p>{item.result.medications}</p>
                      ) : Array.isArray(item.result.medications) && item.result.medications.length > 0 ? (
                        <ul className={styles.medicationsList}>
                          {item.result.medications.slice(0, 2).map((medication: any, index: number) => (
                            <li key={index} className={styles.medicationPreviewItem}>
                              <span className={styles.medicationName}>{medication.name}</span>
                              {medication.dosage && (
                                <span className={styles.medicationDetail}>{medication.dosage}</span>
                              )}
                            </li>
                          ))}
                          {item.result.medications.length > 2 && (
                            <div className={styles.moreMedications}>
                              +{item.result.medications.length - 2} more medications
                            </div>
                          )}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                )}
                
                {/* Show recommendations directly if available */}
                {item.result?.recommendation && (
                  <div className={styles.recommendationsSection}>
                    <h4 className={styles.sectionTitle}>Recommendations</h4>
                    <div className={styles.recommendationPreview}>
                      {typeof item.result.recommendation === 'string' ? (
                        <p>{item.result.recommendation}</p>
                      ) : (
                        <div className={styles.recommendationHighlights}>
                          {Object.entries(item.result.recommendation).slice(0, 2).map(([key, value]: [string, any], index) => (
                            <div key={index} className={styles.recommendationItem}>
                              <span className={styles.recommendationKey}>{key}:</span>
                              <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={styles.cardActions}>
                  <button 
                    className={styles.expandButton}
                    onClick={() => toggleExpand(item.id)}
                  >
                    {expandedItem === item.id ? (
                      <>
                        Show Less
                      </>
                    ) : (
                      <>
                        Show More Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '6px' }}>
                          <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z" fill="currentColor" />
                        </svg>
                      </>
                    )}
                  </button>
                  
                  <Link href="/dashboard" className={styles.newCheckButton}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                      <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
                    </svg>
                    New Symptom Check
                  </Link>
                </div>
                
                {expandedItem === item.id && (
                  <div className={styles.historyItemDetails}>
                    <div className={styles.detailedInfoSection}>
                      <h4>Detailed Information</h4>
                      
                      {/* Escalation Card */}
                      {item.result?.escalation && (
                        <div className={`${styles.detailCard} ${getSeverityClass(item.result.escalation.level)}`}>
                          <h5 className={styles.detailCardTitle}>Escalation Level</h5>
                          <div className={`${styles.detailCardBadge} ${getSeverityClass(item.result.escalation.level)}`}>
                            {item.result.escalation.level}
                          </div>
                          <p className={styles.detailCardText}>{item.result.escalation.message}</p>
                        </div>
                      )}
                      
                      {/* Recommendations Card */}
                      {(item.result?.recommendations || item.result?.recommendation) && (
                        <div className={styles.detailCard}>
                          <h5 className={styles.detailCardTitle}>Recommendations</h5>
                          
                          {/* General recommendation */}
                          {item.result?.recommendations?.general && (
                            <div className={styles.recommendationGroup}>
                              <div className={styles.recommendationHeader}>
                                <h6 className={styles.recommendationLabel}>General</h6>
                              </div>
                              <p className={styles.recommendationText}>{item.result.recommendations.general}</p>
                            </div>
                          )}
                          
                          {/* SelfCare recommendations from recommendations object */}
                          {item.result?.recommendations?.selfCare && Array.isArray(item.result.recommendations.selfCare) && (
                            <div className={styles.recommendationGroup}>
                              <div className={styles.recommendationHeader}>
                                <h6 className={styles.recommendationLabel}>Self-Care</h6>
                                <div className={styles.recommendationIcon}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor" />
                                  </svg>
                                </div>
                              </div>
                              <ul className={styles.recommendationList}>
                                {item.result.recommendations.selfCare.map((care: string, index: number) => (
                                  <li key={index} className={styles.recommendationItem}>{care}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Any other recommendation fields */}
                          {item.result?.recommendations && Object.entries(item.result.recommendations)
                            .filter(([key]) => !['general', 'selfCare'].includes(key))
                            .map(([key, value]: [string, any]) => (
                              <div key={key} className={styles.recommendationGroup}>
                                <div className={styles.recommendationHeader}>
                                  <h6 className={styles.recommendationLabel}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </h6>
                                </div>
                                {typeof value === 'string' ? (
                                  <p className={styles.recommendationText}>{value}</p>
                                ) : Array.isArray(value) ? (
                                  <ul className={styles.recommendationList}>
                                    {value.map((item: any, idx: number) => (
                                      <li key={idx} className={styles.recommendationItem}>
                                        {typeof item === 'string' ? item : JSON.stringify(item)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : typeof value === 'object' && value !== null ? (
                                  <div className={styles.recommendationObject}>
                                    {Object.entries(value).map(([subKey, subVal]: [string, any], idx: number) => (
                                      <div key={idx} className={styles.recommendationProperty}>
                                        <span className={styles.recommendationPropertyKey}>
                                          {subKey.charAt(0).toUpperCase() + subKey.slice(1)}:
                                        </span>
                                        <span className={styles.recommendationPropertyValue}>
                                          {typeof subVal === 'string' ? subVal : JSON.stringify(subVal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className={styles.recommendationText}>{String(value)}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                      
                      {/* SelfCare Card (if it exists at the top level) */}
                      {item.result?.selfCare && Array.isArray(item.result.selfCare) && (
                        <div className={styles.detailCard}>
                          <h5 className={styles.detailCardTitle}>
                            <span className={styles.titleWithIcon}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor" />
                              </svg>
                              Self-Care Advice
                            </span>
                          </h5>
                          <ul className={styles.careList}>
                            {item.result.selfCare.map((care: string, index: number) => (
                              <li key={index} className={styles.careItem}>{care}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Medications Card */}
                      {item.result?.medications && Array.isArray(item.result.medications) && item.result.medications.length > 0 && (
                        <div className={styles.detailCard}>
                          <h5 className={styles.detailCardTitle}>
                            <span className={styles.titleWithIcon}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 3h12v2H6V3zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-2.5v2.5h-3V15H8v-3h2.5V9.5h3V12H16v3z" fill="currentColor" />
                              </svg>
                              Medications
                            </span>
                          </h5>
                          <ul className={styles.cleanMedicationList}>
                            {item.result.medications.map((med: any, index: number) => {
                              // Handle various medication format cases
                              let medicationData = med;
                              
                              // Case 1: Plain object, use as is
                              if (typeof med === 'object' && med !== null) {
                                medicationData = med;
                              } 
                              // Case 2: String that might be JSON
                              else if (typeof med === 'string') {
                                // Check if it looks like a JSON object string
                                if ((med.startsWith('{') && med.endsWith('}')) || 
                                    (med.includes('"name"') && med.includes('"dosage"'))) {
                                  try {
                                    medicationData = JSON.parse(med);
                                  } catch (e) {
                                    // If it has JSON-like format but won't parse, try to extract data manually
                                    if (med.includes('"name"')) {
                                      const nameMatch = med.match(/"name"\s*:\s*"([^"]+)"/);
                                      const dosageMatch = med.match(/"dosage"\s*:\s*"([^"]+)"/);
                                      const instructionsMatch = med.match(/"instructions"\s*:\s*"([^"]+)"/);
                                      
                                      medicationData = {
                                        name: nameMatch ? nameMatch[1] : undefined,
                                        dosage: dosageMatch ? dosageMatch[1] : undefined,
                                        instructions: instructionsMatch ? instructionsMatch[1] : undefined
                                      };
                                    }
                                  }
                                }
                              }
                              
                              // Now display the medication based on what we've determined
                              if (typeof medicationData === 'object' && medicationData !== null) {
                                return (
                                  <li key={index} className={styles.cleanMedicationItem}>
                                    {medicationData.name && <span className={styles.medicationName}>{medicationData.name}</span>}
                                    {medicationData.dosage && <span className={styles.medicationDosage}>{medicationData.dosage}</span>}
                                    {medicationData.instructions && <span className={styles.medicationInstructions}>{medicationData.instructions}</span>}
                                  </li>
                                );
                              } else {
                                // If it's still a string, just display it directly
                                return (
                                  <li key={index} className={styles.cleanMedicationItem}>
                                    <span className={styles.medicationName}>{String(medicationData)}</span>
                                  </li>
                                );
                              }
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Conditions details (if not already shown fully) */}
                    {item.result?.conditions && item.result.conditions.length > 2 && (
                      <div className={styles.conditions}>
                        <h4>All Possible Conditions</h4>
                        <ul className={styles.conditionsList}>
                          {item.result.conditions.map((condition: any, index: number) => (
                            <li key={index} className={styles.conditionItem}>
                              <span className={styles.conditionName}>{condition.name}</span>
                              {condition.description && (
                                <p className={styles.conditionDescription}>{condition.description}</p>
                              )}
                              {condition.url && (
                                <a 
                                  href={condition.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={styles.nhsLink}
                                >
                                  Read more on NHS →
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Medications details (if not already shown fully) */}
                    {item.result?.medications && Array.isArray(item.result.medications) && item.result.medications.length > 2 && (
                      <div className={styles.medications}>
                        <h4>All Medications</h4>
                        <ul className={styles.medicationsList}>
                          {item.result.medications.map((medication: any, index: number) => (
                            <li key={index} className={styles.medicationItem}>
                              <span className={styles.medicationName}>{medication.name}</span>
                              {medication.dosage && (
                                <p className={styles.medicationDosage}>Dosage: {medication.dosage}</p>
                              )}
                              {medication.instructions && (
                                <p className={styles.medicationInstructions}>{medication.instructions}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommendations details (if not already shown fully) */}
                    {item.result?.recommendation && typeof item.result.recommendation !== 'string' && 
                     Object.keys(item.result.recommendation).length > 2 && (
                      <div className={styles.recommendation}>
                        <h4>All Recommendations</h4>
                        <div className={styles.recommendationContent}>
                          {Object.entries(item.result.recommendation).map(([key, value]: [string, any], index) => (
                            <div key={index} className={styles.recommendationItem}>
                              <h5>{key}</h5>
                              <p>{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display any other result properties that might be useful */}
                    {item.result && Object.entries(item.result).map(([key, value]: [string, any]) => {
                      // Skip the properties we've already handled
                      if (['conditions', 'recommendation', 'escalation', 'medications'].includes(key)) {
                        return null;
                      }
                      
                      // Skip complex objects we don't know how to display
                      if (typeof value === 'object' && value !== null) {
                        return null;
                      }
                      
                      // Display any other simple properties
                      return (
                        <div key={key} className={styles.additionalInfo}>
                          <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                          <div className={styles.additionalInfoContent}>
                            <p>{value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3C8.03 3 4 7.03 4 12H1L4.89 15.89L4.96 16.03L9 12H6C6 8.13 9.13 5 13 5C16.87 5 20 8.13 20 12C20 15.87 16.87 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C8.27 19.99 10.51 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3ZM12 8V13L16.28 15.54L17 14.33L13.5 12.25V8H12Z" fill="currentColor" />
              </svg>
            </div>
            <h3>No History Found</h3>
            <p>You haven't checked any symptoms yet.</p>
            <Link href="/dashboard" className={styles.actionButton}>
              Check Symptoms Now
            </Link>
          </div>
        )}
      </div>
      
      {/* Animated background elements */}
      <div className={styles.backgroundAnimations}>
        <div className={styles.animatedCircle} style={{ top: '10%', left: '5%', animationDelay: '0s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '70%', left: '80%', animationDelay: '1s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '40%', left: '90%', animationDelay: '2s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '80%', left: '30%', animationDelay: '3s' }}></div>
        <div className={styles.animatedPulse} style={{ top: '25%', left: '75%' }}></div>
      </div>
    </div>
  );
} 