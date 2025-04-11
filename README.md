# SympCheck

SympCheck is an AI-powered symptom checker app that helps users self-assess non-urgent health issues and take the right next steps — from over-the-counter solutions to escalations (GP booking, NHS 111, or A&E).

## Features

- AI-powered symptom analysis using natural language
- NHS API integration for accurate condition information
- Auto-triage and appropriate escalation recommendations
- OTC medication suggestions with pharmacy locator
- Health profile and symptom history tracking
- Mobile-first design

## API Integrations

### NHS API
The app integrates with the NHS Website Content API v2 to retrieve accurate medical condition information:
- Uses subscription keys for authentication
- Fetches conditions based on user symptoms
- Provides official NHS self-care advice and links

### Azure OpenAI
Provides intelligent symptom analysis:
- Analyzes user symptoms to determine urgency level
- Suggests appropriate medications and self-care steps
- Offers personalized recommendations

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up your Supabase project and get your API keys
4. Create a `.env.local` file in the root directory with the following:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Azure OpenAI credentials
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-azure-openai-deployment-name

# NHS API credentials
NHS_API_SUBSCRIPTION_KEY=your-nhs-api-primary-key
NHS_API_SECONDARY_KEY=your-nhs-api-secondary-key
```

5. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Frontend: Next.js, React
- Authentication: Supabase Auth
- Database: Supabase (PostgreSQL)
- AI: Azure OpenAI (GPT-4o mini)
- Health Data: NHS Website Content API v2
- Styling: CSS Modules