import { NextRequest, NextResponse } from 'next/server';

// NHS API integration
async function getNHSConditionsInfo(symptomQuery: string) {
  try {
    // NHS API endpoint with the provided subscription key
    const primaryKey = process.env.NHS_API_SUBSCRIPTION_KEY || 'a4d98ea331f24a91a2033144988faeed';
    
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

    // Check if the request was successful
    if (!response.ok) {
      console.error('NHS API error:', response.status, response.statusText);
      return getFallbackConditions(symptomQuery);
    }

    const data = await response.json();
    
    // Format the NHS API response
    const conditions = data.mainEntityOfPage?.map((entity: any) => {
      return {
        name: entity.name || 'Unknown Condition',
        description: entity.description || 'No description available',
        selfCare: extractSelfCareFromNHSResponse(entity),
        nhsUrl: entity.url || 'https://www.nhs.uk/conditions/'
      };
    }) || [];

    // If no results, return fallback data
    return conditions.length > 0 ? conditions : getFallbackConditions(symptomQuery);
    
  } catch (error) {
    console.error('Error fetching NHS conditions:', error);
    // Return fallback data if the API fails
    return getFallbackConditions(symptomQuery);
  }
}

// Helper function to extract self-care information from NHS API response
function extractSelfCareFromNHSResponse(entity: any) {
  // Try to extract self-care advice from the response
  // This is a simplified version - the actual implementation would depend on NHS API structure
  const selfCare = [];
  
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
  const mockConditions = [
    {
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
      name: 'COVID-19',
      description: 'An infectious disease caused by the SARS-CoV-2 virus affecting respiratory systems.',
      selfCare: [
        'Rest and stay hydrated',
        'Take paracetamol if needed for pain and fever',
        'Monitor your symptoms carefully',
        'Follow current local guidance on isolation'
      ],
      nhsUrl: 'https://www.nhs.uk/conditions/coronavirus-covid-19/'
    }
  ];
  
  // Filter based on the symptom query
  const lowerCaseQuery = symptomQuery.toLowerCase();
  const filteredConditions = mockConditions.filter(condition => {
    return (
      condition.name.toLowerCase().includes(lowerCaseQuery) || 
      condition.description.toLowerCase().includes(lowerCaseQuery)
    );
  });
  
  // Return all if none match (for demo purposes)
  return filteredConditions.length > 0 ? filteredConditions : mockConditions;
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
      // System prompt for medical analysis
      const systemPrompt = `
        You are a medical assistant for SympCheck, an NHS-supported app that helps users assess their symptoms.
        You analyze symptoms and provide guidance on possible conditions, self-care, and when to seek medical help.
        You should:
        1. Analyze the symptoms to identify possible conditions
        2. Provide self-care advice appropriate for the symptoms
        3. Suggest suitable over-the-counter medications if appropriate
        4. Determine the urgency level (urgent, soon, routine)
        5. Format your response as JSON
        
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

      if (!response.ok) {
        console.error('Azure OpenAI API error:', response.status, response.statusText);
        return getFallbackAnalysis(symptoms, nhsConditions);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        console.error('No content in Azure OpenAI response');
        return getFallbackAnalysis(symptoms, nhsConditions);
      }

      // Parse AI response
      const aiAnalysis = JSON.parse(aiResponse);
      
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
          message: aiAnalysis.urgency_message || getEscalationMessage(determineFallbackEscalationLevel(symptoms))
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
    'unable to move', 'bleeding heavily', 'choking'
  ];
  
  // Keywords indicating care needed soon
  const soonKeywords = [
    'fever', 'worsening', 'persisting', 'getting worse', 'no improvement',
    'infection', 'spreading', 'unusual rash', 'dehydrated', 'vomiting repeatedly'
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
      return 'Your symptoms suggest you need urgent medical attention. Please contact emergency services or go to A&E.';
    case 'soon':
      return 'Your symptoms suggest you should speak to a doctor within the next 24-48 hours.';
    default:
      return 'Your symptoms can likely be managed with self-care, but consult a GP if they persist.';
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
    
    // Get relevant conditions from NHS API
    const nhsConditions = await getNHSConditionsInfo(symptoms);
    
    // Analyze symptoms with Azure OpenAI
    const analysis = await analyzeWithOpenAI(symptoms, nhsConditions);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Error in symptom analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
} 