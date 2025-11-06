import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ChatSession, Message } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function ChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          messages(content, sent_at, message_type)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch stranger profiles for each session
      const sessionsWithStrangers = await Promise.all(
        (data || []).map(async (session) => {
          const strangerId = session.user1_id === user.id ? session.user2_id : session.user1_id;
          const { data: strangerData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', strangerId)
            .single();

          // Get last non-system message
          const lastMessage = session.messages
            ?.filter((m: Message) => m.message_type === 'text')
            ?.sort((a: Message, b: Message) => 
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            )[0];

          return {
            ...session,
            stranger: strangerData,
            last_message: lastMessage
          };
        })
      );

      setSessions(sessionsWithStrangers);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chat History</h1>
          <p className="text-muted-foreground">Your previous conversations</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No chat history</h2>
          <p className="text-muted-foreground mb-6">
            Start chatting with strangers to see your conversation history here
          </p>
          <Button onClick={() => navigate('/')} className="btn-gradient">
            Start Chatting
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session: any) => (
            <Card
              key={session.id}
              className="glass card-hover cursor-pointer"
              onClick={() => {
                if (session.status === 'active') {
                  navigate(`/chat/${session.id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback
                      className="text-white font-semibold"
                      style={{ backgroundColor: session.stranger?.avatar_color || '#8B5CF6' }}
                    >
                      {session.stranger?.anonymous_name?.[0] || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">
                        {session.stranger?.anonymous_name || 'Unknown Stranger'}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {session.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {session.last_message.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'active'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {session.status === 'active' ? 'Active' : 'Ended'}
                      </span>
                      {session.ended_at && (
                        <span className="text-xs text-muted-foreground">
                          Ended {format(new Date(session.ended_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
