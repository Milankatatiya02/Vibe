import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Users, TrendingUp, Settings, LogOut, User, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setUnreadCount(data?.length || 0);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? '/' : '/login'} className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text hidden sm:inline">Vibe</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant={isActive('/feed') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link to="/feed">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Feed
                </Link>
              </Button>
              <Button
                variant={isActive('/chat-match') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link to="/chat-match">
                  <Users className="w-4 h-4 mr-2" />
                  Chat
                </Link>
              </Button>
              <Button
                variant={isActive('/communities') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link to="/communities">
                  <Globe className="w-4 h-4 mr-2" />
                  Communities
                </Link>
              </Button>
              <Button
                variant={isActive('/friends') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="hidden lg:flex"
              >
                <Link to="/friends">
                  <Users className="w-4 h-4 mr-2" />
                  Friends
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                asChild
              >
                <Link to="/notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback 
                        className="text-white font-semibold"
                        style={{ backgroundColor: user.avatar_color || '#8B5CF6' }}
                      >
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/feed">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Community Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/chat-match">
                      <Users className="w-4 h-4 mr-2" />
                      Stranger Chat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/communities">
                      <Globe className="w-4 h-4 mr-2" />
                      Communities
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="lg:hidden">
                    <Link to="/friends">
                      <Users className="w-4 h-4 mr-2" />
                      Friends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.id}`}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link to="/communities">
                      <Globe className="w-4 h-4 mr-2" />
                      Communities
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="lg:hidden">
                    <Link to="/friends">
                      <Users className="w-4 h-4 mr-2" />
                      Friends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="btn-gradient" asChild>
                <Link to="/signup">Join Now</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
