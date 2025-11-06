import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Post, Comment } from '@/types';
import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey(id, username, avatar_color),
          likes(id, user_id),
          comments(id)
        `)
        .eq('id', id)
        .single();

      if (postError) throw postError;

      const formattedPost = {
        ...postData,
        like_count: postData.likes?.length || 0,
        comment_count: postData.comments?.length || 0,
        user_has_liked: user ? postData.likes?.some((like: any) => like.user_id === user.id) : false,
      };

      setPost(formattedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Post not found');
      navigate('/feed');
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:user_profiles!comments_user_id_fkey(username, avatar_color)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id, user]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      fetchPost();
      toast.success('Comment added!');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/feed')} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Button>

      <div className="space-y-6">
        <PostCard post={post} onLikeChange={fetchPost} />

        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Comments ({comments.length})
            </h3>

            {user && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={submitting}
                  />
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="btn-gradient"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        className="text-white text-sm"
                        style={{ backgroundColor: comment.user?.avatar_color || '#8B5CF6' }}
                      >
                        {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {comment.user?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
