import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <p className="text-8xl font-bold text-primary/20">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-center text-muted-foreground">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link href="/">
        <Button className="mt-8" size="lg">
          Back to home
        </Button>
      </Link>
    </div>
  );
}
