import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onLikeChange?: () => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to like posts');
        return;
      }

      if (post.user_has_liked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      }

      onLikeChange?.();
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Card className="glass card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback 
                className="text-white font-semibold"
                style={{ backgroundColor: post.user?.avatar_color || '#8B5CF6' }}
              >
                {post.user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link to={`/profile/${post.user_id}`} className="font-semibold hover:underline">
                {post.user?.username || 'Anonymous'}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <Link to={`/post/${post.id}`}>
            <p className="text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
          </Link>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {post.image_url && (
          <Link to={`/post/${post.id}`}>
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity"
            />
          </Link>
        )}

        <div className="p-4 flex items-center gap-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={post.user_has_liked ? 'text-red-500' : ''}
            disabled={isLiking}
          >
            <Heart className={`w-4 h-4 mr-2 ${post.user_has_liked ? 'fill-current' : ''}`} />
            {post.like_count || 0}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/post/${post.id}`}>
              <MessageCircle className="w-4 h-4 mr-2" />
              {post.comment_count || 0}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
