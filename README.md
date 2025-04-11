# SympCheck

SympCheck is an AI-powered symptom checker app that helps users self-assess non-urgent health issues and take the right next steps — from over-the-counter solutions to escalations (GP booking, NHS 111, or A&E).

## Features

- AI-powered symptom analysis using natural language
- Auto-triage and appropriate escalation recommendations
- OTC medication suggestions with pharmacy locator
- Health profile and symptom history tracking
- Mobile-first design

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
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
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
- Styling: CSS Modules