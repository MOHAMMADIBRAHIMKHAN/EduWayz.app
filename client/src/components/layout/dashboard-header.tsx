import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function DashboardHeader() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  
  const { data: parent } = useQuery<{
    id: string;
    parentName: string;
  }>({
    queryKey: ["/api/parent/profile"],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });
    navigate("/auth/login");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold">
                SMS
              </div>
              <h1 className="ml-3 text-lg font-semibold text-neutral-900">
                School Management System
              </h1>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8" aria-label="Global">
              <Link href="/dashboard">
                <a className="border-primary-500 text-neutral-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
              </Link>
              <Link href="/dashboard/students">
                <a className="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Students
                </a>
              </Link>
              <Link href="/dashboard/academic">
                <a className="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Academic
                </a>
              </Link>
              <Link href="/dashboard/payments">
                <a className="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Payments
                </a>
              </Link>
              <Link href="/dashboard/communications">
                <a className="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Communications
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger className="inline-flex justify-center w-full rounded-md border border-neutral-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span>{parent?.parentName || "Parent"}</span>
                  <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate("/dashboard/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/dashboard/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
