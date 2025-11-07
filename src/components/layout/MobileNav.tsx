import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Search, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/feed', icon: MessageSquare, label: 'Feed' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/messages', icon: Mail, label: 'DMs' },
    { path: `/profile/${user.id}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
                transition-all duration-200 min-w-[60px]
                ${active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
