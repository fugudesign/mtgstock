import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";

interface UserMenuProps {
  session: Session | null;
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onSignOut: () => void;
}

export function UserMenu({ session, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage
            src={session?.user?.image || undefined}
            alt={session?.user?.name || "User"}
            className="w-8 h-8 rounded-full"
          />
          <AvatarFallback className="bg-primary">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-lg font-bold">{session?.user?.name}</span>
          <span className="text-xs text-muted-foreground">
            {session?.user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User />
              Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onSignOut}>
            <LogOut />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
