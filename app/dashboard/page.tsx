'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from './dashboard.module.css';

// Add type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

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
    },
    {
      type: 'assistant',
      content: 'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!',
      animate: true
    }
  ]);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Access environment variables with NEXT_PUBLIC prefix which are safe to expose to the browser
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  
  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);
  
  // Azure Speech SDK token
  const [azureToken, setAzureToken] = useState<string | null>(null);
  const [azureRegion, setAzureRegion] = useState<string | null>(null);
  
  // Language selection state
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translating, setTranslating] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Available languages
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' }
  ];

  // Add new state variables for the pharmacy map
  const [showPharmacyMap, setShowPharmacyMap] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  // Replace the entire mapTexts and translatePharmacyTexts with simpler approach
  // Create a fixed set of pharmacy-related text in English
  const [pharmacyTexts, setPharmacyTexts] = useState({
    title: 'Nearby Pharmacies',
    findButton: 'Find Nearby Pharmacies',
    loadingButton: 'Loading...',
    findingPharmacies: 'Finding nearby pharmacies...',
    foundPharmacies: 'Found {count} pharmacies nearby',
    noPharmacies: 'No pharmacies found nearby. Try expanding your search radius.',
    directions: 'Directions',
    distanceAway: '{distance} km away',
    mapPlaceholder: 'Interactive map would display here with a valid API key.',
    mapNote: 'Pharmacy locations are generated around your current location.'
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
    
    // Initialize voices for speech synthesis
    const initVoices = () => {
      // This is needed for some browsers - especially Safari
      if (window.speechSynthesis) {
        // Load voices
        window.speechSynthesis.getVoices();
        
        // Some browsers need this event to access voices
        if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
          };
        }
      }
    };
    
    initVoices();
    
    // Initialize Azure Speech token
    fetchAzureSpeechToken();
    
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      // Check browser support for speech recognition
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        console.error('Speech recognition not supported in this browser');
        setHasMicPermission(false);
        return;
      }
      
      // Check microphone permission
      checkMicrophonePermission();
    }
    
    return () => {
      // Cleanup speech resources
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supabase.auth]);
  
  // Check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media devices API not supported');
        setHasMicPermission(false);
        setError('Your browser does not support microphone access. Please try a modern browser like Chrome or Edge.');
        return;
      }
      
      // Just check permission without actually using the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      setHasMicPermission(true);
      
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      
      // Now setup speech recognition with known permission
      setupSpeechRecognition();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasMicPermission(false);
      setError('Microphone access was denied. Please allow microphone access in your browser settings.');
    }
  };
  
  // Setup speech recognition after permission check
  const setupSpeechRecognition = () => {
    // Check if SpeechRecognition is supported
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Speech Recognition API not supported in this browser');
      setError('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
      setHasMicPermission(false);
      return;
    }
    
    try {
      // Fix TypeScript errors by declaring types
      interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start(): void;
        stop(): void;
        onresult: (event: any) => void;
        onerror: (event: any) => void;
        onend: () => void;
        onstart: () => void;
      }
      
      // Create speech recognition instance
      recognitionRef.current = new SpeechRecognitionAPI();
      
      // Configure speech recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-GB'; // Set to British English
      
      // Handle successful recognition results
      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result received', event);
        
        // Clear previous content when starting a new recognition
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results, not just the current one
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript = transcript;
          }
        }
        
        // Update the symptom input with the transcript - fix for duplicate text
        if (finalTranscript) {
          // Replace the input entirely with the final transcript to avoid duplication
          setSymptomInput(finalTranscript.trim());
        } else if (interimTranscript) {
          setSymptomInput(interimTranscript.trim());
        }
      };
      
      // Handle recognition errors
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setHasMicPermission(false);
          setError('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please try again and speak clearly.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
      };
      
      // When recognition ends
      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      // When recognition starts
      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
      };
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      setError('Failed to initialize speech recognition. Please try a different browser.');
      setHasMicPermission(false);
    }
  };

  // Fetch Azure Speech token
  const fetchAzureSpeechToken = async () => {
    try {
      const response = await fetch('/api/azure-speech-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch Azure Speech token');
        return;
      }
      
      const data = await response.json();
      setAzureToken(data.token);
      setAzureRegion(data.region);
    } catch (error) {
      console.error('Error fetching Azure Speech token:', error);
    }
  };
  
  // Translate text to selected language
  const translateText = async (text: string, targetLanguage: string) => {
    if (targetLanguage === 'en') return text; // No need to translate if English
    
    try {
      setTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          targetLanguage 
        }),
      });
      
      if (!response.ok) {
        console.error('Translation failed');
        setTranslating(false);
        return text;
      }
      
      const data = await response.json();
      setTranslating(false);
      return data.translatedText;
    } catch (error) {
      console.error('Error during translation:', error);
      setTranslating(false);
      return text;
    }
  };
  
  // Update the language change handler to also translate pharmacy texts
  const changeLanguage = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;
    
    setCurrentLanguage(languageCode);
    setShowLanguageSelector(false);
    
    // Translate existing messages
    const newMessages = await Promise.all(messages.map(async (message) => {
      // Only translate text content, not UI elements or user messages
      if (['assistant', 'assistant-error', 'assistant-escalation', 'assistant-disclaimer'].includes(message.type) && message.content) {
        const translatedContent = await translateText(message.content, languageCode);
        return { ...message, content: translatedContent };
      }
      return message;
    }));
    
    setMessages(newMessages);
    
    // Translate pharmacy texts if not English
    if (languageCode !== 'en') {
      try {
        // Create a properly typed copy of the texts
        const translatedTexts = { ...pharmacyTexts };
        
        // Use a type-safe approach to translate each key
        const keys = Object.keys(translatedTexts) as Array<keyof typeof pharmacyTexts>;
        for (const key of keys) {
          translatedTexts[key] = await translateText(translatedTexts[key], languageCode);
        }
        
        setPharmacyTexts(translatedTexts);
      } catch (error) {
        console.error('Error translating pharmacy texts:', error);
      }
    } else {
      // Reset to English defaults
      setPharmacyTexts({
        title: 'Nearby Pharmacies',
        findButton: 'Find Nearby Pharmacies',
        loadingButton: 'Loading...',
        findingPharmacies: 'Finding nearby pharmacies...',
        foundPharmacies: 'Found {count} pharmacies nearby',
        noPharmacies: 'No pharmacies found nearby. Try expanding your search radius.',
        directions: 'Directions',
        distanceAway: '{distance} km away',
        mapPlaceholder: 'Interactive map would display here with a valid API key.',
        mapNote: 'Pharmacy locations are generated around your current location.'
      });
    }
  };

  // Toggle speech recognition with permission handling
  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported or initialized');
      setError('Speech recognition is not available in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
      setIsListening(false);
    } else {
      // Check if we need to request permission
      if (hasMicPermission === false) {
        checkMicrophonePermission(); // Try again to get permission
        return;
      }
      
      try {
        console.log('Starting speech recognition...');
        recognitionRef.current.start();
        setError(null);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Error starting speech recognition. Please try again or use a different browser.');
      }
    }
  };
  
  // Text to speech for a message
  const speakMessage = async (text: string) => {
    try {
      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      
      setIsSpeaking(true);
      console.log("Speaking text:", text);
      
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        console.error("Speech synthesis not supported in this browser");
        setError("Text-to-speech is not supported in your browser. Please try Chrome, Edge, or Safari.");
        setIsSpeaking(false);
        return;
      }
      
      // Create utterance with the text to be spoken
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to get available voices (might be empty on first call in some browsers)
      let voices = (window.speechSynthesis as any).getVoices();
      console.log(`Loaded ${voices.length} voices initially`);
      
      if (voices.length === 0) {
        // Some browsers (especially Safari) need a delay or event listener
        if ('onvoiceschanged' in window.speechSynthesis) {
          // Set up a promise to wait for voices to load
          const voicesLoadedPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
            const voicesChangedHandler = () => {
              const loadedVoices = (window.speechSynthesis as any).getVoices();
              console.log(`Voices loaded via event: ${loadedVoices.length}`);
              (window.speechSynthesis as any).onvoiceschanged = null;
              resolve(loadedVoices);
            };
            
            (window.speechSynthesis as any).onvoiceschanged = voicesChangedHandler;
            
            // Fallback in case the event doesn't fire
            setTimeout(() => {
              const fallbackVoices = (window.speechSynthesis as any).getVoices();
              if (fallbackVoices.length > 0) {
                console.log(`Voices loaded via timeout: ${fallbackVoices.length}`);
                (window.speechSynthesis as any).onvoiceschanged = null;
                resolve(fallbackVoices);
              }
            }, 1000);
          });
          
          // Wait for voices to load
          voices = await voicesLoadedPromise;
        } else {
          // If the browser doesn't support the onvoiceschanged event, try after a delay
          await new Promise(resolve => setTimeout(resolve, 100));
          voices = (window.speechSynthesis as any).getVoices();
          console.log(`Voices loaded after delay: ${voices.length}`);
        }
      }
      
      // Set up the utterance with appropriate voice
      if (voices.length > 0) {
        // Log available voices for debugging
        console.log("Available voices:", voices.map((v: any) => `${v.name} (${v.lang})`).join(', '));
        
        // Find a suitable voice (prefer female English voices)
        let voice = voices.find((v: SpeechSynthesisVoice) => v.name.includes('Female') && v.lang.includes('en'));
        if (!voice) {
          voice = voices.find((v: SpeechSynthesisVoice) => v.lang.includes('en'));
        }
        
        if (voice) {
          console.log(`Selected voice: ${voice.name} (${voice.lang})`);
          utterance.voice = voice;
        } else {
          console.log("No English voice found, using default voice");
        }
      } else {
        console.warn("No voices available, using default system voice");
      }
      
      // Configure utterance properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log("Speech started");
      };
      
      utterance.onend = () => {
        console.log("Speech ended");
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
      };
      
      // Start speaking
      console.log("Starting speech...");
      window.speechSynthesis.speak(utterance);
      
      // Fix for Chrome issue where onend doesn't fire
      const maxSpeechTime = Math.max(text.length * 50, 5000); // Estimate based on text length
      setTimeout(() => {
        if (isSpeaking) {
          console.log("Speech timeout reached, resetting state");
          setIsSpeaking(false);
        }
      }, maxSpeechTime);
      
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      setIsSpeaking(false);
      setError("There was a problem with text-to-speech. Please try again.");
    }
  };
  
  // Helper function for web speech fallback
  const fallbackToWebSpeech = (text: string) => {
    setIsSpeaking(false);
    
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

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
      // Translate user input to English if needed for API processing
      let processedInput = symptomInput;
      if (currentLanguage !== 'en') {
        try {
          processedInput = await translateText(symptomInput, 'en');
        } catch (error) {
          console.error('Failed to translate input, proceeding with original:', error);
        }
      }
      
      // Call the API to analyze symptoms
      console.log("Calling analyze-symptoms API endpoint...");
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: processedInput }),
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
          language: currentLanguage
        });
      }
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
      
      // Generate conversational messages from the API response
      await createConversationalMessages(data);
      
    } catch (err: any) {
      console.error("Error processing symptom check:", err);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
      
      // Add error message
      let errorMessage = `I'm sorry, I couldn't analyze your symptoms. ${err.message || 'Please try again later.'}`;
      
      // Translate error message if not in English
      if (currentLanguage !== 'en') {
        try {
          errorMessage = await translateText(errorMessage, currentLanguage);
        } catch (error) {
          console.error('Failed to translate error message:', error);
        }
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant-error', 
          content: errorMessage,
          animate: true
        }
      ]);
      
      setError(err.message || 'An error occurred while analyzing symptoms');
    } finally {
      setIsLoading(false);
    }
  };

  const createConversationalMessages = async (data: any) => {
    // Add conditions message
    if (data.possibleConditions && data.possibleConditions.length > 0) {
      const condition = data.possibleConditions[0];
      
      let conditionMessage = `Based on what you've described, this could be ${condition.name.toLowerCase()}. ${condition.description}`;
      
      // Translate condition message if needed
      if (currentLanguage !== 'en') {
        try {
          conditionMessage = await translateText(conditionMessage, currentLanguage);
        } catch (error) {
          console.error('Failed to translate condition message:', error);
        }
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant', 
          content: conditionMessage,
          animate: true
        }
      ]);
      
      // Add delay before next message
      setTimeout(async () => {
        // Add recommendations
        if (data.recommendations) {
          let recommendationMessage = `${data.recommendations.general || 'Here\'s what I recommend:'} `;
          
          if (data.recommendations.selfCare && data.recommendations.selfCare.length > 0) {
            recommendationMessage += `\n\nFor self-care, try these steps:\n• ${data.recommendations.selfCare.join('\n• ')}`;
          }
          
          // Translate recommendation message if needed
          if (currentLanguage !== 'en') {
            try {
              recommendationMessage = await translateText(recommendationMessage, currentLanguage);
            } catch (error) {
              console.error('Failed to translate recommendation message:', error);
            }
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
            setTimeout(async () => {
              let medicationsMessage = `You might consider these medications:\n• ${data.recommendations.medications.map((med: any) => 
                `${med.name}: ${med.dosage} - ${med.instructions}`
              ).join('\n• ')}`;
              
              // Translate medications message if needed
              if (currentLanguage !== 'en') {
                try {
                  medicationsMessage = await translateText(medicationsMessage, currentLanguage);
                } catch (error) {
                  console.error('Failed to translate medications message:', error);
                }
              }
              
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
        setTimeout(async () => {
          const escalationLevel = data.escalation.level;
          let levelEmoji = '✅';
          
          if (escalationLevel === 'urgent') {
            levelEmoji = '🚨';
          } else if (escalationLevel === 'soon') {
            levelEmoji = '⚠️';
          }
          
          let escalationMessage = `${levelEmoji} ${data.escalation.message}`;
          
          // Translate escalation message if needed
          if (currentLanguage !== 'en') {
            try {
              // Keep the emoji but translate the text
              const translatedEscalationText = await translateText(data.escalation.message, currentLanguage);
              escalationMessage = `${levelEmoji} ${translatedEscalationText}`;
            } catch (error) {
              console.error('Failed to translate escalation message:', error);
            }
          }
          
          setMessages(prev => [
            ...prev, 
            { 
              type: 'assistant-escalation', 
              content: escalationMessage,
              level: escalationLevel,
              animate: true
            }
          ]);
          
          // Add options for next steps
          
        }, 2000);
      }
      
      // Add disclaimer with delay
      setTimeout(async () => {
        let disclaimerMessage = "Please remember this is not a replacement for professional medical advice. If your symptoms are severe or you're unsure, please consult a healthcare professional.";
        
        // Translate disclaimer message if needed
        if (currentLanguage !== 'en') {
          try {
            disclaimerMessage = await translateText(disclaimerMessage, currentLanguage);
          } catch (error) {
            console.error('Failed to translate disclaimer message:', error);
          }
        }
        
        setMessages(prev => [
          ...prev, 
          { 
            type: 'assistant-disclaimer', 
            content: disclaimerMessage,
            animate: true
          }
        ]);
      }, 3000);
    } else {
      // Fallback message if no conditions found
      let fallbackMessage = "I couldn't identify any specific conditions based on the symptoms you've described. Please provide more details about your symptoms, when they started, and how severe they are.";
      
      // Translate fallback message if needed
      if (currentLanguage !== 'en') {
        try {
          fallbackMessage = await translateText(fallbackMessage, currentLanguage);
        } catch (error) {
          console.error('Failed to translate fallback message:', error);
        }
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant', 
          content: fallbackMessage,
          animate: true
        }
      ]);
    }
  };

  const handleOptionClick = async (option: any) => {
    console.log("Option clicked:", option);
    
    if (option.action === 'more-info' && option.condition) {
      // Add typing indicator
      setMessages(prev => [...prev, { type: 'typing' }]);
      
      try {
        // Generate more info about the condition
        const response = await fetch('/api/condition-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ condition: option.condition.name }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get condition info (${response.status})`);
        }
        
        const data = await response.json();
        console.log("Condition info:", data);
        
        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
        
        // Create informational message
        let infoMessage = data.info || `${option.condition.name} is a common condition. If you're concerned about your symptoms, we recommend consulting a healthcare professional.`;
        
        // Add NHS links if available
        if (data.links && data.links.length > 0) {
          infoMessage += "\n\nLearn more from trusted sources:";
        }
        
        // Translate the message if needed
        if (currentLanguage !== 'en') {
          try {
            infoMessage = await translateText(infoMessage, currentLanguage);
          } catch (error) {
            console.error('Failed to translate condition info:', error);
          }
        }
        
        // Add the informational message
        setMessages(prev => [
          ...prev, 
          { 
            type: 'assistant', 
            content: infoMessage,
            links: data.links,
            animate: true
          }
        ]);
        
      } catch (error) {
        console.error("Error fetching condition info:", error);
        
        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.type !== 'typing'));
        
        // Add error message
        let errorMessage = "I'm sorry, I couldn't retrieve more information about this condition right now.";
        
        // Translate error message if needed
        if (currentLanguage !== 'en') {
          try {
            errorMessage = await translateText(errorMessage, currentLanguage);
          } catch (error) {
            console.error('Failed to translate error message:', error);
          }
        }
        
        setMessages(prev => [
          ...prev, 
          { 
            type: 'assistant-error', 
            content: errorMessage,
            animate: true
          }
        ]);
      }
    } else if (option.action === 'book' && option.value === 'gp') {
      // Show GP booking info
      let bookingMessage = "To book a GP appointment, you can use the NHS app, contact your GP directly, or call NHS 111 for advice.";
      
      // Translate booking message if needed
      if (currentLanguage !== 'en') {
        try {
          bookingMessage = await translateText(bookingMessage, currentLanguage);
        } catch (error) {
          console.error('Failed to translate booking message:', error);
        }
      }
      
      setMessages(prev => [
        ...prev, 
        { 
          type: 'assistant', 
          content: bookingMessage,
          animate: true
        }
      ]);
    }
  };

  // Render messages with distinct icons
  const renderAssistantMessage = (message: any, index: number) => {
    return (
      <div key={index} className={`${styles.assistantMessage} ${message.animate ? styles.fadeIn : ''}`}>
        <div className={styles.assistantAvatar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
          </svg>
        </div>
        {renderMessageContent(message)}
      </div>
    );
  };

  // Render message content with text-to-speech button
  const renderMessageContent = (message: any) => {
    // Only add speak button to assistant messages with text content
    const canSpeak = ['assistant', 'assistant-error', 'assistant-escalation', 'assistant-disclaimer'].includes(message.type);
    
    return (
      <div className={styles.messageContentWrapper}>
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
        {canSpeak && (
          <button 
            className={`${styles.speakButton} ${isSpeaking ? styles.speaking : ''}`}
            onClick={() => speakMessage(message.content)}
            aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
            title={isSpeaking ? "Stop speaking" : "Speak message"}
          >
            {isSpeaking ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="none" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="none" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  // Add function to fetch nearby pharmacies
  const fetchNearbyPharmacies = () => {
    setShowPharmacyMap(true);
    setLoadingPharmacies(true);
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          try {
            // Fetch nearby pharmacies using the location
            const response = await fetch('/api/nearby-pharmacies', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                latitude, 
                longitude,
                radius: 5000, // 5km radius
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch nearby pharmacies');
            }
            
            const data = await response.json();
            setPharmacies(data.pharmacies || []);
          } catch (error) {
            console.error('Error fetching nearby pharmacies:', error);
            setLocationError('Unable to fetch nearby pharmacies. Please try again later.');
          } finally {
            setLoadingPharmacies(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Location access denied. Please enable location services to see nearby pharmacies.');
          setLoadingPharmacies(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setLoadingPharmacies(false);
    }
  };

  // Add Google Maps script loading and map initialization
  useEffect(() => {
    // Skip if no user location or pharmacies
    if (!userLocation || !showPharmacyMap || pharmacies.length === 0) return;
    
    // Check if Google Maps script is already loaded
    if (!window.google) {
      // Load Google Maps script
      const googleMapsScript = document.createElement('script');
      googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBZpNAYS5uU_VL7t379YdV1wcq3U8-hqlM&libraries=places`;
      googleMapsScript.async = true;
      googleMapsScript.defer = true;
      googleMapsScript.onload = initMap;
      document.head.appendChild(googleMapsScript);
    } else {
      // If already loaded, initialize map
      initMap();
    }
    
    function initMap() {
      // Get the map container
      const mapElement = document.getElementById('pharmacy-map');
      if (!mapElement || !userLocation) return;
      
      // Create the map
      const map = new window.google.maps.Map(mapElement, {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 14,
        styles: [
          {
            featureType: "poi.business",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
        ],
      });
      
      // Add marker for user location
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      
      // Add markers for each pharmacy
      pharmacies.forEach((pharmacy) => {
        const marker = new window.google.maps.Marker({
          position: { lat: pharmacy.lat, lng: pharmacy.lng },
          map,
          title: pharmacy.name,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });
        
        // Add info window for pharmacy details
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 5px; font-size: 16px; color: #1E88E5;">${pharmacy.name}</h3>
              <p style="margin: 0 0 5px; font-size: 14px;">${pharmacy.address}</p>
              <p style="margin: 0; font-size: 13px; color: #666;">${pharmacy.distance} km away</p>
            </div>
          `,
        });
        
        // Open info window when marker is clicked
        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });
      
      // Fit the map to include all markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      pharmacies.forEach((pharmacy) => {
        bounds.extend({ lat: pharmacy.lat, lng: pharmacy.lng });
      });
      map.fitBounds(bounds);
    }
    
    // Cleanup function
    return () => {
      // Remove any map-related event listeners if needed
    };
  }, [userLocation, pharmacies, showPharmacyMap]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>How can we help you{user?.email ? `, ${user.email.split('@')[0]}` : ''}?</h2>
          
          {/* Language selector dropdown */}
          <div className={styles.languageSelector}>
            <button 
              className={styles.languageButton}
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              aria-label="Select language"
              title="Select language"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{availableLanguages.find(lang => lang.code === currentLanguage)?.name || 'English'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {showLanguageSelector && (
              <div className={styles.languageDropdown}>
                {availableLanguages.map(language => (
                  <button
                    key={language.code}
                    className={`${styles.languageOption} ${currentLanguage === language.code ? styles.activeLanguage : ''}`}
                    onClick={() => changeLanguage(language.code)}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            )}
            
            {translating && (
              <div className={styles.translatingIndicator}>
                <span>Translating...</span>
              </div>
            )}
          </div>
        </div>
        
        {(hasMicPermission === false || error) && (
          <div className={styles.permissionAlert}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error || 'Microphone access is required for voice input. Please allow microphone access in your browser settings.'}</span>
            <button onClick={checkMicrophonePermission} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
        
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
                return renderAssistantMessage(message, index);
              } else if (message.type === 'assistant-escalation') {
                return (
                  <div key={index} className={`${styles.assistantMessage} ${styles.escalationMessage} ${styles[`escalation-${message.level}`]} ${message.animate ? styles.fadeIn : ''}`}>
                    <div className={styles.assistantAvatar}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 18.49L9.5 12.5L13.5 16.5L22 8.5V14.5H24V4.5H14V6.5H20L13.5 13L9.5 9L2 16.5L3.5 18.49Z" fill="#1E88E5"/>
                      </svg>
                    </div>
                    {renderMessageContent(message)}
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
                    {renderMessageContent(message)}
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
                    {renderMessageContent(message)}
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
              disabled={isLoading || isListening}
            />
            <button 
              type="button" 
              className={`${styles.micButton} ${isListening ? styles.listening : ''} ${hasMicPermission === false ? styles.disabled : ''}`}
              onClick={toggleListening}
              disabled={isLoading || hasMicPermission === false}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={isLoading || !symptomInput.trim() || isListening}
              aria-label="Send message"
              title="Send message"
              onClick={(e) => {
                if (symptomInput.trim()) {
                  e.preventDefault();
                  handleSymptomCheck(e);
                }
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white" />
              </svg>
            </button>
          </form>
          
          {isListening && (
            <div className={styles.listeningIndicator}>
              <div className={styles.listeningWaves}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles.listeningText}>Listening...</span>
            </div>
          )}
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

      <div className={styles.mapContainer}>
        <div className={styles.mapHeader}>
          <div>
            <h3>{pharmacyTexts.title}</h3>
            <p className={styles.mapHeaderDescription}>Find pharmacies near your current location to get medications and advice</p>
          </div>
          <button 
            className={styles.findPharmaciesButton} 
            onClick={fetchNearbyPharmacies}
            disabled={loadingPharmacies}
          >
            {loadingPharmacies ? (
              <>
                <div className={styles.buttonSpinner}></div>
                {pharmacyTexts.loadingButton}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                {pharmacyTexts.findButton}
              </>
            )}
          </button>
        </div>
        
        {locationError && (
          <div className={styles.mapError}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{locationError}</span>
          </div>
        )}
        
        {showPharmacyMap && !locationError && (
          <div className={styles.mapWrapper}>
            {loadingPharmacies ? (
              <div className={styles.mapLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>{pharmacyTexts.findingPharmacies}</p>
              </div>
            ) : (
              <>
                {/* This div will be used as the map container */}
                <div className={styles.pharmacyMap} id="pharmacy-map">
                  <div className={styles.mapPlaceholder}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3"></circle>
                      <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"></path>
                    </svg>
                    <h4>{pharmacyTexts.mapPlaceholder}</h4>
                    <p className={styles.mapNote}>{pharmacyTexts.mapNote}</p>
                    
                    {userLocation && pharmacies.length > 0 && (
                      <div className={styles.fallbackMapControls}>
                        <div className={styles.mapLocation}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>Your location: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/pharmacy/@${userLocation.lat},${userLocation.lng},14z`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openGoogleMapsButton}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          View Pharmacies in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {pharmacies.length > 0 ? (
                  <div className={styles.pharmacyList}>
                    <h4>{pharmacyTexts.foundPharmacies.replace('{count}', pharmacies.length.toString())}</h4>
                    <ul>
                      {pharmacies.map((pharmacy, index) => (
                        <li key={index} className={styles.pharmacyItem}>
                          <div className={styles.pharmacyInfo}>
                            <h5>{pharmacy.name}</h5>
                            <p>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {pharmacy.address}
                            </p>
                            <div className={styles.pharmacyDistance}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span>{pharmacyTexts.distanceAway.replace('{distance}', pharmacy.distance)}</span>
                            </div>
                          </div>
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.directionsButton}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            {pharmacyTexts.directions}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className={styles.noPharmacies}>
                    <p>{pharmacyTexts.noPharmacies}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 