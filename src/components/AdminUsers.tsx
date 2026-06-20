import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { db, doc, updateDoc, collection, onSnapshot, OperationType, handleFirestoreError } from "../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Clock, 
  UserX, 
  UserCheck, 
  UserCheck2,
  Mail,
  Calendar,
  Lock,
  Search,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DBUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isApproved?: boolean;
  role?: 'admin' | 'user';
  createdAt?: string;
  points?: number;
  streak?: number;
}

export function AdminUsers() {
  const { user, profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<DBUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'pending' | 'admin'>('all');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if admin
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersCollectionRef = collection(db, "users");
    
    const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
      const dbUsers = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as DBUserProfile[];
      
      // Sort users by createdAt or Name
      dbUsers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });

      setUsers(dbUsers);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error subscribing to users list:", err);
      setError("Failed to fetch users list. Please check Firestore security rules.");
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, "users");
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleToggleApproval = async (targetUser: DBUserProfile) => {
    if (!isAdmin || processingUid) return;

    setProcessingUid(targetUser.uid);
    try {
      const userRef = doc(db, "users", targetUser.uid);
      const newApprovedStatus = !targetUser.isApproved;
      
      // Update locally & in Firestore
      await updateDoc(userRef, {
        isApproved: newApprovedStatus
      });
    } catch (err) {
      console.error("Failed to toggle approval:", err);
      alert("Error: Failed to change user status. Check your firestore.rules.");
    } finally {
      setProcessingUid(null);
    }
  };

  const handleToggleRole = async (targetUser: DBUserProfile) => {
    if (!isAdmin || processingUid) return;
    
    // Prevent the core admin from demoting themselves accidentally
    if (targetUser.email === 'diwakarvishwakarma9009@gmail.com') {
      alert("Error: You are the root admin and cannot change your own role!");
      return;
    }

    setProcessingUid(targetUser.uid);
    try {
      const userRef = doc(db, "users", targetUser.uid);
      const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
      
      await updateDoc(userRef, {
        role: newRole
      });
    } catch (err) {
      console.error("Failed to toggle role:", err);
      alert("Error: Failed to change user role.");
    } finally {
      setProcessingUid(null);
    }
  };

  // If loading authentication or readying state
  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-4 text-sm font-medium text-muted-foreground">Loading Users Core...</span>
      </div>
    );
  }

  // Access check!
  if (!isAdmin) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center py-12">
        <Card className="w-full max-w-md border-rose-500/20 bg-card shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Direct Access Locked
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Only the workspace administrator can access this console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm pt-4">
            <p className="text-muted-foreground leading-relaxed">
              Yeh page exclusive access control manage karne ke liye hai. Agar aap administrator hain, toh please admin email account <strong className="text-foreground">diwakarvishwakarma9009@gmail.com</strong> se sign-in karein.
            </p>
            <p className="border-t border-muted/50 pt-4 text-xs font-mono text-muted-foreground">
              ERROR_CODE: ACCESS_ROLE_FORBIDDEN
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const totalUsersCount = users.length;
  const approvedUsersCount = users.filter(u => u.isApproved || u.email === 'diwakarvishwakarma9009@gmail.com').length;
  const pendingUsersCount = users.filter(u => !u.isApproved && u.email !== 'diwakarvishwakarma9009@gmail.com').length;
  const adminUsersCount = users.filter(u => u.role === 'admin' || u.email === 'diwakarvishwakarma9009@gmail.com').length;

  // Filter list
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName && (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterType === 'approved') return u.isApproved === true || u.email === 'diwakarvishwakarma9009@gmail.com';
    if (filterType === 'pending') return !u.isApproved && u.email !== 'diwakarvishwakarma9009@gmail.com';
    if (filterType === 'admin') return u.role === 'admin' || u.email === 'diwakarvishwakarma9009@gmail.com';
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage user accounts, approvals, and system-level permissions smoothly.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5 text-destructive">
          <CardHeader className="flex flex-row items-center space-x-2 py-4">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle className="text-sm font-semibold">{error}</CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Overview stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/20 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Users</span>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{totalUsersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered workspace accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/20 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Approved Users</span>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-500">{approvedUsersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Granted access to AI features</p>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/20 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-mono">Pending Approvals</span>
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-amber-500">{pendingUsersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting workspace evaluation</p>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-500/20 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">System Admins</span>
              <div className="rounded-xl bg-violet-500/10 p-2 text-violet-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-violet-500">{adminUsersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Full control privilege accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Tools Layout */}
      <Card>
        <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle className="text-lg font-bold">User Registrations</CardTitle>
            <CardDescription>Review and modify permissions instantly below.</CardDescription>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full md:w-64 rounded-xl border border-input bg-muted/30 pl-9 pr-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex h-10 items-center rounded-xl bg-muted/50 p-1 border">
              {(['all', 'approved', 'pending', 'admin'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    filterType === type 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <UserX className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-semibold">No registered users match your filters.</p>
                <p className="text-xs mt-1">Try resetting the search query or toggle filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="divide-y bg-muted/30 text-xs text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th scope="col" className="px-6 py-4">User profile</th>
                    <th scope="col" className="px-6 py-4">Security Role</th>
                    <th scope="col" className="px-6 py-4">AI Tools Access</th>
                    <th scope="col" className="px-6 py-4">Action Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((targetUser) => {
                    const isTargetSelf = targetUser.uid === user?.uid;
                    const isRootAdmin = targetUser.email === 'diwakarvishwakarma9009@gmail.com';
                    
                    return (
                      <tr 
                        key={targetUser.uid}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {targetUser.photoURL ? (
                              <img 
                                src={targetUser.photoURL} 
                                alt={targetUser.displayName} 
                                className="h-10 w-10 rounded-full border bg-muted"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/25">
                                {targetUser.displayName ? targetUser.displayName.charAt(0).toUpperCase() : "U"}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                                {targetUser.displayName}
                                {isTargetSelf && (
                                  <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5">You</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                                <Mail className="h-3.5 w-3.5" />
                                {targetUser.email}
                              </span>
                              {targetUser.createdAt && (
                                <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-1 font-sans">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Joined: {new Date(targetUser.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Security Role */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            {(targetUser.role === 'admin' || isRootAdmin) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-500">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-1 text-xs font-semibold">
                                User
                              </span>
                            )}
                            
                            {!isRootAdmin && (
                              <button
                                onClick={() => handleToggleRole(targetUser)}
                                disabled={processingUid === targetUser.uid}
                                className="text-[10px] text-muted-foreground underline hover:text-primary transition-colors disabled:opacity-50 mt-1"
                              >
                                Toggle to {targetUser.role === 'admin' ? "Standard" : "Admin"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* AI Tool Access approved status */}
                        <td className="px-6 py-4">
                          {(targetUser.isApproved || isRootAdmin) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                              <UserCheck2 className="h-3.5 w-3.5" />
                              Approved (Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500 animate-pulse">
                              <Clock className="h-3.5 w-3.5" />
                              Pending Approval
                            </span>
                          )}
                        </td>

                        {/* Controls */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {isRootAdmin ? (
                              <span className="text-xs text-muted-foreground italic font-mono">Root Administrator</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={targetUser.isApproved ? "destructive" : "default"}
                                onClick={() => handleToggleApproval(targetUser)}
                                disabled={processingUid === targetUser.uid}
                                className="h-8 rounded-lg font-bold"
                              >
                                {processingUid === targetUser.uid ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : targetUser.isApproved ? (
                                  "Revoke Access"
                                ) : (
                                  "Approve Access"
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
