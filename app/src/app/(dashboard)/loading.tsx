import { LogoLoader } from '@/components/ui/logo-loader';

export default function Loading() {
  return (
    <div className="bg-background fixed inset-0 z-50 flex items-center justify-center">
      <LogoLoader size="2xl" message="Loading..." />
    </div>
  );
}
