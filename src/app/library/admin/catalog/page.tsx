"use client";

import { useEffect, useState } from "react";
import AdminCatalogClient from "./AdminCatalogClient";

export default function AdminCatalogPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AdminCatalogClient />;
}
