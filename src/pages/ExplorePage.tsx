import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, TrendingUp } from 'lucide-react';

export function ExplorePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrendingTags = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      const allTags = data?.flatMap((post: any) => post.tags || []) || [];
      const tagCounts = allTags.reduce((acc: any, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});

      const sorted = Object.entries(tagCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      setTrendingTags(sorted);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey(id, username, avatar_color),
          likes(id, user_id),
          comments(id)
        `);

      if (selectedTag) {
        query = query.contains('tags', [selectedTag]);
      }

      const { data: postsData, error } = await query.order('created_at', { ascending: false });

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
    fetchTrendingTags();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);

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
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Explore</h1>
          <p className="text-muted-foreground">Discover trending content</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Trending Tags</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className={`cursor-pointer ${selectedTag === null ? 'bg-gradient-to-r from-primary to-accent' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            All
          </Badge>
          {trendingTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className={`cursor-pointer ${
                selectedTag === tag ? 'bg-gradient-to-r from-primary to-accent' : ''
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No posts found {selectedTag && `with tag #${selectedTag}`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeChange={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
