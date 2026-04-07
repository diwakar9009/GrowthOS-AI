import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Settings,
  MessageSquare,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Editor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const qMembers = query(collection(db, `users/${user.uid}/team`), orderBy("createdAt", "desc"));
    const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/team`);
    });

    return () => unsubscribeMembers();
  }, [user]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/team`), {
        userId: user.uid,
        email: newEmail,
        role: newRole,
        status: "invited",
        createdAt: new Date().toISOString()
      });
      setNewEmail("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/team`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMember = async (id: string) => {
    if (!user || !window.confirm("Remove this team member?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/team`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/team/${id}`);
    }
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground">Manage your agency team and collaborators.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Team Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length + 1}</div>
            <p className="text-xs text-muted-foreground mt-1">Including you (Owner)</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground mt-1">Currently online</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.filter(m => m.status === 'invited').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Invite New Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input 
                      type="email"
                      placeholder="colleague@agency.com" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option>Admin</option>
                      <option>Editor</option>
                      <option>Viewer</option>
                      <option>Client</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Members List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 h-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {/* Owner (You) */}
              <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold flex items-center">
                      {user?.email}
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold uppercase">Owner</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">Super Admin • Active Now</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </div>
              ) : filteredMembers.map((member, i) => (
                <motion.div 
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                      {member.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">{member.email}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {member.role} • {member.status === 'invited' ? "Invited" : "Active"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteMember(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions & Quick Actions */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                Quick Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-white border space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Admins</p>
                <p className="text-xs">Full access to all clients, projects, and billing.</p>
              </div>
              <div className="p-3 rounded-lg bg-white border space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Editors</p>
                <p className="text-xs">Can manage content, tools, and projects but no billing.</p>
              </div>
              <div className="p-3 rounded-lg bg-white border space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Clients</p>
                <p className="text-xs">View-only access to their specific project progress.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { user: "You", action: "Invited Sarah", time: "2h ago" },
                { user: "System", action: "Updated permissions", time: "5h ago" },
              ].map((log, i) => (
                <div key={i} className="flex items-start space-x-3 text-xs">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {log.user[0]}
                  </div>
                  <div>
                    <span className="font-bold">{log.user}</span> {log.action}
                    <p className="text-[10px] text-muted-foreground">{log.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
