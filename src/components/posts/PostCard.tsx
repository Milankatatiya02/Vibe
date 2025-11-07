import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MapPin, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: Post;
  onLikeChange?: () => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [post.id, user]);

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post.id)
      .single();
    setIsSaved(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      if (post.user_has_liked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      }
      onLikeChange?.();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to save posts');
      return;
    }

    try {
      if (isSaved) {
        await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', user.id);
        toast.success('Post removed from saved');
      } else {
        await supabase.from('saved_posts').insert({ post_id: post.id, user_id: user.id });
        toast.success('Post saved!');
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save post');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.share({
        title: `Post by ${post.user?.username}`,
        text: post.content,
        url: window.location.origin + `/post/${post.id}`,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="post-card animate-fade-in">
      <Link to={`/post/${post.id}`} className="block">
        {/* Post Image */}
        {post.image_url && (
          <div className="relative overflow-hidden bg-muted">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Post Content */}
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarFallback
                className="text-white font-semibold"
                style={{ backgroundColor: post.user?.avatar_color }}
              >
                {post.user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate hover:text-primary transition-colors">
                {post.user?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words line-clamp-6">
            {post.content}
          </p>

          {/* Community Badge */}
          {post.community && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {post.community.name}
            </Badge>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`gap-2 ${post.user_has_liked ? 'text-red-500 hover:text-red-600' : ''}`}
        >
          <Heart
            className={`w-4 h-4 ${post.user_has_liked ? 'fill-current' : ''}`}
          />
          <span className="text-xs">{post.like_count || 0}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to={`/post/${post.id}`}>
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">{post.comment_count || 0}</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className={isSaved ? 'text-primary' : ''}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
