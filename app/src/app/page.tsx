import { redirect } from 'next/navigation';

export default function RootPage() {
  // Default to Portuguese (Brazil)
  redirect('/pt');
}