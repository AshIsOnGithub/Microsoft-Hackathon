import { redirect } from 'next/navigation';

export const dynamic = 'force-static';
export const revalidate = false;

export default function ProfilePage() {
  redirect('/dashboard/profile');
} 