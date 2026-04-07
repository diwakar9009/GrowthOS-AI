import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Palette, 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Search,
  Copy,
  Check,
  Sparkles,
  Zap,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function BrandKit() {
  const { user } = useAuth();
  const [brandKits, setBrandKits] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const qKits = query(collection(db, `users/${user.uid}/brandkits`), orderBy("createdAt", "desc"));
    const unsubscribeKits = onSnapshot(qKits, (snapshot) => {
      setBrandKits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/brandkits`);
    });

    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });

    return () => {
      unsubscribeKits();
      unsubscribeClients();
    };
  }, [user]);

  const handleAddKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !brandName) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/brandkits`), {
        userId: user.uid,
        clientId: selectedClient,
        name: brandName,
        colors: [primaryColor, secondaryColor, "#f8fafc", "#1e293b"],
        fonts: [fontFamily, "JetBrains Mono"],
        createdAt: new Date().toISOString()
      });
      setBrandName("");
      setSelectedClient("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/brandkits`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteKit = async (id: string) => {
    if (!user || !window.confirm("Delete this brand kit?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/brandkits`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/brandkits/${id}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Brand Kits</h1>
          <p className="text-muted-foreground">Centralize logos, colors, and fonts for consistent branding.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Brand Kit
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
                <CardTitle className="text-lg">New Brand Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddKit} className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name</label>
                    <Input 
                      placeholder="e.g., Acme Corp" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client (Optional)</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">Internal Brand</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex space-x-2">
                      <Input 
                        type="color" 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 p-1 h-10"
                      />
                      <Input 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Font Family</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                    >
                      <option>Inter</option>
                      <option>Space Grotesk</option>
                      <option>Outfit</option>
                      <option>Playfair Display</option>
                      <option>JetBrains Mono</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Brand Kit"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : brandKits.length > 0 ? (
          brandKits.map((kit, index) => (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all border-primary/10">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{kit.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {clients.find(c => c.id === kit.clientId)?.name || "Internal Brand"}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => deleteKit(kit.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Colors */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                      <Palette className="h-3 w-3 mr-2" />
                      Color Palette
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {kit.colors.map((color: string, i: number) => (
                        <div key={i} className="group relative">
                          <button 
                            onClick={() => copyToClipboard(color)}
                            className="h-12 w-12 rounded-lg border shadow-sm transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] font-mono bg-background border px-1 rounded">
                            {copiedColor === color ? "Copied!" : color}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                      <Type className="h-3 w-3 mr-2" />
                      Typography
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {kit.fonts.map((font: string, i: number) => (
                        <div key={i} className="p-3 rounded-lg border bg-muted/20">
                          <p className="text-[10px] text-muted-foreground mb-1">{i === 0 ? "Primary" : "Secondary"}</p>
                          <p className="font-bold text-sm" style={{ fontFamily: font }}>{font}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Assets Integration */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">AI Brand Integration</span>
                      </div>
                      <span className="text-[10px] text-primary font-bold uppercase">Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      This brand kit is automatically applied to AI-generated content and strategies.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No brand kits yet</h3>
            <p className="text-muted-foreground mb-6">Create a brand kit to keep your visual identity consistent.</p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Kit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
