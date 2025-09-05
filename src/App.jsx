import React, { useMemo, useState, useEffect } from "react";
// UI: Tailwind is available. shadcn/ui components are available in this environment.
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlusCircle, Calculator, GraduationCap, Users, Home, TrendingUp } from "lucide-react";

// --- Helpers ---
const currency = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n, d=1) => `${(n*100).toFixed(d)}%`;

function hashRoute() {
  return (typeof window !== 'undefined' && window.location.hash.replace('#','')) || 'overview'
}

const BRAND = {
  primary: "#0D3B66", // deep blue trust
  accent: "#1FAB89",  // mint/green growth
};

// --- Navbar ---
function Nav({ route, setRoute }) {
  const links = [
    { id: "overview", label: "Overview", icon: <Home className="w-4 h-4"/> },
    { id: "calculators", label: "Calculators", icon: <Calculator className="w-4 h-4"/> },
    { id: "advisors", label: "Advisors", icon: <Users className="w-4 h-4"/> },
    { id: "courses", label: "Courses", icon: <GraduationCap className="w-4 h-4"/> },
    { id: "plans", label: "Plans", icon: <TrendingUp className="w-4 h-4"/> },
  ];
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl" style={{background: `conic-gradient(from 180deg, ${BRAND.accent}, ${BRAND.primary})`}}/>
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight" style={{color: BRAND.primary}}>Finwise</div>
            <div className="text-xs text-muted-foreground">Tu salud financiera</div>
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          {links.map(l => (
            <Button key={l.id} variant={route===l.id?"default":"ghost"} className={`gap-2 ${route===l.id?"bg-[#0D3B66] hover:bg-[#0b3155]":""}`} onClick={()=>{setRoute(l.id); if (typeof window!=="undefined") window.location.hash = l.id;}}>
              {l.icon}<span>{l.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Financial Health Widget ---
function HealthScore({ income, expenses, savingsTargetPct, debtMonthly }) {
  const score = useMemo(()=>{
    const savingsRate = income>0 ? Math.max(0, (income - expenses)/income) : 0;
    const dti = income>0 ? debtMonthly/income : 0; // debt-to-income
    // weighted score components
    const wSavings = Math.min(1, savingsRate / (savingsTargetPct||0.2)); // target 20%
    const wDTI = 1 - Math.min(1, dti/0.36); // target DTI <= 36%
    const wBudget = Math.max(0, 1 - Math.max(0, (expenses-income))/income); // if expenses>income, penalize
    const composite = (wSavings*0.45 + wDTI*0.35 + wBudget*0.20);
    return Math.round(composite*100);
  },[income, expenses, savingsTargetPct, debtMonthly]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl font-extrabold" style={{color: BRAND.primary}}>{score}/100</div>
        <Progress value={score} />
        <div className="text-xs text-muted-foreground">Based on savings rate, DTI and budget balance.</div>
      </CardContent>
    </Card>
  )
}

// --- Calculators ---
function Calculators() {
  const [income, setIncome] = useState(1200);
  const [expenses, setExpenses] = useState(900);
  const [debtMonthly, setDebtMonthly] = useState(150);
  const [rate, setRate] = useState(18); // APR %
  const [years, setYears] = useState(3);
  const [principal, setPrincipal] = useState(2000);
  const [lump, setLump] = useState(2000);
  const [ciRate, setCiRate] = useState(8);
  const [ciYears, setCiYears] = useState(5);
  const [ciMonthly, setCiMonthly] = useState(50);

  const capacity30 = Math.max(0, income*0.3 - debtMonthly); // basic rule

  // Loan payment (amortization)
  const pmt = useMemo(()=>{
    const i = rate/100/12;
    const n = years*12;
    if (i===0) return principal/n;
    return principal * (i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1);
  },[principal, rate, years]);

  // Compound interest with monthly contributions
  const ciFuture = useMemo(()=>{
    const r = ciRate/100/12;
    const n = ciYears*12;
    const fvLump = lump * Math.pow(1+r, n);
    const fvAnnuity = ciMonthly * (Math.pow(1+r, n)-1)/r;
    return fvLump + fvAnnuity;
  },[lump, ciRate, ciYears, ciMonthly]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Budget & Capacity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="col-span-1">
            <Label>Monthly income</Label>
            <Input type="number" value={income} onChange={e=>setIncome(+e.target.value||0)} />
          </div>
          <div className="col-span-1">
            <Label>Monthly expenses</Label>
            <Input type="number" value={expenses} onChange={e=>setExpenses(+e.target.value||0)} />
          </div>
          <div className="col-span-1">
            <Label>Existing debt payments</Label>
            <Input type="number" value={debtMonthly} onChange={e=>setDebtMonthly(+e.target.value||0)} />
          </div>
          <div className="col-span-2 text-sm bg-muted/40 rounded-xl p-3">
            <div>Safe new payment capacity (30% rule minus current debt): <b>{currency(capacity30)}</b>/mo</div>
          </div>
          <div className="col-span-2">
            <HealthScore income={income} expenses={expenses} savingsTargetPct={0.2} debtMonthly={debtMonthly} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loan Payment Calculator</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label>Principal</Label>
            <Input type="number" value={principal} onChange={e=>setPrincipal(+e.target.value||0)} />
          </div>
          <div>
            <Label>APR %</Label>
            <Input type="number" value={rate} onChange={e=>setRate(+e.target.value||0)} />
          </div>
          <div>
            <Label>Years</Label>
            <Input type="number" value={years} onChange={e=>setYears(+e.target.value||0)} />
          </div>
          <div className="bg-muted/40 rounded-xl p-3 col-span-2 text-sm">
            <div>Monthly payment: <b>{currency(pmt||0)}</b></div>
            <div className="text-xs text-muted-foreground">Keep below capacity for safer budgeting.</div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Compound Interest</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-1">
            <Label>Initial amount</Label>
            <Input type="number" value={lump} onChange={e=>setLump(+e.target.value||0)} />
          </div>
          <div className="md:col-span-1">
            <Label>Monthly contribution</Label>
            <Input type="number" value={ciMonthly} onChange={e=>setCiMonthly(+e.target.value||0)} />
          </div>
          <div className="md:col-span-1">
            <Label>Annual return %</Label>
            <Input type="number" value={ciRate} onChange={e=>setCiRate(+e.target.value||0)} />
          </div>
          <div className="md:col-span-1">
            <Label>Years</Label>
            <Input type="number" value={ciYears} onChange={e=>setCiYears(+e.target.value||0)} />
          </div>
          <div className="md:col-span-1 bg-muted/40 rounded-xl p-3 text-sm flex flex-col justify-center">
            <div>Projected value: <b>{currency(ciFuture||0)}</b></div>
            <div className="text-xs text-muted-foreground">Assumes monthly compounding.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Advisors (mock) ---
const ADVISORS = [
  { id: 1, name: "Ana Torres", specialty: "Debt reduction", price: 19, rating: 4.9 },
  { id: 2, name: "Luis Pérez", specialty: "Budgeting", price: 15, rating: 4.7 },
  { id: 3, name: "María Gómez", specialty: "Investing basics", price: 22, rating: 4.8 },
];

function Advisors() {
  const [topic, setTopic] = useState("Debt reduction");
  const list = ADVISORS.filter(a => !topic || a.specialty===topic);
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Find a Consultant</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            <Label>Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Debt reduction">Debt reduction</SelectItem>
                <SelectItem value="Budgeting">Budgeting</SelectItem>
                <SelectItem value="Investing basics">Investing basics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="ml-auto">Starting at $15/session</Badge>
        </CardContent>
      </Card>

      {list.map(a => (
        <Card key={a.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{a.name}</span>
              <Badge>{a.rating}★</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Specialty: {a.specialty}</div>
            <div className="font-semibold">{currency(a.price)} / 30 min</div>
            <Button className="w-full bg-[#1FAB89] hover:bg-emerald-600" onClick={()=>alert(`Booked session with ${a.name}. You will receive a confirmation email.`)}>Book session</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Courses (mock) ---
const COURSES = [
  { id: 'c1', title: "Personal Budget 101", level: "Beginner", progress: 40 },
  { id: 'c2', title: "Kill Your Debt Fast", level: "Intermediate", progress: 10 },
  { id: 'c3', title: "Investing Basics", level: "Beginner", progress: 0 },
];

function Courses() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {COURSES.map(c => (
        <Card key={c.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5"/>
              {c.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="outline">{c.level}</Badge>
            <div className="text-xs">Progress</div>
            <Progress value={c.progress} />
            <Button variant="secondary" className="w-full" onClick={()=>alert(`Continue: ${c.title}`)}>Continue</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Plans ---
function Plans() {
  const tiers = [
    { name: "Free", price: 0, features: ["Calculators", "1 mini-course", "Community access" ] },
    { name: "Premium", price: 5, features: ["All calculators", "Full courses", "Advisor discounts", "Health report" ] },
    { name: "Pro", price: 12, features: ["Everything in Premium", "1 free advisor call/mo", "Priority support" ] },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {tiers.map(t => (
        <Card key={t.name} className={`${t.name==='Premium'? 'ring-2 ring-[#1FAB89]':''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.name}</span>
              {t.name==='Premium' && <Badge className="bg-[#1FAB89]">Best value</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-extrabold">{t.price===0?"Free":`$${t.price}/mo`}</div>
            <ul className="text-sm space-y-2">
              {t.features.map(f=>(
                <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-[#0D3B66] hover:bg-[#0b3155]">Choose {t.name}</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Overview ---
function Overview() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Welcome to Finwise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Finwise helps you reduce debt, master your budget, and grow savings with a friendly toolkit and real human advisors.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Quick calculators to plan purchases and pay down debt.</li>
            <li>Personalized health score to stay on track.</li>
            <li>Affordable, on-demand financial consultants.</li>
            <li>Courses tailored to your level and goals.</li>
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full bg-[#1FAB89] hover:bg-emerald-600">Create free account</Button>
          <Button variant="outline" className="w-full">Import your budget (CSV)</Button>
          <Button variant="ghost" className="w-full">Learn the basics</Button>
        </CardContent>
      </Card>
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Starter Checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
          {["Input your income & expenses","Check your payment capacity","Book a 30-min advisor call"].map((t,i)=>(
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
              <PlusCircle className="w-4 h-4"/>
              <span>{t}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(hashRoute());
  useEffect(()=>{
    const onHash = ()=> setRoute(hashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  },[])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Nav route={route} setRoute={setRoute} />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {route==='overview' && <Overview/>}
        {route==='calculators' && <Calculators/>}
        {route==='advisors' && <Advisors/>}
        {route==='courses' && <Courses/>}
        {route==='plans' && <Plans/>}
      </main>
      <footer className="border-t py-6 text-xs text-center text-muted-foreground">
        © {new Date().getFullYear()} Finwise • Built lean · MVP preview
      </footer>
    </div>
  )
}

