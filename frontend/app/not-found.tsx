import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<div className="max-w-md w-full text-center space-y-8">
				<div className="space-y-1">
					<p className="text-8xl font-bold font-display text-gradient-gold">404</p>
					<h1 className="text-2xl font-bold font-display">Page not found</h1>
					<p className="text-muted-foreground">
						The page you&apos;re looking for doesn&apos;t exist or has been moved.
					</p>
				</div>

				<div className="flex gap-3 justify-center">
					<Button size="sm" asChild>
						<Link href="/">
							<Home className="h-4 w-4 mr-2" />
							Go home
						</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href="/courses">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Browse courses
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
