🏷️ Project Name:
SympCheck
Tagline: “Feel something? Check it fast. Stress-free care starts here.”

🎯 Objective:
Develop a mobile-first AI-powered symptom checker app that reduces unnecessary pressure on NHS and local councils by helping users self-assess non-urgent health issues and take the right next step — from over-the-counter solutions to escalations (GP booking, NHS 111, or A&E).

The app supports:

Residents with non-urgent health issues

Elderly users needing carer support

Parents needing night-time symptom clarity

People without a registered GP

Aligned with:

UN SDG 3 – Good Health & Well-being

Microsoft Hackathon Theme: AI for Sustainable Digital Services for Local Councils

🧩 MVP Feature Set
Symptom Checker AI (Chat UI)

Natural language input (e.g., "I have a sore throat and headache")

Response includes:

Possible cause

Self-care guidance

OTC medication suggestions

Whether escalation is advised

Auto-Triage + Escalation Flow

If symptoms require attention:

Option to book a GP (mocked)

Redirect to NHS 111 or urgent care

Nearby pharmacy locator (Azure Maps)

OTC Medication Suggestions

Suggest meds with dosage

Find open nearby pharmacy

Health Profile + History

Log symptoms + history for sharing with GP

Support multiple profiles (elderly/children)

🧠 AI Components
Azure OpenAI (GPT-4o mini)
→ Symptom analysis, recommendation generation, triage logic
→ Can use function calling to trigger actions (e.g., booking, map query)

Azure Cognitive Services

Translator API for non-English support

Immersive Reader / Voice Input for accessibility

🧱 Tech Stack
Layer	Tool / Service
Frontend	React (Next.js) or React Native
Backend	Node.js + Express
Authentication	Supabase Auth
Database	Supabase Postgres or Azure Cosmos DB
AI/LLM	Azure OpenAI (GPT-4o mini)
NHS Content API	NHS Website Content API v2
Geolocation	Azure Maps
Notifications	Azure Notification Hubs
Booking	Microsoft Graph API (Calendar)
📦 Data Handling
End-to-end encrypted (at rest + in transit)

GDPR-aligned

NHS-compliant architecture (mocked where necessary)

Optional MS Verified ID via Entra for secure profile sharing

🖼️ Output Goals (for Demo)
Working AI-powered chat for symptoms

Live OTC suggestion with location lookup

Option to escalate (mocked GP booking or 111 redirect)

Simple health history component

Clean UI (mobile-first)

Use british English


🎨 SympCheck Blue-White Color Palette
Element	Color	Usage
Primary Blue	#1E88E5	Buttons, highlights, links
Secondary Blue	#90CAF9	Hover states, cards, backgrounds
Dark Blue	#1565C0	Headers, CTAs, icons
Accent Sky Blue	#E3F2FD	Section backgrounds, soft cards
White	#FFFFFF	Main background
Off-white	#F9FAFB	Cards, containers
Text Black	#212121	Primary text
Text Grey	#757575	Secondary text, hints, labels
Error Red	#E53935	Validation errors, urgent alerts
Success Green	#43A047	Success messages, confirmations

🧠 Design Tips
Font: Use a clean sans-serif like Inter, Roboto, or SF Pro.

Layout: Stick to white or off-white backgrounds with cards/containers using subtle blues (#E3F2FD or #F9FAFB) and outlines/shadows.

Buttons:

Primary: Blue (#1E88E5) with white text

Secondary: Transparent with blue border and text

Icons & Illustrations: Use blue monochrome line icons or soft gradients in sky blue tones.

Accessibility: Maintain high contrast between text and backgrounds, especially for the elderly.



