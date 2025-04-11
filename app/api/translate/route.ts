import { NextRequest, NextResponse } from 'next/server';

// Demo implementations for translation when in demo mode
const demoTranslations: Record<string, Record<string, string>> = {
  'en': {
    'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.': 'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.',
    'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!': 'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!',
  },
  'es': {
    'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.': '¿Qué síntomas está experimentando? Por favor, incluya cuándo comenzaron, su gravedad y cualquier otra información de salud relevante.',
    'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!': 'Puede hacer clic en el botón redondo de reproducción junto a este mensaje para escucharlo en voz alta. ¡Haga clic ahora para probar la función de texto a voz!',
  },
  'fr': {
    'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.': 'Quels symptômes ressentez-vous ? Veuillez indiquer quand ils ont commencé, leur gravité et toute autre information de santé pertinente.',
    'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!': 'Vous pouvez cliquer sur le bouton rond de lecture à côté de ce message pour l\'entendre à haute voix. Cliquez maintenant pour essayer la fonction de synthèse vocale !',
  },
  'de': {
    'What symptoms are you experiencing? Please include when they started, their severity, and any other relevant health information.': 'Welche Symptome haben Sie? Bitte geben Sie an, wann sie begannen, wie stark sie sind und andere relevante Gesundheitsinformationen.',
    'You can click the round play button next to this message to hear it read aloud. Click it now to try the text-to-speech feature!': 'Sie können auf die runde Wiedergabetaste neben dieser Nachricht klicken, um sie laut vorlesen zu lassen. Klicken Sie jetzt, um die Text-to-Speech-Funktion auszuprobieren!',
  },
};

// Default translations for common messages
const getDefaultTranslation = (text: string, targetLanguage: string): string | null => {
  if (demoTranslations[targetLanguage] && demoTranslations[targetLanguage][text]) {
    return demoTranslations[targetLanguage][text];
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();
    
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }
    
    // Check if we have a pre-defined translation for demo purposes
    const defaultTranslation = getDefaultTranslation(text, targetLanguage);
    if (defaultTranslation) {
      return NextResponse.json({
        translatedText: defaultTranslation,
        source: 'demo'
      });
    }

    // If AZURE_SPEECH_KEY is set to DEMO_MODE, perform a simple mock translation
    if (process.env.AZURE_SPEECH_KEY === 'DEMO_MODE') {
      // Create a simple mock translation by adding a prefix to indicate the language
      let mockTranslation = '';
      
      switch (targetLanguage) {
        case 'es':
          mockTranslation = `[ES] ${text}`;
          break;
        case 'fr':
          mockTranslation = `[FR] ${text}`;
          break;
        case 'de':
          mockTranslation = `[DE] ${text}`;
          break;
        case 'zh':
          mockTranslation = `[ZH] ${text}`;
          break;
        case 'ar':
          mockTranslation = `[AR] ${text}`;
          break;
        case 'hi':
          mockTranslation = `[HI] ${text}`;
          break;
        case 'ru':
          mockTranslation = `[RU] ${text}`;
          break;
        default:
          mockTranslation = text;
      }
      
      return NextResponse.json({
        translatedText: mockTranslation,
        source: 'mock'
      });
    }
    
    // For a production implementation, you would use Azure AI Translator or another translation service
    // Example with Azure AI Translator:
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || '';
    const apiKey = process.env.AZURE_TRANSLATOR_KEY || '';
    const region = process.env.AZURE_TRANSLATOR_REGION || '';
    
    if (!endpoint || !apiKey || !region) {
      console.warn('Azure Translator credentials not configured, using mock translation');
      return NextResponse.json({
        translatedText: `[${targetLanguage.toUpperCase()}] ${text}`,
        source: 'mock'
      });
    }
    
    // Actual API call to Azure AI Translator
    const url = `${endpoint}/translate?api-version=3.0&from=en&to=${targetLanguage}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    });
    
    if (!response.ok) {
      console.error('Translation API error:', await response.text());
      throw new Error(`Translation failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      translatedText: data[0].translations[0].text,
      source: 'azure'
    });
    
  } catch (error) {
    console.error('Error in translation API:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
} 