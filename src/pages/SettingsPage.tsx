import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anonymousName, setAnonymousName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const colors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', 
    '#3B82F6', '#6366F1', '#EF4444', '#14B8A6'
  ];

  const availableInterests = [
    'Music', 'Movies', 'Gaming', 'Sports', 'Technology', 
    'Art', 'Travel', 'Books', 'Food', 'Fitness',
    'Photography', 'Fashion', 'Science', 'Comedy', 'Nature'
  ];

  useEffect(() => {
    if (user) {
      setAnonymousName(user.anonymous_name || '');
      setSelectedColor(user.avatar_color || '#8B5CF6');
      setSelectedInterests(user.interests || []);
    }
  }, [user]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user || !anonymousName.trim()) {
      toast.error('Anonymous name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          anonymous_name: anonymousName.trim(),
          avatar_color: selectedColor,
          interests: selectedInterests
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Settings saved successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your anonymous profile</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Anonymous Identity</CardTitle>
            <CardDescription>
              This is how other users will see you in chats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Avatar className="w-24 h-24">
                <AvatarFallback
                  className="text-white text-3xl font-semibold"
                  style={{ backgroundColor: selectedColor }}
                >
                  {anonymousName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anonymous-name">Anonymous Name</Label>
              <Input
                id="anonymous-name"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
                placeholder="e.g., Cool Panda"
              />
            </div>

            <div className="space-y-2">
              <Label>Avatar Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full transition-transform ${
                      selectedColor === color ? 'ring-4 ring-ring scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Interests
            </CardTitle>
            <CardDescription>
              Help us match you with like-minded strangers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map((interest) => (
                <Badge
                  key={interest}
                  variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    selectedInterests.includes(interest)
                      ? 'bg-gradient-to-r from-primary to-accent hover:scale-105'
                      : 'hover:border-primary'
                  }`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-gradient"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
