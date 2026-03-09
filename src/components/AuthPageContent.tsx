import { motion } from "framer-motion";
import {
  Users, Building2, TrendingUp, MessageSquare, BarChart3, Shield,
  Zap, Target, Star, HelpCircle, CheckCircle, Search, Rocket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

const steps = [
  { num: "01", icon: Search, title: "Search & Discover", desc: "Browse thousands of verified creators filtered by niche, city, platform, and engagement rate." },
  { num: "02", icon: MessageSquare, title: "Connect & Negotiate", desc: "Message creators directly, discuss deliverables, and agree on pricing — no middlemen." },
  { num: "03", icon: Rocket, title: "Launch & Track", desc: "Kick off your campaign, track deliverables in real-time, and measure results from your dashboard." },
];

const creatorFeatures = [
  { icon: TrendingUp, title: "Get Discovered", desc: "Top brands search for creators like you every day. Show up in results and grow your business." },
  { icon: BarChart3, title: "Track Earnings", desc: "See your campaign stats, pending payments, and performance analytics in one dashboard." },
  { icon: MessageSquare, title: "Direct Deals", desc: "No middlemen. Chat directly with brands, negotiate your rates, and close deals faster." },
  { icon: Shield, title: "Verified Badge", desc: "Get verified to stand out from the crowd and build trust with potential brand partners." },
  { icon: Star, title: "Build Reputation", desc: "Collect reviews from brands you work with and showcase your track record." },
  { icon: CheckCircle, title: "Set Your Prices", desc: "You're in control. Set rates for Reels, Stories, and Visits — update anytime." },
];

const brandFeatures = [
  { icon: Target, title: "Smart Discovery", desc: "Filter by niche, city, follower count, engagement rate, and platform to find your perfect match." },
  { icon: Zap, title: "Campaign Builder", desc: "Create campaigns with budgets, deliverables, and timelines. Receive applications from interested creators." },
  { icon: Star, title: "Ratings & Reviews", desc: "Read authentic reviews from other brands before booking any creator." },
  { icon: Users, title: "Manage Everything", desc: "Track bookings, applications, messages, and campaign progress from one unified dashboard." },
];

const faqs = [
  { q: "Is InfluFlow free to use?", a: "Creating an account and browsing is completely free. You only pay when you book an influencer for a campaign." },
  { q: "How do I get verified as a creator?", a: "After registering, connect your social accounts. Our system verifies your follower count and engagement automatically." },
  { q: "Can I use InfluFlow in any city?", a: "Yes! InfluFlow supports creators and brands across all cities. You can filter by location to find local matches." },
  { q: "How are payments handled?", a: "Payments are agreed upon between brands and creators. InfluFlow facilitates the connection and collaboration management." },
  { q: "What platforms are supported?", a: "We support Instagram, YouTube, Twitter/X, and TikTok. More platforms are being added regularly." },
  { q: "How is InfluFlow different from other platforms?", a: "We focus on direct connections with no commissions, verified profiles, and a clean marketplace experience built for both micro and macro influencers." },
];

const AuthPageContent = () => (
  <div>
    {/* How It Works */}
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-primary text-sm font-semibold tracking-wide uppercase mb-3">
            How It Works
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Three simple steps to get started
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.num} variants={fadeUp} custom={i} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform">
                <step.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-6xl font-bold text-primary/[0.07] font-display select-none">
                {step.num}
              </span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* For Creators */}
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/5 px-4 py-1.5 mb-4">
            <Users className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-pink-500 text-sm font-semibold">For Creators</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Everything you need to monetise your influence
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Join thousands of creators already growing their income through brand partnerships on InfluFlow.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {creatorFeatures.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}>
              <Card className="h-full border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* For Brands */}
    <section className="py-20 md:py-28">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 mb-4">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-blue-500 text-sm font-semibold">For Brands</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Powerful tools to run influencer campaigns
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-3 max-w-xl mx-auto">
            From discovery to delivery, manage your entire influencer marketing workflow in one place.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid sm:grid-cols-2 gap-5">
          {brandFeatures.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}>
              <Card className="h-full border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-6 flex gap-5 items-start">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary text-sm font-semibold">FAQ</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Frequently Asked Questions
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fadeUp} custom={0}>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-5 bg-card data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-foreground hover:no-underline text-left py-4 text-[15px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 md:py-28">
      <div className="container max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="text-center gradient-primary rounded-3xl p-10 md:p-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
            Ready to grow your brand or creator career?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            Join InfluFlow today. It's free to get started — no credit card required.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 bg-card text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-card/90 transition-colors"
            >
              Get Started <Rocket className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  </div>
);

export default AuthPageContent;
