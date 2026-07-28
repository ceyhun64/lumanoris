"use client";
import { createContext } from "react";

// Kept in its own tiny module (no other exports/imports) so that pages
// importing UserContext don't pull dashboard/layout.jsx's module graph
// (Sidebar, DashboardHeader, etc.) into their own bundle.
export const UserContext = createContext(null);
