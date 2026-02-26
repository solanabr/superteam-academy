export default function Loading() {
	return (
		<div className="min-h-[60vh] bg-background">
			<div className="mx-auto px-4 sm:px-6 py-8 space-y-6">
				<div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
				<div className="h-4 w-72 bg-muted animate-pulse rounded-lg" />
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
					))}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
					))}
				</div>
			</div>
		</div>
	);
}
