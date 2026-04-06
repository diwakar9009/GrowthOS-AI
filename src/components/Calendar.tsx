import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType, orderBy } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Instagram, 
  Youtube, 
  Twitter, 
  Clock,
  CheckCircle2,
  Trash2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Fetch events
    const qEvents = query(collection(db, `users/${user.uid}/calendar`), orderBy("date", "asc"));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch clients for the dropdown
    const qClients = query(collection(db, `users/${user.uid}/clients`), orderBy("name", "asc"));
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeEvents();
      unsubscribeClients();
    };
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !selectedClient) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/calendar`), {
        userId: user.uid,
        clientId: selectedClient,
        title: newTitle,
        platform: selectedPlatform,
        date: selectedDate,
        status: "planned"
      });
      setNewTitle("");
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/calendar`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/calendar`, eventId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/calendar/${eventId}`);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user || !window.confirm("Delete this scheduled post?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/calendar`, eventId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/calendar/${eventId}`);
    }
  };

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthEmptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">Plan and schedule your client campaigns.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" />
          Plan Post
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
                <CardTitle className="text-lg">Schedule New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEvent} className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Post Title / Topic</label>
                    <Input 
                      placeholder="e.g., Summer Sale Announcement" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
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
                    <label className="text-sm font-medium">Platform</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                    >
                      <option>Instagram</option>
                      <option>YouTube</option>
                      <option>Twitter</option>
                      <option>LinkedIn</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-4 flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add to Calendar"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle>{monthName} {currentDate.getFullYear()}</CardTitle>
              <div className="flex space-x-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted border rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-background p-2 text-center text-xs font-bold text-muted-foreground">
                  {day}
                </div>
              ))}
              {prevMonthEmptyDays.map(i => (
                <div key={`empty-${i}`} className="bg-muted/30 h-24 p-2" />
              ))}
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                
                return (
                  <div key={day} className={cn(
                    "bg-background h-24 p-2 border-t border-l transition-colors hover:bg-accent/50",
                    isToday && "bg-primary/5"
                  )}>
                    <span className={cn(
                      "text-xs font-medium",
                      isToday && "text-primary font-bold"
                    )}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          className={cn(
                            "text-[8px] p-1 rounded truncate border",
                            event.status === 'posted' ? "bg-green-50 border-green-200 text-green-700" : "bg-primary/10 border-primary/20 text-primary"
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Posts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Upcoming Schedule
          </h2>
          <div className="space-y-4">
            {events.filter(e => e.status !== 'posted').length > 0 ? (
              events.filter(e => e.status !== 'posted').map((event, index) => {
                const client = clients.find(c => c.id === event.clientId);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {event.platform === 'Instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                              {event.platform === 'YouTube' && <Youtube className="h-3 w-3 text-red-600" />}
                              {event.platform === 'Twitter' && <Twitter className="h-3 w-3 text-blue-400" />}
                              <span className="text-xs font-bold text-muted-foreground uppercase">{event.platform}</span>
                            </div>
                            <p className="text-sm font-bold">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {client?.name || "Unknown Client"} • {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => updateEventStatus(event.id, 'posted')}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => deleteEvent(event.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No upcoming posts. Start planning!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
