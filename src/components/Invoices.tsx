import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  FileText, 
  Plus, 
  IndianRupee, 
  Download, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const qInvoices = query(collection(db, `users/${user.uid}/invoices`), orderBy("createdAt", "desc"));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/invoices`);
    });

    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeClients();
    };
  }, [user]);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClient || !amount) return;
    setIsSubmitting(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      await addDoc(collection(db, `users/${user.uid}/invoices`), {
        userId: user.uid,
        clientId: selectedClient,
        clientName: client?.name || "Unknown",
        amount: parseFloat(amount),
        dueDate,
        description,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      setAmount("");
      setDueDate("");
      setDescription("");
      setSelectedClient("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/invoices`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/invoices`, id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/invoices/${id}`);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!user || !window.confirm("Delete this invoice?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/invoices`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/invoices/${id}`);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-8 pb-20 md:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Invoicing & Payments</h1>
          <p className="text-muted-foreground">Manage your billing and track client payments.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {pendingRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting client payment</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clients with active billing</p>
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
                <CardTitle className="text-lg">Create New Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddInvoice} className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input 
                      type="number"
                      placeholder="e.g., 15000" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      placeholder="e.g., SEO Services - April" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Invoice"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoices..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'paid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('paid')}
          >
            Paid
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-bold">Invoice #</th>
                  <th className="text-left p-4 font-bold">Client</th>
                  <th className="text-left p-4 font-bold">Amount</th>
                  <th className="text-left p-4 font-bold">Due Date</th>
                  <th className="text-left p-4 font-bold">Status</th>
                  <th className="text-right p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv, i) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="p-4 font-mono text-xs">INV-{inv.id.substring(0, 6).toUpperCase()}</td>
                      <td className="p-4">
                        <div className="font-bold">{inv.clientName}</div>
                        <div className="text-[10px] text-muted-foreground">{inv.description}</div>
                      </td>
                      <td className="p-4 font-bold">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                          inv.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {inv.status}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {inv.status !== 'paid' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600"
                              onClick={() => updateStatus(inv.id, 'paid')}
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteInvoice(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
