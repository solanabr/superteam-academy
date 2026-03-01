import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <MagnifyingGlass className="size-7 text-muted-foreground" weight="duotone" />
      </div>
      <h3 className="mt-4 font-heading text-lg font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
