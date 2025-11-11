"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ViewingAsIndicatorProps = {
	role: string | null | undefined;
	className?: string;
};

const ROLE_COPY: Record<string, string> = {
	manager: "Manager",
	executive: "Executive",
};

export function ViewingAsIndicator({ role, className }: ViewingAsIndicatorProps) {
	const normalizedRole = (role ?? "manager").toLowerCase();
	const label = ROLE_COPY[normalizedRole] ?? role ?? "Manager";

	return (
		<div
			className={cn(
				"inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs md:text-sm",
				className
			)}
			aria-live="polite"
		>
			<span className="uppercase tracking-wide text-[0.6rem] text-muted-foreground md:text-[0.65rem]">
				Viewing as
			</span>
			<span className="font-semibold text-foreground">{label}</span>
		</div>
	);
}

export default ViewingAsIndicator;
