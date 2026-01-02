import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login first to avoid hanging on dashboard
  redirect('/login');
}
