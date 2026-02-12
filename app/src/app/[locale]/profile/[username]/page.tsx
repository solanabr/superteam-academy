import { setRequestLocale } from 'next-intl/server';
import { ProfileView } from '../profile-view';

type Props = { params: Promise<{ locale: string; username: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileView />;
}
