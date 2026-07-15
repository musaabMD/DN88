export const LIBRARY_OWNER_EMAIL = "mousab.r@gmail.com";

export function isLibraryOwnerEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === LIBRARY_OWNER_EMAIL;
}
