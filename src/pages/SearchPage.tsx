import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { User, Post, Community } from '@/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, Users, MessageSquare, Globe, Loader2 } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setPosts([]);
      setCommunities([]);
      return;
    }

    setLoading(true);
    try {
      // Search users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      // Search posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey(id, username, avatar_color, avatar_url),
          likes(id, user_id),
          comments(id)
        `)
        .or(`content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Search communities
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      const { data: { user } } = await supabase.auth.getUser();
      const formattedPosts = postsData?.map((post: any) => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        user_has_liked: user ? post.likes?.some((like: any) => like.user_id === user.id) : false,
      })) || [];

      setUsers(usersData || []);
      setPosts(formattedPosts);
      setCommunities(communitiesData || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 content-container">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, posts, communities..."
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && query && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              <MessageSquare className="w-4 h-4 mr-2" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="communities">
              <Globe className="w-4 h-4 mr-2" />
              Communities ({communities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Users</h3>
                <div className="space-y-2">
                  {users.slice(0, 3).map((user) => (
                    <Card
                      key={user.id}
                      className="glass cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} />
                          ) : (
                            <AvatarFallback
                              className="text-white font-semibold"
                              style={{ backgroundColor: user.avatar_color }}
                            >
                              {user.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{user.username}</p>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Posts</h3>
                <div className="masonry-grid">
                  {posts.slice(0, 6).map((post) => (
                    <PostCard key={post.id} post={post} onLikeChange={() => performSearch(query)} />
                  ))}
                </div>
              </div>
            )}

            {communities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Communities</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {communities.slice(0, 4).map((community) => (
                    <Card
                      key={community.id}
                      className="glass cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/communities/${community.id}`)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">{community.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {community.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {community.member_count} members
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="space-y-2">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="glass cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} />
                      ) : (
                        <AvatarFallback
                          className="text-white font-semibold"
                          style={{ backgroundColor: user.avatar_color }}
                        >
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="masonry-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLikeChange={() => performSearch(query)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communities" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {communities.map((community) => (
                <Card
                  key={community.id}
                  className="glass cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/communities/${community.id}`)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">{community.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {community.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {community.member_count} members
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!loading && !query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Start typing to search</p>
        </div>
      )}

      {!loading && query && users.length === 0 && posts.length === 0 && communities.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
