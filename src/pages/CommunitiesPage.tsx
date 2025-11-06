import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Community } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, Search, Users, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

export function CommunitiesPage() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [loading, setLoading] = useState(true);

  const fetchCommunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('communities')
        .select(`
          *,
          creator:user_profiles!communities_created_by_fkey(id, username, avatar_color),
          members:community_members(id, user_id)
        `);

      if (filter === 'public') {
        query = query.eq('is_private', false);
      } else if (filter === 'my' && user) {
        query = query.contains('members', [{ user_id: user.id }]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map((community: any) => ({
        ...community,
        member_count: community.members?.length || 0,
        is_member: user ? community.members?.some((m: any) => m.user_id === user.id) : false,
      })) || [];

      if (search) {
        setCommunities(
          formatted.filter((c: Community) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
          )
        );
      } else {
        setCommunities(formatted);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground">Join conversations that matter</p>
        </div>
        <Button onClick={() => navigate('/communities/create')} className="btn-gradient">
          <Plus className="w-5 h-5 mr-2" />
          Create Community
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'my' ? 'default' : 'outline'}
            onClick={() => setFilter('my')}
          >
            My Communities
          </Button>
          <Button
            variant={filter === 'public' ? 'default' : 'outline'}
            onClick={() => setFilter('public')}
          >
            Public
          </Button>
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No communities found</p>
          <Button onClick={() => navigate('/communities/create')} className="btn-gradient">
            Create First Community
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Card
              key={community.id}
              className="glass card-hover cursor-pointer"
              onClick={() => navigate(`/communities/${community.id}`)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback
                      className="text-white font-semibold text-lg"
                      style={{ backgroundColor: community.creator?.avatar_color || '#8B5CF6' }}
                    >
                      {community.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{community.name}</CardTitle>
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
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {community.member_count}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {community.description || 'No description'}
                </p>
                {community.tags && community.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {community.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
