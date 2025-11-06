import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Sparkles, Globe, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ChatMatchingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matching, setMatching] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);

  const availableInterests = [
    'Music', 'Movies', 'Gaming', 'Sports', 'Technology', 
    'Art', 'Travel', 'Books', 'Food', 'Fitness',
    'Photography', 'Fashion', 'Science', 'Comedy', 'Nature'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const saveInterests = async () => {
    if (!user) return;
    try {
      await supabase
        .from('user_profiles')
        .update({ interests: selectedInterests })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving interests:', error);
    }
  };

  const findStranger = async () => {
    if (!user) return;
    
    setMatching(true);
    await saveInterests();

    try {
      // Set user as online
      await supabase
        .from('user_profiles')
        .update({ is_online: true })
        .eq('id', user.id);

      // Find available users (not in active sessions)
      const { data: activeSessions } = await supabase
        .from('chat_sessions')
        .select('user1_id, user2_id')
        .eq('status', 'active');

      const busyUserIds = new Set(
        activeSessions?.flatMap(s => [s.user1_id, s.user2_id]) || []
      );

      // Get online users who aren't busy and aren't the current user
      const { data: availableUsers } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_online', true)
        .neq('id', user.id);

      const matchableUsers = availableUsers?.filter(u => !busyUserIds.has(u.id)) || [];

      if (matchableUsers.length === 0) {
        toast.error('No strangers available right now. Try again in a moment!');
        setMatching(false);
        return;
      }

      // Find best match based on interests
      let matchedUser = matchableUsers[0];
      if (selectedInterests.length > 0) {
        const scored = matchableUsers.map(u => ({
          user: u,
          score: (u.interests || []).filter(i => selectedInterests.includes(i)).length
        }));
        scored.sort((a, b) => b.score - a.score);
        matchedUser = scored[0].user;
      }

      // Create chat session
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: user.id,
          user2_id: matchedUser.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Send system message
      await supabase.from('messages').insert({
        session_id: session.id,
        sender_id: user.id,
        content: 'Chat started! Say hi to your new stranger friend 👋',
        message_type: 'system'
      });

      toast.success('Connected! Say hello 👋');
      navigate(`/chat/${session.id}`);
    } catch (error: any) {
      console.error('Error finding match:', error);
      toast.error('Failed to find a match. Please try again.');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 gradient-bg">
      <div className="w-full max-w-2xl space-y-8 animate-scale-in">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent">
              <Globe className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">
            Talk to <span className="gradient-text">Strangers</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with random people around the world anonymously
          </p>
        </div>

        <Card className="glass">
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Your Interests</h3>
                <span className="text-sm text-muted-foreground">(Select to find better matches)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      selectedInterests.includes(interest)
                        ? 'bg-gradient-to-r from-primary to-accent hover:scale-105'
                        : 'hover:border-primary'
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={findStranger}
                disabled={matching}
                className="w-full btn-gradient text-lg py-6"
                size="lg"
              >
                {matching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding a stranger...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Start Chatting
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/history')}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat History
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>🔒 Your identity is completely anonymous</p>
              <p>💬 Chat respectfully and have fun!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
