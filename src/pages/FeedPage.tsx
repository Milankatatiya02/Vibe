import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';

export function FeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey(id, username, avatar_color),
          likes(id, user_id),
          comments(id)
        `)
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
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Community Feed</h1>
        </div>
        <Button onClick={() => navigate('/create')} className="btn-gradient">
          <Plus className="w-5 h-5 mr-2" />
          Create
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet. Be the first to share!</p>
          <Button onClick={() => navigate('/create')} className="btn-gradient">
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeChange={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
