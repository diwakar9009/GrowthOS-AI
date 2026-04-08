import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Plus, Layout, Clock, AlertCircle, CheckCircle2, MoreVertical, Trash2, Filter, Briefcase, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'in-progress', title: 'In Progress', icon: Layout, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'review', title: 'Review', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'done', title: 'Done', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' }
];

const TEMPLATES = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Comprehensive setup for a new product launch.',
    icon: Sparkles,
    tasks: [
      { title: 'Market Research', priority: 'high', description: 'Analyze target audience and market trends.' },
      { title: 'Competitor Analysis', priority: 'medium', description: 'Identify key competitors and their strategies.' },
      { title: 'Landing Page Development', priority: 'high', description: 'Design and build the product landing page.' },
      { title: 'Email Marketing Setup', priority: 'medium', description: 'Create email sequences for the launch.' },
      { title: 'Social Media Teasers', priority: 'medium', description: 'Plan and schedule teaser posts.' },
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media Campaign',
    description: 'Standard tasks for a monthly social media campaign.',
    icon: Layout,
    tasks: [
      { title: 'Content Strategy', priority: 'high', description: 'Define goals and content themes.' },
      { title: 'Graphic Design', priority: 'medium', description: 'Create visuals for posts.' },
      { title: 'Copywriting', priority: 'medium', description: 'Write captions and headlines.' },
      { title: 'Scheduling Posts', priority: 'medium', description: 'Queue posts in the management tool.' },
      { title: 'Performance Analysis', priority: 'low', description: 'Review campaign metrics.' },
    ]
  },
  {
    id: 'seo-audit',
    name: 'SEO Audit & Optimization',
    description: 'Tasks for improving search engine rankings.',
    icon: Filter,
    tasks: [
      { title: 'Keyword Research', priority: 'high', description: 'Identify high-value keywords.' },
      { title: 'On-Page Optimization', priority: 'high', description: 'Update meta tags and content structure.' },
      { title: 'Technical SEO Audit', priority: 'medium', description: 'Check site speed and crawl errors.' },
      { title: 'Backlink Analysis', priority: 'medium', description: 'Review existing backlink profile.' },
    ]
  },
  {
    id: 'email-blitz',
    name: 'Email Marketing Blitz',
    description: 'Quick setup for a high-impact email sequence.',
    icon: Sparkles,
    tasks: [
      { title: 'Segment Audience', priority: 'high', description: 'Filter and clean the email list.' },
      { title: 'A/B Test Subjects', priority: 'medium', description: 'Draft 2-3 subject line variations.' },
      { title: 'Design Newsletter', priority: 'high', description: 'Create a mobile-responsive email template.' },
      { title: 'Setup Automation', priority: 'medium', description: 'Configure triggers and drip sequences.' },
    ]
  }
];

export function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New project form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch projects
    const qProjects = query(
      collection(db, `users/${user.uid}/projects`),
      orderBy("createdAt", "desc")
    );
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/projects`);
    });

    // Fetch clients for dropdown
    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/clients`);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeClients();
    };
  }, [user]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/projects`), {
        userId: user.uid,
        clientId: newClientId || null,
        title: newTitle,
        description: newDesc,
        status: "todo",
        priority: newPriority,
        dueDate: newDueDate || null,
        createdAt: new Date().toISOString()
      });
      setNewTitle("");
      setNewDesc("");
      setNewClientId("");
      setNewPriority("medium");
      setNewDueDate("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/projects`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = async (template: typeof TEMPLATES[0]) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const promises = template.tasks.map(task => 
        addDoc(collection(db, `users/${user.uid}/projects`), {
          userId: user.uid,
          clientId: newClientId || null,
          title: task.title,
          description: task.description,
          status: "todo",
          priority: task.priority,
          dueDate: newDueDate || null,
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      setIsAdding(false);
      setShowTemplates(false);
      setNewClientId("");
      setNewDueDate("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/projects`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (projectId: string, newStatus: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/projects`, projectId), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${projectId}`);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/projects`, projectId));
      setDeleteConfirmId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/${projectId}`);
    }
  };

  const clearAllTasks = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const promises = projects.map(p => deleteDoc(doc(db, `users/${user.uid}/projects`, p.id)));
      await Promise.all(promises);
      setIsClearing(false);
    } catch (error) {
      console.error("Failed to clear tasks:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campaign Board</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your marketing tasks and project lifecycle.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {projects.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:bg-red-50 w-full sm:w-auto"
              onClick={() => setIsClearing(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Board
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)} className="w-full sm:w-auto">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Templates
          </Button>
          <Button 
            onClick={() => setIsAdding(!isAdding)} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAdding ? "Cancel" : "New Campaign"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isClearing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <Card className="max-w-sm w-full">
              <CardHeader>
                <CardTitle>Clear Board?</CardTitle>
                <CardDescription>This will permanently delete all {projects.length} tasks on the board. This action cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsClearing(false)}>Cancel</Button>
                <Button variant="destructive" onClick={clearAllTasks} disabled={isSubmitting}>
                  {isSubmitting ? "Clearing..." : "Delete All"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {TEMPLATES.map(template => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => handleApplyTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <template.icon className="h-4 w-4" />
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply
                    </Button>
                  </div>
                  <CardTitle className="text-sm mt-2">{template.name}</CardTitle>
                  <CardDescription className="text-[10px]">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {template.tasks.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {t.title}
                      </span>
                    ))}
                    {template.tasks.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{template.tasks.length - 3} more</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Create New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProject} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Task Title</label>
                    <Input 
                      placeholder="e.g., Q4 Strategy Presentation" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      placeholder="What needs to be done?" 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input 
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:gap-6 lg:grid-cols-4 no-scrollbar snap-x snap-mandatory">
        {COLUMNS.map(column => (
          <div key={column.id} className="space-y-4 min-w-[280px] sm:min-w-[320px] lg:min-w-0 snap-center mr-4 lg:mr-0 last:mr-0">
            <div className={cn("flex items-center justify-between p-2 rounded-lg", column.bg)}>
              <div className="flex items-center space-x-2">
                <column.icon className={cn("h-4 w-4", column.color)} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">
                  {projects.filter(p => p.status === column.id).length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[500px]">
              {projects.filter(p => p.status === column.id).map(project => (
                <motion.div
                  key={project.id}
                  layoutId={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="group hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold leading-tight">{project.title}</h4>
                          {project.clientId && (
                            <div className="flex items-center text-[10px] text-muted-foreground">
                              <Briefcase className="mr-1 h-3 w-3" />
                              {clients.find(c => c.id === project.clientId)?.name || "Client"}
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                          project.priority === 'high' ? "bg-red-100 text-red-700" :
                          project.priority === 'medium' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {project.priority}
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No date"}
                        </div>
                        <div className="flex items-center space-x-1">
                          <select 
                            className="text-[10px] bg-muted rounded px-1 py-0.5 outline-none"
                            value={project.status}
                            onChange={(e) => updateStatus(project.id, e.target.value)}
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                          {deleteConfirmId === project.id ? (
                            <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-red-600 hover:bg-red-50"
                                onClick={() => deleteProject(project.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                <Plus className="h-3 w-3 rotate-45" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setDeleteConfirmId(project.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
