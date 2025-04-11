// This is a static route adapter for Next.js App Router
export default function ProfilePage({ params }: { params: { userId: string } }) {
  // We just pass the userId down to the client component
  return <PublicProfileClient userId={params.userId} />;
}

// Import at the end to avoid circular dependencies
import PublicProfileClient from './PublicProfileClient'; 