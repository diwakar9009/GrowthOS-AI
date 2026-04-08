import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Plus, Briefcase, Mail, Target, Trash2, ExternalLink, Loader2, CheckCircle2, Clock, Sparkles, Layout } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New client form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newBrandVoice, setNewBrandVoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/clients`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/clients`), {
        userId: user.uid,
        name: newName,
        email: newEmail,
        niche: newNiche,
        brandVoice: newBrandVoice,
        status: "active",
        progress: 0,
        createdAt: new Date().toISOString()
      });
      setNewName("");
      setNewEmail("");
      setNewNiche("");
      setNewBrandVoice("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/clients`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/clients`, clientId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/clients/${clientId}`);
    }
  };

  const updateProgress = async (clientId: string, currentProgress: number) => {
    if (!user) return;
    const newProgress = Math.min(100, currentProgress + 10);
    try {
      await updateDoc(doc(db, `users/${user.uid}/clients`, clientId), {
        progress: newProgress,
        status: newProgress === 100 ? "completed" : "active"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/clients/${clientId}`);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track your client campaigns and progress.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="w-full md:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isAdding ? "Cancel" : "Add Client"}
        </Button>
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
                <CardTitle className="text-lg">New Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddClient} className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Name</label>
                    <Input 
                      placeholder="e.g., Nike India" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input 
                      type="email"
                      placeholder="client@example.com" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Niche</label>
                    <Input 
                      placeholder="e.g., Fitness, Tech" 
                      value={newNiche}
                      onChange={(e) => setNewNiche(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-sm font-medium">Brand Voice / Personality</label>
                    <Input 
                      placeholder="e.g., Witty & Bold, Professional & Corporate, Gen-Z Slang" 
                      value={newBrandVoice}
                      onChange={(e) => setNewBrandVoice(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Client"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clients.length > 0 ? (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {clients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4 text-primary" />
                        {client.name}
                      </CardTitle>
                      <CardDescription className="flex items-center">
                        <Target className="mr-1 h-3 w-3" />
                        {client.niche || "General"}
                      </CardDescription>
                    </div>
                    <div className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                      client.status === 'active' ? "bg-green-100 text-green-700" : 
                      client.status === 'completed' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {client.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{client.email || "No email provided"}</span>
                  </div>

                  {client.brandVoice && (
                    <div className="flex items-center space-x-2 text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-md">
                      <Sparkles className="h-3 w-3" />
                      <span>Voice: {client.brandVoice}</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Campaign Progress</span>
                      <span>{client.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${client.progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => updateProgress(client.id, client.progress)}>
                        <Clock className="mr-2 h-3 w-3" />
                        Log Task
                      </Button>
                    </div>
                    <div className="flex space-x-1">
                      {deleteConfirmId === client.id ? (
                        <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteConfirmId(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Link to={`/portal/${client.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Client Portal">
                          <Layout className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No clients added yet</h3>
          <p className="mb-6 text-muted-foreground">Start by adding your first client to track their campaigns.</p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Client
          </Button>
        </div>
      )}
    </div>
  );
}
