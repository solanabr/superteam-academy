import { setRequestLocale } from 'next-intl/server';
import { ProfileView } from './profile-view';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileView />;
}
