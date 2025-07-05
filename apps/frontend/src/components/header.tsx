import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 sm:px-8">
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
