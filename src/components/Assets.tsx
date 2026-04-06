import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Plus, Image, Video, FileText, Link, Trash2, ExternalLink, Search, Filter, Briefcase, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const ASSET_TYPES = [
  { id: 'image', icon: Image, label: 'Images', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'video', icon: Video, label: 'Videos', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'doc', icon: FileText, label: 'Docs', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'link', icon: Link, label: 'Links', color: 'text-green-600', bg: 'bg-green-50' }
];

export function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  // New asset form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("link");
  const [newUrl, setNewUrl] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const qAssets = query(
      collection(db, `users/${user.uid}/assets`),
      orderBy("createdAt", "desc")
    );
    const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assets`);
    });

    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAssets();
      unsubscribeClients();
    };
  }, [user]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName || !newUrl) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/assets`), {
        userId: user.uid,
        clientId: newClientId || null,
        name: newName,
        type: newType,
        url: newUrl,
        createdAt: new Date().toISOString()
      });
      setNewName("");
      setNewUrl("");
      setNewClientId("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/assets`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/assets`, assetId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/assets/${assetId}`);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filter === "all" || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          (asset.clientId && clients.find(c => c.id === asset.clientId)?.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-muted-foreground">Centralized repository for brand assets, media, and links.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
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
                <CardTitle className="text-lg">Add New Asset</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAsset} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Asset Name</label>
                    <Input 
                      placeholder="e.g., Brand Logo (Primary)" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    >
                      {ASSET_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-4">
                    <label className="text-sm font-medium">URL / Link</label>
                    <Input 
                      placeholder="e.g., https://drive.google.com/..." 
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Asset"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          {ASSET_TYPES.map(t => (
            <Button 
              key={t.id}
              variant={filter === t.id ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilter(t.id)}
              className="flex items-center"
            >
              <t.icon className="mr-2 h-3 w-3" />
              {t.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAssets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset, index) => {
            const typeInfo = ASSET_TYPES.find(t => t.id === asset.type) || ASSET_TYPES[0];
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:border-primary/50 transition-all overflow-hidden">
                  <div className={cn("h-2 w-full", typeInfo.bg.replace('bg-', 'bg-'))} />
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <typeInfo.icon className={cn("h-5 w-5", typeInfo.color)} />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={asset.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        {deleteConfirmId === asset.id ? (
                          <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => deleteAsset(asset.id)}
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
                            className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeleteConfirmId(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold truncate">{asset.name}</h4>
                      {asset.clientId && (
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {clients.find(c => c.id === asset.clientId)?.name || "Client"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                      <span className="capitalize">{asset.type}</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-xl p-8">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No assets found</h3>
          <p className="text-muted-foreground max-w-sm">
            {search || filter !== "all" ? "Try adjusting your filters or search terms." : "Start by adding brand logos, campaign videos, or strategy documents."}
          </p>
        </div>
      )}
    </div>
  );
}
