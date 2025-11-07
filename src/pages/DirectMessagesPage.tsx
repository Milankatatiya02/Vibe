import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, DirectMessage } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function DirectMessagesPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*, user_profiles!friends_user1_id_fkey(*), user_profiles!friends_user2_id_fkey(*)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const friendsList = data?.map((friendship: any) => {
        return friendship.user1_id === user.id 
          ? friendship.user_profiles[1] 
          : friendship.user_profiles[0];
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedFriend) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*, sender:user_profiles!direct_messages_sender_id_fkey(*)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', selectedFriend.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedFriend]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: selectedFriend.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedFriend.id,
        type: 'dm',
        title: 'New Message',
        message: `${user.username} sent you a message`,
        link: '/messages',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex content-container">
      {/* Friends List */}
      <div className="w-full md:w-80 border-r glass">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {friends.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No friends to chat with</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedFriend?.id === friend.id
                    ? 'bg-primary/10 border-primary/50'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.username} />
                    ) : (
                      <AvatarFallback
                        className="text-white font-semibold"
                        style={{ backgroundColor: friend.avatar_color }}
                      >
                        {friend.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{friend.username}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {friend.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      {selectedFriend ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b glass flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {selectedFriend.avatar_url ? (
                <img src={selectedFriend.avatar_url} alt={selectedFriend.username} />
              ) : (
                <AvatarFallback
                  className="text-white font-semibold"
                  style={{ backgroundColor: selectedFriend.avatar_color }}
                >
                  {selectedFriend.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-semibold">{selectedFriend.username}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFriend.is_online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <Card
                      className={`px-4 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-r from-primary to-accent text-white'
                          : 'bg-card'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                    </Card>
                    <p className="text-xs text-muted-foreground px-2 mt-1">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t glass">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="btn-gradient"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Select a friend to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
