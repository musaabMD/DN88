"use client";

import { LibraryAccessGate } from "@/components/LibraryAccessGate";
import AdminCatalogClient from "./AdminCatalogClient";

export default function AdminCatalogPage() {
  return (
    <LibraryAccessGate>
      <AdminCatalogClient />
    </LibraryAccessGate>
  );
}
