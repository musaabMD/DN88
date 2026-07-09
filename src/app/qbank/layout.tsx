"use client";

import type { ReactNode } from "react";
import { QbankAccessGate } from "@/components/QbankAccessGate";

export default function QbankLayout({ children }: { children: ReactNode }) {
  return <QbankAccessGate>{children}</QbankAccessGate>;
}
