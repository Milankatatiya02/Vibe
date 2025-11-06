import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Settings, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === id;

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Profile not found');
      navigate('/feed');
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
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = postsData?.map((post: any) => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        user_has_liked: currentUser ? post.likes?.some((like: any) => like.user_id === currentUser.id) : false,
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/feed')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="glass mb-8">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback
                className="text-white text-3xl font-bold"
                style={{ backgroundColor: profile.avatar_color || '#8B5CF6' }}
              >
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                {isOwnProfile && (
                  <Button variant="outline" onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{profile.email}</p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-semibold text-xl">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                {profile.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-6">Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
            {isOwnProfile && (
              <Button onClick={() => navigate('/create')} className="btn-gradient mt-4">
                Create First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeChange={fetchPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
