'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [symptomInput, setSymptomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { 
      type: 'assistant', 
      content: 'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.',
      animate: true
    }
  ]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase.auth]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Set hasMessages if there are more than just the initial message
  useEffect(() => {
    if (messages.length > 1) {
      setHasMessages(true);
    }
  }, [messages.length]);

  const handleSymptomCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symptomInput.trim()) {
      setError("Please describe your symptoms");
      return;
    }
    
    console.log(`Submitting symptom check: "${symptomInput}"`);
    
    // Set hasMessages to true to show the message area
    setHasMessages(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: symptomInput }]);
    
    // Add typing indicator
    setMessages(prev => [...prev, { type: 'typing' }]);
    
    setIsLoading(true);
    setError(null);
    setSymptomInput('');
    
    try {
      // Call the API to analyze symptoms
      console.log("Calling analyze-symptoms API endpoint...");
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptomInput }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API response error:', response.status, response.statusText, errorData);
        throw new Error(errorData.error || `Failed to analyze symptoms (${response.status})`);
      }
      
      const data = await response.json();
      console.log("API response data:", data);
      
      // Save to history in Supabase
      if (user) {
        await supabase.from('symptom_history').insert({
          user_id: user.id,
          symptoms: symptomInput,
          result: data,
          created_at: new Date().toISOString(),
        });
      }
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
      
      // Generate conversational messages from the API response
      createConversationalMessages(data);
      
    } catch (err: any) {
      console.error("Error processing symptom check:", err);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant-error', 
          content: `I'm sorry, I couldn't analyze your symptoms. ${err.message || 'Please try again later.'}`,
          animate: true
        }
      ]);
      
      setError(err.message || 'An error occurred while analyzing symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const createConversationalMessages = (data: any) => {
    // Add conditions message
    if (data.possibleConditions && data.possibleConditions.length > 0) {
      const condition = data.possibleConditions[0];
      
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant', 
          content: `Based on what you've described, this could be ${condition.name.toLowerCase()}. ${condition.description}`,
          animate: true
        }
      ]);
      
      // Add delay before next message
      setTimeout(() => {
        // Add recommendations
        if (data.recommendations) {
          let recommendationMessage = `${data.recommendations.general || 'Here\'s what I recommend:'} `;
          
          if (data.recommendations.selfCare && data.recommendations.selfCare.length > 0) {
            recommendationMessage += `\n\nFor self-care, try these steps:\n• ${data.recommendations.selfCare.join('\n• ')}`;
          }
          
          setMessages(prev => [
            ...prev, 
            { 
              type: 'assistant', 
              content: recommendationMessage,
              animate: true
            }
          ]);
          
          // Add medications with delay if available
          if (data.recommendations.medications && data.recommendations.medications.length > 0) {
            setTimeout(() => {
              const medicationsMessage = `You might consider these medications:\n• ${data.recommendations.medications.map((med: any) => 
                `${med.name}: ${med.dosage} - ${med.instructions}`
              ).join('\n• ')}`;
              
              setMessages(prev => [
                ...prev, 
                { 
                  type: 'assistant', 
                  content: medicationsMessage,
                  animate: true
                }
              ]);
            }, 800);
          }
        }
      }, 1000);
      
      // Add escalation advice with delay
      if (data.escalation) {
        setTimeout(() => {
          const escalationLevel = data.escalation.level;
          let levelEmoji = '✅';
          
          if (escalationLevel === 'urgent') {
            levelEmoji = '🚨';
          } else if (escalationLevel === 'soon') {
            levelEmoji = '⚠️';
          }
          
          setMessages(prev => [
            ...prev, 
            { 
              type: 'assistant-escalation', 
              content: `${levelEmoji} ${data.escalation.message}`,
              level: escalationLevel,
              animate: true
            }
          ]);
          
          // Add options for next steps
          setTimeout(() => {
            setMessages(prev => [
              ...prev, 
              { 
                type: 'assistant-options', 
                options: [
                  { 
                    label: 'Find healthcare services nearby', 
                    action: 'link', 
                    path: '/dashboard/nearby' 
                  },
                  {
                    label: escalationLevel === 'urgent' ? 'Call emergency services' : 'Book GP appointment',
                    action: escalationLevel === 'urgent' ? 'tel' : 'book',
                    value: escalationLevel === 'urgent' ? '999' : 'gp'
                  },
                  { 
                    label: 'Tell me more about this condition', 
                    action: 'more-info',
                    condition: data.possibleConditions[0]
                  }
                ],
                animate: true
              }
            ]);
          }, 800);
        }, 2000);
      }
      
      // Add disclaimer with delay
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            type: 'assistant-disclaimer', 
            content: "Please remember this is not a replacement for professional medical advice. If your symptoms are severe or you're unsure, please consult a healthcare professional.",
            animate: true
          }
        ]);
      }, 3000);
    } else {
      // Fallback message if no conditions found
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant', 
          content: "I couldn't identify specific conditions based on the symptoms you described. Could you provide more details about what you're experiencing?",
          animate: true
        }
      ]);
    }
  };

  const handleOptionClick = (option: any) => {
    if (option.action === 'more-info' && option.condition) {
      // Show more info about the condition
      const condition = option.condition;
      setMessages(prev => [
        ...prev,
        { type: 'user', content: `Tell me more about ${condition.name}` },
        { 
          type: 'assistant', 
          content: `${condition.name} is ${condition.description}\n\n${condition.nhsUrl ? `You can find more detailed information on the NHS website.` : ''}`,
          animate: true,
          links: condition.nhsUrl ? [{ text: 'NHS Website', url: condition.nhsUrl }] : []
        }
      ]);
    } else if (option.action === 'link' && option.path) {
      // Let the Link component handle navigation
    } else if (option.action === 'tel' && option.value) {
      // Let the link handle phone call
    } else if (option.action === 'book' && option.value === 'gp') {
      // Mock GP booking
      setMessages(prev => [
        ...prev,
        { type: 'user', content: 'I want to book a GP appointment' },
        { 
          type: 'assistant', 
          content: 'I can help you book a GP appointment. Which day would you prefer?',
          animate: true
        },
        {
          type: 'assistant-options',
          options: [
            { label: 'Today', action: 'book-day', value: 'today' },
            { label: 'Tomorrow', action: 'book-day', value: 'tomorrow' },
            { label: 'Later this week', action: 'book-day', value: 'later' }
          ],
          animate: true
        }
      ]);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>How can we help you{user?.email ? `, ${user.email.split('@')[0]}` : ''}?</h2>
        </div>
        <div className={`${styles.chatInterface} ${!hasMessages ? styles.noMessages : ''}`}>
          <div className={styles.chatMessages}>
            {messages.map((message, index) => {
              if (message.type === 'user') {
                return (
                  <div key={index} className={styles.userMessage}>
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                );
              } else if (message.type === 'assistant') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content.split('\n').map((line: string, i: number) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                      {message.links && message.links.map((link: any, i: number) => (
                        <a 
                          key={i} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.nhsLink}
                        >
                          {link.text} →
                        </a>
                      ))}
                    </div>
                  </div>
                );
              } else if (message.type === 'assistant-escalation') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.escalationMessage} ${styles[`escalation-${message.level}`]} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                );
              } else if (message.type === 'assistant-disclaimer') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.disclaimerMessage} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                );
              } else if (message.type === 'assistant-error') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.errorMessage} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                );
              } else if (message.type === 'assistant-options') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.optionsMessage} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.optionsContainer}>
                      {message.options.map((option: any, optIndex: number) => (
                        <React.Fragment key={optIndex}>
                          {option.action === 'link' && option.path ? (
                            <Link href={option.path} className={styles.optionButton}>
                              {option.label}
                            </Link>
                          ) : option.action === 'tel' && option.value ? (
                            <a href={`tel:${option.value}`} className={`${styles.optionButton} ${styles.urgentOption}`}>
                              {option.label}
                            </a>
                          ) : (
                            <button 
                              className={styles.optionButton}
                              onClick={() => handleOptionClick(option)}
                            >
                              {option.label}
                            </button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              } else if (message.type === 'typing') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.typingMessage}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                );
              }
              return null;
            })}
            <div ref={chatEndRef} />
          </div>
          
          <form className={styles.chatInputWrapper} onSubmit={handleSymptomCheck}>
            <input
              className={styles.chatInput}
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              placeholder="Describe symptoms, when they started, severity, and any relevant medical history..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={isLoading || !symptomInput.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
              </svg>
            </button>
          </form>
        </div>
        
        
      </div>
      
      {/* Animated background elements */}
      <div className={styles.backgroundAnimations}>
        <div className={styles.animatedCircle} style={{ top: '10%', left: '5%', animationDelay: '0s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '70%', left: '80%', animationDelay: '1s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '40%', left: '90%', animationDelay: '2s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '80%', left: '30%', animationDelay: '3s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '20%', left: '60%', animationDelay: '4s' }}></div>
        <div className={styles.animatedCircle} style={{ top: '30%', left: '25%', animationDelay: '2.5s', width: '250px', height: '250px' }}></div>
        <div className={styles.animatedCircle} style={{ top: '60%', left: '55%', animationDelay: '1.5s', width: '200px', height: '200px' }}></div>
        <div className={styles.animatedPulse} style={{ top: '45%', left: '15%' }}></div>
        <div className={styles.animatedPulse} style={{ top: '25%', left: '75%' }}></div>
      </div>
    </div>
  );
} 