import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function CreateCommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Community name is required');
      return;
    }

    setSubmitting(true);
    try {
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_private: isPrivate,
          created_by: user!.id,
          tags,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add creator as admin member
      const { error: memberError } = await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: user!.id,
        role: 'admin',
      });

      if (memberError) throw memberError;

      toast.success('Community created successfully!');
      navigate(`/communities/${community.id}`);
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/communities')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">Create Community</h1>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Build Your Community</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name..."
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your community about?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (max 5)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  disabled={tags.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={tags.length >= 5}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">Private Community</Label>
                <p className="text-sm text-muted-foreground">
                  Only invited members can join
                </p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-gradient"
              disabled={submitting || !name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Community'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
