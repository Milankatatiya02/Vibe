import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Globe, Users, Sparkles, TrendingUp, Image, UserPlus, Bell } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] gradient-bg">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, <span className="gradient-text">{user?.username}</span>! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            What would you like to do today?
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Community Section */}
          <Card className="glass card-hover animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Community</CardTitle>
              </div>
              <CardDescription className="text-base">
                Share your thoughts, discover content, and connect with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start btn-gradient" size="lg">
                <Link to="/feed">
                  <TrendingUp className="w-5 h-5 mr-3" />
                  View Feed
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link to="/create">
                  <Image className="w-5 h-5 mr-3" />
                  Create Post
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link to="/explore">
                  <Globe className="w-5 h-5 mr-3" />
                  Explore
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Communities Section */}
          <Card className="glass card-hover animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Communities</CardTitle>
              </div>
              <CardDescription className="text-base">
                Join topic-based groups and engage with like-minded people
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start btn-gradient" size="lg">
                <Link to="/communities">
                  <Globe className="w-5 h-5 mr-3" />
                  Browse Communities
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link to="/communities/create">
                  <Sparkles className="w-5 h-5 mr-3" />
                  Create Community
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stranger Chat Section */}
          <Card className="glass card-hover animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Stranger Chat</CardTitle>
              </div>
              <CardDescription className="text-base">
                Talk anonymously with random people from around the world
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start btn-gradient" size="lg">
                <Link to="/chat-match">
                  <Users className="w-5 h-5 mr-3" />
                  Find Stranger
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link to="/chat-history">
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Chat History
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Friends & Notifications */}
          <Card className="glass card-hover animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Social</CardTitle>
              </div>
              <CardDescription className="text-base">
                Manage your friends and stay updated with notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start btn-gradient" size="lg">
                <Link to="/friends">
                  <UserPlus className="w-5 h-5 mr-3" />
                  Friends
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link to="/notifications">
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold gradient-text">24/7</p>
              <p className="text-sm text-muted-foreground">Always Active</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold gradient-text">100%</p>
              <p className="text-sm text-muted-foreground">Anonymous</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold gradient-text">Safe</p>
              <p className="text-sm text-muted-foreground">Moderated</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold gradient-text">Free</p>
              <p className="text-sm text-muted-foreground">Forever</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
