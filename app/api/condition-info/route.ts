import { NextRequest, NextResponse } from 'next/server';

// Mock data for common conditions
const conditionData: Record<string, any> = {
  'common cold': {
    info: 'The common cold is a viral infection affecting your nose and throat (upper respiratory tract). It\'s usually harmless, although it might not feel that way. Many types of viruses can cause a common cold. Healthy adults can expect to have two or three colds annually, while children may have more.',
    links: [
      { text: 'NHS - Common Cold', url: 'https://www.nhs.uk/conditions/common-cold/' },
      { text: 'Mayo Clinic - Common Cold', url: 'https://www.mayoclinic.org/diseases-conditions/common-cold/symptoms-causes/syc-20351605' }
    ]
  },
  'flu': {
    info: 'Influenza (flu) is a viral infection that attacks your respiratory system — your nose, throat and lungs. Influenza is commonly called the flu, but it\'s not the same as stomach "flu" viruses that cause diarrhea and vomiting. For most people, the flu resolves on its own, but sometimes it can be life-threatening.',
    links: [
      { text: 'NHS - Flu', url: 'https://www.nhs.uk/conditions/flu/' },
      { text: 'CDC - Influenza (Flu)', url: 'https://www.cdc.gov/flu/index.htm' }
    ]
  },
  'migraine': {
    info: 'A migraine is a headache that can cause severe throbbing pain or a pulsing sensation, usually on one side of the head. It\'s often accompanied by nausea, vomiting, and extreme sensitivity to light and sound. Migraine attacks can last for hours to days, and the pain can be so severe that it interferes with your daily activities.',
    links: [
      { text: 'NHS - Migraine', url: 'https://www.nhs.uk/conditions/migraine/' },
      { text: 'Migraine Trust', url: 'https://migrainetrust.org/' }
    ]
  },
  'allergic rhinitis': {
    info: 'Allergic rhinitis, also known as hay fever, is a type of inflammation in the nose caused by an allergic response to allergens in the air. It\'s characterized by a runny or stuffy nose, sneezing, red, itchy, and watery eyes, and swelling around the eyes.',
    links: [
      { text: 'NHS - Allergic rhinitis', url: 'https://www.nhs.uk/conditions/allergic-rhinitis/' },
      { text: 'Allergy UK', url: 'https://www.allergyuk.org/types-of-allergies/hay-fever/' }
    ]
  },
  'gastroenteritis': {
    info: 'Gastroenteritis is an inflammation of the lining of the intestines caused by a virus, bacteria, or parasites. Viral gastroenteritis is the second most common illness in the United States. The cause is often a norovirus infection, but rotavirus is the leading cause in children.',
    links: [
      { text: 'NHS - Gastroenteritis', url: 'https://www.nhs.uk/conditions/diarrhoea-and-vomiting/' },
      { text: 'CDC - Viral Gastroenteritis', url: 'https://www.cdc.gov/norovirus/index.html' }
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { condition } = await request.json();
    
    if (!condition) {
      return NextResponse.json(
        { error: 'Condition name is required' },
        { status: 400 }
      );
    }
    
    // Convert to lowercase and try to find the condition
    const conditionLower = condition.toLowerCase();
    
    // Find an exact match or a partial match
    const exactMatch = conditionData[conditionLower];
    if (exactMatch) {
      return NextResponse.json(exactMatch);
    }
    
    // Look for partial matches if no exact match
    const partialMatchKey = Object.keys(conditionData).find(key => 
      conditionLower.includes(key) || key.includes(conditionLower)
    );
    
    if (partialMatchKey) {
      return NextResponse.json(conditionData[partialMatchKey]);
    }
    
    // If no matches found, return a generic response
    return NextResponse.json({
      info: `${condition} is a medical condition that may require professional medical assessment. If your symptoms are concerning, please consult a healthcare provider for proper diagnosis and treatment.`,
      links: [
        { text: 'NHS Health A to Z', url: 'https://www.nhs.uk/conditions/' },
        { text: 'NHS 111 Online', url: 'https://111.nhs.uk/' }
      ]
    });
    
  } catch (error) {
    console.error('Error in condition-info API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve condition information' },
      { status: 500 }
    );
  }
} 