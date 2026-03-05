"use client";

import { Logo } from "@/components/shared/logo";
import { Certificate } from "@/lib/data/certificates";

interface CertificateDisplayProps {
	certificate: Certificate;
}

export function CertificateDisplay({ certificate }: CertificateDisplayProps) {
	return (
		<div
			id="certificate-capture"
			className="relative aspect-video p-3 md:p-12 flex flex-col justify-between overflow-hidden shadow-sm"
			style={{
				backgroundColor: "#ffffff",
				border: "1px solid #09090b",
				boxShadow: "0 10px 40px -15px rgba(13,20,18,0.2)",
				backgroundImage: `linear-gradient(45deg, rgba(13,20,18,0.01) 25%, transparent 25%, transparent 75%, rgba(13,20,18,0.01) 75%, rgba(13,20,18,0.01)),
                         linear-gradient(45deg, rgba(13,20,18,0.01) 25%, transparent 25%, transparent 75%, rgba(13,20,18,0.01) 75%, rgba(13,20,18,0.01))`,
				backgroundSize: "4px 4px",
				backgroundPosition: "0 0, 2px 2px",
			}}
		>
			{/* Inner Border */}
			<div
				className="absolute top-2 left-2 right-2 bottom-2 md:top-4 md:left-4 md:right-4 md:bottom-4 border pointer-events-none"
				style={{ borderColor: "#e4e4e7" }}
			></div>

			{/* Header */}
			<div className="flex justify-between items-start relative z-10">
				<div className="flex items-center gap-1.5 md:gap-3">
					<Logo
						className="w-4 h-4 md:w-8 md:h-8"
						style={{ color: "#09090b" }}
					/>
					<div
						className="font-display font-black text-[9px] md:text-2xl tracking-tight"
						style={{ color: "#09090b" }}
					>
						SUPERTEAM ACADEMY
					</div>
				</div>
				<div
					className="text-[6px] md:text-[10px] text-right font-mono leading-tight"
					style={{ color: "#a1a1aa" }}
				>
					CERTIFICATE NO.
					<br />
					<span className="font-bold uppercase" style={{ color: "#09090b" }}>
						{certificate.certificateNo.split("-").pop()}
					</span>
				</div>
			</div>

			{/* Body */}
			<div className="text-center relative z-10 py-1 md:py-0">
				<div
					className="text-[6px] md:text-xs uppercase tracking-[0.2em] mb-1 md:mb-6 font-medium"
					style={{ color: "#a1a1aa" }}
				>
					This is to certify that
				</div>
				<div
					className="font-mono text-[10px] md:text-[1.75rem] border-b md:border-b-2 inline-block px-3 md:px-12 pb-0.5 md:pb-2 mb-2 md:mb-8 font-bold tracking-widest leading-none"
					style={{ color: "#09090b", borderColor: "#09090b" }}
				>
					{certificate.recipient}
				</div>
				<div
					className="text-[6px] md:text-xs uppercase tracking-[0.2em] mt-1 md:mt-4 mb-1 md:mb-4 font-medium"
					style={{ color: "#a1a1aa" }}
				>
					Has successfully mastered
				</div>
				<div
					className="font-display text-xs md:text-5xl font-black uppercase leading-[1.1] mb-1 md:mb-3 tracking-tighter px-4"
					style={{ color: "#09090b" }}
				>
					{certificate.courseName}
				</div>
				<div
					className="text-[6px] md:text-sm max-w-[85%] md:max-w-2xl mx-auto leading-tight md:leading-relaxed italic line-clamp-2 md:line-clamp-none"
					style={{ color: "#71717a" }}
				>
					&quot;{certificate.courseDescription}&quot;
				</div>
			</div>

			{/* Footer */}
			<div className="flex justify-between items-end relative z-10">
				<div
					className="text-[6px] md:text-[10px] font-mono leading-tight"
					style={{ color: "#a1a1aa" }}
				>
					DATE OF ISSUE
					<br />
					<span className="font-bold" style={{ color: "#09090b" }}>
						{certificate.issueDate}
					</span>
				</div>

				{/* Authentic Seal - Ink Stamp Style */}
				<div className="relative transform scale-[0.5] md:scale-100 origin-bottom">
					<div
						className="w-16 h-16 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center p-1.5 transform -rotate-12"
						style={{
							backgroundColor: "rgba(27, 35, 29, 0.04)",
							border: "1.5px dashed #1b231d",
							opacity: 0.8,
						}}
					>
						<Logo
							className="w-5 h-5 md:w-8 md:h-8 mb-0.5"
							style={{ color: "#1b231d" }}
						/>
						<div
							className="text-[4px] md:text-[7px] font-black text-center leading-none tracking-tighter uppercase"
							style={{ color: "#1b231d" }}
						>
							Official
							<br />
							Academy Seal
						</div>
					</div>
				</div>

				<div
					className="text-[6px] md:text-[10px] text-right font-mono leading-tight"
					style={{ color: "#a1a1aa" }}
				>
					VALIDATED BY
					<br />
					<span className="font-bold" style={{ color: "#09090b" }}>
						{certificate.validator}
					</span>
				</div>
			</div>
		</div>
	);
}
