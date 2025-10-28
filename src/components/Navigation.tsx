"use client";

import { MtgStockIcon } from "@/components/icons/MtgStockIcon";
import { cn } from "@/lib/utils";
import { BookOpen, Home, Layers, LogOut, Search, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

const navigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Recherche", href: "/search", icon: Search },
  { name: "Collections", href: "/collections", icon: BookOpen },
  { name: "Decks", href: "/decks", icon: Layers },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-background/60 fixed inset-x-0 backdrop-blur-xs top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="w-full grid grid-cols-[1fr_auto_1fr] gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-10 bg-linear-to-br from-purple-600 to-blue-600 text-primary-foreground rounded-lg flex items-center justify-center">
                <MtgStockIcon size={32} />
              </div>
              {/* <span className="font-decorative text-3xl tracking-tight text-indigo-900">
                Magic Stack
              </span> */}
            </Link>

            <div className="hidden md:flex justify-center items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex justify-end items-center gap-4">
              {status === "loading" ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
              ) : session ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-20">
                        <div className="flex items-center justify-between px-4 py-2 text-md font-bold text-foreground">
                          {session.user?.name || session.user?.email}
                        </div>
                        <hr className="border-t border-border my-1" />
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          Mon profil
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Inscription</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="flex items-center justify-around py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
