import { Button } from "./Button";
import { Flame, Sparkles, TrendingUp, Zap, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-6 md:px-12">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrowthOS AI</span>
        </div>
        <Button onClick={onLogin}>Access Portal</Button>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl space-y-6"
          >
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Private Freelancer Assistant
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Your Personal <span className="text-primary">Marketing</span> Command Center
            </h1>
            <p className="text-xl text-muted-foreground">
              A private AI assistant designed specifically for your digital marketing campaigns, client management, and content automation.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <Button size="lg" onClick={onLogin}>Enter Assistant Portal</Button>
            </div>
          </motion.div>
        </section>

        <section className="bg-muted/50 py-20 px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything you need to grow</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <CardItem 
                icon={<Sparkles className="h-6 w-6" />}
                title="AI Content Creation"
                description="Generate captions and hashtags in English and Hinglish for Indian audiences."
              />
              <CardItem 
                icon={<TrendingUp className="h-6 w-6" />}
                title="Trend Engine"
                description="Stay ahead with real-time trending topics and content ideas for your niche."
              />
              <CardItem 
                icon={<Zap className="h-6 w-6" />}
                title="Growth Suggestions"
                description="Get daily actionable tasks to boost your social media presence."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 GrowthOS AI. Built for creators by creators.</p>
      </footer>
    </div>
  );
}

function CardItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col space-y-3 rounded-xl border bg-background p-6 shadow-sm"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
