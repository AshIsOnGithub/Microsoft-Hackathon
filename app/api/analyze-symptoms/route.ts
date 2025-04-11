import { NextRequest, NextResponse } from 'next/server';

// NHS API integration
async function getNHSConditionsInfo(symptomQuery: string) {
  try {
    // NHS API endpoint with the provided subscription key
    const primaryKey = process.env.NHS_API_SUBSCRIPTION_KEY || 'a4d98ea331f24a91a2033144988faeed';
    const secondaryKey = process.env.NHS_API_SECONDARY_KEY || 'cba20085719449b89c918f6eb7d78614';
    
    // Log the request for debugging
    console.log(`Fetching NHS API data for query: "${symptomQuery}"`);
    
    // Build the URL with proper encoding
    const encodedQuery = encodeURIComponent(symptomQuery);
    const apiUrl = `https://api.nhs.uk/conditions?search=${encodedQuery}&syn=true`;
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'subscription-key': primaryKey,
        'Content-Type': 'application/json'
      }
    });

    // If primary key fails, try with secondary key
    if (!response.ok && secondaryKey) {
      console.log('Primary NHS API key failed, trying secondary key');
      const retryResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'subscription-key': secondaryKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (retryResponse.ok) {
        const data = await retryResponse.json();
        console.log(`NHS API returned ${data.mainEntityOfPage?.length || 0} results with secondary key`);
        
        // Format the NHS API response
        const conditions = formatNHSResponse(data, symptomQuery);
        return conditions.length > 0 ? conditions : getFallbackConditions(symptomQuery);
      } else {
        console.error('Both NHS API keys failed:', retryResponse.status, retryResponse.statusText);
        return getFallbackConditions(symptomQuery);
      }
    }

    // Process response with primary key if successful
    if (response.ok) {
      const data = await response.json();
      console.log(`NHS API returned ${data.mainEntityOfPage?.length || 0} results`);
      
      // Format the NHS API response
      const conditions = formatNHSResponse(data, symptomQuery);
      return conditions.length > 0 ? conditions : getFallbackConditions(symptomQuery);
    } else {
      console.error('NHS API error:', response.status, response.statusText);
      return getFallbackConditions(symptomQuery);
    }
    
  } catch (error) {
    console.error('Error fetching NHS conditions:', error);
    // Return fallback data if the API fails
    return getFallbackConditions(symptomQuery);
  }
}

// Format NHS API response
function formatNHSResponse(data: any, symptomQuery: string) {
  if (!data.mainEntityOfPage || !Array.isArray(data.mainEntityOfPage) || data.mainEntityOfPage.length === 0) {
    console.log('No results in NHS API response, using fallback');
    return [];
  }
  
  try {
    const conditions = data.mainEntityOfPage.map((entity: any) => {
      return {
        name: entity.name || 'Unknown Condition',
        description: entity.description || 'No description available',
        selfCare: extractSelfCareFromNHSResponse(entity),
        nhsUrl: entity.url || 'https://www.nhs.uk/conditions/'
      };
    }).filter((condition: any) => {
      // Filter out any malformed entries
      return condition.name !== 'Unknown Condition' || condition.description !== 'No description available';
    });
    
    // Handle emergency keywords with special condition
    if (checkForEmergency(symptomQuery) === 'urgent' && conditions.length > 0) {
      // Add an emergency condition at the beginning
      conditions.unshift({
        name: 'Medical Emergency',
        description: 'Your symptoms suggest a potentially serious medical condition that requires immediate attention.',
        selfCare: [
          'Seek emergency medical help immediately',
          'Call 999 (UK) or go to your local emergency services',
          'Do not delay seeking professional medical care'
        ],
        nhsUrl: 'https://www.nhs.uk/service-search/other-services/Urgent-Care/LocationSearch/1824'
      });
    }
    
    return conditions;
  } catch (error) {
    console.error('Error formatting NHS response:', error);
    return [];
  }
}

// Helper function to extract self-care information from NHS API response
function extractSelfCareFromNHSResponse(entity: any) {
  // Try to extract self-care advice from the response
  // This is a simplified version - the actual implementation would depend on NHS API structure
  const selfCare: string[] = [];
  
  // Check if there's a hasPart array with advice
  if (entity.hasPart && Array.isArray(entity.hasPart)) {
    entity.hasPart.forEach((part: any) => {
      if (part.name && (
          part.name.toLowerCase().includes('self-care') || 
          part.name.toLowerCase().includes('treatment') ||
          part.name.toLowerCase().includes('manage') ||
          part.name.toLowerCase().includes('advice')
        )) {
        // Extract text content if available
        if (part.text) {
          selfCare.push(part.text);
        }
      }
    });
  }
  
  // Return extracted advice or default advice
  return selfCare.length > 0 ? selfCare : [
    'Rest and stay hydrated',
    'Take over-the-counter medications as directed for symptom relief',
    'Monitor your symptoms and seek medical attention if they worsen'
  ];
}

// Fallback data in case the NHS API fails or returns no results
function getFallbackConditions(symptomQuery: string) {
  console.log(`Generating fallback conditions for query: "${symptomQuery}"`);
  
  // Define a more comprehensive set of conditions mapped to symptoms
  const conditionsDatabase = [
    {
      symptoms: ['cold', 'sneez', 'cough', 'sore throat', 'runny nose', 'stuffy nose', 'congestion', 'mucus'],
      name: 'Common Cold',
      description: 'A mild viral infection of the nose, throat, sinuses and upper airways.',
      selfCare: [
        'Get plenty of rest',
        'Drink plenty of fluids',
        'Take paracetamol or ibuprofen to reduce temperature if necessary'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/common-cold/'
    },
    {
      symptoms: ['flu', 'fever', 'aches', 'chills', 'fatigue', 'headache', 'body ache', 'muscle ache', 'high temperature'],
      name: 'Flu (Influenza)',
      description: 'A viral infection that causes fever, aches and pains, and general malaise.',
      selfCare: [
        'Rest and sleep',
        'Keep warm',
        'Take paracetamol or ibuprofen to lower temperature and treat aches and pains',
        'Drink plenty of water'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/flu/'
    },
    {
      symptoms: ['covid', 'coronavirus', 'loss of taste', 'loss of smell', 'shortness of breath', 'high temperature', 'continuous cough'],
      name: 'COVID-19',
      description: 'An infectious disease caused by the SARS-CoV-2 virus affecting respiratory systems.',
      selfCare: [
        'Rest and stay hydrated',
        'Take paracetamol if needed for pain and fever',
        'Monitor your symptoms carefully',
        'Follow current local guidance on isolation'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/coronavirus-covid-19/'
    },
    {
      symptoms: ['feet', 'foot', 'ankle', 'heel', 'toe', 'arch', 'sole', 'plantar'],
      name: 'Foot Pain',
      description: 'Pain in the foot can be caused by injury, overuse, or conditions such as plantar fasciitis or arthritis.',
      selfCare: [
        'Rest your foot when possible',
        'Apply ice to reduce swelling',
        'Take over-the-counter pain relievers',
        'Wear properly fitting footwear'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/foot-pain/'
    },
    {
      symptoms: ['headache', 'migraine', 'head pain', 'tension headache', 'throbbing head'],
      name: 'Headache',
      description: 'Pain in any region of the head. Headaches may occur on one or both sides of the head, be isolated to a certain location, or radiate across the head.',
      selfCare: [
        'Rest in a quiet, dark room',
        'Use a hot or cold compress',
        'Try over-the-counter pain relievers like paracetamol or ibuprofen',
        'Stay hydrated'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/headaches/'
    },
    {
      symptoms: ['stomach', 'nausea', 'vomit', 'diarrhea', 'diarrhoea', 'abdominal', 'belly', 'food poisoning', 'gastroenteritis'],
      name: 'Gastroenteritis',
      description: 'Inflammation of the stomach and intestines, typically resulting from bacterial toxins or viral infection.',
      selfCare: [
        'Stay hydrated by drinking water, clear broths, or oral rehydration solutions',
        'Rest and avoid solid foods until vomiting stops',
        'Gradually reintroduce bland, easy-to-digest foods',
        'Avoid dairy products, caffeine, alcohol, and fatty or highly seasoned foods'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/diarrhoea-and-vomiting/'
    },
    {
      symptoms: ['skin', 'rash', 'itch', 'blister', 'hives', 'dermatitis', 'eczema'],
      name: 'Skin Rash',
      description: 'A skin rash can appear as a change in color, texture, or both on the skin. It may be localized or spread across the body.',
      selfCare: [
        'Avoid scratching the affected area',
        'Apply cool compresses to the area',
        'Use mild, fragrance-free soaps and moisturizers',
        'Consider over-the-counter antihistamines or hydrocortisone cream for itching'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/rashes-babies-and-children/'
    },
    {
      symptoms: ['back', 'spine', 'lower back', 'upper back', 'backache', 'slipped disc', 'sciatica'],
      name: 'Back Pain',
      description: 'Pain felt in the back that usually originates from the muscles, nerves, bones, joints or other structures in the spine.',
      selfCare: [
        'Stay active and continue with daily activities as much as possible',
        'Take over-the-counter pain relievers like ibuprofen or paracetamol',
        'Use hot or cold compression packs',
        'Sleep on a firm, supportive mattress'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/back-pain/'
    }
  ];
  
  // Convert the query to lowercase for matching
  const lowerCaseQuery = symptomQuery.toLowerCase();
  
  // Score each condition based on how many of its symptoms match the query
  const scoredConditions = conditionsDatabase.map(condition => {
    let score = 0;
    for (const symptom of condition.symptoms) {
      if (lowerCaseQuery.includes(symptom)) {
        score++;
      }
    }
    return { condition, score };
  }).sort((a, b) => b.score - a.score); // Sort by score (highest first)
  
  console.log('Scored conditions:', scoredConditions.map(sc => ({ name: sc.condition.name, score: sc.score })));
  
  // Filter to only include conditions with at least one matching symptom
  const matchingConditions = scoredConditions.filter(sc => sc.score > 0).map(sc => sc.condition);
  
  // If there's a clear emergency, prioritize it
  if (checkForEmergency(symptomQuery) === 'urgent') {
    matchingConditions.unshift({
      symptoms: ['emergency', 'urgent', 'immediate', 'severe'],
      name: 'Medical Emergency',
      description: 'Your symptoms suggest a potentially serious medical condition that requires immediate attention.',
      selfCare: [
        'Seek emergency medical help immediately',
        'Call 999 (UK) or go to your local emergency services',
        'Do not delay seeking professional medical care'
      ],
      nhsUrl: 'https://www.nhs.uk/service-search/other-services/Urgent-Care/LocationSearch/1824'
    });
  }
  
  // If no matches, return a generic message with a subset of common conditions
  if (matchingConditions.length === 0) {
    console.log('No matching conditions found, using default set');
    // Return the first three conditions as default
    return conditionsDatabase.slice(0, 3);
  }
  
  // Return the matching conditions
  return matchingConditions;
}

// Azure OpenAI integration
async function analyzeWithOpenAI(symptoms: string, nhsConditions: any[]) {
  try {
    // Azure OpenAI API configuration
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://mango-bush-0a9e12903.5.azurestaticapps.net/api/v1';
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY || 'd3218654-a956-40bd-bd02-ee59c7b8299f';
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'mango-bush-0a9e12903';
    
    // Check if we have all required configuration
    if (!azureEndpoint || !azureApiKey || !deploymentName) {
      console.warn('Azure OpenAI configuration missing, using fallback analysis');
      return getFallbackAnalysis(symptoms, nhsConditions);
    }
    
    try {
      // Detect if symptoms describe a serious emergency
      const emergencyLevel = checkForEmergency(symptoms);
      
      // System prompt for medical analysis
      const systemPrompt = `
        You are a medical assistant for SympCheck, an NHS-supported app that helps users assess their symptoms.
        You analyze symptoms and provide guidance on possible conditions, self-care, and when to seek medical help.
        
        You should:
        1. Analyze the symptoms to identify possible conditions
        2. Provide self-care advice appropriate for the symptoms
        3. Suggest suitable over-the-counter medications if appropriate
        4. Determine the urgency level (urgent, soon, routine)
        5. Format your response as JSON with the following structure:
        {
          "general_advice": "Overall advice about the condition and symptoms",
          "self_care": ["List of self-care recommendations"],
          "medications": [{"name": "Medication name", "dosage": "Recommended dosage", "instructions": "Usage instructions"}],
          "urgency_level": "urgent|soon|routine",
          "urgency_message": "Specific advice about when to seek medical help"
        }
        
        IMPORTANT: Match your response to the specific symptoms described:
        - For foot/ankle/leg pain: Give appropriate advice about rest, elevation, compression, ice, etc.
        - For head/migraine symptoms: Recommend appropriate pain relief, rest in dark rooms, etc.
        - For stomach/digestive issues: Suggest appropriate dietary changes and hydration
        - For skin conditions: Recommend appropriate creams, avoiding irritants, etc.
        
        CRITICAL: If the user mentions ANY potentially serious symptoms like bleeding heavily, difficulty breathing, chest pain,
        severe pain, stabbing, loss of consciousness, stroke symptoms, or injuries that require immediate medical attention, 
        you MUST set the urgency_level to "urgent" and provide appropriate emergency guidance.
        
        For medication recommendations, include dosage and usage instructions.
        Be factual and concise. Use British English.
        Emphasize that your advice is not a replacement for professional medical diagnosis.
      `;
    
      // Call Azure OpenAI API
      const response = await fetch(`${azureEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze these symptoms: ${symptoms}. Also consider these possible conditions from NHS database: ${JSON.stringify(nhsConditions.map(c => c.name))}` }
          ],
          temperature: 0.3,
          max_tokens: 800,
          response_format: { type: "json_object" }
        })
      });

      // Log request for debugging
      console.log(`Azure OpenAI request for symptoms: "${symptoms}"`);

      if (!response.ok) {
        console.error('Azure OpenAI API error:', response.status, response.statusText);
        // If we detected an emergency, override the fallback with emergency response
        if (emergencyLevel === 'urgent') {
          const emergencyResponse = getEmergencyResponse(symptoms);
          console.log('Providing emergency response for:', symptoms);
          return emergencyResponse;
        }
        return getFallbackAnalysis(symptoms, nhsConditions);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        console.error('No content in Azure OpenAI response');
        if (emergencyLevel === 'urgent') {
          const emergencyResponse = getEmergencyResponse(symptoms);
          console.log('Providing emergency response for:', symptoms);
          return emergencyResponse;
        }
        return getFallbackAnalysis(symptoms, nhsConditions);
      }

      console.log('Azure OpenAI raw response:', aiResponse);

      // Parse AI response
      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(aiResponse);
        console.log('Parsed AI response:', JSON.stringify(aiAnalysis, null, 2));
        
        // Normalize response fields (the model might use different field names)
        aiAnalysis = {
          general_advice: aiAnalysis.general_advice || aiAnalysis.generalAdvice || aiAnalysis.advice || aiAnalysis.general || '',
          self_care: Array.isArray(aiAnalysis.self_care) ? 
            aiAnalysis.self_care : 
            (Array.isArray(aiAnalysis.selfCare) ? 
              aiAnalysis.selfCare : 
              (typeof aiAnalysis.self_care === 'string' ? 
                [aiAnalysis.self_care] : 
                [])),
          medications: Array.isArray(aiAnalysis.medications) ? 
            aiAnalysis.medications : 
            (Array.isArray(aiAnalysis.medication) ? 
              aiAnalysis.medication : 
              []),
          urgency_level: aiAnalysis.urgency_level || 
            aiAnalysis.urgencyLevel || 
            aiAnalysis.level || 
            aiAnalysis.severity || 
            'routine',
          urgency_message: aiAnalysis.urgency_message || 
            aiAnalysis.urgencyMessage || 
            aiAnalysis.message || 
            ''
        };
        
        // Ensure urgency level is one of the expected values
        if (!['urgent', 'soon', 'routine'].includes(aiAnalysis.urgency_level)) {
          aiAnalysis.urgency_level = 'routine';
        }
        
        // Log normalized response
        console.log('Normalized AI response:', JSON.stringify(aiAnalysis, null, 2));
      } catch (error) {
        console.error('Failed to parse AI response JSON:', error);
        if (emergencyLevel === 'urgent') {
          const emergencyResponse = getEmergencyResponse(symptoms);
          console.log('Providing emergency response for:', symptoms);
          return emergencyResponse;
        }
        return getFallbackAnalysis(symptoms, nhsConditions);
      }
      
      // Override with emergency response if we detected it's urgent but AI didn't
      if (emergencyLevel === 'urgent' && aiAnalysis.urgency_level !== 'urgent') {
        console.log('Overriding AI response with emergency response for:', symptoms);
        const emergencyResponse = getEmergencyResponse(symptoms);
        return emergencyResponse;
      }
      
      // Combine AI analysis with NHS data
      return {
        possibleConditions: nhsConditions.map(condition => ({
          name: condition.name,
          description: condition.description,
          nhsUrl: condition.nhsUrl
        })),
        recommendations: {
          general: aiAnalysis.general_advice || `Based on your symptoms (${symptoms}), here are some recommendations for managing your condition.`,
          selfCare: aiAnalysis.self_care || (nhsConditions.length > 0 ? nhsConditions[0].selfCare : [
            'Rest and stay hydrated',
            'Monitor your symptoms and seek medical attention if they worsen'
          ]),
          medications: aiAnalysis.medications || []
        },
        escalation: {
          level: aiAnalysis.urgency_level || determineFallbackEscalationLevel(symptoms),
          message: aiAnalysis.urgency_message || getEscalationMessage(aiAnalysis.urgency_level || determineFallbackEscalationLevel(symptoms))
        }
      };
      
    } catch (error) {
      console.error('Error with Azure OpenAI API call:', error);
      return getFallbackAnalysis(symptoms, nhsConditions);
    }
    
  } catch (error) {
    console.error('Error analyzing with OpenAI:', error);
    return getFallbackAnalysis(symptoms, nhsConditions);
  }
}

// Function to check if symptoms describe an emergency
function checkForEmergency(symptoms: string) {
  const lowerCaseSymptoms = symptoms.toLowerCase();
  
  // Critical emergency keywords that always require immediate attention
  const criticalKeywords = [
    'bleeding heavily', 'severe bleeding', 'stabbed', 'stabbing', 'gunshot', 
    'can\'t breathe', 'cannot breathe', 'struggling to breathe', 'difficulty breathing',
    'chest pain', 'heart attack', 'stroke', 'unconscious', 'passed out',
    'seizure', 'convulsion', 'fitting', 'broken bone', 'fracture',
    'severe allergic', 'anaphylaxis', 'anaphylactic', 'poisoning',
    'overdose', 'suicide', 'self-harm'
  ];
  
  // Check for critical emergency keywords
  for (const keyword of criticalKeywords) {
    if (lowerCaseSymptoms.includes(keyword)) {
      return 'urgent';
    }
  }
  
  return determineFallbackEscalationLevel(symptoms);
}

// Get an emergency response for critical symptoms
function getEmergencyResponse(symptoms: string) {
  return {
    possibleConditions: [
      {
        name: 'Medical Emergency',
        description: 'Your symptoms suggest a potentially serious medical condition that requires immediate attention.',
        nhsUrl: 'https://www.nhs.uk/service-search/other-services/Urgent-Care/LocationSearch/1824'
      }
    ],
    recommendations: {
      general: 'Your symptoms indicate you need immediate medical attention. This is not something to manage at home.',
      selfCare: [
        'Seek emergency medical help immediately',
        'Call 999 (UK) or your local emergency services',
        'Do not delay seeking professional medical care'
      ],
      medications: []
    },
    escalation: {
      level: 'urgent',
      message: 'Your symptoms require IMMEDIATE medical attention. Please call 999 or go to A&E immediately.'
    }
  };
}

// Fallback analysis in case Azure OpenAI fails
function getFallbackAnalysis(symptoms: string, nhsConditions: any[]) {
  // Determine escalation level based on symptoms
  const escalationLevel = determineFallbackEscalationLevel(symptoms);
  const escalationMessage = getEscalationMessage(escalationLevel);
  
  // Determine medications based on symptoms
  const medications = determineFallbackMedications(symptoms);
  
  return {
    possibleConditions: nhsConditions.map(condition => ({
      name: condition.name,
      description: condition.description,
      nhsUrl: condition.nhsUrl
    })),
    recommendations: {
      general: `Based on your symptoms (${symptoms}), here are some recommendations for managing your condition.`,
      selfCare: nhsConditions.length > 0 ? nhsConditions[0].selfCare : [
        'Rest and stay hydrated',
        'Monitor your symptoms and seek medical attention if they worsen'
      ],
      medications: medications.length > 0 ? medications : null
    },
    escalation: {
      level: escalationLevel,
      message: escalationMessage
    }
  };
}

// Helper function to determine escalation level based on symptoms
function determineFallbackEscalationLevel(symptoms: string) {
  const lowerCaseSymptoms = symptoms.toLowerCase();
  
  // Keywords indicating urgent care needed
  const urgentKeywords = [
    'severe', 'struggle to breathe', 'chest pain', 'collapse', 'unconscious',
    'difficulty breathing', 'stroke', 'heart attack', 'seizure', 'unresponsive',
    'unable to move', 'bleeding heavily', 'choking', 'stabbed', 'stabbing',
    'gun shot', 'gunshot', 'knife', 'head injury', 'head trauma',
    'can\'t breathe', 'cannot breathe', 'not breathing', 'stopped breathing',
    'fractured', 'broken bone', 'dislocated', 'wound', 'deep cut',
    'severe allergic', 'anaphylaxis', 'anaphylactic', 'swollen throat',
    'coughing blood', 'vomiting blood', 'blood in stool', 'blood in urine',
    'sudden weakness', 'sudden numbness', 'sudden vision loss',
    'poisoning', 'overdose', 'drug overdose', 'alcohol poisoning',
    'suicide', 'self harm', 'harming myself', 'kill myself', 'end my life'
  ];
  
  // Keywords indicating care needed soon
  const soonKeywords = [
    'fever', 'high temperature', 'worsening', 'persisting', 'getting worse', 
    'no improvement', 'infection', 'infected', 'spreading', 'unusual rash', 
    'dehydrated', 'vomiting repeatedly', 'constant vomiting', 'can\'t keep fluids down',
    'severe pain', 'intense pain', 'worst headache', 'migraine', 
    'painful urination', 'abdominal pain', 'stomach pain', 'ear pain',
    'swollen', 'inflammation', 'inflamed', 'pus', 'abscess',
    'can\'t walk', 'can\'t move', 'difficulty moving', 'stiffness', 
    'jaundice', 'yellow skin', 'yellow eyes'
  ];
  
  // Check for urgent keywords
  for (const keyword of urgentKeywords) {
    if (lowerCaseSymptoms.includes(keyword)) {
      return 'urgent';
    }
  }
  
  // Check for soon keywords
  for (const keyword of soonKeywords) {
    if (lowerCaseSymptoms.includes(keyword)) {
      return 'soon';
    }
  }
  
  // Default to routine
  return 'routine';
}

// Helper function to get escalation message based on level
function getEscalationMessage(level: string) {
  switch (level) {
    case 'urgent':
      return 'Your symptoms suggest you need URGENT medical attention. Please contact emergency services (999) or go to A&E immediately.';
    case 'soon':
      return 'Your symptoms suggest you should speak to a healthcare professional within the next 24-48 hours. Contact your GP or call NHS 111 for advice.';
    default:
      return 'Your symptoms can likely be managed with self-care, but consult a GP if they persist or worsen.';
  }
}

// Helper function to determine medications based on symptoms
function determineFallbackMedications(symptoms: string) {
  const lowerCaseSymptoms = symptoms.toLowerCase();
  const medications = [];
  
  // Check for common symptoms and recommend appropriate medications
  if (lowerCaseSymptoms.includes('headache') || lowerCaseSymptoms.includes('pain')) {
    medications.push({
      name: 'Paracetamol',
      dosage: '500-1000mg every 4-6 hours, max 4g per day',
      instructions: 'Take with water, with or after food if needed'
    });
  }
  
  if (lowerCaseSymptoms.includes('fever') || 
      lowerCaseSymptoms.includes('inflammation') || 
      lowerCaseSymptoms.includes('pain')) {
    medications.push({
      name: 'Ibuprofen',
      dosage: '200-400mg every 4-6 hours, max 1200mg per day',
      instructions: 'Take with or after food to reduce stomach irritation'
    });
  }
  
  if (lowerCaseSymptoms.includes('congestion') || 
      lowerCaseSymptoms.includes('blocked nose') || 
      lowerCaseSymptoms.includes('stuffy')) {
    medications.push({
      name: 'Decongestant nasal spray',
      dosage: 'Follow package instructions',
      instructions: 'Do not use for more than 7 days to avoid rebound congestion'
    });
  }
  
  if (lowerCaseSymptoms.includes('cough')) {
    medications.push({
      name: 'Cough syrup',
      dosage: 'Follow package instructions',
      instructions: 'Choose between dry or chesty cough formulations depending on your symptoms'
    });
  }
  
  if (lowerCaseSymptoms.includes('sore throat')) {
    medications.push({
      name: 'Throat lozenges',
      dosage: 'Follow package instructions',
      instructions: 'Suck the lozenge until it dissolves. Do not chew.'
    });
  }
  
  if (lowerCaseSymptoms.includes('allergy') || 
      lowerCaseSymptoms.includes('itchy') || 
      lowerCaseSymptoms.includes('rash')) {
    medications.push({
      name: 'Antihistamine',
      dosage: 'Follow package instructions',
      instructions: 'Non-drowsy formulations are available for daytime use'
    });
  }
  
  return medications;
}

export async function POST(request: NextRequest) {
  try {
    const { symptoms } = await request.json();
    
    if (!symptoms || typeof symptoms !== 'string') {
      return NextResponse.json(
        { error: 'Symptoms must be provided as a string' },
        { status: 400 }
      );
    }
    
    console.log(`==== Starting symptom analysis for: "${symptoms}" ====`);
    
    // Get relevant conditions from NHS API
    const nhsConditions = await getNHSConditionsInfo(symptoms);
    console.log(`NHS API returned ${nhsConditions.length} conditions`);
    
    // Check for emergency symptoms directly
    const emergencyLevel = checkForEmergency(symptoms);
    if (emergencyLevel === 'urgent') {
      console.log(`EMERGENCY detected in symptoms: "${symptoms}"`);
    }
    
    // Analyze symptoms with Azure OpenAI
    console.log(`Calling Azure OpenAI API for symptom analysis...`);
    const analysis = await analyzeWithOpenAI(symptoms, nhsConditions);
    
    console.log(`Analysis complete. Urgency level: ${analysis.escalation.level}`);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Error in symptom analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
} 