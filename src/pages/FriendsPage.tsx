import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Friend, FriendRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          user1:user_profiles!friends_user1_id_fkey(id, username, avatar_color, is_online),
          user2:user_profiles!friends_user2_id_fkey(id, username, avatar_color, is_online)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      const formatted = data?.map((f: any) => ({
        ...f,
        friend: f.user1_id === user.id ? f.user2 : f.user1,
      })) || [];

      setFriends(formatted);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;
    try {
      // Received requests
      const { data: received, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*, sender:user_profiles!friend_requests_sender_id_fkey(id, username, avatar_color)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friend_requests')
        .select('*, receiver:user_profiles!friend_requests_receiver_id_fkey(id, username, avatar_color)')
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      setRequests(received || []);
      setSentRequests(sent || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [user]);

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    setProcessing(requestId);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create friendship (ensure user1_id < user2_id for consistency)
      const user1 = user!.id < senderId ? user!.id : senderId;
      const user2 = user!.id < senderId ? senderId : user!.id;

      const { error: friendError } = await supabase.from('friends').insert({
        user1_id: user1,
        user2_id: user2,
      });

      if (friendError) throw friendError;

      toast.success('Friend request accepted!');
      fetchFriends();
      fetchRequests();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const startChat = async (friendId: string) => {
    try {
      // Check if chat session already exists
      const { data: existingSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'active')
        .or(`and(user1_id.eq.${user!.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user!.id})`);

      if (existingSessions && existingSessions.length > 0) {
        navigate(`/chat/${existingSessions[0].id}`);
        return;
      }

      // Create new session
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user1_id: user!.id,
          user2_id: friendId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${session.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your connections</p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {friends.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No friends yet. Start chatting with strangers to make connections!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friends.map((friendship) => (
                <Card key={friendship.id} className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback
                              className="text-white font-semibold"
                              style={{ backgroundColor: friendship.friend?.avatar_color }}
                            >
                              {friendship.friend?.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {friendship.friend?.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{friendship.friend?.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Friends since {formatDistanceToNow(new Date(friendship.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => startChat(friendship.friend!.id)}
                        className="btn-gradient"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id} className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback
                            className="text-white font-semibold"
                            style={{ backgroundColor: request.sender?.avatar_color }}
                          >
                            {request.sender?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{request.sender?.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id, request.sender_id)}
                          disabled={processing === request.id}
                          className="btn-gradient"
                        >
                          {processing === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processing === request.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentRequests.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No sent requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentRequests.map((request) => (
                <Card key={request.id} className="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback
                            className="text-white font-semibold"
                            style={{ backgroundColor: request.receiver?.avatar_color }}
                          >
                            {request.receiver?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{request.receiver?.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
