import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Users, TrendingUp, UserPlus, History, Sparkles } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-6 content-container">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">
          Welcome back, {user?.username}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          What would you like to explore today?
        </p>
      </div>

      {/* Main Actions */}
      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-4 mb-8">
        {/* Community Card */}
        <Card className="glass card-hover cursor-pointer group" onClick={() => navigate('/feed')}>
          <CardHeader>
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent mb-3 w-fit group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">Community Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Share posts, discover content, and engage
            </p>
            <Button className="btn-gradient w-full" size="sm">
              Explore
            </Button>
          </CardContent>
        </Card>

        {/* Stranger Chat Card */}
        <Card className="glass card-hover cursor-pointer group" onClick={() => navigate('/chat-match')}>
          <CardHeader>
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary mb-3 w-fit group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-lg">Stranger Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect anonymously with strangers
            </p>
            <Button className="btn-gradient w-full" size="sm">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            className="glass card-hover cursor-pointer"
            onClick={() => navigate('/communities')}
          >
            <CardContent className="p-4 text-center">
              <Globe className="w-6 h-6 mb-2 text-primary mx-auto" />
              <p className="font-semibold text-sm mb-0.5">Communities</p>
              <p className="text-xs text-muted-foreground">Join groups</p>
            </CardContent>
          </Card>

          <Card
            className="glass card-hover cursor-pointer"
            onClick={() => navigate('/friends')}
          >
            <CardContent className="p-4 text-center">
              <UserPlus className="w-6 h-6 mb-2 text-primary mx-auto" />
              <p className="font-semibold text-sm mb-0.5">Friends</p>
              <p className="text-xs text-muted-foreground">Your connections</p>
            </CardContent>
          </Card>

          <Card
            className="glass card-hover cursor-pointer"
            onClick={() => navigate('/chat-history')}
          >
            <CardContent className="p-4 text-center">
              <History className="w-6 h-6 mb-2 text-primary mx-auto" />
              <p className="font-semibold text-sm mb-0.5">History</p>
              <p className="text-xs text-muted-foreground">Past chats</p>
            </CardContent>
          </Card>

          <Card
            className="glass card-hover cursor-pointer"
            onClick={() => navigate('/explore')}
          >
            <CardContent className="p-4 text-center">
              <Sparkles className="w-6 h-6 mb-2 text-primary mx-auto" />
              <p className="font-semibold text-sm mb-0.5">Explore</p>
              <p className="text-xs text-muted-foreground">Discover</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
