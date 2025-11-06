import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ChatSession, Message, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, Phone, Video, UserX, Loader2, 
  AlertCircle, ArrowLeft, MoreVertical, UserPlus 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [stranger, setStranger] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSession = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*, user_profiles!chat_sessions_user1_id_fkey(*), user_profiles!chat_sessions_user2_id_fkey(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setSession(data);
      
      // Determine who the stranger is
      const strangerId = data.user1_id === user.id ? data.user2_id : data.user1_id;
      const { data: strangerData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', strangerId)
        .single();
      
      setStranger(strangerData);

      // Check if already friends
      if (user) {
        const { data: friendData } = await supabase
          .from('friends')
          .select('*')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${strangerId}),and(user1_id.eq.${strangerId},user2_id.eq.${user.id})`);

        setIsFriend(!!friendData && friendData.length > 0);

        // Check for pending request
        const { data: requestData } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', user.id)
          .eq('receiver_id', strangerId)
          .eq('status', 'pending');

        setHasPendingRequest(!!requestData && requestData.length > 0);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Chat session not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user_profiles(anonymous_name, avatar_color)')
        .eq('session_id', id)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [id, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user || sending) return;

    setSending(true);
    try {
      await supabase.from('messages').insert({
        session_id: id,
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: 'text'
      });

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const endChat = async () => {
    if (!id) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', id);

      await supabase.from('messages').insert({
        session_id: id,
        sender_id: user!.id,
        content: 'Chat ended',
        message_type: 'system'
      });

      toast.success('Chat ended');
      navigate('/');
    } catch (error) {
      console.error('Error ending chat:', error);
      toast.error('Failed to end chat');
    }
  };

  const sendFriendRequest = async () => {
    if (!user || !stranger) return;

    try {
      const { error } = await supabase.from('friend_requests').insert({
        sender_id: user.id,
        receiver_id: stranger.id,
      });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: stranger.id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${user.username} wants to be your friend!`,
        link: '/friends',
      });

      setHasPendingRequest(true);
      toast.success('Friend request sent!');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const initiateCall = async (type: 'audio' | 'video') => {
    if (!id || !user || !stranger) return;

    try {
      await supabase.from('call_logs').insert({
        session_id: id,
        caller_id: user.id,
        receiver_id: stranger.id,
        call_type: type,
        status: 'initiated'
      });

      toast.info(`${type === 'video' ? 'Video' : 'Voice'} call feature coming soon!`);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.status === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Chat Ended</h2>
        <p className="text-muted-foreground mb-6">This conversation has ended</p>
        <Button onClick={() => navigate('/')}>Find New Stranger</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback 
                className="text-white font-semibold"
                style={{ backgroundColor: stranger?.avatar_color || '#8B5CF6' }}
              >
                {stranger?.anonymous_name?.[0] || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{stranger?.anonymous_name || 'Stranger'}</h2>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => initiateCall('audio')}
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => initiateCall('video')}
            >
              <Video className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isFriend && !hasPendingRequest && (
                  <DropdownMenuItem onClick={sendFriendRequest}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </DropdownMenuItem>
                )}
                {hasPendingRequest && (
                  <DropdownMenuItem disabled>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Request Sent
                  </DropdownMenuItem>
                )}
                {isFriend && (
                  <DropdownMenuItem disabled>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Already Friends
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={endChat} className="text-destructive">
                  <UserX className="w-4 h-4 mr-2" />
                  End Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const isSystem = message.message_type === 'system';

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      className="text-white text-sm"
                      style={{ 
                        backgroundColor: isOwn 
                          ? user?.avatar_color || '#8B5CF6'
                          : stranger?.avatar_color || '#EC4899'
                      }}
                    >
                      {isOwn ? user?.anonymous_name?.[0] : stranger?.anonymous_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <Card
                      className={`px-4 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-r from-primary to-accent text-white'
                          : 'bg-card'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                    </Card>
                    <p className="text-xs text-muted-foreground px-2">
                      {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card px-4 py-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-gradient"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
