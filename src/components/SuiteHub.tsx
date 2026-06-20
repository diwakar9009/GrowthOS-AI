import { useState, useEffect, useRef } from "react";
import { db, collection, addDoc, query, orderBy, onSnapshot, handleFirestoreError, OperationType, doc, updateDoc, deleteDoc, setDoc } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/lib/ToastContext";
import { AIService } from "@/lib/gemini";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { 
  Building2, 
  Sparkles, 
  Search, 
  Globe, 
  Users, 
  Heart, 
  Mail, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart3, 
  Target, 
  Zap, 
  RefreshCw, 
  Check, 
  Trash2, 
  Send, 
  ArrowRight,
  Calculator, 
  CalendarRange, 
  MessageSquare, 
  Link as LinkIcon, 
  ExternalLink, 
  FileDown, 
  Smartphone, 
  Clock, 
  Briefcase, 
  Megaphone,
  Volume2, 
  Settings, 
  Lock, 
  ShieldAlert, 
  MousePointer2,
  ListFilter,
  Eye,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Compass,
  FileText,
  Copy,
  CheckCircle2,
  Percent,
  TrendingDown,
  Laptop,
  Upload,
  Play,
  Pause,
  FolderSync,
  History,
  ClipboardCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type GroupSuiteType = "hubspot" | "semrush" | "ahrefs" | "hootsuite" | "mailchimp" | "analytics" | "jasper" | "brevo" | "ads";

// Sub-interfaces for active tools
interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  stage: string;
  value: number;
  score: number;
}

interface SocialPost {
  id: string;
  content: string;
  platform: "meta" | "twitter" | "linkedin" | "youtube";
  scheduleTime: string;
  status: "Draft" | "Scheduled" | "Published";
  engagement: { views: number; likes: number; clicks: number };
}

interface BrevoMessage {
  id: string;
  sender: "customer" | "agent";
  text: string;
  time: string;
}

export function SuiteHub() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeSuiteTab, setActiveSuiteTab] = useState<GroupSuiteType>("hubspot");
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Custom API key configuration (saved in browser local storage)
  const [userApiKey, setUserApiKey] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("growthos_user_gemini_api_key") || "";
    setUserApiKey(saved);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem("growthos_user_gemini_api_key", userApiKey);
    showToast("Gemini API Key configured and stored locally!", "success");
  };

  // HubSpot Restore File Ref & Import handler
  const hubspotFileRef = useRef<HTMLInputElement>(null);

  const importHubspotCRM = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      showToast("Please log in first before importing backups.", "error");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (payload && Array.isArray(payload.contacts)) {
          // Push imported contacts to Firestore real-time collection
          for (const item of payload.contacts) {
            await addDoc(collection(db, `users/${user.uid}/suitehub_contacts`), {
              name: item.name || "Unnamed Contact",
              email: item.email || "no-email@example.com",
              company: item.company || "Independent",
              stage: item.stage || "Lead",
              value: Number(item.value || 0),
              score: Number(item.score || 50),
              createdAt: new Date().toISOString()
            });
          }

          // Push contact notes if they are present in JSON
          if (payload.contactNotes && typeof payload.contactNotes === "object") {
            for (const [cid, notes] of Object.entries(payload.contactNotes)) {
              await setDoc(doc(db, `users/${user.uid}/suitehub_contact_notes`, cid), {
                notes: Array.isArray(notes) ? notes : []
              });
            }
          }

          showToast(`Successfully restored ${payload.contacts.length} CRM contacts to Cloud database!`, "success");
        } else {
          showToast("Invalid JSON schema. Backup template must contain contacts.", "error");
        }
      } catch (err) {
        showToast("Failed to parse JSON backup file.", "error");
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = "";
  };

  // Additional Interactive Applets States
  const [hootsuiteFilter, setHootsuiteFilter] = useState<"all" | "Draft" | "Scheduled" | "Published">("all");
  const [bulkSubInput, setBulkSubInput] = useState("");
  const [showBulkSub, setShowBulkSub] = useState(false);
  
  // Google Analytics Active Live Event Interval Simulation state
  const [isGaLiveSimulating, setIsGaLiveSimulating] = useState(false);

  interface GaEvent {
    id: string | number;
    type: string;
    url: string;
    country: string;
    time: string;
    status: string;
    createdAt?: string;
  }
  const [gaMockEvents, setGaMockEvents] = useState<GaEvent[]>([]);

  const [trackedPixelName, setTrackedPixelName] = useState("");
  const [installedPixels, setInstalledPixels] = useState<string[]>([]);

  const installPixel = async () => {
    if (!trackedPixelName.trim()) {
      showToast("Please enter a pixel container or ID.", "info");
      return;
    }
    if (!user) {
      showToast("Please log in first to save pixels.", "error");
      return;
    }
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_pixels`), {
        name: trackedPixelName.trim(),
        createdAt: new Date().toISOString()
      });
      setTrackedPixelName("");
      showToast("Analytics pixel installed successfully into DOM wrapper!", "success");
    } catch (err) {
      showToast("Failed to save pixel.", "error");
    }
  };

  const dispatchGaEvent = async (triggerName: string) => {
    if (!user) {
      showToast("Please log in first before triggering telemetry.", "error");
      return;
    }
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_ga_events`), {
        type: triggerName,
        url: "/dashboard",
        country: "Local Sandbox",
        time: "Just now",
        status: "success",
        createdAt: new Date().toISOString()
      });
      showToast(`GA Protocol fired: ${triggerName}`, "success");
    } catch (err) {
      showToast("Failed to fire GA event.", "error");
    }
  };

  useEffect(() => {
    if (!isGaLiveSimulating || !user) return;
    const simulationEvents = [
      "Cart Item Appended", 
      "Whitepaper Downloaded", 
      "Upgrade Tier Clicked", 
      "Meta Carousel Inbound", 
      "Transactional Email Opened", 
      "Custom Filter Applied"
    ];
    const simulationInterval = setInterval(async () => {
      const chosenType = simulationEvents[Math.floor(Math.random() * simulationEvents.length)];
      const randomGeo = ["France", "Japan", "Australia", "Canada", "Singapore", "Dubai", "United States", "India", "Germany"][Math.floor(Math.random() * 9)];
      const randomUrls = ["/dashboard", "/register", "/upgrade", "/cart", "/about-us", "/features/seo", "/pricing"];
      try {
        await addDoc(collection(db, `users/${user.uid}/suitehub_ga_events`), {
          type: chosenType,
          url: randomUrls[Math.floor(Math.random() * randomUrls.length)],
          country: randomGeo,
          time: "Just now",
          status: "success",
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Simulation error", err);
      }
    }, 5000);

    return () => clearInterval(simulationInterval);
  }, [isGaLiveSimulating, user]);

  // Bulk Import Mailchimp
  const bulkImportSubscribers = async () => {
    if (!user) {
      showToast("Please log in first before importing subscribers.", "error");
      return;
    }
    if (!bulkSubInput.trim()) {
      showToast("Please enter email addresses first.", "error");
      return;
    }
    const extractedEmails = bulkSubInput.split(/[\n,;]+/).map(e => e.trim()).filter(e => e && e.includes("@"));
    if (extractedEmails.length === 0) {
      showToast("No valid emails detected. Use commas or lines.", "error");
      return;
    }
    
    try {
      for (const email of extractedEmails) {
        const defaultName = email.split("@")[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        await addDoc(collection(db, `users/${user.uid}/suitehub_subscribers`), {
          name: defaultName,
          email,
          status: "Subscribed",
          signupDate: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString()
        });
      }
      setBulkSubInput("");
      setShowBulkSub(false);
      showToast(`Successfully imported ${extractedEmails.length} bulk subscribers to cloud index!`, "success");
    } catch (err) {
      showToast("Failed to bulk import subscribers", "error");
    }
  };

  // 1. HubSpot States & Firestore synchronizations
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactNotes, setContactNotes] = useState<{ [id: string]: string[] }>({});

  // 2. SEMrush SEO Keyword Gap states & persistent watchlist
  const [semUrl, setSemUrl] = useState("");
  const [semCompUrl, setSemCompUrl] = useState("");
  const [semNiche, setSemNiche] = useState("Technology");
  const [semResult, setSemResult] = useState<string | null>(null);

  interface TrackedKeyword {
    id: string;
    keyword: string;
    volume: number;
    difficulty: number;
    status: "To Write" | "In Progress" | "Optimized" | "Ranking #1";
  }
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([]);

  // 3. Ahrefs States & persistent backlink outreach CRM
  const [ahrefsUrl, setAhrefsUrl] = useState("");
  const [ahrefsResult, setAhrefsResult] = useState<string | null>(null);

  interface OutreachTarget {
    id: string;
    domain: string;
    score: number;
    contact: string;
    status: "Uncontacted" | "Pitch Sent" | "Negotiating" | "Link Live";
  }
  const [outreachTargets, setOutreachTargets] = useState<OutreachTarget[]>([]);

  // 4. Hootsuite Scheduler States & AI Generator
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);

  // 5. Mailchimp States & Persistent Subscribers database
  interface MailchimpSubscriber {
    id: string;
    name: string;
    email: string;
    status: "Subscribed" | "Unsubscribed";
    signupDate: string;
  }
  const [mcGoal, setMcGoal] = useState("Product Launch");
  const [mcDesc, setMcDesc] = useState("");
  const [mcTone, setMcTone] = useState("Professional");
  const [mcResult, setMcResult] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<MailchimpSubscriber[]>([]);

  // 7. Jasper AI States & Persistent Drafts history
  interface JasperDraft {
    id: string;
    type: string;
    prompt: string;
    content: string;
    timestamp: string;
  }
  const [jasperType, setJasperType] = useState("AIDA");
  const [jasperPrompt, setJasperPrompt] = useState("");
  const [jasperOutput, setJasperOutput] = useState<string | null>(null);
  const [jasperHistory, setJasperHistory] = useState<JasperDraft[]>([]);

  // UI state variables
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactComp, setNewContactComp] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactVal, setNewContactVal] = useState("");
  const [newContactStage, setNewContactStage] = useState("Lead");

  const [newKw, setNewKw] = useState("");
  const [newKwVol, setNewKwVol] = useState("");
  const [newKwDiff, setNewKwDiff] = useState("");

  const [newOutreachDom, setNewOutreachDom] = useState("");
  const [newOutreachScore, setNewOutreachScore] = useState("");
  const [newOutreachCont, setNewOutreachCont] = useState("");

  const [newPostText, setNewPostText] = useState("");
  const [newPostPlatform, setNewPostPlatform] = useState<"meta" | "twitter" | "linkedin" | "youtube">("linkedin");
  const [newPostTime, setNewPostTime] = useState("");
  const [aiComposerLoading, setAiComposerLoading] = useState(false);

  const [newSubName, setNewSubName] = useState("");
  const [newSubEmail, setNewSubEmail] = useState("");

  // ====== CROSS-MODULE INTELLIGENCE SYNC METRICS ======
  const promoteToCoreClient = async (contact: Contact) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/clients`), {
        name: contact.name,
        email: contact.email,
        niche: contact.company || "Marketing Client",
        brandVoice: "Professional, Authoritative",
        createdAt: new Date().toISOString()
      });
      showToast(`Successfully promoted ${contact.name} (${contact.company || 'Independent'}) to Core CRM Client list!`, "success");
    } catch (error) {
      showToast("Sync to Core Client Database failed.", "error");
    }
  };

  const createCoreProjectFromLead = async (contact: Contact) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/projects`), {
        title: `${contact.company || contact.name} Scaling Campaign`,
        description: `Coordinated scale outreach, search keyword dominance audits, and performance ad creative campaigns. Initial projected value ₹${contact.value}.`,
        clientId: "", 
        status: "planning",
        priority: "medium",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      });
      showToast(`Generated Core Growth Project for ${contact.company || contact.name}! Check Projects tab!`, "success");
    } catch (error) {
      showToast("Project generation failed", "error");
    }
  };

  const syncKeywordToTasks = async (term: string, difficulty: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        title: `Draft high-priority SEO article targeting keyword: "${term}"`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: difficulty > 40 ? "high" : difficulty > 20 ? "medium" : "low",
        status: "pending",
        createdAt: new Date().toISOString()
      });
      showToast(`SEO Action Task for keyword "${term}" successfully linked to main Task Board!`, "success");
    } catch (e) {
      showToast("Keyword task creation failed.", "error");
    }
  };

  const syncOutreachToTasks = async (domain: string, contact: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/tasks`), {
        title: `Sponsor or pitching backlink outreach exchange with: ${domain} (${contact})`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "medium",
        status: "pending",
        createdAt: new Date().toISOString()
      });
      showToast(`Backlink outreach task appended to team Kanban board!`, "success");
    } catch (e) {
      showToast("Task creation failed", "error");
    }
  };

  const syncPostToCalendar = async (post: SocialPost) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/calendar`), {
        title: `[Social] ${post.platform.toUpperCase()} broadcast: "${post.content.substring(0, 30)}..."`,
        date: post.scheduleTime.split(" ")[0] || new Date().toISOString().split("T")[0],
        type: "social-post",
        description: post.content,
        createdAt: new Date().toISOString()
      });
      showToast(`Hootsuite post synced to Core Calendar!`, "success");
    } catch (e) {
      showToast("Calendar sync failed", "error");
    }
  };

  const saveCopyAsAsset = async (name: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/assets`), {
        userId: user.uid,
        clientId: null,
        name: `${name} Copy Draft`,
        type: "doc",
        url: content.substring(0, 150) + "...", 
        createdAt: new Date().toISOString()
      });
      showToast(`Newsletter marketing copy saved to brand Assets library!`, "success");
    } catch (e) {
      showToast("Asset library save failed", "error");
    }
  };

  // ====== FIRESTORE REAL-TIME SYNCHRONIZERS ======
  useEffect(() => {
    if (!user) return;

    // A. HubSpot Contacts
    const unsubscribeContacts = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_contacts`)),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { name: "Aarav Mehta", email: "aarav@mehtatech.com", company: "Mehta Technologies", stage: "Lead", value: 45000, score: 85, createdAt: new Date(Date.now() - 4000).toISOString() },
            { name: "Emily Watson", email: "emily@watsonretail.co.uk", company: "Watson Retail", stage: "Contacted", value: 120000, score: 62, createdAt: new Date(Date.now() - 3000).toISOString() },
            { name: "Vikram Malhotra", email: "v.malhotra@indialogistics.in", company: "India Logistics", stage: "Qualified", value: 350000, score: 91, createdAt: new Date(Date.now() - 2000).toISOString() },
            { name: "Sophie Dubois", email: "s.dubois@luxebrand.fr", company: "Luxe Brands Corp", stage: "Proposal", value: 500000, score: 48, createdAt: new Date(Date.now() - 1000).toISOString() },
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_contacts`), item);
          });
        } else {
          setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Contact[]);
        }
      }
    );

    // B. HubSpot Notes
    const unsubscribeNotes = onSnapshot(
      collection(db, `users/${user.uid}/suitehub_contact_notes`),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = {
            "1": ["Discovered via LinkedIn outreach.", "Scheduled introductory call for next Tuesday."],
            "2": ["Interested in e-commerce migration services.", "Needs detailed proposal on custom Shopify theme development."],
            "3": ["Enterprise-level logistics firm.", "In negotiations with CEO regarding CRM integrations."],
            "4": ["High end luxury brand expansion.", "Reviewing proposal stages on multi-channel ad plans."],
          };
          Object.entries(defaults).forEach(([id, notes]) => {
            setDoc(doc(db, `users/${user.uid}/suitehub_contact_notes`, id), { notes });
          });
        } else {
          const notesMap: { [id: string]: string[] } = {};
          snapshot.forEach((doc) => {
            notesMap[doc.id] = doc.data().notes || [];
          });
          setContactNotes(notesMap);
        }
      }
    );

    // C. Tracked Keywords (SEMrush)
    const unsubscribeKeywords = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_keywords`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { keyword: "advanced crm for startups", volume: 1800, difficulty: 24, status: "In Progress", createdAt: new Date(Date.now() - 3000).toISOString() },
            { keyword: "best visual marketing pipeline cost", volume: 950, difficulty: 12, status: "To Write", createdAt: new Date(Date.now() - 2000).toISOString() },
            { keyword: "top lead scores algorithms b2b", volume: 320, difficulty: 8, status: "Optimized", createdAt: new Date(Date.now() - 1000).toISOString() },
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_keywords`), item);
          });
        } else {
          setTrackedKeywords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TrackedKeyword[]);
        }
      }
    );

    // D. Backlink Outreach (Ahrefs)
    const unsubscribeOutreach = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_outreach`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { domain: "techcrunch.com/features", score: 92, contact: "editor@techcrunch.com", status: "Uncontacted", createdAt: new Date(Date.now() - 3000).toISOString() },
            { domain: "medium.com/startup-advice", score: 80, contact: "pitch@mediumventures.com", status: "Pitch Sent", createdAt: new Date(Date.now() - 2000).toISOString() },
            { domain: "saashub.com/blog", score: 74, contact: "onboarding@saashub.com", status: "Link Live", createdAt: new Date(Date.now() - 1000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_outreach`), item);
          });
        } else {
          setOutreachTargets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OutreachTarget[]);
        }
      }
    );

    // E. Social Post Feed (Hootsuite)
    const unsubscribeSocial = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_posts`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { content: "GrowthOS AI has revolutionized how our digital marketing agency runs campaign analysis. Real-time data + smart generation are massive game-changers! #SaaS #GrowthScaling", platform: "linkedin", scheduleTime: "2026-06-14 10:30", status: "Scheduled", engagement: { views: 125, likes: 11, clicks: 4 }, createdAt: new Date(Date.now() - 3000).toISOString() },
            { content: "Don't let missing keywords sink your SEO campaigns. Use our SEO tools to do Gap audits instantly. Here is how: https://growthos.ai/blog/keywords", platform: "twitter", scheduleTime: "2026-06-15 14:15", status: "Scheduled", engagement: { views: 89, likes: 6, clicks: 2 }, createdAt: new Date(Date.now() - 2000).toISOString() },
            { content: "Why performance marketers are migrating their entire brand workflow to serverless frameworks with integrated cognitive reasoning pipelines. Complete analysis video live on Monday!", platform: "youtube", scheduleTime: "2026-06-18 19:00", status: "Draft", engagement: { views: 0, likes: 0, clicks: 0 }, createdAt: new Date(Date.now() - 1000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_posts`), item);
          });
        } else {
          setSocialFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SocialPost[]);
        }
      }
    );

    // F. Audience Subscribers (Mailchimp)
    const unsubscribeSubscribers = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_subscribers`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { name: "Rohan Sharma", email: "rohan@indiatech.io", status: "Subscribed", signupDate: "2026-06-01", createdAt: new Date(Date.now() - 3000).toISOString() },
            { name: "Jessica Alva", email: "jessica@alvagroup.com", status: "Subscribed", signupDate: "2026-06-05", createdAt: new Date(Date.now() - 2000).toISOString() },
            { name: "Nikhil Joshi", email: "n.joshi@startupventures.co", status: "Unsubscribed", signupDate: "2026-05-20", createdAt: new Date(Date.now() - 1000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_subscribers`), item);
          });
        } else {
          setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MailchimpSubscriber[]);
        }
      }
    );

    // G. Jasper Copywriting History
    const unsubscribeJasper = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_jasper`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            {
              type: "AIDA",
              prompt: "CRM pipeline built for developers with free migrations",
              content: `**ATTENTION:** Are manual spreadsheets slowing down your deployment velocities?\n\n**INTEREST:** We built the first lifecycle CRM engineered from the code up for fast-paced developer startups. Say goodbye to manual sync scripts.\n\n**DESIRE:** Integrate seamlessly with PostgreSQL or SaaS databases, build pipelines directly from Git tags, and utilize instant cloud webhooks for status transparency. Free migration assistance on all standard tier plans.\n\n**ACTION:** Get started for free today. Backup and sync your telemetry arrays in one click at GrowthSuite.`,
              timestamp: "2026-06-12 11:40",
              createdAt: new Date().toISOString()
            }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_jasper`), item);
          });
        } else {
          setJasperHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JasperDraft[]);
        }
      }
    );

    // H. Google Analytics Live Event Logs
    const unsubscribeGAEvents = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_ga_events`), orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { type: "Lead Generated", url: "/upgrade-plan", country: "United States", time: "2 mins ago", status: "success", createdAt: new Date(Date.now() - 300000).toISOString() },
            { type: "SEO Article Read", url: "/blog/scale", country: "India", time: "5 mins ago", status: "success", createdAt: new Date(Date.now() - 200000).toISOString() },
            { type: "Hootsuite Click", url: "/dashboard", country: "Germany", time: "12 mins ago", status: "success", createdAt: new Date(Date.now() - 100000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_ga_events`), item);
          });
        } else {
          setGaMockEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as GaEvent[]);
        }
      }
    );

    // I. Google Analytics Installed Pixels
    const unsubscribePixels = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_pixels`), orderBy("createdAt", "asc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { name: "Google Analytics G-Z1904YF", createdAt: new Date(Date.now() - 2000).toISOString() },
            { name: "Meta Pixel lead-tracking v2", createdAt: new Date(Date.now() - 1000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_pixels`), item);
          });
        } else {
          setInstalledPixels(snapshot.docs.map(doc => doc.data().name as string));
        }
      }
    );

    // J. Brevo Customer Conversation Messages
    const unsubscribeBrevo = onSnapshot(
      query(collection(db, `users/${user.uid}/suitehub_brevo_chats`), orderBy("createdAt", "asc")),
      (snapshot) => {
        if (snapshot.empty) {
          const defaults = [
            { sender: "customer", text: "Hi, I am looking for the enterprise license pricing details. Do you offer seasonal discounts?", time: "10:30", createdAt: new Date(Date.now() - 300000).toISOString() },
            { sender: "agent", text: "Hello! Thank you for reaching out. Yes, we support customizable enterprise packages starting at ₹24,999/mo depending on user seats, and offer a flat 15% discount on annual billing cycles.", time: "10:32", createdAt: new Date(Date.now() - 200000).toISOString() },
            { sender: "customer", text: "Great! Can you draft me a custom proposal based on 25 users with priority support features?", time: "10:35", createdAt: new Date(Date.now() - 100000).toISOString() }
          ];
          defaults.forEach((item) => {
            addDoc(collection(db, `users/${user.uid}/suitehub_brevo_chats`), item);
          });
        } else {
          setBrevoChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as BrevoMessage[]);
        }
      }
    );

    return () => {
      unsubscribeContacts();
      unsubscribeNotes();
      unsubscribeKeywords();
      unsubscribeOutreach();
      unsubscribeSocial();
      unsubscribeSubscribers();
      unsubscribeJasper();
      unsubscribeGAEvents();
      unsubscribePixels();
      unsubscribeBrevo();
    };
  }, [user]);

  // ====== DATABASE INTERACTION CONTROLS (FIRESTORE ENFORCED) ======
  const addHubspotContact = async () => {
    if (!newContactName || !newContactEmail) {
      showToast("Please enter contact name and email.", "error");
      return;
    }
    if (!user) {
      showToast("Please authenticate first to sync changes.", "error");
      return;
    }
    const val = parseFloat(newContactVal) || 0;
    const emailWeight = newContactEmail.endsWith(".com") || newContactEmail.endsWith(".in") ? 15 : 5;
    const valueWeight = val > 100000 ? 50 : val > 50000 ? 35 : 20;
    const computedScore = Math.min(100, Math.floor(valueWeight + emailWeight + Math.random() * 30));

    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/suitehub_contacts`), {
        name: newContactName,
        company: newContactComp || "Independent",
        email: newContactEmail,
        stage: newContactStage,
        value: val,
        score: computedScore,
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, `users/${user.uid}/suitehub_contact_notes`, docRef.id), {
        notes: ["Deal record initialized in HubSpot pipeline."]
      });

      setNewContactName("");
      setNewContactComp("");
      setNewContactEmail("");
      setNewContactVal("");
      showToast("HubSpot CRM deal pipeline updated!", "success");
    } catch (e) {
      showToast("Failed to save CRM contact data.", "error");
    }
  };

  const updateContactStage = async (id: string, stage: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/suitehub_contacts`, id), { stage });
      showToast(`Lead stage updated to: ${stage}`, "success");
    } catch (e) {
      showToast("Failed to update status stage.", "error");
    }
  };

  const deleteHubspotContact = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_contacts`, id));
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_contact_notes`, id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      showToast("Contact deleted from CRM", "info");
    } catch (e) {
      showToast("Deletion failed.", "error");
    }
  };

  const addContactNote = async (id: string) => {
    if (!newNoteText.trim() || !user) return;
    const currentNotes = contactNotes[id] || [];
    try {
      await setDoc(doc(db, `users/${user.uid}/suitehub_contact_notes`, id), {
        notes: [...currentNotes, newNoteText.trim()]
      });
      setNewNoteText("");
      showToast("Activity log entry added successfully!", "success");
    } catch (e) {
      showToast("Failed to log activity.", "error");
    }
  };

  const exportHubspotCRM = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ contacts, contactNotes }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hubspot_crm_dump_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("CRM Database Backup downloaded successfully!", "success");
  };

  const addTrackedKeyword = async () => {
    if (!newKw.trim()) {
      showToast("Please enter a keyword term first.", "error");
      return;
    }
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_keywords`), {
        keyword: newKw.trim(),
        volume: parseInt(newKwVol) || 250,
        difficulty: parseFloat(newKwDiff) || 15,
        status: "To Write",
        createdAt: new Date().toISOString()
      });
      setNewKw("");
      setNewKwVol("");
      setNewKwDiff("");
      showToast("Keyword target appended to SEMrush tracking deck!", "success");
    } catch (e) {
      showToast("Failed to track keyword.", "error");
    }
  };

  const updateKeywordStatus = async (id: string, status: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/suitehub_keywords`, id), { status });
      showToast(`Keyword planning status updated to: ${status}`, "success");
    } catch (e) {
      showToast("Status change failed.", "error");
    }
  };

  const removeTrackedKeyword = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_keywords`, id));
      showToast("Keyword removed from target list", "info");
    } catch (e) {
      showToast("Deletion failed.", "error");
    }
  };

  const runSemrushAudit = async () => {
    if (!semUrl) {
      showToast("Please enter your website URL", "error");
      return;
    }
    setLoading(true);
    setSemResult(null);
    setAiError(null);
    try {
      const prompt = `As SEMrush Elite Competitor SEO Analyzer, conduct a professional Competitor Keyword Gap Analysis.
      Target Domain: ${semUrl}
      Competitor Domain: ${semCompUrl || 'Top Direct Local Competitor'}
      Focus Niche/Topic: ${semNiche}

      Generate an advanced, comprehensive diagnostic report:
      1. **SERP Competitiveness Rating**: Trust score out of 100 with SEO recommendations.
      2. **Core Keyword Gap Matrix**: Generate a detailed table of 8 key high-traffic, low-difficulty transactional keywords that the Competitor ranks in top 10 for, but the Target Domain is missing. Provide search volume, Keyword Difficulty % (KD), and CTR potentials.
      3. **Content Overlap & Positioning Analysis**: Highlighting where target is lagging.
      4. **On-Page & Technical SEO Plan**: Actionable remedies (structured data, topical authority gaps) to out-position them.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the head of SEO engineering at SEMrush. Provide deep, authentic metrics and actionable technical guidelines."
      });
      setSemResult(response);
      showToast("SEMrush Intelligence gap analysis pulled successfully!", "success");
    } catch (err: any) {
      setAiError(err.message || "SEO research failed.");
    } finally {
      setLoading(false);
    }
  };

  const addOutreachTarget = async () => {
    if (!newOutreachDom.trim()) {
      showToast("Specify domain reference or landing page url.", "error");
      return;
    }
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_outreach`), {
        domain: newOutreachDom.trim().replace(/^https?:\/\//, ''),
        score: parseInt(newOutreachScore) || 50,
        contact: newOutreachCont.trim() || "contact@domain.com",
        status: "Uncontacted",
        createdAt: new Date().toISOString()
      });
      setNewOutreachDom("");
      setNewOutreachScore("");
      setNewOutreachCont("");
      showToast("Outreach campaign target registered in system!", "success");
    } catch (e) {
      showToast("Outreach add failed.", "error");
    }
  };

  const updateOutreachStatus = async (id: string, status: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/suitehub_outreach`, id), { status });
      showToast(`Outreach target progress updated: ${status}`, "success");
    } catch (e) {
      showToast("Status change failed.", "error");
    }
  };

  const removeOutreachTarget = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_outreach`, id));
      showToast("Outreach partner removed", "info");
    } catch (e) {
      showToast("Deletion failed.", "error");
    }
  };

  const runAhrefsAudit = async () => {
    if (!ahrefsUrl) {
      showToast("Please specify a URL to audit", "error");
      return;
    }
    setLoading(true);
    setAhrefsResult(null);
    setAiError(null);
    try {
      const prompt = `As Ahrefs Backlink & Organic Authority Profiler, run a live crawl audit on: "${ahrefsUrl}".
      Generate:
      1. **Domain Rating (DR)** estimate out of 100.
      2. **Estimated Link Volume Profile**: Backlink counts, Referring Domains, and Do-follow ratio.
      3. **Toxic/Risk Link Vulnerability**: Percentage of risky domains.
      4. **Top 5 Outreach Referral Targets**: Specific real-world or highly relevant sites they should pitch to for premium backlinks.
      5. **Competitor Link Gap**: Specific anchor text and referring source recommendations to bypass their competition.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the Director of Organic Link Building at Ahrefs. Deliver deep link intelligence matrices."
      });
      setAhrefsResult(response);
      showToast("Ahrefs DR & backlink analysis completed!", "success");
    } catch (err: any) {
      setAiError(err.message || "Ahrefs link check failed.");
    } finally {
      setLoading(false);
    }
  };

  const addSocialPost = async () => {
    if (!newPostText) {
      showToast("Please enter content for your social post.", "error");
      return;
    }
    if (!user) return;
    const sched = newPostTime || new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace("T", " ");
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_posts`), {
        content: newPostText,
        platform: newPostPlatform,
        scheduleTime: sched,
        status: "Scheduled",
        engagement: { views: 0, likes: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      });
      setNewPostText("");
      setNewPostTime("");
      showToast("Post inserted into Hootsuite Publisher Queue!", "success");
    } catch (e) {
      showToast("Failed to schedule post.", "error");
    }
  };

  const generateAICaption = async () => {
    if (!newPostText.trim()) {
      showToast("Provide a brief theme topic or keyword into the caption box to transform with AI!", "info");
      return;
    }
    setAiComposerLoading(true);
    try {
      const prompt = `As a world-class social media copywriter, write a highly engaging, professional scroll-stopping social media post on the platform: "${newPostPlatform}".
      User details / context: "${newPostText}"
      Include 3 relevant high-converting trending hashtags and a strong call-to-action (CTA). Avoid generic AI greetings or fluff. Make the style natural, human-sounding, and highly interactive.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the Social Copywriter Lead. Output only the copy and hashtags, formatted ready for pasting."
      });
      setNewPostText(response || "");
      showToast("AI custom draft prepared!", "success");
    } catch (e: any) {
      showToast("AI Generation failed. Check key config.", "error");
    } finally {
      setAiComposerLoading(false);
    }
  };

  const publishImmediately = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/suitehub_posts`, id), {
        status: "Published",
        engagement: { 
          views: Math.floor(250 + Math.random() * 500), 
          likes: Math.floor(15 + Math.random() * 40), 
          clicks: Math.floor(8 + Math.random() * 20) 
        }
      });
      showToast("Post broadcasted instantly across connected webhooks!", "success");
    } catch (e) {
      showToast("Broadcast failure.", "error");
    }
  };

  const deleteSocialPost = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_posts`, id));
      showToast("Social post removed from queue", "info");
    } catch (e) {
      showToast("Removal failed.", "error");
    }
  };

  const addSubscriber = async () => {
    if (!newSubName.trim() || !newSubEmail.trim() || !newSubEmail.includes("@")) {
      showToast("Provide a valid name and active email address.", "error");
      return;
    }
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_subscribers`), {
        name: newSubName.trim(),
        email: newSubEmail.trim(),
        status: "Subscribed",
        signupDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      });
      setNewSubName("");
      setNewSubEmail("");
      showToast("Contact added to Mailchimp subscriber directory!", "success");
    } catch (e) {
      showToast("Failed to register subscriber.", "error");
    }
  };

  const toggleSubscriberStatus = async (id: string) => {
    if (!user) return;
    const currentSub = subscribers.find(s => s.id === id);
    if (!currentSub) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/suitehub_subscribers`, id), {
        status: currentSub.status === "Subscribed" ? "Unsubscribed" : "Subscribed"
      });
      showToast("Subscriber status updated!", "info");
    } catch (e) {
      showToast("Update failed.", "error");
    }
  };

  const removeSubscriber = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/suitehub_subscribers`, id));
      showToast("Contact removed from audience list", "info");
    } catch (e) {
      showToast("Removal failed.", "error");
    }
  };

  const copyBulkEmails = () => {
    const activeSubscribers = subscribers.filter(s => s.status === "Subscribed").map(s => s.email);
    if (activeSubscribers.length === 0) {
      showToast("No active subscribers in current list.", "info");
      return;
    }
    navigator.clipboard.writeText(activeSubscribers.join(", "));
    showToast(`Copied ${activeSubscribers.length} active emails to clipboard!`, "success");
  };

  const buildMailchimpCampaign = async () => {
    if (!mcDesc) {
      showToast("Describe your product or campaign context first.", "error");
      return;
    }
    setLoading(true);
    setMcResult(null);
    setAiError(null);
    try {
      const prompt = `As Mailchimp Elite Automation Architect, design a high-converting email campaign.
      Goal: ${mcGoal}
      Product Description: ${mcDesc}
      Brand Tone: ${mcTone}

      Provide:
      1. **3 High-converting Subject Lines**: Using Curiosity, Urgency, and Direct Value.
      2. **Pre-header Text Recommendations**.
      3. **3-Step HTML Automation Drip Blueprint**: Define timings (Delay 0, Day 2, Day 5) & core layout messages.
      4. **Responsive HTML Copyable Newsletter Template**: Inside a clear markdown code block \`\`\`html, write structured, visually striking responsive transactional single-column email HTML styled beautifully with colors, margin spacing, clean headers, custom CTA button centering, and legal unsubscribe footers so it renders perfectly on both desktop and mobile devices. Keep the style modern.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the lead email marketer of Mailchimp. Output clean, compliant HTML and direct marketing copies."
      });
      setMcResult(response);
      showToast("Mailchimp campaign email template ready!", "success");
    } catch (err: any) {
      setAiError(err.message || "Email automation builder failed.");
    } finally {
      setLoading(false);
    }
  };

  const runJasperCopywriter = async () => {
    if (!jasperPrompt) {
      showToast("Provide write-up details for copy generation.", "error");
      return;
    }
    setLoading(true);
    setJasperOutput(null);
    setAiError(null);
    try {
      const modePrompt = jasperType === "AIDA" ? 
        "Generate a complete Attention-Interest-Desire-Action (AIDA) Sales copy." :
        jasperType === "PAS" ?
        "Generate a highly persuasive Pain-Agitate-Solve (PAS) Marketing copy." :
        "Generate a structured, SEO-dense Long-Form blog post outline with custom H1, H2 sections, key hooks, and bullet takeaways.";

      const prompt = `As Jasper AI Premium Copywriting Architect, process the following instructions:
      Blueprint: ${jasperType} - ${modePrompt}
      Context/Details: "${jasperPrompt}"
      Include scroll-stopping headlines, formatted sales sections, clear bullet lists, tone modifiers, and creative hooks. Let's make it highly creative.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the premium Jasper AI content engine. Output copy that converts with zero fluff."
      });
      setJasperOutput(response);
      
      if (user) {
        await addDoc(collection(db, `users/${user.uid}/suitehub_jasper`), {
          type: jasperType,
          prompt: jasperPrompt,
          content: response || "",
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          createdAt: new Date().toISOString()
        });
      }
      showToast("Jasper copywriting completed & draft archived!", "success");
    } catch (err: any) {
      setAiError(err.message || "Copy generation failed.");
    } finally {
      setLoading(false);
    }
  };

  // 8. Brevo/Sendinblue Live chat inbox states
  const [brevoChats, setBrevoChats] = useState<BrevoMessage[]>([]);
  const [brevoInput, setBrevoInput] = useState("");

  const sendBrevoMessage = async () => {
    if (!brevoInput || !user) return;
    const originalText = brevoInput;
    setBrevoInput("");
    
    try {
      await addDoc(collection(db, `users/${user.uid}/suitehub_brevo_chats`), {
        sender: "agent",
        text: originalText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      });

      // Simulate smart AI support bot reply
      setTimeout(async () => {
        try {
          const sysPrompt = `Act as an elite support chatbot inside the Brevo live customer engine. 
          Your agent replied to a customer's message: "${originalText}".
          Based on that conversation, what is a highly helpful, concise reply from the customer saying 'Thank you' or asking a follow-up about timelines or onboarding?
          Provide a short 1-2 sentence response.`;
          const autoReply = await AIService.generateContent(sysPrompt, {
            systemInstruction: "Act as an active business customer. Keep replies short and realistic."
          });
          await addDoc(collection(db, `users/${user.uid}/suitehub_brevo_chats`), {
            sender: "customer",
            text: autoReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          // Fallback message
          await addDoc(collection(db, `users/${user.uid}/suitehub_brevo_chats`), {
            sender: "customer",
            text: "Thank you for the quick support! Please send over the contract outline.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString()
          });
        }
      }, 1500);
    } catch (e) {
      showToast("Failed to send message.", "error");
    }
  };

  // 9. Ads Campaign Planner states
  const [adsBudget, setAdsBudget] = useState("50000");
  const [adsCPC, setAdsCPC] = useState("15");
  const [adsCPM, setAdsCPM] = useState("250");
  const [adsNiche, setAdsNiche] = useState("SaaS Agency");
  const [adsPlannerResult, setAdsPlannerResult] = useState<string | null>(null);

  const calculateAdPlan = async () => {
    setLoading(true);
    setAdsPlannerResult(null);
    setAiError(null);
    try {
      const budget = parseFloat(adsBudget) || 10000;
      const cpc = parseFloat(adsCPC) || 20;
      const cpm = parseFloat(adsCPM) || 300;
      
      const estimatedClicks = Math.floor(budget / cpc);
      const estimatedImp = Math.floor((budget / cpm) * 1000);
      const estCtr = ((estimatedClicks / estimatedImp) * 100).toFixed(2);

      const prompt = `As Google & Meta Ads Performance Strategist, architect an advanced media buying budget map.
      Total Budget: ₹${budget}
      Target CPC Constraint: ₹${cpc}
      Target CPM Setup: ₹${cpm}
      Business/Niche Theme: ${adsNiche}

      Simulated Direct Calculations:
      - Estimated Core Clicks: ${estimatedClicks}
      - Estimated Absolute Impressions: ${estimatedImp}
      - Calculated Projected CTR: ${estCtr}%

      Please generate a comprehensive performative planning blueprint:
      1. **Channel Spends Diversification Matrix**: Define exactly how to split the ₹${budget} (e.g., Google Search, Meta Carousel, Meta Retargeting, YouTube pre-rolls) on a responsive % breakdown.
      2. **ROAS Target Ranges**: Suggest conversion value guidelines to hit a 3x-5x return.
      3. **3 Scroll-Stopping Meta Creative hooks & Copy frameworks** specifically optimized for this CTR target.
      4. **Google Search Ad group outlines**: Recommended keywords and Headline pinning strategies.`;

      const response = await AIService.generateContent(prompt, {
        systemInstruction: "You are the premium performance marketing buyer for elite ad networks. Deliver deep, data-driven budget splits."
      });
      setAdsPlannerResult(response);
      showToast("Google/Meta performing ad plan calculated!", "success");
    } catch (err: any) {
      setAiError(err.message || "Ad planning engine failed.");
    } finally {
      setLoading(false);
    }
  };

  const suiteList = [
    { id: "hubspot", name: "HubSpot CRM", icon: Building2, desc: "Pipeline & Contact Leads", color: "from-orange-500 to-amber-600 bg-orange-500/10 text-orange-500" },
    { id: "semrush", name: "SEMrush SEO", icon: Search, desc: "Domain & Keyword Gap Auditing", color: "from-amber-500 to-orange-500 bg-amber-500/10 text-amber-500" },
    { id: "ahrefs", name: "Ahrefs Backlinks", icon: Globe, desc: "Domain Rank & Trust Audit", color: "from-blue-500 to-indigo-600 bg-blue-500/10 text-blue-500" },
    { id: "hootsuite", name: "Hootsuite Queue", icon: CalendarRange, desc: "Schedule Social Streams", color: "from-sky-500 to-blue-500 bg-sky-500/10 text-sky-500" },
    { id: "mailchimp", name: "Mailchimp Emails", icon: Mail, desc: "Email Builder & newsletters", color: "from-yellow-400 to-amber-500 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400" },
    { id: "analytics", name: "Google Analytics", icon: BarChart3, desc: "Real-time Event Tracker", color: "from-rose-500 to-emerald-500 bg-rose-500/10 text-rose-500" },
    { id: "jasper", name: "Jasper AI", icon: Sparkles, desc: "Ultimate Copywriting suite", color: "from-indigo-500 to-purple-600 bg-indigo-500/10 text-indigo-500" },
    { id: "brevo", name: "Brevo Support Inbox", icon: MessageSquare, desc: "Conversational Chat Suite", color: "from-teal-500 to-emerald-600 bg-teal-500/10 text-teal-600" },
    { id: "ads", name: "Google/Meta Ads", icon: Target, desc: "Advanced Budget Optimization", color: "from-violet-500 to-indigo-600 bg-violet-500/10 text-violet-500" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-14">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-br from-primary/10 via-background to-secondary/15 rounded-2xl border border-primary/10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-primary/25 border border-primary/30 text-primary text-[10px] font-black rounded-full uppercase tracking-wider">
              Ultimate Enterprise Pack
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            GrowthSuite Command Center
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Next-gen advanced tooling integrating HubSpot, SEMrush, Ahrefs, Hootsuite, Mailchimp, GA, Jasper, Brevo & Ad Planners directly in one cohesive hub.
          </p>
        </div>
        
        {/* Token API Settings Modal trigger */}
        <div className="flex items-center space-x-2 bg-background border border-border px-3 py-2 rounded-xl shadow-sm max-w-sm">
          <Settings className="h-4 w-4 text-muted-foreground animate-spin-slow" />
          <input
            type="password"
            placeholder="Custom Gemini API Key override (Optional)"
            className="text-xs md:text-sm bg-transparent outline-none w-44"
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
          />
          <Button size="sm" className="h-7 text-[10px]" onClick={saveApiKey}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-2 lg:col-span-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-3">Integrations Active</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2">
            {suiteList.map((item) => {
              const Icon = item.icon;
              const isActive = activeSuiteTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSuiteTab(item.id as GroupSuiteType);
                    setAiError(null);
                  }}
                  className={cn(
                    "flex flex-col lg:flex-row lg:items-center gap-2 rounded-xl p-3 border transition-all text-left group cursor-pointer",
                    isActive 
                      ? "bg-primary border-primary text-primary-foreground shadow-md"
                      : "bg-background hover:bg-muted/50 border-border hover:border-primary/20 hover:scale-[1.02] duration-200"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isActive ? "bg-white/25 text-white" : item.color
                  )}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs md:text-sm truncate">{item.name}</p>
                    <p className={cn(
                      "text-[10px] truncate",
                      isActive ? "text-white/80" : "text-muted-foreground"
                    )}>{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Panel Workspace */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSuiteTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* HUBSPOT VIEW */}
              {activeSuiteTab === "hubspot" && (
                <Card className="border-orange-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/10 via-transparent to-transparent border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-orange-500/20">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">HubSpot Lifecycle CRM Pipeline</CardTitle>
                        <CardDescription>Advanced Client Deal Pipeline & Lead Qualification parameters</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 self-start md:self-auto shrink-0 flex-wrap">
                      <Button onClick={exportHubspotCRM} size="sm" variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10 gap-1.5 text-xs font-bold">
                        <FileDown className="h-3.5 w-3.5" /> Backup Database (JSON)
                      </Button>
                      <Button onClick={() => hubspotFileRef.current?.click()} size="sm" variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10 gap-1.5 text-xs font-bold">
                        <Upload className="h-3.5 w-3.5" /> Restore CRM
                      </Button>
                      <input type="file" ref={hubspotFileRef} className="hidden" onChange={importHubspotCRM} accept=".json" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Add Contact Form */}
                    <div className="p-4 bg-muted/35 rounded-xl border border-border grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Deal Contact Name</label>
                        <Input value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="e.g. Rachel Green" className="h-9 text-xs" />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Corporate Email</label>
                        <Input value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} placeholder="rachel@ralphlauren.com" className="h-9 text-xs" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Company Name</label>
                        <Input value={newContactComp} onChange={e => setNewContactComp(e.target.value)} placeholder="Ralph Lauren" className="h-9 text-xs" />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Deal Value (INR)</label>
                        <Input value={newContactVal} onChange={e => setNewContactVal(e.target.value)} placeholder="150000" type="number" className="h-9 text-xs" />
                      </div>
                      <div className="md:col-span-2">
                        <Button className="w-full h-9 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white border-none shrink-0" onClick={addHubspotContact}>
                          <Plus className="h-4 w-4 mr-1" /> Add Deal
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      {/* Kanban Columns */}
                      <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-4", selectedContact ? "xl:col-span-9" : "xl:col-span-12")}>
                        {["Lead", "Contacted", "Qualified", "Proposal"].map(stage => {
                          const matching = contacts.filter(c => c.stage === stage);
                          return (
                            <div key={stage} className="bg-muted/40 p-4 rounded-xl border border-border min-h-[350px] space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b">
                                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{stage}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-600 font-bold rounded">
                                  {matching.length}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {matching.map(c => {
                                  const isSelected = selectedContact?.id === c.id;
                                  return (
                                    <div 
                                      key={c.id} 
                                      onClick={() => setSelectedContact(c)}
                                      className={cn(
                                        "p-3 bg-background border rounded-lg shadow-sm space-y-2 group transition-all cursor-pointer text-left",
                                        isSelected 
                                          ? "border-orange-500 ring-2 ring-orange-500/20" 
                                          : "border-border hover:border-orange-500/40"
                                      )}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="truncate">
                                          <h4 className="font-bold text-xs truncate">{c.name}</h4>
                                          <p className="text-[10px] text-muted-foreground truncate">{c.company}</p>
                                        </div>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteHubspotContact(c.id);
                                          }} 
                                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 rounded transition-opacity"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-mono text-muted-foreground">₹{c.value.toLocaleString()}</span>
                                        <span className={cn(
                                          "px-1 rounded font-bold",
                                          c.score > 80 ? "bg-emerald-100 text-emerald-700" : c.score > 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                        )}>
                                          Score: {c.score}
                                        </span>
                                      </div>

                                      {/* Quick Stage Moving Buttons */}
                                      <div className="flex items-center justify-end gap-1 pt-1 border-t border-dashed" onClick={e => e.stopPropagation()}>
                                        {stage !== "Lead" && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[8px] px-1" onClick={() => {
                                            const stages = ["Lead", "Contacted", "Qualified", "Proposal"];
                                            const prevIndex = stages.indexOf(stage) - 1;
                                            updateContactStage(c.id, stages[prevIndex]);
                                          }}>&larr; Prev</Button>
                                        )}
                                        {stage !== "Proposal" && (
                                          <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1 text-orange-600" onClick={() => {
                                            const stages = ["Lead", "Contacted", "Qualified", "Proposal"];
                                            const nextIndex = stages.indexOf(stage) + 1;
                                            updateContactStage(c.id, stages[nextIndex]);
                                          }}>Next &rarr;</Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Contact Sidebar Details & Activity Logger */}
                      {selectedContact && (
                        <div className="xl:col-span-3 bg-muted/20 border border-border rounded-xl p-4 space-y-5 text-left">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-bold text-sm text-foreground">Deal Journal & Logs</h3>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedContact(null)}>✕</Button>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-black text-sm text-orange-600 truncate">{selectedContact.name}</h4>
                            <p className="text-[11px] text-muted-foreground truncate">{selectedContact.company} &bull; {selectedContact.email}</p>
                            <p className="font-mono text-xs font-bold pt-1">Lead Stage: {selectedContact.stage}</p>
                          </div>

                          {/* Real App Integration actions */}
                          <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-2">
                            <h5 className="text-[9px] uppercase font-bold text-orange-600 tracking-wider">Growth Workspace Sync</h5>
                            <div className="flex flex-col gap-1.5">
                              <Button 
                                size="sm" 
                                className="w-full h-8 text-[11px] bg-white border border-orange-500/20 text-orange-700 hover:bg-orange-500/10 font-bold justify-start"
                                onClick={() => promoteToCoreClient(selectedContact)}
                              >
                                <Users className="h-3.5 w-3.5 mr-1.5 text-orange-600" /> Promote to Client Profile
                              </Button>
                              <Button 
                                size="sm" 
                                className="w-full h-8 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold justify-start border-none"
                                onClick={() => createCoreProjectFromLead(selectedContact)}
                              >
                                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-white" /> Create Growth Project
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Activity History</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {(contactNotes[selectedContact.id] || []).length === 0 ? (
                                <p className="text-[11px] text-muted-foreground italic">No activities logged yet.</p>
                              ) : (
                                (contactNotes[selectedContact.id] || []).map((note, index) => (
                                  <div key={index} className="p-2 bg-background border border-border/60 rounded text-[11px] leading-relaxed relative">
                                    <span className="absolute left-1.5 top-2 text-[8px] text-muted-foreground">#{index + 1}</span>
                                    <p className="pl-4 text-muted-foreground">{note}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Log New Interaction</label>
                            <div className="flex gap-2">
                              <Input 
                                value={newNoteText} 
                                onChange={e => setNewNoteText(e.target.value)} 
                                placeholder="Call conducted, sent RFP..." 
                                className="h-8 text-xs bg-background"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    addContactNote(selectedContact.id);
                                  }
                                }}
                              />
                              <Button size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white shrink-0" onClick={() => addContactNote(selectedContact.id)}>
                                Log
                              </Button>
                            </div>
                            <p className="text-[8px] text-muted-foreground">Press Log or Enter to save activity.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SEMRUSH VIEW */}
              {activeSuiteTab === "semrush" && (
                <Card className="border-amber-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-amber-500/20">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">SEMrush Organic Keyword Gap Explorer</CardTitle>
                        <CardDescription>Deep Competitor benchmarking & transactional keyword overlap diagnostics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">My/Client URL</label>
                        <Input value={semUrl} onChange={e => setSemUrl(e.target.value)} placeholder="e.g. myshopifybrand.com" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Competitor Domain</label>
                        <Input value={semCompUrl} onChange={e => setSemCompUrl(e.target.value)} placeholder="e.g. marketleader.com" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Industry/Product Focus</label>
                        <Input value={semNiche} onChange={e => setSemNiche(e.target.value)} placeholder="e.g. Organic Cosmetics" />
                      </div>
                    </div>
                    <Button disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 font-bold" onClick={runSemrushAudit}>
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Audit Domain Gaps Now
                    </Button>

                    {aiError && (
                      <div className="p-4 bg-rose-100/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                      {/* Left: Audit Report output */}
                      <div className="lg:col-span-7 space-y-4 text-left">
                        {semResult ? (
                          <div className="p-5 bg-muted/30 border border-border shadow-inner rounded-xl space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-xs font-bold font-mono tracking-wider uppercase">SEMrush Gap Report</span>
                              <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full font-bold">API Live</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                              <ReactMarkdown>{semResult}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className="h-64 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                            <Search className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-xs font-bold">Ready to analyze target site and competitor keyword positions.</p>
                            <p className="text-[10px]">Enter domain nodes and trigger the Live SEMrush auditor.</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Personal high-impact keywords board */}
                      <div className="lg:col-span-5 p-4 bg-muted/30 border border-border rounded-xl space-y-4 text-left">
                        <div className="border-b pb-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Personal Target Watchlist</h3>
                          <p className="text-[10px] text-muted-foreground">Track discovered keywords locally & plan content workflow.</p>
                        </div>

                        {/* Watchlist Quick Stats Dashboard Card */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-background border border-border/70 rounded-xl text-center shadow-inner">
                          <div>
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Volume Pool</div>
                            <div className="text-xs font-extrabold text-amber-600 font-mono mt-0.5">
                              {trackedKeywords.reduce((acc, k) => acc + k.volume, 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="border-x border-dashed px-1 border-border">
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Avg Diff</div>
                            <div className="text-xs font-extrabold text-amber-600 font-mono mt-0.5">
                              {trackedKeywords.length ? Math.round(trackedKeywords.reduce((acc, k) => acc + k.difficulty, 0) / trackedKeywords.length) : 0}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Easy Terms</div>
                            <div className="text-xs font-extrabold text-emerald-500 font-mono mt-0.5">
                              {trackedKeywords.filter(k => k.difficulty < 30).length} / {trackedKeywords.length}
                            </div>
                          </div>
                        </div>

                        {/* Quick keyword adder */}
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Keyword</label>
                            <Input value={newKw} onChange={e => setNewKw(e.target.value)} placeholder="organic facial oil" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Vol</label>
                            <Input value={newKwVol} onChange={e => setNewKwVol(e.target.value)} placeholder="1200" type="number" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">KD%</label>
                            <Input value={newKwDiff} onChange={e => setNewKwDiff(e.target.value)} placeholder="18" type="number" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-2">
                            <Button size="sm" className="h-8 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold p-0 shrink-0" onClick={addTrackedKeyword}>
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1">
                          {trackedKeywords.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic text-center py-4">Your target keyword deck is currently empty.</p>
                          ) : (
                            trackedKeywords.map(k => (
                              <div key={k.id} className="p-3 bg-background border border-border rounded-lg shadow-sm space-y-2 relative group">
                                <button onClick={() => removeTrackedKeyword(k.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 rounded p-1">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                <div className="pr-6">
                                  <h4 className="font-bold text-xs truncate text-orange-600">{k.keyword}</h4>
                                  <div className="flex items-center space-x-3 text-[10px] text-muted-foreground mt-0.5">
                                    <span>Vol: <strong className="font-mono text-foreground">{k.volume.toLocaleString()}</strong></span>
                                    <span>KD: <strong className="font-mono text-foreground">{k.difficulty}%</strong></span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-dashed">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-5 text-[9px] px-1 border-orange-500/10 hover:bg-orange-500/5 text-orange-600 gap-1 font-bold"
                                    onClick={() => syncKeywordToTasks(k.keyword, k.difficulty)}
                                  >
                                    <ClipboardCheck className="h-2.5 w-2.5" /> Sync Task
                                  </Button>
                                  <select 
                                    value={k.status} 
                                    onChange={e => updateKeywordStatus(k.id, e.target.value)}
                                    className="text-[10px] font-bold bg-muted border border-border rounded py-0.5 px-1.5 cursor-pointer outline-none"
                                  >
                                    <option value="To Write">&para; To Write</option>
                                    <option value="In Progress">&raquo; In Progress</option>
                                    <option value="Optimized">&bull; Optimized</option>
                                    <option value="Ranking #1">&#9733; Ranking #1</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AHREFS VIEW */}
              {activeSuiteTab === "ahrefs" && (
                <Card className="border-blue-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Ahrefs Premium Backlink Profiler</CardTitle>
                        <CardDescription>Domain Rating (DR) crawl logic, referral volume checks & link strategy building</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex gap-3 max-w-2xl">
                      <div className="flex-1">
                        <Input value={ahrefsUrl} onChange={e => setAhrefsUrl(e.target.value)} placeholder="Enter target site to audit (e.g. startupgrowth.co)" />
                      </div>
                      <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={runAhrefsAudit}>
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Crawl domain and links
                      </Button>
                    </div>

                    {aiError && (
                      <div className="p-4 bg-rose-100/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                      {/* Left Block: Audit Markdown Results */}
                      <div className="lg:col-span-7 space-y-4 text-left">
                        {ahrefsResult ? (
                          <div className="p-5 bg-muted/30 border border-border shadow-inner rounded-xl space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-xs font-bold font-mono tracking-wider">Ahrefs Backlink Profile Stats</span>
                              <span className="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-600 rounded-full font-bold">Crawl Complete</span>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                              <ReactMarkdown>{ahrefsResult}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className="h-64 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                            <Globe className="h-10 w-10 mb-2 opacity-50 text-blue-500" />
                            <p className="text-xs font-bold">Ready to index domain references & referring domains.</p>
                            <p className="text-[10px]">Enter target domain endpoints and fetch simulated anchor profiles.</p>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Backlink Outreach CRM & Target list */}
                      <div className="lg:col-span-5 p-4 bg-muted/30 border border-border rounded-xl space-y-4 text-left">
                        <div className="border-b pb-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Link Outreach Pipeline</h3>
                          <p className="text-[10px] text-muted-foreground">Log organic guest posts and PR links targets.</p>
                        </div>

                        {/* Outreach Stats Counter Card */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-background border border-border/70 rounded-xl text-center shadow-inner">
                          <div>
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Prospects</div>
                            <div className="text-xs font-extrabold text-blue-600 font-mono mt-0.5">{outreachTargets.length}</div>
                          </div>
                          <div className="border-x border-dashed px-1 border-border">
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Avg DR</div>
                            <div className="text-xs font-extrabold text-blue-600 font-mono mt-0.5">
                              {outreachTargets.length ? Math.round(outreachTargets.reduce((acc, t) => acc + t.score, 0) / outreachTargets.length) : 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-muted-foreground uppercase font-black">Live Links</div>
                            <div className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                              {outreachTargets.filter(t => t.status === "Link Live").length} <CheckCircle2 className="h-3 w-3 text-emerald-500 inline" />
                            </div>
                          </div>
                        </div>

                        {/* Quick outreach adder */}
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Domain</label>
                            <Input value={newOutreachDom} onChange={e => setNewOutreachDom(e.target.value)} placeholder="techblog.org" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Editor Email</label>
                            <Input value={newOutreachCont} onChange={e => setNewOutreachCont(e.target.value)} placeholder="editor@site.com" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-1.5 space-y-1">
                            <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">DR</label>
                            <Input value={newOutreachScore} onChange={e => setNewOutreachScore(e.target.value)} placeholder="70" type="number" className="h-8 text-[11px] bg-background" />
                          </div>
                          <div className="col-span-1.5">
                            <Button size="sm" className="h-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-0 shrink-0" onClick={addOutreachTarget}>
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {outreachTargets.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic text-center py-4">No outreach records saved.</p>
                          ) : (
                            outreachTargets.map(t => (
                              <div key={t.id} className="p-3 bg-background border border-border rounded-lg shadow-sm space-y-1.5 relative group">
                                <button onClick={() => removeOutreachTarget(t.id)} className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 rounded p-1">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                <div className="pr-6">
                                  <h4 className="font-bold text-xs truncate text-blue-600">{t.domain}</h4>
                                  <div className="flex items-center space-x-3 text-[10px] text-muted-foreground mt-0.5">
                                    <span>Contact: <strong className="text-foreground font-mono">{t.contact}</strong></span>
                                    <span>DR: <strong className="font-mono text-foreground">{t.score}</strong></span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-dashed">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-5 text-[9px] px-1 border-blue-500/10 hover:bg-blue-500/5 text-blue-600 gap-1 font-bold"
                                    onClick={() => syncOutreachToTasks(t.domain, t.contact)}
                                  >
                                    <Mail className="h-2.5 w-2.5" /> Sync Task
                                  </Button>
                                  <select 
                                    value={t.status} 
                                    onChange={e => updateOutreachStatus(t.id, e.target.value)}
                                    className="text-[10px] font-bold bg-muted border border-border rounded py-0.5 px-1.5 cursor-pointer outline-none"
                                  >
                                    <option value="Uncontacted">Uncontacted</option>
                                    <option value="Pitch Sent">Pitch Sent</option>
                                    <option value="Negotiating">Negotiating</option>
                                    <option value="Link Live">Link Live</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* HOOTSUITE VIEW */}
              {activeSuiteTab === "hootsuite" && (
                <Card className="border-sky-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-sky-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-sky-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-sky-500/20">
                        <CalendarRange className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Hootsuite Social scheduler Queue</CardTitle>
                        <CardDescription>Multi-profile composer, visual live post drafts & channel previews</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Social Composer */}
                      <div className="lg:col-span-5 p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground pb-2 border-b">
                          Composer & Channel Planner
                        </h3>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-muted-foreground">Select Platform</label>
                          <div className="grid grid-cols-4 gap-2">
                            {["linkedin", "twitter", "meta", "youtube"].map(plat => (
                              <button
                                key={plat}
                                onClick={() => setNewPostPlatform(plat as any)}
                                className={cn(
                                  "py-1.5 px-2 rounded-lg border font-bold capitalize text-[10px] text-center transition-all cursor-pointer",
                                  newPostPlatform === plat 
                                    ? "bg-sky-600 border-sky-600 text-white shadow"
                                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                                )}
                              >
                                {plat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase font-black text-muted-foreground">Post Content Caption</label>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              disabled={aiComposerLoading}
                              onClick={generateAICaption}
                              className="h-6 text-[9px] font-bold text-sky-600 hover:text-sky-700 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0 border-none shrink-0"
                            >
                              {aiComposerLoading ? (
                                <>
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin mr-1" /> Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-2.5 w-2.5 text-sky-500 mr-1 animate-pulse" /> AI Magic Caption
                                </>
                              )}
                            </Button>
                          </div>
                          <textarea
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            placeholder="Write a draft topic, or click 'AI Magic Caption' to transform details into organic copy..."
                            rows={4}
                            className="w-full text-xs p-3 outline-none bg-background border rounded-xl resize-none font-sans focus:border-sky-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-muted-foreground">Schedule Date & Time</label>
                          <Input
                            type="datetime-local"
                            value={newPostTime}
                            onChange={e => setNewPostTime(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>

                        <Button className="w-full h-9 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white" onClick={addSocialPost}>
                          Queue Post to Calendar
                        </Button>
                      </div>

                      {/* Middle: Live Composer mobile card Preview */}
                      <div className="lg:col-span-3 bg-[#e2e8f0]/30 dark:bg-slate-900/60 p-4 rounded-xl border border-border flex flex-col justify-center items-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-3 flex items-center">
                          <Smartphone className="h-3 w-3 mr-1" /> Handset Live mock Preview
                        </span>
                        
                        {/* Twitter Card Mock / LinkedIn Post Mock */}
                        <div className="w-full max-w-[240px] bg-background border rounded-xl p-3 shadow-sm space-y-2 text-left">
                          <div className="flex items-center space-x-2">
                            <div className="h-7 w-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              OS
                            </div>
                            <div>
                              <p className="text-[10px] font-black">GrowthOS Brand Hub</p>
                              <p className="text-[8px] text-muted-foreground">@growthos_ai</p>
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-foreground leading-snug line-clamp-6">
                            {newPostText || "Your scheduled post text outline will appear live in this standard preview console card..."}
                          </p>
                          
                          <div className="h-20 w-full bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">
                            Media Asset Attached
                          </div>

                          <div className="flex items-center justify-between text-[8px] text-muted-foreground pt-1 border-t">
                            <span>Likes: 0</span>
                            <span>Clicks: 0</span>
                            <span>Comments: 0</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scheduled Stream */}
                      <div className="lg:col-span-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        <div className="flex justify-between items-center border-b pb-1">
                          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                            Publisher Queue Stream
                          </h3>
                        </div>

                        {/* Interactive Queue Filters */}
                        <div className="flex flex-wrap gap-1 bg-muted/65 p-1 rounded-lg">
                          {[
                            { id: "all", name: `All (${socialFeed.length})` },
                            { id: "Scheduled", name: `Sched (${socialFeed.filter(p => p.status === "Scheduled").length})` },
                            { id: "Published", name: `Pub (${socialFeed.filter(p => p.status === "Published").length})` },
                            { id: "Draft", name: `Drafts (${socialFeed.filter(p => p.status === "Draft").length})` }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setHootsuiteFilter(t.id as any)}
                              className={cn(
                                "text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition-colors flex-1 text-center",
                                hootsuiteFilter === t.id 
                                  ? "bg-sky-600 text-white shadow-xs" 
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>

                        {socialFeed.filter(post => hootsuiteFilter === "all" || post.status === hootsuiteFilter).length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-border/60 rounded-xl">
                            <CalendarRange className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-40" />
                            <p className="text-[11px] text-muted-foreground italic">No posts match this filter.</p>
                          </div>
                        ) : (
                          socialFeed.filter(post => hootsuiteFilter === "all" || post.status === hootsuiteFilter).map(post => (
                            <div key={post.id} className="p-3 bg-background border rounded-xl shadow-sm space-y-3 text-left">
                              <div className="flex justify-between items-center">
                                <span className={cn(
                                  "text-[9px] uppercase font-bold px-1.5 py-0.5 rounded",
                                  post.platform === "linkedin" ? "bg-blue-100 text-blue-700 font-bold" :
                                  post.platform === "twitter" ? "bg-[#1DA1F2]/10 text-[#1DA1F2] font-semibold" :
                                  post.platform === "meta" ? "bg-facebook/10 text-facebook font-semibold" : "bg-red-100 text-red-700"
                                )}>{post.platform}</span>
                                <span className="text-[9px] text-muted-foreground font-mono">{post.scheduleTime}</span>
                              </div>
                              <p className="text-xs text-foreground/80 line-clamp-3">{post.content}</p>
                              
                              {post.status === "Scheduled" && (
                                <div className="flex justify-end gap-1.5 pt-1 border-t">
                                  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 border-sky-500/20 text-sky-600 hover:bg-sky-500/5 font-bold" onClick={() => syncPostToCalendar(post)}>
                                    <CalendarRange className="h-3 w-3 mr-1" /> Sync Calendar
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 text-rose-500" onClick={() => deleteSocialPost(post.id)}>
                                    Delete
                                  </Button>
                                  <Button size="sm" className="h-6 text-[9.5px] px-2.5 bg-sky-600 hover:bg-sky-700 text-white animate-pulse" onClick={() => publishImmediately(post.id)}>
                                    Publish Now
                                  </Button>
                                </div>
                              )}

                              {post.status === "Published" && (
                                <div className="flex justify-between items-center pt-2 border-t text-[9px] text-emerald-600">
                                  <span className="font-bold">Published Live</span>
                                  <span className="font-mono text-muted-foreground">Views: {post.engagement.views} | Likes: {post.engagement.likes}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MAILCHIMP VIEW */}
              {activeSuiteTab === "mailchimp" && (
                <Card className="border-yellow-400/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-yellow-400/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-yellow-400/20">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Mailchimp Email Campaign & Automation Drip</CardTitle>
                        <CardDescription>Generate HTML response campaign structures & click triggers</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Goal</label>
                        <select className="w-full text-xs p-2 bg-background border rounded-lg h-9" value={mcGoal} onChange={e => setMcGoal(e.target.value)}>
                          <option value="Product Launch">Product Launch/Update</option>
                          <option value="Welcome Automation">Welcome Automation sequence</option>
                          <option value="Re-engagement Drip">Customer Re-engagement</option>
                          <option value="Weekly Digest">Weekly Strategic digest</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Copy Tone</label>
                        <select className="w-full text-xs p-2 bg-background border rounded-lg h-9" value={mcTone} onChange={e => setMcTone(e.target.value)}>
                          <option value="Professional & authoritative">Professional & authoritative</option>
                          <option value="Humorous & bold">Humorous & bold</option>
                          <option value="Urgent & conversions-aimed">Urgent & conversions-aimed</option>
                          <option value="Direct Value proposition">Direct Value-driver</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Product Offer details</label>
                        <Input value={mcDesc} onChange={e => setMcDesc(e.target.value)} placeholder="e.g. 50% off on premium plan today only" className="h-9" />
                      </div>
                    </div>
                    
                    <Button disabled={loading} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-10 border-none shrink-0" onClick={buildMailchimpCampaign}>
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2 text-black" /> : <Sparkles className="h-4 w-4 mr-2 text-black animate-pulse" />}
                      Generate Mailchimp campaign & Drip HTML
                    </Button>

                    {aiError && (
                      <div className="p-4 bg-rose-100/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                       {/* Generated Newsletter Preview output */}
                       <div className="lg:col-span-7 space-y-4 text-left">
                         {mcResult ? (
                           <div className="p-5 bg-muted/30 border border-border shadow-inner rounded-xl space-y-4">
                             <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-1.5">
                               <span className="text-xs font-bold font-mono text-amber-600 uppercase">Mailchimp Campaign Output & Email Sequence</span>
                               <div className="flex gap-1.5 shrink-0">
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="h-6 text-[9px] border-yellow-400/30 text-yellow-600 hover:bg-yellow-400/10 px-2 shrink-0 font-bold"
                                   onClick={() => saveCopyAsAsset("Mailchimp Newsletter", mcResult)}
                                 >
                                   <FolderSync className="h-3 w-3 mr-1" /> Save to Assets
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="h-6 text-[9px] border-yellow-400/55 text-yellow-600 hover:bg-yellow-400/10 px-2 shrink-0 font-bold"
                                   onClick={() => {
                                     navigator.clipboard.writeText(mcResult);
                                     showToast("Newsletter Campaign content copied!", "success");
                                   }}
                                 >
                                   <Copy className="h-3 w-3 mr-1" /> Copy Markdown
                                 </Button>
                               </div>
                             </div>
                             <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
                               <ReactMarkdown>{mcResult}</ReactMarkdown>
                             </div>
                           </div>
                         ) : (
                           <div className="h-64 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                             <Mail className="h-10 w-10 mb-2 opacity-50 text-yellow-500" />
                             <p className="text-xs font-bold">Mailchimp AI ready to generate newsletter templates.</p>
                             <p className="text-[10px]">Configure your copy specifications above and build transactional copy templates list instantly.</p>
                           </div>
                         )}
                       </div>

                       {/* Persistent Audience Subscriber CRM */}
                       <div className="lg:col-span-5 p-4 bg-muted/30 border border-border rounded-xl space-y-4 text-left">
                         <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                           <div>
                             <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Audience Contacts</h3>
                             <p className="text-[10px] text-muted-foreground font-medium">Track your personal subscriber database.</p>
                           </div>
                           <div className="flex gap-1.5 shrink-0">
                             <Button size="sm" onClick={() => setShowBulkSub(!showBulkSub)} className="h-7 text-[9px] bg-slate-200 dark:bg-slate-800 text-foreground hover:bg-muted font-bold px-2 border-none">
                               Bulk Import
                             </Button>
                             <Button size="sm" onClick={copyBulkEmails} className="h-7 text-[9px] bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-2 shrink-0 border-none">
                               Copy CSV Active
                             </Button>
                           </div>
                         </div>

                         {/* Collapsible Bulk Importer Workspace */}
                         {showBulkSub && (
                           <div className="p-3 bg-background border border-yellow-400/20 rounded-xl space-y-2">
                             <label className="text-[9px] uppercase font-black text-muted-foreground">Paste comma/line separated emails</label>
                             <textarea
                               value={bulkSubInput}
                               onChange={e => setBulkSubInput(e.target.value)}
                               placeholder="sam@example.com, john@corp.com&#10;alice@web.net"
                               rows={3}
                               className="w-full text-xs p-2 bg-muted/30 outline-none border rounded-lg resize-none font-mono"
                             />
                             <div className="flex justify-end gap-1.5">
                               <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2" onClick={() => setShowBulkSub(false)}>Cancel</Button>
                               <Button size="sm" className="h-6 text-[9.5px] px-3 bg-yellow-400 text-black hover:bg-yellow-500 font-bold border-none" onClick={bulkImportSubscribers}>
                                 Import Bulk
                                </Button>
                             </div>
                           </div>
                         )}

                         {/* Quick subscriber adder form */}
                         <div className="grid grid-cols-12 gap-2 items-end">
                           <div className="col-span-5 space-y-1">
                             <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Name</label>
                             <Input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Nikhil Kumar" className="h-8 text-[11px] bg-background" />
                           </div>
                           <div className="col-span-5 space-y-1">
                             <label className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Email Address</label>
                             <Input value={newSubEmail} onChange={e => setNewSubEmail(e.target.value)} placeholder="nikhil@corp.in" className="h-8 text-[11px] bg-background" />
                           </div>
                           <div className="col-span-2">
                             <Button size="sm" className="h-8 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold p-0 shrink-0 border-none" onClick={addSubscriber}>
                               Join
                             </Button>
                           </div>
                         </div>

                         <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                           {subscribers.length === 0 ? (
                             <p className="text-[11px] text-muted-foreground italic text-center py-4">No subscribers found in database.</p>
                           ) : (
                             subscribers.map(sub => (
                               <div key={sub.id} className="p-3 bg-background border border-border rounded-lg shadow-sm flex items-center justify-between relative group">
                                 <div className="truncate pr-6">
                                   <h4 className="font-bold text-xs truncate leading-snug">{sub.name}</h4>
                                   <p className="text-[10px] text-muted-foreground truncate">{sub.email}</p>
                                   <span className="text-[8px] font-mono text-muted-foreground">Added: {sub.signupDate}</span>
                                 </div>
                                 <div className="flex items-center space-x-2 shrink-0 border-none">
                                   <button 
                                     onClick={() => toggleSubscriberStatus(sub.id)}
                                     className={cn(
                                       "text-[9px] px-1.5 py-0.5 rounded-full font-bold cursor-pointer transition-all border shrink-0",
                                       sub.status === "Subscribed" 
                                         ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/30" 
                                         : "bg-muted text-muted-foreground border-border"
                                     )}
                                   >
                                     {sub.status}
                                   </button>
                                   <button onClick={() => removeSubscriber(sub.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 rounded">
                                     <Trash2 className="h-3.5 w-3.5" />
                                   </button>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* GOOGLE ANALYTICS VIEW */}
              {activeSuiteTab === "analytics" && (
                <Card className="border-rose-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-rose-500/20">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Google Analytics Simulated Real-Time & Tag Manager</CardTitle>
                        <CardDescription>Inspect inbound traffic logs, mock pixels & trigger conversion telemetry</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left side: Tag Manager */}
                      <div className="md:col-span-5 p-4 bg-muted/30 border border-border rounded-xl space-y-4">
                        <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider pb-2 border-b">
                          Universal Tag Manager Setup
                        </h3>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={trackedPixelName}
                              onChange={e => setTrackedPixelName(e.target.value)}
                              placeholder="e.g. Meta Pixel Tag (91YEX...)"
                              className="h-8 text-xs flex-1"
                            />
                            <Button size="sm" className="h-8 text-[11px] bg-rose-600 hover:bg-rose-700 text-white" onClick={installPixel}>
                              Install Pixel
                            </Button>
                          </div>
                          
                          <div className="space-y-1.5 pt-2">
                            {installedPixels.map((pix, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-background border rounded-lg text-xs font-mono">
                                <span className="truncate pr-1 text-[10px]">{pix}</span>
                                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-bold">ACTIVE</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t space-y-2">
                          <h4 className="text-[10px] uppercase font-bold text-muted-foreground">Trigger Custom Metric Firing Test</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {["Purchase Trigger", "Lead Hook Sign-Up", "Newsletter Opt-In", "Click Cart"].map(triggerName => (
                              <Button
                                key={triggerName}
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] capitalize font-medium border-rose-500/10 hover:bg-rose-500/5 hover:text-rose-500 text-left"
                                onClick={() => dispatchGaEvent(triggerName)}
                              >
                                Fire: {triggerName}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Event Stream Logger (Real-time logs) */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b flex-wrap gap-2">
                          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground flex items-center">
                            <span className="relative flex h-2 w-2 mr-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            Measurement Live stream Telemetry
                          </h3>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setIsGaLiveSimulating(!isGaLiveSimulating);
                                showToast(isGaLiveSimulating ? "Real-time stream paused" : "Real-time event simulator active!", "info");
                              }} 
                              className={cn(
                                "h-6 text-[9px] font-black border-none gap-1",
                                isGaLiveSimulating ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-200 dark:bg-slate-800 text-foreground hover:bg-muted"
                              )}
                            >
                              {isGaLiveSimulating ? (
                                <>
                                  <Pause className="h-2.5 w-2.5" /> Stop Sim
                                </>
                              ) : (
                                <>
                                  <Play className="h-2.5 w-2.5 fill-current" /> Start Live Sim
                                </>
                              )}
                            </Button>
                            <span className="text-[9px] font-mono text-muted-foreground">GAv4 Protocol</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {gaMockEvents.map((evt) => (
                            <div key={evt.id} className="p-3 bg-muted/20 border rounded-xl flex items-center justify-between text-xs hover:bg-muted/30 transition-all font-mono">
                              <div className="flex items-center space-x-3 truncate">
                                <div className="p-1.5 bg-rose-500/10 text-rose-600 rounded">
                                  <MousePointer2 className="h-3 w-3" />
                                </div>
                                <div className="truncate">
                                  <p className="font-bold text-xs">{evt.type}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{evt.url} • {evt.country}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">{evt.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* JASPER AI VIEW */}
              {activeSuiteTab === "jasper" && (
                <Card className="border-indigo-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-indigo-500/20">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Jasper AI Elite Copywriting suite</CardTitle>
                        <CardDescription>Generate scroll-stopping conversion copy, blog briefs, pain formulas and CTAs</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Interactive Workspace */}
                      <div className="lg:col-span-8 space-y-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1 md:col-span-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Writer blueprint</label>
                            <div className="flex flex-col gap-2">
                              {[
                                { id: "AIDA", name: "AIDA Catalyst" },
                                { id: "PAS", name: "PAS Framework" },
                                { id: "Blog Structure", name: "SEO Blog Outline" }
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => setJasperType(opt.id)}
                                  className={cn(
                                    "p-2 rounded-lg text-xs font-bold capitalize text-left transition-all border cursor-pointer",
                                    jasperType === opt.id 
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                                  )}
                                >
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1 md:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Write up Instructions & Audience triggers</label>
                            <textarea
                              value={jasperPrompt}
                              onChange={e => setJasperPrompt(e.target.value)}
                              placeholder="Describe your target offer, branding, keyword focus & what makes you superior (e.g. CRM pipeline built for developers with free migrations)"
                              rows={4}
                              className="w-full text-xs p-3 outline-none bg-background border rounded-xl resize-none font-sans focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <Button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold h-10 border-none shrink-0" onClick={runJasperCopywriter}>
                          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          Execute Jasper Blueprint
                        </Button>

                        {aiError && (
                          <div className="p-4 bg-rose-100/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span>{aiError}</span>
                          </div>
                        )}

                        {jasperOutput && (
                          <div className="p-5 bg-muted/30 border border-border shadow-inner rounded-xl space-y-4">
                            <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-1.5">
                              <span className="text-xs font-bold font-mono text-indigo-600 uppercase">Jasper AI Copy Assistant Output</span>
                              <div className="flex gap-1.5 shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-6 text-[9px] border-indigo-400/30 text-indigo-600 hover:bg-indigo-400/10 px-2 shrink-0 font-bold"
                                  onClick={() => saveCopyAsAsset(`Jasper Copy (${jasperType})`, jasperOutput)}
                                >
                                  <FolderSync className="h-3 w-3 mr-1" /> Save to Assets
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-6 text-[9px] border-indigo-400/55 text-indigo-600 hover:bg-indigo-400/10 px-2 shrink-0 font-bold"
                                  onClick={() => {
                                    navigator.clipboard.writeText(jasperOutput);
                                    showToast("Draft copied to clipboard!", "success");
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Copy Draft
                                </Button>
                              </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
                              <ReactMarkdown>{jasperOutput}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: History Feed Desk */}
                      <div className="lg:col-span-4 p-4 bg-muted/30 border border-border rounded-xl space-y-4 text-left">
                        <div className="border-b pb-2 flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Draft Archives</h3>
                            <p className="text-[10px] text-muted-foreground font-medium">Archived copywriting copies</p>
                          </div>
                          <History className="h-4 w-4 text-indigo-500" />
                        </div>
                        
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {jasperHistory.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic text-center py-4">No drafts generated yet.</p>
                          ) : (
                            jasperHistory.map((hist) => (
                              <div key={hist.id} className="p-3 bg-background border border-border rounded-lg shadow-xs space-y-2 relative group hover:border-indigo-400/50 duration-200">
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded leading-none">{hist.type}</span>
                                  <span className="font-mono text-muted-foreground">{hist.timestamp}</span>
                                </div>
                                <p className="text-[10px] font-bold text-foreground line-clamp-1 italic">"{hist.prompt}"</p>
                                <p className="text-[10.5px] text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-line">{hist.content}</p>
                                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-dashed">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 text-[8.5px] px-1.5 py-0 text-indigo-600 hover:text-indigo-750 font-bold"
                                    onClick={() => {
                                      setJasperType(hist.type);
                                      setJasperPrompt(hist.prompt);
                                      setJasperOutput(hist.content);
                                      showToast("Draft restored to primary workspace view!", "info");
                                    }}
                                  >
                                    Load Draft
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 text-[8.5px] px-1.5 py-0 text-muted-foreground hover:text-indigo-600"
                                    onClick={() => {
                                      navigator.clipboard.writeText(hist.content);
                                      showToast("Draft copied to clipboard!", "success");
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* BREVO CUSTOMER CONVERSATION INBOX VIEW */}
              {activeSuiteTab === "brevo" && (
                <Card className="border-teal-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-teal-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-teal-500/20">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Brevo Customer Live Conversations Hub</CardTitle>
                        <CardDescription>Advanced unified communications chat workspace with smart support agent responses</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="bg-muted/35 rounded-2xl border border-border flex flex-col h-[350px] overflow-hidden">
                      {/* Active Ticket Banner */}
                      <div className="p-3 bg-background border-b flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                          <span className="text-xs font-bold">Active Customer Chat: #TKT-8291A</span>
                        </div>
                        <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded font-mono">Brevo API</span>
                      </div>

                      {/* Messages box */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                        {brevoChats.map(chat => {
                          const isCust = chat.sender === "customer";
                          return (
                            <div key={chat.id} className={cn(
                              "flex flex-col max-w-[80%] rounded-2xl p-3 shadow-sm",
                              isCust 
                                ? "bg-background border self-start rounded-tl-none" 
                                : "bg-teal-600 text-white self-end rounded-tr-none"
                            )}>
                              <p className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-75">
                                {isCust ? "Customer Inquiry" : "Brand Support Agent"}
                              </p>
                              <p className="leading-snug">{chat.text}</p>
                              <span className="text-[8px] mt-1 text-right block opacity-60">{chat.time}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chat input footer */}
                      <div className="p-3 bg-background border-t flex gap-2">
                        <Input
                          value={brevoInput}
                          onChange={e => setBrevoInput(e.target.value)}
                          placeholder="Type customer reply message or advice..."
                          className="h-9 text-xs flex-1 border-none focus-visible:ring-0 shadow-none bg-muted/40"
                          onKeyDown={e => e.key === "Enter" && sendBrevoMessage()}
                        />
                        <Button size="sm" className="h-9 bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={sendBrevoMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ADS PERFORMANCE BUDGET PLANNER VIEW */}
              {activeSuiteTab === "ads" && (
                <Card className="border-violet-500/10 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-violet-500/10 via-transparent to-transparent border-b border-border p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-violet-600/20">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Google & Meta Performative budget Planner</CardTitle>
                        <CardDescription>Allocate spend splits, estimate absolute CTR potentials and target ROAS thresholds</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Total Budget (INR)</label>
                        <Input value={adsBudget} onChange={e => setAdsBudget(e.target.value)} placeholder="e.g. 50000" type="number" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Target CPC (INR)</label>
                        <Input value={adsCPC} onChange={e => setAdsCPC(e.target.value)} placeholder="e.g. 15" type="number" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Target CPM (INR)</label>
                        <Input value={adsCPM} onChange={e => setAdsCPM(e.target.value)} placeholder="e.g. 250" type="number" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Niche</label>
                        <Input value={adsNiche} onChange={e => setAdsNiche(e.target.value)} placeholder="e.g. B2B Consultancy" />
                      </div>
                    </div>

                    <Button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-750 text-white font-bold h-10 border-none shrink-0" onClick={calculateAdPlan}>
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                      Compute Performing Ad Media Plan
                    </Button>

                    {aiError && (
                      <div className="p-4 bg-rose-100/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {adsPlannerResult && (
                      <div className="p-5 bg-muted/30 border border-border shadow-inner rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-xs font-bold font-mono text-violet-600 uppercase">Calculated Budget & Creative Recommendation Map</span>
                          <span className="text-[9px] px-2 py-0.5 bg-violet-500/20 text-violet-600 rounded-full font-bold">Analytics ready</span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed font-sans">
                          <ReactMarkdown>{adsPlannerResult}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
