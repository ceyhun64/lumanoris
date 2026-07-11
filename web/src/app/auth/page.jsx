import { notFound } from "next/navigation";

// Retired — superseded by /login and /register (this was a client-only
// prototype with fake validation, no real API calls). The Sidebar logout
// flow that used to point here now calls /api/auth/logout.php and redirects
// to /login directly.
export default function Auth() {
    notFound();
}
