import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  action?: () => void; // Optional function if not a link
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-[#2E2E36] rounded-xl bg-[#0A0A0F]/50">
      <div className="w-16 h-16 rounded-full bg-[#1E1E24] flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-sm mb-8">{description}</p>
      
      {actionLabel && (
        actionLink ? (
          <Button asChild variant="default" className="bg-[#9945FF] hover:bg-[#7b35cc] text-white">
            <Link href={actionLink}>
              {actionLabel}
            </Link>
          </Button>
        ) : (
             <Button onClick={action} variant="default" className="bg-[#9945FF] hover:bg-[#7b35cc] text-white">
                {actionLabel}
             </Button>
        )
      )}
    </div>
  );
}
