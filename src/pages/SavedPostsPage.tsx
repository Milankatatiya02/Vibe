import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Loader2, Bookmark } from 'lucide-react';

export function SavedPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          *,
          post:posts(
            *,
            user:user_profiles!posts_user_id_fkey(id, username, avatar_color, avatar_url),
            likes(id, user_id),
            comments(id)
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map((item: any) => ({
        ...item.post,
        like_count: item.post.likes?.length || 0,
        comment_count: item.post.comments?.length || 0,
        user_has_liked: item.post.likes?.some((like: any) => like.user_id === user.id),
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 content-container">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bookmark className="w-6 h-6" />
        Saved Posts
      </h1>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No saved posts yet</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeChange={fetchSavedPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
