export function FeaturedCoursesSkeleton() {
	return (
		<section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
			<div className="mx-auto px-4 sm:px-6">
				<div className="flex items-end justify-between mb-10">
					<div className="w-full">
						<div className="h-9 w-64 bg-muted rounded-lg mb-3 animate-pulse" />
						<div className="h-6 w-80 bg-muted rounded-lg animate-pulse" />
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="rounded-2xl bg-card border border-border overflow-hidden"
						>
							<div className="h-40 bg-muted animate-pulse" />

							<div className="flex-1 p-5 space-y-3">
								<div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
								<div className="space-y-2">
									<div className="h-4 bg-muted rounded animate-pulse" />
									<div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
								</div>

								<div className="flex items-center gap-4 text-xs pt-1">
									<div className="h-4 w-12 bg-muted rounded animate-pulse" />
									<div className="h-4 w-16 bg-muted rounded animate-pulse" />
									<div className="h-4 w-14 bg-muted rounded animate-pulse" />
								</div>
							</div>

							<div className="px-5 pb-4 pt-0">
								<div className="flex items-center justify-between">
									<div className="h-4 w-32 bg-muted rounded animate-pulse" />
									<div className="h-4 w-20 bg-muted rounded animate-pulse" />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
