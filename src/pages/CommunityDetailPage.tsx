import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Community, Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Users, Lock, Globe, Send, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export function CommunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:user_profiles!communities_created_by_fkey(id, username, avatar_color),
          members:community_members(id, user_id, role)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const member = user ? data.members.find((m: any) => m.user_id === user.id) : null;

      setCommunity({
        ...data,
        member_count: data.members.length,
        is_member: !!member,
        user_role: member?.role,
      });
    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Community not found');
      navigate('/communities');
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey(id, username, avatar_color),
          likes(id, user_id),
          comments(id)
        `)
        .eq('community_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = postsData?.map((post: any) => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        user_has_liked: user ? post.likes?.some((like: any) => like.user_id === user.id) : false,
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
    fetchPosts();
  }, [id, user]);

  const handleJoinLeave = async () => {
    if (!user || !community) return;
    setJoining(true);

    try {
      if (community.is_member) {
        // Leave community
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', user.id);
        toast.success('Left community');
      } else {
        // Join community
        await supabase.from('community_members').insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member',
        });
        toast.success('Joined community!');
      }
      fetchCommunity();
    } catch (error: any) {
      console.error('Error joining/leaving community:', error);
      toast.error('Failed to update membership');
    } finally {
      setJoining(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user || !community) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        community_id: community.id,
        content: newPost.trim(),
      });

      if (error) throw error;

      setNewPost('');
      fetchPosts();
      toast.success('Post created!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !community) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/communities')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Communities
      </Button>

      <Card className="glass mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback
                className="text-white font-bold text-2xl"
                style={{ backgroundColor: community.creator?.avatar_color || '#8B5CF6' }}
              >
                {community.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {community.is_private ? (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.member_count} members
                    </span>
                  </div>
                </div>
                {user && (
                  <Button
                    onClick={handleJoinLeave}
                    disabled={joining}
                    variant={community.is_member ? 'outline' : 'default'}
                    className={!community.is_member ? 'btn-gradient' : ''}
                  >
                    {joining ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : community.is_member ? (
                      <UserMinus className="w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {community.is_member ? 'Leave' : 'Join'}
                  </Button>
                )}
              </div>
              {community.description && (
                <p className="text-muted-foreground mb-3">{community.description}</p>
              )}
              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          {community.is_member && user && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Create Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the community..."
                    rows={3}
                  />
                  <Button
                    type="submit"
                    disabled={!newPost.trim() || submitting}
                    className="btn-gradient"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Post
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {community.is_member
                  ? 'No posts yet. Be the first to share!'
                  : 'Join this community to see and create posts'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLikeChange={fetchPosts} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card className="glass">
            <CardHeader>
              <CardTitle>About this Community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {community.description || 'No description provided'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Created by</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback
                      className="text-white"
                      style={{ backgroundColor: community.creator?.avatar_color }}
                    >
                      {community.creator?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{community.creator?.username}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
