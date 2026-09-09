import { redirect } from 'next/navigation';

// Signup is now handled by Google OAuth on the login page
export default function SignupPage() {
  redirect('/login');
}
