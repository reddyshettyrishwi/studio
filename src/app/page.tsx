"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
