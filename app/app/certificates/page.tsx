import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "My Certificates | Superteam Academy",
	description: "Redirects to the localized certificates route.",
};

export default function CertificatesPage() {
	redirect("/en/certificates");
}
