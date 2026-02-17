/**
 * Payment Processor Component
 * Handles secure payment processing for subscriptions
 */

"use client";

import type React from "react";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements as _Elements,
    CardElement as _CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Shield, CheckCircle, AlertTriangle, Loader2, Crown } from "@/components/lucide-shim";
import { useTranslations } from "next-intl";

const Elements = _Elements as unknown as React.ComponentType<any>;
const CardElement = _CardElement as unknown as React.ComponentType<any>;

// Initialize Stripe (in real app, this would be from environment variables)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PremiumContentGateProps {
	hasAccess: boolean;
	requiredPlan?: string;
	children: React.ReactNode;
	fallback?: React.ReactNode;
	className?: string;
}

export function PremiumContentGate({
	hasAccess,
	requiredPlan,
	children,
	fallback,
	className = "",
}: PremiumContentGateProps) {
	const t = useTranslations("premium");

	if (hasAccess) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	return (
		<div
			className={`text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${className}`}
		>
			<Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
			<h3 className="text-lg font-semibold mb-2">{t("gate.title")}</h3>
			<p className="text-gray-600 dark:text-gray-400 mb-4">
				{requiredPlan
					? t("gate.descriptionWithPlan", { plan: requiredPlan })
					: t("gate.description")}
			</p>
			<Button>
				<Crown className="h-4 w-4 mr-2" />
				{t("gate.upgrade")}
			</Button>
		</div>
	);
}

interface PaymentStatusProps {
	status: "processing" | "success" | "failed";
	message?: string;
	className?: string;
}

export function PaymentStatus({ status, message, className }: PaymentStatusProps) {
	const t = useTranslations("payment");

	const statusConfig = {
		processing: {
			variant: "default" as const,
			description: message || t("status.processingDesc"),
			title: t("status.processing"),
			icon: Loader2,
		},
		success: {
			variant: "default" as const,
			description: message || t("status.successDesc"),
			title: t("status.success"),
			icon: CheckCircle,
		},
		failed: {
			variant: "destructive" as const,
			description: message || t("status.failedDesc"),
			title: t("status.failed"),
			icon: AlertTriangle,
		},
	};

	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<Alert variant={config.variant} className={className}>
			<Icon className={`h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`} />
			<AlertDescription>
				<div className="font-medium">{config.title}</div>
				<div className="text-sm mt-1">{config.description}</div>
			</AlertDescription>
		</Alert>
	);
}

interface PaymentProcessorProps {
	plan: {
		id: string;
		name: string;
		price: number;
		currency: string;
	};
	onSuccess: (subscription: unknown) => void;
	onError: (error: string) => void;
	className?: string;
}

export function PaymentProcessor({ plan, onSuccess, onError, className }: PaymentProcessorProps) {
	const t = useTranslations("payment");

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<CreditCard className="h-5 w-5" />
					<span>{t("title")}</span>
				</CardTitle>
				<CardDescription>
					{t("description", {
						plan: plan.name,
						amount: plan.price,
						currency: plan.currency,
					})}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Elements stripe={stripePromise}>
					<PaymentForm
						amount={plan.price}
						currency={plan.currency}
						planName={plan.name}
						onSuccess={onSuccess}
						onError={onError}
					/>
				</Elements>
			</CardContent>
		</Card>
	);
}

interface PaymentFormProps {
	amount: number;
	currency: string;
	planName: string;
	onSuccess: (paymentIntent: unknown) => void;
	onError: (error: string) => void;
}

function PaymentForm({ amount, currency, planName, onSuccess, onError }: PaymentFormProps) {
	const [billingDetails, setBillingDetails] = useState({
		name: "",
		email: "",
		address: {
			line1: "",
			city: "",
			state: "",
			postal_code: "",
			country: "US",
		},
	});
	const [loading, setLoading] = useState(false);

	const stripe = useStripe();
	const elements = useElements();
	const t = useTranslations("payment");

	const cardElementOptions = {
		style: {
			base: {
				fontSize: "16px",
				color: "#424770",
				"::placeholder": {
					color: "#aab7c4",
				},
			},
			invalid: {
				color: "#9e2146",
			},
		},
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!stripe || !elements) {
			onError(t("errors.stripeNotLoaded"));
			return;
		}

		setLoading(true);

		try {
			// Create payment intent on the server
			const response = await fetch("/api/create-payment-intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount,
					currency,
					planName,
					billingDetails,
				}),
			});

			const { clientSecret, error } = await response.json();

			if (error) {
				onError(error);
				return;
			}

			// Confirm payment
			const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
				clientSecret,
				{
					payment_method: {
						card: elements.getElement(_CardElement)!,
						billing_details: billingDetails,
					},
				}
			);

			if (stripeError) {
				onError(stripeError.message || t("errors.paymentFailed"));
			} else if (paymentIntent?.status === "succeeded") {
				onSuccess(paymentIntent);
			}
		} catch (_error) {
			onError(t("errors.networkError"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="name">{t("billing.name")}</Label>
						<Input
							required={true}
							placeholder="John Doe"
							value={billingDetails.name}
							onChange={(e) =>
								setBillingDetails((prev) => ({ ...prev, name: e.target.value }))
							}
							id="name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">{t("billing.email")}</Label>
						<Input
							required={true}
							type="email"
							placeholder="john@example.com"
							value={billingDetails.email}
							onChange={(e) =>
								setBillingDetails((prev) => ({ ...prev, email: e.target.value }))
							}
							id="email"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label>{t("billing.address")}</Label>
					<Input
						required={true}
						placeholder="123 Main St"
						value={billingDetails.address.line1}
						onChange={(e) =>
							setBillingDetails((prev) => ({
								...prev,
								address: { ...prev.address, line1: e.target.value },
							}))
						}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label>{t("billing.city")}</Label>
						<Input
							required={true}
							placeholder="New York"
							value={billingDetails.address.city}
							onChange={(e) =>
								setBillingDetails((prev) => ({
									...prev,
									address: { ...prev.address, city: e.target.value },
								}))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("billing.state")}</Label>
						<Input
							required={true}
							placeholder="NY"
							value={billingDetails.address.state}
							onChange={(e) =>
								setBillingDetails((prev) => ({
									...prev,
									address: { ...prev.address, state: e.target.value },
								}))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("billing.zip")}</Label>
						<Input
							required={true}
							placeholder="10001"
							value={billingDetails.address.postal_code}
							onChange={(e) =>
								setBillingDetails((prev) => ({
									...prev,
									address: { ...prev.address, postal_code: e.target.value },
								}))
							}
						/>
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<Label>{t("card.details")}</Label>
				<div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
					<CardElement options={cardElementOptions} />
				</div>
			</div>

			<div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
				<Shield className="h-4 w-4" />
				<span>{t("security.note")}</span>
			</div>

			<Button type="submit" className="w-full" disabled={!stripe || loading}>
				{loading ? (
					<div className="flex items-center space-x-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>{t("processing")}</span>
					</div>
				) : (
					<div className="flex items-center space-x-2">
						<span>
							{t("pay")} ${amount} {currency.toUpperCase()}
						</span>
						<CreditCard className="h-4 w-4" />
					</div>
				)}
			</Button>
		</form>
	);
}
