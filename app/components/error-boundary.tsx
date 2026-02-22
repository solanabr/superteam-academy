"use client";

import React from "react";

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | undefined;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error | undefined; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: undefined };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	reset = () => {
		this.setState({ hasError: false, error: undefined });
	};

	override render() {
		if (this.state.hasError) {
			const Fallback = this.props.fallback || DefaultErrorFallback;
			return <Fallback error={this.state.error} reset={this.reset} />;
		}

		return this.props.children;
	}
}

function DefaultErrorFallback({ error, reset }: { error: Error | undefined; reset: () => void }) {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
				<p className="mb-4">{error?.message || "An unexpected error occurred"}</p>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-primary text-primary-foreground rounded"
				>
					Try again
				</button>
			</div>
		</div>
	);
}

export { ErrorBoundary, DefaultErrorFallback };
