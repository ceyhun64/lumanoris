import { notFound } from "next/navigation";

// Retired — superseded by /dashboard/explore. Kept as an explicit 404
// rather than removing the route outright.
export default function Market() {
    notFound();
}
