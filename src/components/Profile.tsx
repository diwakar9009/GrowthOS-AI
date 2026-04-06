import { useState } from "react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Input } from "./Input";
import { User, Settings, LogOut, Flame, Trophy, Zap, LayoutGrid, Loader2 } from "lucide-react";
import { NICHES, PLATFORMS } from "@/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { auth, signOut, db, doc, updateDoc, handleFirestoreError, OperationType } from "@/lib/firebase";

export function Profile() {
  const { profile, user } = useAuth();
  const [niche, setNiche] = useState(profile?.niche || "General");
  const [platform, setPlatform] = useState(profile?.platform || "both");
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        niche,
        platform
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your preferences and track your growth.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* User Info & Stats */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile?.displayName || 'Creator'}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Growth Achievement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Daily Streak</span>
                </div>
                <span className="text-sm font-bold">{profile?.streak || 0} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Points</span>
                </div>
                <span className="text-sm font-bold">{profile?.points || 0} XP</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences & Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Marketing Preferences</span>
            </CardTitle>
            <CardDescription>Customize how GrowthOS AI suggests content for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Your Niche</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NICHES.map((n) => (
                  <Button
                    key={n}
                    variant={niche === n ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setNiche(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Target Platforms</h3>
              <div className="grid grid-cols-3 gap-4">
                {PLATFORMS.map((p) => (
                  <Button
                    key={p.id}
                    variant={platform === p.id ? "default" : "outline"}
                    className="flex flex-col h-20 space-y-2"
                    onClick={() => setPlatform(p.id as any)}
                  >
                    <span className="text-xs">{p.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
