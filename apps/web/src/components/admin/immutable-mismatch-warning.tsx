"use client";

interface DiffEntry {
  field: string;
  sanityValue: unknown;
  onChainValue: unknown;
  updateable: boolean;
}

interface ImmutableMismatchWarningProps {
  immutableDiffs: DiffEntry[];
  courseTitle: string;
}

export function ImmutableMismatchWarning({
  immutableDiffs,
  courseTitle,
}: ImmutableMismatchWarningProps) {
  if (immutableDiffs.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-danger bg-danger-light p-3 text-sm">
      <p className="mb-2 font-semibold text-danger">
        Immutable field mismatch — cannot auto-fix
      </p>
      <ul className="space-y-1 font-mono text-xs text-danger">
        {immutableDiffs.map((d) => (
          <li key={d.field}>
            <span className="text-text-3">{d.field}:</span> on-chain{" "}
            <span className="text-danger">{String(d.onChainValue)}</span> →
            Sanity <span className="text-accent">{String(d.sanityValue)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-text-3">
        {`"${courseTitle}"`} has immutable fields that differ. Options: 1.
        Revert the change in Sanity Studio, or 2. Deactivate this course and
        deploy a new version.
      </p>
    </div>
  );
}
