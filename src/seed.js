import mongoose from 'mongoose'
import Event from './models/Event.js'
import Game from './models/Game.js'
import Question from './models/Question.js'
import Stats from './models/Stats.js'
import { invalidateAll } from './cache.js'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Seed: Connected to DB')

  const event = await Event.findOne() || await Event.create({ name: 'Takaful Summit 2026', slug: 'takaful-2026', isActive: true })

  // Find or create Agency Game
  let agencyGame = await Game.findOne({ type: 'AGENCY' })
  if (!agencyGame) {
    agencyGame = await Game.create({
      eventId: event._id,
      title: 'Build Your Agency',
      type: 'AGENCY',
      isActive: true,
      agencyMaxPerMetric: { pipeline: 80, agents: 40, lifecycle: 40, visibility: 40 }
    })
  }

  // Clear old questions
  await Question.deleteMany({ gameId: agencyGame._id })

  const withIds = (options) => options.map(o => {
    const id = new mongoose.Types.ObjectId()
    return { 
      _id: id,
      optionId: id.toString(),
      ...o 
    }
  })

  const categories = [
    {
      label: 'Lead Pipeline & Acquisition',
      questions: [
        {
          // HTML Stage 2 — pain items p2_1, p2_5
          text: 'How do leads arrive and get assigned in your agency today?',
          options: [
            { label: 'Leads arrive through multiple channels with no single capture point', subtitle: 'WhatsApp, phone calls, referrals, walk-ins — each agent manages their own informal system. No visibility across the team.', scoreImpact: { pipeline: 5 } },
            { label: 'Leads from digital channels are handled differently from referrals', subtitle: 'Online enquiries go to a separate mailbox. Some leads are never actioned at all.', scoreImpact: { pipeline: 10 } },
            { label: 'CRM exists but entry is manual and inconsistent across agents', subtitle: 'Data quality is low. Some agents log everything, others log nothing.', scoreImpact: { pipeline: 20 } },
            { label: 'AI-Powered Unified Lead Capture', subtitle: 'Every channel, instant routing, zero leakage (BENCHMARK)', scoreImpact: { pipeline: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 2 — pain items p2_2, p2_7
          text: 'How does your agency decide which leads agents call first?',
          options: [
            { label: 'No lead scoring — agents choose who to call based on gut feel', subtitle: 'The agent calls who they like or who called last. High-potential leads with no prior relationship sit at the bottom of the list.', scoreImpact: { pipeline: 5 } },
            { label: 'Agents are not qualifying leads consistently — time wasted on low-potential prospects', subtitle: 'Every enquiry gets the same level of attention regardless of profile.', scoreImpact: { pipeline: 15 } },
            { label: 'AI Lead Scoring & Ranking', subtitle: 'Calling high-intent leads first every morning (BENCHMARK)', scoreImpact: { pipeline: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 2 — pain items p2_3, p2_4
          text: 'What happens when a lead isn\'t converted on the first contact?',
          options: [
            { label: 'No follow-up system — leads go cold when agents get busy', subtitle: 'Agents intend to follow up. Life gets in the way. Three weeks later, the lead is forgotten. No record. No accountability.', scoreImpact: { pipeline: 5 } },
            { label: 'Manager has no real-time view of pipeline health', subtitle: 'The only way to know the pipeline is to ask each agent individually. The picture is always incomplete and always delayed.', scoreImpact: { pipeline: 15 } },
            { label: 'Automated Follow-up Sequences', subtitle: 'SalesVerse triggers follow-ups automatically — right message, right time, zero agent effort (BENCHMARK)', scoreImpact: { pipeline: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 2 — pain item p2_6
          text: 'How does your agency know which lead source gives the best return?',
          options: [
            { label: 'No data on where leads come from or which source converts best', subtitle: 'Budget is allocated to lead generation but nobody knows which channel produces the best return. Decisions are made on assumption.', scoreImpact: { pipeline: 5 } },
            { label: 'Monthly summary reports reviewed in management meetings', subtitle: 'Data is 3–4 weeks old by the time it informs a decision.', scoreImpact: { pipeline: 15 } },
            { label: 'Real-time AI Channel ROI Dashboard', subtitle: 'Every source tracked, every ringgit attributed, live (BENCHMARK)', scoreImpact: { pipeline: 40 }, badge: 'AI-POWERED' }
          ]
        }
      ]
    },
    {
      label: 'Agent Performance',
      questions: [
        {
          // HTML Stage 3 — pain items p3_1, p3_5
          text: 'How does your average agent start their working day?',
          options: [
            { label: 'Agents start each day without knowing their priority actions', subtitle: 'No structured task list. No AI-guided next action. Each agent decides their own day — which means the best next action often isn\'t taken.', scoreImpact: { agents: 10 } },
            { label: 'Agents spend 30–40% of their time on admin, reporting, and data entry', subtitle: 'Filling in forms, updating spreadsheets, chasing approval signatures. Every hour of admin is an hour not spent in front of a customer.', scoreImpact: { agents: 15 } },
            { label: 'Manager assigns tasks manually each morning', subtitle: 'Dependent on manager availability. Inconsistent across the team.', scoreImpact: { agents: 20 } },
            { label: 'Real-time AI-Guided Daily Action List', subtitle: 'Every agent knows their top priority actions the moment they open the app (BENCHMARK)', scoreImpact: { agents: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 3 — pain items p3_2, p3_3
          text: 'How does your manager know which agents need coaching?',
          options: [
            { label: 'Manager doesn\'t know which agents need coaching until it\'s too late', subtitle: 'Performance problems surface through missed targets, not through early warning signals. Coaching is reactive, not preventive.', scoreImpact: { agents: 10 } },
            { label: 'Top performers carry institutional knowledge that isn\'t captured anywhere', subtitle: 'Your best agent knows what works — but it\'s in their head. When they leave, the knowledge disappears with them.', scoreImpact: { agents: 15 } },
            { label: 'Weekly activity review with each agent', subtitle: 'Better than monthly but still reactive. Problems surface days later, not in real time.', scoreImpact: { agents: 20 } },
            { label: 'Real-time Digital Activity Map', subtitle: 'SalesVerse flags struggling agents mid-month — before targets are missed (BENCHMARK)', scoreImpact: { agents: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 3 — pain items p3_4, p3_6, p3_7
          text: 'How does your agency track new agent onboarding and individual performance metrics?',
          options: [
            { label: 'New agents take 4–6 months to reach meaningful productivity', subtitle: 'Onboarding is inconsistent. Each manager trains differently. New agents are largely left to figure it out after the first month.', scoreImpact: { agents: 10 } },
            { label: 'Agents don\'t have visibility of their own performance metrics', subtitle: 'Agents don\'t know their conversion rate, their average response time, or how they rank vs their peers. Without a mirror, behaviour doesn\'t change.', scoreImpact: { agents: 15 } },
            { label: 'Recognition and commission tracking is manual and delayed', subtitle: 'Agents wait weeks to know their commission status. Errors happen. Disputes arise. Trust in the system erodes quietly.', scoreImpact: { agents: 20 } },
            { label: 'Automated Onboarding Tracker & Personal Performance Mirror', subtitle: 'Every agent sees their own metrics daily. Every manager sees every agent\'s ramp progress (BENCHMARK)', scoreImpact: { agents: 40 }, badge: 'AI-POWERED' }
          ]
        }
      ]
    },
    {
      label: 'Customer Lifecycle',
      questions: [
        {
          // HTML Stage 4 — pain items p4_1, p4_2
          text: 'A customer\'s renewal is 6 weeks away. How does your agency know — and what triggers action?',
          options: [
            { label: 'No systematic renewal management — agents track their own book', subtitle: 'Each agent maintains their own renewal calendar in their phone or notebook. Lapse happens when the agent is busy, ill, or has left.', scoreImpact: { lifecycle: 10 } },
            { label: 'Lapse is discovered after the fact — not prevented in advance', subtitle: 'The agency finds out a policy has lapsed when the system flags it, not 60 days before when intervention was still possible.', scoreImpact: { lifecycle: 15 } },
            { label: 'Monthly renewal report reviewed by manager', subtitle: 'Better than nothing, but reactive. Lapses still happen between report cycles.', scoreImpact: { lifecycle: 20 } },
            { label: 'Automated Renewal Intelligence', subtitle: 'Predictive lapse alerts 60 days before expiry, auto-sequenced re-engagement (BENCHMARK)', scoreImpact: { lifecycle: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 4 — pain items p4_3, p4_4
          text: 'What does your agency do with a customer in the 11 months between policy issue and renewal?',
          options: [
            { label: 'No structured mid-policy engagement — customers feel forgotten between sales moments', subtitle: 'Contact happens at sign-up and at renewal. The 11 months in between are silent. Customers who feel forgotten don\'t renew.', scoreImpact: { lifecycle: 10 } },
            { label: 'Cross-sell and upsell opportunities go undetected — life events not tracked', subtitle: 'A customer gets married, has a child, buys a home. These are gold-standard cross-sell triggers — but if the agent doesn\'t know, the opportunity is lost.', scoreImpact: { lifecycle: 15 } },
            { label: 'Periodic check-ins by agent — birthday messages, festive greetings', subtitle: 'Personal but not systematic. High-value life event triggers are still missed.', scoreImpact: { lifecycle: 20 } },
            { label: 'AI-Triggered Lifecycle Touchpoints & Cross-sell Alerts', subtitle: 'SalesVerse detects life events and triggers the right action at the right moment (BENCHMARK)', scoreImpact: { lifecycle: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 4 — pain items p4_5, p4_6, p4_7
          text: 'What happens to your customer relationships when an agent leaves your agency?',
          options: [
            { label: 'Customer portfolio moves with the agent — agency has no independent relationship', subtitle: 'When an agent leaves, their customers often follow or simply disengage. The agency built no independent relationship with the customer base it invested to acquire.', scoreImpact: { lifecycle: 10 } },
            { label: 'No claim support process — customers navigate claims alone and feel abandoned', subtitle: 'When a customer makes a claim, they deal with the operator directly. The most critical loyalty moment in Takaful becomes a source of frustration.', scoreImpact: { lifecycle: 15 } },
            { label: 'No referral programme — happy customers don\'t become growth engines', subtitle: 'Satisfied customers are the cheapest source of new business. But without a structured programme, referrals happen randomly if at all.', scoreImpact: { lifecycle: 20 } },
            { label: 'Agency-level CRM — customers belong to the agency, not the agent', subtitle: 'SalesVerse builds the relationship at the agency level. Agent departure = zero customer disruption (BENCHMARK)', scoreImpact: { lifecycle: 40 }, badge: 'AI-POWERED' }
          ]
        }
      ]
    },
    {
      label: 'Visibility & Operations',
      questions: [
        {
          // HTML Stage 5 — pain items p5_1, p5_3
          text: 'How does your management team know the agency\'s current performance?',
          options: [
            { label: 'Reports are produced manually and are always out of date by the time they\'re ready', subtitle: 'The report that informs this week\'s decisions was built from data that is 1–2 weeks old. Decisions are made on a lagging picture of reality.', scoreImpact: { visibility: 10 } },
            { label: 'No single source of truth — different people carry different versions of the numbers', subtitle: 'The manager\'s spreadsheet, the operator\'s portal, and individual agent records never quite agree. Meetings start with reconciling numbers.', scoreImpact: { visibility: 15 } },
            { label: 'Operator portal reports with a 1–2 week lag', subtitle: 'Data exists but it\'s not real-time. Strategic decisions are made on last month\'s picture.', scoreImpact: { visibility: 20 } },
            { label: 'Instant AI-Powered Dashboard', subtitle: 'Every metric, live, all the time — manager acts in hours, not weeks (BENCHMARK)', scoreImpact: { visibility: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 5 — pain items p5_2, p5_6
          text: 'How early can your manager identify an agent who is falling behind on targets?',
          options: [
            { label: 'No early warning system for agents who are slipping before the month ends', subtitle: 'The manager only knows about a performance problem after the target has been missed. Coaching at that point is retrospective, not corrective.', scoreImpact: { visibility: 10 } },
            { label: 'Agency performance is tracked per agent but not across the full portfolio', subtitle: 'Individual agent targets are tracked. But the full agency book — total premium, total persistency, total renewal risk — is not managed as an integrated whole.', scoreImpact: { visibility: 15 } },
            { label: 'Bi-weekly activity review meetings per agent', subtitle: 'Better than monthly but still delayed. Problems surface days after they could have been corrected.', scoreImpact: { visibility: 20 } },
            { label: 'SalesVerse Early Warning Alerts', subtitle: 'Flags slipping agents mid-month, before targets are missed — with recommended coaching action (BENCHMARK)', scoreImpact: { visibility: 40 }, badge: 'AI-POWERED' }
          ]
        },
        {
          // HTML Stage 5 — pain items p5_4, p5_5, p5_7
          text: 'How does your agency track product performance, compliance, and new agent onboarding standards?',
          options: [
            { label: 'Unable to identify which product performs best with which customer segment', subtitle: 'The agency has no analytical view of which products convert well for which profiles. Recommendations are based on agent familiarity, not data.', scoreImpact: { visibility: 10 } },
            { label: 'Compliance and documentation checks are manual and inconsistent', subtitle: 'Checking that required documents have been collected is done on trust or ad hoc audit. Compliance gaps surface at inconvenient moments.', scoreImpact: { visibility: 15 } },
            { label: 'No structured process for onboarding new agents — each manager does it differently', subtitle: 'There is no documented standard, no training tracker, no milestone check-in system. New agent induction varies depending on who is responsible.', scoreImpact: { visibility: 20 } },
            { label: 'AI-Powered Product Analytics & Automated Compliance Tracking', subtitle: 'SalesVerse matches product to customer profile automatically and flags compliance gaps before they become audit findings (BENCHMARK)', scoreImpact: { visibility: 40 }, badge: 'AI-POWERED' }
          ]
        }
      ]
    }
  ]

  let orderCount = 1
  const max = { pipeline: 0, agents: 0, lifecycle: 0, visibility: 0 }
  const metrics = ['pipeline', 'agents', 'lifecycle', 'visibility']

  for (const cat of categories) {
    for (const q of cat.questions) {
      const options = withIds(q.options)
      await Question.create({
        gameId: agencyGame._id,
        text: q.text,
        sectionLabel: cat.label,
        options,
        order: orderCount++
      })

      metrics.forEach(m => {
        const best = Math.max(...options.map(o => o.scoreImpact?.[m] || 0))
        max[m] += best
      })
    }
  }

  await Game.findByIdAndUpdate(agencyGame._id, { agencyMaxPerMetric: max })

  // ── MYTH GAME: Beat the AI ─────────────────────────────────────────────────
  let mythGame = await Game.findOne({ type: 'MYTH' })
  if (!mythGame) {
    mythGame = await Game.create({
      eventId: event._id,
      title: 'Beat the AI',
      type: 'MYTH',
      isActive: true
    })
  }
  await Question.deleteMany({ gameId: mythGame._id })

  const mythScenarios = [
    {
      text: 'You are a Takaful agent with 3 waiting leads. Who do you call first?',
      answer: 'Lead Prioritisation',
      sectionLabel: 'SALES & DISTRIBUTION',
      hostProposal: 'You are a Takaful agent. 3 leads. 30 seconds. Who do you call first?',
      aiRationale: "Highest protection gap + family dependency = urgency. High income supports premium. Protection need is time-sensitive when dependants are involved. SalesVerse surfaces this combination instantly.\n\n« AI reads financial vulnerability, not just interest level. SalesVerse prioritises need — not convenience. »",
      options: [
        { label: 'LEAD A', shortLabel: 'Azmi, Age 28', subtitle: 'Status: Single|Income: Medium|Interest: Savings Plan|Last contact: Never', badge: 'Savings plans have lower urgency — single, no dependants. Good prospect, but not priority today.', isCorrect: false },
        { label: 'LEAD B', shortLabel: 'Hassan, Age 40', subtitle: 'Status: Married, 2 kids|Income: High|Interest: Protection|Last contact: Never', badge: 'Correct — AI agrees. Family dependency + high income + protection interest = highest-value, most urgent call.', isCorrect: true },
        { label: 'LEAD C', shortLabel: 'Rosmah, Age 35', subtitle: 'Status: Married|Income: Medium|Interest: Medical Takaful|Last contact: Never', badge: 'Medical Takaful is a genuine need, but family protection with two kids is statistically more urgent.', isCorrect: false }
      ]
    },
    {
      text: '3 policies are due for renewal this month. Which one is most likely to lapse?',
      answer: 'Renewal at Risk',
      sectionLabel: 'RETENTION & PERSISTENCY',
      hostProposal: '50 renewals due this month. Which policy is most at risk of lapsing?',
      aiRationale: "Three combined risk signals: no auto-renew + longest dormancy + premium hike. Any one is manageable. All three together = near-certain lapse without immediate outreach. SalesVerse flags this 60 days before expiry.\n\n« SalesVerse flags this combination automatically — before the renewal date, not after. »",
      options: [
        { label: 'POLICY A', shortLabel: 'Ahmad, Age 32', subtitle: 'Auto-renew: ON|Last engagement: 2 weeks ago|Premium: Unchanged|No complaints', badge: 'Auto-renew is ON — this policy is safe. Focus effort elsewhere.', isCorrect: false },
        { label: 'POLICY B', shortLabel: 'Siti, Age 55', subtitle: 'Auto-renew: OFF|Last engagement: 4 months ago|Premium: Increased +12%|No follow-up done', badge: 'Correct — AI agrees. No auto-renew + 4-month silence + 12% premium hike = the highest combined risk score.', isCorrect: true },
        { label: 'POLICY C', shortLabel: 'Ravi, Age 45', subtitle: 'Auto-renew: OFF|Last engagement: 1 month ago|Premium: Unchanged|Contacted once', badge: 'One risk factor but recent contact and stable premium. A reminder is enough here.', isCorrect: false }
      ]
    },
    {
      text: 'A loyal customer paid their second Family Takaful year on time. They just bought a new home. What do you offer next?',
      answer: 'Cross-sell Opportunity',
      sectionLabel: 'UPSELL & CROSS-SELL',
      hostProposal: 'Loyal customer paid year 2 on time. New home purchase detected. What do you offer next?',
      aiRationale: "Life event trigger — new home purchase is the strongest cross-sell signal in Takaful. Mortgage protection urgency is immediate. SalesVerse detects life events and surfaces the right product automatically.\n\n« AI reads life events. Agents need to too — SalesVerse connects both so nothing is missed. »",
      options: [
        { label: 'OPTION A', shortLabel: 'Upgrade Sum Covered', subtitle: 'Increase existing protection|Higher premium same product|Low friction upsell|Moderate conversion rate', badge: 'A reasonable upsell but misses the most urgent and time-sensitive trigger — the new home.', isCorrect: false },
        { label: 'OPTION B', shortLabel: 'Add Medical Rider', subtitle: 'Hospitalisation coverage|Universally relevant need|Easy add-on|High acceptance rate', badge: 'Good instinct — but a stronger, more urgent opportunity exists based on the life event signal.', isCorrect: false },
        { label: 'OPTION C', shortLabel: 'Takaful Mortgage Plan', subtitle: 'New home = perfect trigger|Protects mortgage repayment|Highest urgency right now|Strongest conversion signal', badge: 'Correct — AI agrees. New home = immediate need for mortgage protection. Highest conversion probability by far.', isCorrect: true }
      ]
    },
    {
      text: '3 agents have identical lead allocations this month. Who earns more leads next month?',
      answer: 'Agent Performance',
      sectionLabel: 'AGENCY MANAGEMENT',
      hostProposal: '3 agents, same lead count. Who earns more leads next month?',
      aiRationale: "Highest conversion rate + best persistency = maximum ROI per lead. Response time of 2 hours is still strong. SalesVerse ranks agents by composite performance score every morning automatically.\n\n« This ranking takes 10 minutes manually. SalesVerse does it at midnight, every day. »",
      options: [
        { label: 'AGENT A', shortLabel: 'Faizal', subtitle: 'Conversion rate: 35%|Response time: < 1 hour|Persistency: 88%|Activity score: High', badge: 'Strong response time but conversion and persistency are below Agent C — two of the three key metrics.', isCorrect: false },
        { label: 'AGENT B', shortLabel: 'Norzahanim', subtitle: 'Conversion rate: 28%|Response time: 4 hours|Persistency: 72%|Activity score: Medium', badge: 'Lowest on all metrics. Needs coaching before more leads, not a higher allocation.', isCorrect: false },
        { label: 'AGENT C', shortLabel: 'Selvam', subtitle: 'Conversion rate: 40%|Response time: 2 hours|Persistency: 91%|Activity score: High', badge: 'Correct — AI agrees. Best conversion + highest persistency + strong activity = highest ROI per lead.', isCorrect: true }
      ]
    },
    {
      text: 'A 29-year-old fresh graduate enquires about Takaful. No dependants. First job. What do you recommend?',
      answer: 'Product Match',
      sectionLabel: 'NEED-BASED SELLING',
      hostProposal: '29-year-old fresh graduate. No dependants. What\'s your recommendation?',
      aiRationale: "Life stage = savings priority. Investment-linked plans appeal strongly to young professionals. Dual value (grow money + stay protected) increases persistency. SalesVerse maps life stage to product automatically.\n\n« Need-based selling isn't just ethical in Takaful — it's smarter business. SalesVerse ensures agents never miss the right fit. »",
      options: [
        { label: 'OPTION A', shortLabel: 'Term Family Takaful', subtitle: 'High coverage sum|High monthly premium|Protection-heavy|Risk of early lapse — high cost', badge: 'High premiums create affordability risk for fresh graduates. High early lapse probability reduces long-term value.', isCorrect: false },
        { label: 'OPTION B', shortLabel: 'Investment-linked Takaful', subtitle: 'Savings + protection combined|Flexible premium entry|Growth component|Long-term loyalty builder', badge: 'Correct — AI agrees. Investment + protection at a flexible entry point matches the life stage and builds loyalty.', isCorrect: true },
        { label: 'OPTION C', shortLabel: 'Medical Takaful Only', subtitle: 'Hospitalisation coverage|Lowest monthly commitment|Single-need solution|No savings component', badge: 'Covers one need but misses the bigger savings opportunity. A partial solution for this profile.', isCorrect: false }
      ]
    },
    {
      text: '3 customer complaints arrive at the same time. You can handle one call right now. Who gets it?',
      answer: 'Complaint Triage',
      sectionLabel: 'CUSTOMER RETENTION',
      hostProposal: '3 customer complaints just came in. You can only call one right now. Who gets it?',
      aiRationale: "Cancellation threat + 28% premium hike + zero agent contact = imminent churn. The claim has process protection while it's pending. The login issue can be resolved via support channels. Complaint B needs a human conversation now.\n\n« SalesVerse flags cancellation-risk signals in real time — no complaint should catch you by surprise. »",
      options: [
        { label: 'COMPLAINT A', shortLabel: 'Encik Jefri — Late claim', subtitle: 'Claim filed: 3 weeks ago|Status: Pending review|Policy: 7 years active|Premium: RM 380/month', badge: 'Long-term, high-value customer with a legitimate claim issue. Important, but process protects them while you address the imminent churn risk first.', isCorrect: false },
        { label: 'COMPLAINT B', shortLabel: 'Puan Rohani — Premium shock', subtitle: 'Renewal premium up 28%|Threatening to cancel policy|Policy: 2 years active|Agent contact: Zero', badge: 'Correct — AI agrees. Cancellation threat + premium increase + zero agent contact = highest immediate churn risk. Call now.', isCorrect: true },
        { label: 'COMPLAINT C', shortLabel: 'Mr Lim — App login issue', subtitle: 'Cannot access app: 2 days|Has a coverage query|Low frustration tone|Premium: RM 180/month', badge: 'Login issues are urgent for the customer but can be resolved via support channels. Not the highest business risk right now.', isCorrect: false }
      ]
    },
    {
      text: 'You have a RM 50,000 distribution budget for next quarter. Which channel gets the investment?',
      answer: 'Channel Investment',
      sectionLabel: 'GROWTH STRATEGY',
      hostProposal: 'RM 50,000 to invest in one distribution channel next quarter. Where does it go?',
      aiRationale: "Digital has the lowest cost per policy AND 34% year-on-year growth — compounding return. Agency converts better but costs 1.8× more. Bancatakaful is flat. RM 50K in digital builds infrastructure that scales beyond the quarter. SalesVerse tracks channel ROI in real time.\n\n« SalesVerse gives channel-level ROI visibility in real time — so budget decisions are driven by data, not gut feel. »",
      options: [
        { label: 'CHANNEL A', shortLabel: 'Bancatakaful', subtitle: 'Conversion rate: 22%|Cost per policy: RM 680|Avg premium: RM 240/month|Growth trend: Flat 2 years', badge: 'Bancatakaful has decent conversion but flat growth and high cost. Investment here maintains, not grows.', isCorrect: false },
        { label: 'CHANNEL B', shortLabel: 'Digital / Direct', subtitle: 'Conversion rate: 18%|Cost per policy: RM 290|Avg premium: RM 195/month|Growth trend: +34% YoY', badge: 'Correct — AI agrees. Lowest cost per policy + highest growth trend = best compounding return on RM 50K.', isCorrect: true },
        { label: 'CHANNEL C', shortLabel: 'Agency (Tied Agents)', subtitle: 'Conversion rate: 31%|Cost per policy: RM 520|Avg premium: RM 310/month|Growth trend: +8% YoY', badge: 'Best conversion rate, but high cost and modest growth. Good channel, not the best marginal ROI for new budget.', isCorrect: false }
      ]
    },
    {
      text: '3 new agents joined 6 months ago with identical training. Which one is most likely performing well today?',
      answer: 'New Agent Potential',
      sectionLabel: 'TALENT & ONBOARDING',
      hostProposal: '3 recruits joined 6 months ago with the same training. Which one is most likely still performing well?',
      aiRationale: "High early activity (28 calls) + near-perfect CRM adoption + willingness to ask for guidance = strongest success predictor. Teaching background means strong communication. SalesVerse tracks early behavioural signals and flags high-potential recruits within the first 30 days.\n\n« Onboarding signals predict performance. SalesVerse surfaces these so managers coach the right people at the right time. »",
      options: [
        { label: 'RECRUIT A', shortLabel: 'Hafiz', subtitle: 'Prior work: Sales exec|First week calls: 12|CRM login rate: 40%|Asked for help: Rarely', badge: 'Prior sales experience matters, but low CRM adoption and low call volume in week 1 are early warning signs of disengagement.', isCorrect: false },
        { label: 'RECRUIT B', shortLabel: 'Aishah', subtitle: 'Prior work: Teacher|First week calls: 28|CRM login rate: 94%|Asked for help: Often (early on)', badge: 'Correct — AI agrees. High activity, high tool adoption, and a learning mindset are the three strongest early predictors.', isCorrect: true },
        { label: 'RECRUIT C', shortLabel: 'Darren', subtitle: 'Prior work: Banking|First week calls: 8|CRM login rate: 61%|Asked for help: Never', badge: 'Banking background is relevant, but lowest call volume and never seeking help are concerning early signals.', isCorrect: false }
      ]
    },
    {
      text: '3 new claims arrive simultaneously. Which claim do you fast-track?',
      answer: 'Claims Priority',
      sectionLabel: 'OPERATIONS & SERVICE',
      hostProposal: '3 claims just came in. Your team can fast-track one. Which gets priority processing?',
      aiRationale: "Dependant family with no income + complete documentation + longest-standing policy = highest urgency on humanitarian and Takaful principle grounds. Fast-tracking completes in days. The critical illness claim cannot be processed — paperwork is incomplete. SalesVerse flags documentation status automatically.\n\n« SalesVerse tracks documentation completeness and dependant flags — so the right claims get prioritised on day one. »",
      options: [
        { label: 'CLAIM A', shortLabel: 'Hospitalisation — RM 12,400', subtitle: 'Patient: Still admitted|Family: Requesting updates daily|Policy: 8 years active|Paperwork: Complete', badge: 'Genuine urgency with patient still admitted, but family has income. Process has daily updates available. Not the highest-stakes case today.', isCorrect: false },
        { label: 'CLAIM B', shortLabel: 'Critical Illness — RM 85,000', subtitle: 'Diagnosis: 3 weeks ago|Claimant: Single, no dependants|Policy: 3 years active|Paperwork: Incomplete', badge: 'Large payout, but incomplete paperwork means processing cannot complete regardless of priority. Fix the docs first.', isCorrect: false },
        { label: 'CLAIM C', shortLabel: 'Death Benefit — RM 240,000', subtitle: 'Claimant: Spouse + 3 children|Policy: 11 years active|All documents: Submitted|Family: No income currently', badge: 'Correct — AI agrees. Complete documentation + active dependants with no income + longest policy = fast-track immediately.', isCorrect: true }
      ]
    },
    {
      text: 'A long-standing customer has had zero contact for 8 months. Renewal is 6 weeks away. What is your next move?',
      answer: 'Re-engagement Strategy',
      sectionLabel: 'CUSTOMER LIFECYCLE',
      hostProposal: 'A customer has had zero contact for 8 months. Renewal is 6 weeks away. What do you do?',
      aiRationale: "8 months of silence + 6-week window = re-engagement must be multi-touch, personalised, and sequenced. A single WhatsApp is easy to ignore. Waiting is the highest lapse risk. SalesVerse triggers an AI-sequenced outreach — right message, right channel, right time — without agent effort.\n\n« SalesVerse turns dormant customers into active relationships. No agent effort. No leads lost to silence. »",
      options: [
        { label: 'OPTION A', shortLabel: 'Send a WhatsApp reminder', subtitle: 'Low friction for agent|Easy to ignore for customer|No context or personalisation|Re-engagement rate: ~12%', badge: 'WhatsApp alone is the minimum viable action, but easy to ignore after 8 months of silence. Too low-touch for this risk level.', isCorrect: false },
        { label: 'OPTION B', shortLabel: 'AI-personalised outreach sequence', subtitle: 'Email + WhatsApp + call trigger|Timed to optimal engagement window|Includes policy review summary|SalesVerse auto-sequences this', badge: 'Correct — AI agrees. Multi-touch, personalised, and auto-sequenced = highest re-engagement probability. SalesVerse handles this automatically.', isCorrect: true },
        { label: 'OPTION C', shortLabel: 'Wait — renewal may auto-process', subtitle: 'Lowest effort required|High risk if no auto-renew|No relationship rebuilt|Lapse probability: High', badge: 'Waiting is the highest-risk option. If there is no auto-renew, this policy lapses and the relationship stays broken.', isCorrect: false }
      ]
    }
  ]

  for (let i = 0; i < mythScenarios.length; i++) {
    const s = mythScenarios[i]
    await Question.create({
      gameId: mythGame._id,
      text: s.text,
      answer: s.answer,
      sectionLabel: s.sectionLabel,
      aiRationale: s.aiRationale,
      order: i + 1,
      options: withIds(s.options)
    })
  }
  console.log(`Seed: Created ${mythScenarios.length} MYTH scenarios`)

  // ── CROSSWORD GAME ─────────────────────────────────────────────────────────
  let crosswordGame = await Game.findOne({ type: 'CROSSWORD' })
  if (!crosswordGame) {
    crosswordGame = await Game.create({
      eventId: event._id,
      title: 'Takaful AI Challenge',
      type: 'CROSSWORD',
      isActive: true
    })
  }
  await Question.deleteMany({ gameId: crosswordGame._id })

  const crosswordQuestions = [
    {
      text: "Lead-to-policy rate — the essential performance metric for every Takaful agent and agency manager",
      answer: "CONVERSION",
      aiRationale: "Starts with C. Think: what percentage of your leads actually sign up?",
      gridNum: 1,
      gridDir: "down",
      gridRow: 2,  // HTML row:1 + 1
      gridCol: 6,  // HTML col:5 + 1
      gridLen: 10,
      order: 1
    },
    {
      text: "Malaysia's Islamic insurance system — built on Shariah principles, mutual protection, and community solidarity",
      answer: "TAKAFUL",
      aiRationale: "The name of Islamic insurance itself. Malaysia has 18 licensed operators.",
      gridNum: 2,
      gridDir: "down",
      gridRow: 4,  // HTML row:3 + 1
      gridCol: 2,  // HTML col:1 + 1
      gridLen: 7,
      order: 2
    },
    {
      text: "Annual action that keeps a Takaful policy active — persistency depends on how well this is managed",
      answer: "RENEWAL",
      aiRationale: "What must happen every year to keep coverage running? R-E-N-E-W-A-L",
      gridNum: 3,
      gridDir: "across",
      gridRow: 4,  // HTML row:3 + 1
      gridCol: 4,  // HTML col:3 + 1
      gridLen: 7,
      order: 3
    },
    {
      text: "iorta TechNXT's AI-powered distribution platform — from lead capture through renewal, all automated",
      answer: "SALESVERSE",
      aiRationale: "iorta's flagship product. Two words merged. S-A-L-E-S-V-E-R-S-E",
      gridNum: 4,
      gridDir: "across",
      gridRow: 5,  // HTML row:4 + 1
      gridCol: 1,  // HTML col:0 + 1
      gridLen: 10,
      order: 4
    },
    {
      text: "Number of licensed Takaful and Retakaful operators in Malaysia, all regulated by Bank Negara Malaysia",
      answer: "EIGHTEEN",
      aiRationale: "Count Malaysia's licensed Takaful operators. The answer is a number written as a word.",
      gridNum: 5,
      gridDir: "across",
      gridRow: 6,  // HTML row:5 + 1
      gridCol: 6,  // HTML col:5 + 1
      gridLen: 8,
      order: 5
    },
    {
      text: "Voluntary donation contribution pooled by participants — the Islamic mechanism enabling mutual Takaful protection",
      answer: "TABARRU",
      aiRationale: "Arabic for 'donation'. The giving that makes Takaful work. T-A-B-A-R-R-U",
      gridNum: 6,
      gridDir: "across",
      gridRow: 7,  // HTML row:6 + 1
      gridCol: 1,  // HTML col:0 + 1
      gridLen: 7,
      order: 6
    },
    {
      text: "Takaful fund excess returned to participants after claims and expenses — a key ethical distinction from conventional insurance",
      answer: "SURPLUS",
      aiRationale: "What remains in the pool after all claims are settled. Returned to participants.",
      gridNum: 7,
      gridDir: "across",
      gridRow: 8,  // HTML row:7 + 1
      gridCol: 6,  // HTML col:5 + 1
      gridLen: 7,
      order: 7
    }
  ]

  for (const q of crosswordQuestions) {
    await Question.create({
      gameId: crosswordGame._id,
      ...q,
      options: [] // Crossword doesn't use options but model might require it
    })
  }
  console.log(`Seed: Created ${crosswordQuestions.length} CROSSWORD questions`)

  // ── INTERVIEW GAME: Voices of Takaful AI ──────────────────────────────────
  let interviewGame = await Game.findOne({ type: 'INTERVIEW' })
  if (!interviewGame) {
    interviewGame = await Game.create({
      eventId: event._id,
      title: 'Voices of Takaful AI',
      type: 'INTERVIEW',
      isActive: true
    })
  }
  await Question.deleteMany({ gameId: interviewGame._id })

  const interviewData = [
    { id: "tf1", text: "AI will eventually replace Takaful agents — True or False?", type: "tf", personas: ["cxo", "bdo", "operator", "agent", "association", "insuretech"], tip: "Expected: FALSE — but both answers generate great content. If they say TRUE, follow with: 'Really? What happens to the relationship side of Takaful?' The tension is the content.", host: "Say it fast — True or False? No explanation yet." },
    { id: "tf2", text: "Takaful customers are harder to convert than conventional insurance — True or False?", type: "tf", personas: ["bdo", "agent", "operator"], tip: "Expected: FALSE — but experienced agents often say TRUE based on their reality. Both are valuable. If TRUE: 'What makes them harder?' If FALSE: 'What's the real barrier then?'", host: "Gut reaction first — True or False?" },
    { id: "tf3", text: "Most insurers today have a technology problem — not an execution problem. True or False?", type: "tf", personas: ["cxo", "operator", "insuretech", "association"], tip: "Expected: FALSE — the strong take is that it's an execution problem. 'We don't lack tools. We lack implementation discipline.' This generates great LinkedIn engagement because it challenges the industry narrative.", host: "True or False — be honest." },
    { id: "tf4", text: "Malaysian Takaful agents are ready to adopt AI tools today — True or False?", type: "tf", personas: ["cxo", "bdo", "agent", "association"], tip: "This is genuinely debatable and both sides are interesting. If TRUE: 'What makes you confident?' If FALSE: 'What's missing — skills, mindset, or tools?' The disagreement between leaders makes great content.", host: "Be honest — True or False?" },
    { id: "tf5", text: "Digital Takaful will make traditional agency channels irrelevant within 10 years — True or False?", type: "tf", personas: ["cxo", "operator", "bdo", "association", "insuretech"], tip: "Expected: FALSE — hybrid wins. But get them to say it with specifics: 'The agent role changes — it doesn't disappear.' That line is quotable.", host: "True or False?" },
    { id: "tf6", text: "More leads is what most Takaful agents actually need — True or False?", type: "tf", personas: ["bdo", "agent", "cxo"], tip: "Expected: FALSE — better conversion on existing leads. This question is a direct SalesVerse setup. If they say FALSE, follow: 'So what do they actually need?' The answer should be about tools, guidance, prioritisation.", host: "Quick reaction — True or False?" },
    { id: "tf7", text: "A great agent today can succeed without any technology — True or False?", type: "tf", personas: ["agent", "bdo", "cxo"], tip: "Expected: FALSE in 2026. But some senior agents will say TRUE based on their own career. Both answers are compelling. If TRUE: 'What does that look like in practice?' Great for agent-facing clips.", host: "Honest answer — True or False?" },
    { id: "tf8", text: "The biggest barrier to Takaful growth in Malaysia is awareness, not access — True or False?", type: "tf", personas: ["operator", "association", "cxo"], tip: "Expected: TRUE from most operators. But some will say FALSE — access is the real problem, especially for B40 and rural communities. This generates meaningful discussion about inclusion.", host: "True or False?" },
    { id: "tf9", text: "AI can fully respect Shariah compliance principles in Takaful selling — True or False?", type: "tf", personas: ["operator", "association", "insuretech", "cxo"], tip: "Genuinely controversial. InsureTech leaders tend to say TRUE; traditional operators tend to say FALSE. The debate itself is excellent LinkedIn content. Always follow with: 'What would need to be true for that to work?'", host: "Bold question — True or False?" },
    { id: "tf10", text: "The insurance industry moves too slowly for AI to make a meaningful impact in the next 5 years — True or False?", type: "tf", personas: ["cxo", "insuretech", "association", "operator"], tip: "Expected: FALSE — change is accelerating. But if someone says TRUE, that's a fascinating counter-narrative. 'What's the blocker?' generates real insight.", host: "True or False — your genuine read on the industry." },
    { id: "tf11", text: "Customer loyalty in Takaful is genuinely declining — True or False?", type: "tf", personas: ["cxo", "bdo", "operator"], tip: "Expected: TRUE based on persistency data. But the response matters — 'True, and here's what we're doing about it' vs 'True, and nobody's talking about it openly.' The latter is more compelling content.", host: "Based on what you see — True or False?" },
    { id: "tf12", text: "The DITO framework will benefit smaller Takaful operators more than the big players — True or False?", type: "tf", personas: ["operator", "association", "cxo", "insuretech"], tip: "Genuinely debatable. Smaller operators see it as a competitive opening. Large operators see it as a threat to their moat. Both perspectives are valuable and generate industry discussion.", host: "Your take — True or False?" },
    { id: "op1", text: "What is the single biggest inefficiency in Takaful distribution today?", type: "open", personas: ["bdo", "cxo", "agent", "operator"], tip: "This is the best question for BDMs and agency managers. Listen for: manual processes, follow-up failure, data silos, training gaps. Any of these is a direct SalesVerse use case — but do NOT say so during filming.", host: "Take your time — what's the one thing that wastes the most time or money?" },
    { id: "op2", text: "If you could automate one process in your organisation tomorrow — what would it be?", type: "open", personas: ["cxo", "bdo", "operator", "agent"], tip: "Forces specificity. 'Renewal reminders' and 'lead follow-up' are the most common answers — and both are direct SalesVerse use cases. Great content because it's concrete and relatable.", host: "One thing. Tomorrow. What is it?" },
    { id: "op3", text: "What does the ideal Takaful agent look like in 5 years?", type: "open", personas: ["cxo", "association", "bdo", "operator"], tip: "Generates forward-looking, aspirational content. Best for senior leaders and association members. Listen for: digital fluency, hybrid human-AI, specialisation, advisory role. All quotable.", host: "Paint the picture — what does the agent of the future do differently?" },
    { id: "op4", text: "If you had to describe AI in the insurance industry in one word — what would it be?", type: "open", personas: ["cxo", "bdo", "operator", "insuretech", "association", "agent"], tip: "Great as a closing question — fast, punchy, quotable. Common answers: 'Overdue', 'Necessary', 'Inevitable', 'Misunderstood', 'Experimental.' Any of these makes a strong standalone clip thumbnail.", host: "One word — first thing that comes to mind." },
    { id: "op5", text: "What does your most productive agent do differently from your average one?", type: "open", personas: ["bdo", "cxo"], tip: "Best for agency managers and BDMs. Answers often reveal: discipline in follow-up, CRM usage, early morning activity, qualification skills. All directly relatable to agents watching on LinkedIn.", host: "Be specific — what separates the top 10% from the rest?" },
    { id: "op6", text: "What would make you — or your agents — 30% more effective starting Monday?", type: "open", personas: ["agent", "bdo", "cxo"], tip: "Forces a concrete, actionable answer. Better than 'what do you need?' because it implies the solution exists. Great for agent-facing clips.", host: "Be practical. What's the 30% lift that's within reach?" },
    { id: "op7", text: "Where is the biggest untapped growth opportunity in Malaysian Takaful right now?", type: "open", personas: ["operator", "association", "cxo", "insuretech"], tip: "Best for operators and association members. Generates industry-level insight. Common answers: B40 segment, micro-takaful, bancatakaful optimisation, digital-first products.", host: "Where are we leaving the most on the table?" },
    { id: "op8", text: "What's the most overhyped technology in insurance right now?", type: "open", personas: ["insuretech", "cxo", "operator"], tip: "Contrarian question — generates the most interesting content. InsureTech leaders often call out blockchain, metaverse, or 'AI in general.' The controversy drives LinkedIn engagement.", host: "Be honest — what are people excited about that won't deliver?" },
    { id: "op9", text: "What keeps you up at night about your distribution strategy?", type: "open", personas: ["cxo", "operator"], tip: "Best for CXOs and senior leaders. Gets past the PR answer to the genuine strategic concern. Answers here are often the most quotable and shareable in the series.", host: "No filter — what's the real worry?" },
    { id: "op10", text: "What does 'digital transformation' actually mean to you — beyond the buzzword?", type: "open", personas: ["insuretech", "cxo", "operator", "association"], tip: "Great contrarian opener for InsureTech and operators. Forces a concrete definition. Common strong answers: 'It means my agents spend time selling, not reporting' — that's a usable quote.", host: "Strip away the jargon — what does it really mean in practice?" },
    { id: "op11", text: "What is Malaysia's Takaful industry getting right that the rest of APAC should learn from?", type: "open", personas: ["association", "cxo", "operator"], tip: "Positive framing question — generates pride and genuine insight. Association and regulator guests typically have the strongest answers here. Good for closing a session on a high note.", host: "Where are we actually leading — not just keeping up?" },
    { id: "op12", text: "What's one thing customers want from Takaful that the industry still isn't delivering?", type: "open", personas: ["agent", "bdo", "operator", "cxo"], tip: "Best for agents and BDMs who interact with customers daily. Answers often reveal: simplicity, speed, trust, affordability. All directly connect to SalesVerse's customer experience value proposition.", host: "The honest customer gap — what is it?" }
  ]

  for (let i = 0; i < interviewData.length; i++) {
    const d = interviewData[i]
    await Question.create({
      gameId: interviewGame._id,
      text: d.text,
      interviewType: d.type === 'tf' ? 'tf' : 'open',
      personas: d.personas,
      aiRationale: d.tip,
      hostProposal: d.host,
      order: i + 1,
      options: []
    })
  }

  console.log(`Seed: Created ${interviewData.length} INTERVIEW questions`)

  // 1. Clear local seed process cache
  invalidateAll()

  // 2. Clear MAIN SERVER process cache using native FETCH
  try {
    const port = process.env.PORT || 4000
    await fetch(`http://localhost:${port}/api/maintenance/clear-cache`, { method: 'POST' })
    console.log('Seed: Server cache invalidation signal sent.')
  } catch (err) {
    console.log('Seed: Note - Server cache not cleared (server offline or unreachable)')
  }

  console.log('Seed: Done. Max Scaling:', max)
  process.exit()
}

seed().catch(err => { console.error(err); process.exit(1) })
