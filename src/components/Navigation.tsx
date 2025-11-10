"use client";

import { MagicStackIcon } from "@/components/icons/MagicStackIcon";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { BookOpen, Home, Layers, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
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

  const handleToggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleCloseUserMenu = () => {
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="navigation bg-background/60 hidden md:inline fixed inset-x-0 backdrop-blur-xs top-0 z-50">
        <div className="mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="w-full h-full grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="size-10 bg-linear-to-br from-purple-600 to-blue-600 text-primary-foreground rounded-lg flex items-center justify-center">
                  <MagicStackIcon size={32} />
                </div>
                {!!session && (
                  <span className="text-xl tracking-tight font-semibold text-foreground">
                    MTG Stack
                  </span>
                )}
              </Link>

              <div className="hidden md:flex justify-center items-stretch gap-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-1 py-2 text-xs uppercase tracking-wide font-medium transition-all border-b-4 border-t-4 border-transparent",
                        isActive
                          ? " border-b-primary text-primary-foreground "
                          : "text-accent hover:text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="flex justify-end items-center gap-4">
                {status === "loading" ? (
                  <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                ) : session ? (
                  <UserMenu
                    session={session}
                    onSignOut={handleSignOut}
                    open={showUserMenu}
                    onOpen={handleToggleUserMenu}
                    onClose={handleCloseUserMenu}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth/login">Connexion</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/auth/register">Inscription</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {session && (
        <div className="mobile-nav fixed bottom-0 inset-x-0 z-50 flex flex-col justify-end bg-background-dark/90 md:hidden border-t border-border backdrop-blur-xs">
          <div className="grid grid-cols-5 py-2 px-2">
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
                  <span className="text-[9px]">{item.name}</span>
                </Link>
              );
            })}

            <div className="flex flex-col justify-center items-center">
              <UserMenu
                session={session}
                onSignOut={handleSignOut}
                open={showUserMenu}
                onOpen={handleToggleUserMenu}
                onClose={handleCloseUserMenu}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
