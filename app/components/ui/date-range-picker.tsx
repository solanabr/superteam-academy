"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DateRange {
	from: Date;
	to: Date;
}

interface DatePickerWithRangeProps {
	date: DateRange;
	onDateChange: (range: DateRange) => void;
	className?: string;
}

export function DatePickerWithRange({
	date,
	onDateChange: _onDateChange,
	className = "",
}: DatePickerWithRangeProps) {
	return (
		<Button variant="outline" className={className}>
			<Calendar className="h-4 w-4 mr-2" />
			<span>
				{date.from.toLocaleDateString()} - {date.to.toLocaleDateString()}
			</span>
		</Button>
	);
}
