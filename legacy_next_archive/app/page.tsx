'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  FileEdit, 
  Search, 
  Users, 
  CheckSquare, 
  Brain, 
  ShieldCheck, 
  LineChart, 
  MessageSquare,
  Globe,
  Video,
  FileText,
  LayoutDashboard,
  Settings
} from 'lucide-react'

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <div className="min-h-screen bg-white text-brand-navy font-sans selection:bg-brand-blue selection:text-white">
      
      {/* 1. Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-brand-blue font-bold text-2xl tracking-tighter mr-1">H</span>
              <span className="font-bold text-xl tracking-tight">Hirica</span>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">For Recruiters</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">For Job Seekers</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">Solutions</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">Resources</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">Pricing</Link>
            </div>
            {/* CTA */}
            <div className="hidden md:flex space-x-3">
              <Link href="/jobseeker/login" className="bg-white border border-gray-200 text-brand-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors">
                Find a Job
              </Link>
              <Link href="/recruiter/login" className="bg-brand-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gray-100 -z-10"></div>
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gray-100 -z-10"></div>
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-gray-50 -z-10"></div>
        
        {/* Dot grid top right */}
        <div className="absolute top-20 right-20 w-48 h-48 opacity-20 bg-[radial-gradient(#0F52BA_2px,transparent_2px)] [background-size:16px_16px] -z-10"></div>
        {/* Dot grid bottom right */}
        <div className="absolute bottom-20 right-10 w-48 h-48 opacity-20 bg-[radial-gradient(#0F52BA_2px,transparent_2px)] [background-size:16px_16px] -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div initial="initial" animate="animate" variants={fadeInUp} className="max-w-2xl pt-10">
            <div className="inline-flex items-center space-x-2 text-brand-blue font-bold text-xs tracking-widest uppercase mb-8">
              <span className="text-lg leading-none">✦</span>
              <span>AI-POWERED HIRING INFRASTRUCTURE</span>
            </div>
            
            <h1 className="text-6xl md:text-[80px] font-black tracking-tighter leading-[0.95] mb-8 text-black">
              HIRING<br/>
              SHOULD NOT<br/>
              FEEL LIKE<br/>
              GUESSWORK<span className="text-brand-blue">.</span>
            </h1>
            
            <div className="w-16 h-[2px] bg-gray-300 mb-8"></div>

            <p className="text-xl text-gray-500 mb-10 max-w-lg font-medium leading-relaxed">
              Hirica helps companies find, assess and hire the right people faster with AI at every step.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-16">
              <Link href="/recruiter/login" className="bg-brand-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center shadow-lg">
                I'm a Recruiter <ArrowRight className="ml-3 w-5 h-5 opacity-80" />
              </Link>
              <Link href="/jobseeker/login" className="bg-white text-brand-black border border-gray-200 shadow-sm px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center">
                Find a Job <ArrowRight className="ml-3 w-5 h-5 opacity-80" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
              <div>
                <p className="font-bold text-3xl mb-1 text-black">10K+</p>
                <p className="text-sm text-gray-500 font-medium">Companies Trust Us</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="font-bold text-3xl mb-1 text-black">500K+</p>
                <p className="text-sm text-gray-500 font-medium">Candidates Evaluated</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="font-bold text-3xl mb-1 text-black">95%</p>
                <p className="text-sm text-gray-500 font-medium">Faster Hiring</p>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div>
                <p className="font-bold text-3xl mb-1 text-black">AI</p>
                <p className="text-sm text-gray-500 font-medium">Built In</p>
              </div>
            </div>
          </motion.div>

          {/* Workflow Diagram */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative h-[800px] w-full hidden lg:block"
          >
            {/* The SVG Winding Path */}
            <svg className="absolute top-10 left-[20%] w-[400px] h-[750px] overflow-visible" viewBox="0 0 200 600" preserveAspectRatio="none">
              <path 
                d="M 50 10 C 50 100, 150 50, 150 150 C 150 250, 50 200, 50 300 C 50 400, 150 350, 150 450 C 150 550, 50 500, 50 590" 
                fill="none" 
                stroke="#0F52BA" 
                strokeWidth="16" 
                strokeLinecap="round"
                className="path-animate drop-shadow-xl"
              />
              <path 
                d="M 35 575 L 50 600 L 65 575 Z" 
                fill="#0F52BA" 
              />
            </svg>

            {/* Node 1: Application */}
            <div className="absolute top-[10px] left-[17%] transform -translate-x-1/2 flex items-center z-10">
              <div className="w-12 h-12 bg-brand-blue rounded-full border-4 border-white shadow-md flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-brand-blue font-bold text-sm leading-none mb-1">01</p>
                <p className="font-black text-black tracking-tight uppercase">APPLICATION</p>
              </div>
            </div>

            {/* Card 1: Top Candidates */}
            <div className="absolute top-[60px] left-[45%] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-72 z-20 hover:scale-105 transition-transform duration-300">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-black">Top Candidates</h4>
                <span className="text-xs text-brand-blue font-bold">View all</span>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Arlene McCoy', match: '92%', img: 'https://i.pravatar.cc/100?img=5' },
                  { name: 'Cameron Williamson', match: '88%', img: 'https://i.pravatar.cc/100?img=11' },
                  { name: 'Leslie Alexander', match: '85%', img: 'https://i.pravatar.cc/100?img=9' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={c.img} alt={c.name} className="w-8 h-8 rounded-full" />
                      <p className="text-xs font-bold text-gray-800">{c.name}</p>
                    </div>
                    <span className="text-xs font-bold text-brand-blue bg-blue-50 px-2 py-1 rounded-full">{c.match} Match</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node 2: AI Assessment */}
            <div className="absolute top-[230px] left-[42%] transform -translate-x-1/2 flex items-center z-10">
              <div className="w-12 h-12 bg-brand-black rounded-full border-4 border-white shadow-md flex items-center justify-center text-white">
                <FileEdit className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-brand-blue font-bold text-sm leading-none mb-1">02</p>
                <p className="font-black text-black tracking-tight uppercase">AI ASSESSMENT</p>
              </div>
            </div>

            {/* Card 2: Assessment Summary */}
            <div className="absolute top-[290px] left-[47%] bg-brand-black text-white rounded-2xl shadow-2xl p-6 w-[340px] z-20 hover:scale-105 transition-transform duration-300">
              <h4 className="font-bold text-sm mb-6">Assessment Summary</h4>
              <div className="flex items-center space-x-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-800" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-brand-blue" strokeWidth="4" strokeDasharray="86, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold">86%</p>
                    <p className="text-[9px] text-gray-400">Average Score</p>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {[
                    { label: 'Logical Reasoning', val: '90%' },
                    { label: 'Technical', val: '85%' },
                    { label: 'Coding', val: '83%' },
                    { label: 'Communication', val: '87%' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{s.label}</span>
                      <span className="font-bold">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Node 3: Interview */}
            <div className="absolute top-[430px] left-[17%] transform -translate-x-1/2 flex items-center z-10">
              <div className="w-12 h-12 bg-brand-black rounded-full border-4 border-white shadow-md flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-brand-blue font-bold text-sm leading-none mb-1">03</p>
                <p className="font-black text-black tracking-tight uppercase">INTERVIEW</p>
              </div>
            </div>

            {/* Card 3: Interview Scheduled */}
            <div className="absolute top-[500px] left-[35%] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-72 z-20 hover:scale-105 transition-transform duration-300">
              <h4 className="font-bold text-sm text-black mb-4">Interview Scheduled</h4>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">May</span>
                  <span className="text-lg font-black text-black leading-none">24</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-black">Technical Interview</p>
                  <p className="text-xs text-gray-500 mt-1 mb-2">10:30 AM - 11:30 AM</p>
                  <span className="text-xs font-bold text-brand-blue flex items-center cursor-pointer hover:underline">
                    Join Interview <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            </div>

            {/* Node 4: Hiring */}
            <div className="absolute top-[660px] left-[29%] transform -translate-x-1/2 flex items-center z-10">
              <div className="w-12 h-12 bg-brand-black rounded-full border-4 border-white shadow-md flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-brand-blue font-bold text-sm leading-none mb-1">04</p>
                <p className="font-black text-black tracking-tight uppercase">HIRING</p>
              </div>
            </div>

            {/* Card 4: Offer Extended */}
            <div className="absolute top-[690px] left-[37%] bg-brand-blue text-white rounded-2xl shadow-xl shadow-blue-500/30 p-6 w-72 z-20 flex justify-between items-center hover:scale-105 transition-transform duration-300">
              <div>
                <h4 className="font-bold text-sm mb-1">Offer Extended</h4>
                <p className="text-xs text-blue-200">Welcome onboard!</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-6 h-6 text-brand-blue" />
              </div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* 3. Powerful Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Text and Graphic */}
          <div className="lg:col-span-5 relative">
            <p className="text-brand-blue font-bold text-xs tracking-widest uppercase mb-4">POWERFUL FEATURES</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6 text-black">
              Everything you need<br/>
              to hire with <span className="text-brand-blue">confidence.</span>
            </h2>
            <p className="text-gray-500 text-lg mb-16 max-w-md">
              Hirica combines AI, automation, and human insight to simplify every step of your hiring process.
            </p>
            
            {/* Concentric Circles Graphic */}
            <div className="relative w-80 h-80 mx-auto lg:mx-0 flex items-center justify-center">
              <div className="absolute inset-0 border border-gray-100 rounded-full animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-gray-100 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
              <div className="absolute inset-12 border border-gray-100 rounded-full animate-[spin_20s_linear_infinite]"></div>
              
              {/* Center Logo */}
              <div className="w-28 h-28 bg-white rounded-full shadow-xl flex items-center justify-center z-10 relative">
                <span className="text-brand-black font-black text-6xl">H</span>
                <div className="absolute top-4 right-4 w-4 h-4 bg-brand-blue rounded-sm transform rotate-45"></div>
              </div>

              {/* Floating Icons */}
              <div className="absolute top-0 right-10 w-10 h-10 bg-brand-black rounded-full flex items-center justify-center text-white shadow-lg">
                <LineChart className="w-5 h-5" />
              </div>
              <div className="absolute bottom-10 right-0 w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="absolute bottom-4 left-10 w-10 h-10 bg-brand-black rounded-full flex items-center justify-center text-white shadow-lg">
                <Video className="w-5 h-5" />
              </div>
              <div className="absolute top-12 left-4 w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white shadow-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Right Side: Feature Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { num: '01', title: 'AI Job Creation', desc: 'Create detailed, engaging job posts in seconds with AI assistance.', icon: FileEdit },
              { num: '02', title: 'Smart Assessments', desc: 'AI-generated tests and coding challenges tailored to your needs.', icon: Brain },
              { num: '03', title: 'AI Proctoring', desc: 'Advanced real-time monitoring ensures fair and secure assessments.', icon: ShieldCheck },
              { num: '04', title: 'Intelligent Interviews', desc: 'AI-led or collaborative interviews with deep evaluation insights.', icon: Users },
              { num: '05', title: 'Hiring Analytics', desc: 'Data-driven reports and insights to make smarter hiring decisions.', icon: LineChart },
              { num: '06', title: 'Seamless Workflow', desc: 'End-to-end hiring pipeline built for speed and scalability.', icon: Search },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-50 p-8 hover:shadow-xl transition-shadow duration-300 relative group">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-brand-blue font-bold">{f.num}</span>
                  <div className="flex-1 h-px bg-gray-100 flex items-center">
                     <div className="w-1 h-1 bg-brand-blue rounded-full mx-1"></div>
                     <div className="w-1 h-1 bg-brand-blue rounded-full mx-1"></div>
                     <div className="w-1 h-1 bg-brand-blue rounded-full mx-1"></div>
                     <div className="w-1 h-1 bg-brand-blue rounded-full mx-1"></div>
                  </div>
                </div>
                <div className="mb-4 relative inline-block">
                  <f.icon className="w-8 h-8 text-brand-black" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-brand-blue transform rotate-45"></div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-black">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.desc}</p>
                <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-brand-blue" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Stats Section (Angled Black Background) */}
      <section className="relative bg-brand-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 mt-20">
        {/* Angled top separator */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-full">
          <svg className="relative block w-full h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M1200 120L0 16.48 0 120 1200 120z" className="fill-brand-black"></path>
          </svg>
        </div>
        
        {/* Abstract Mesh Graphic right side */}
        <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
           <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mask-image:linear-gradient(to_left,black,transparent)]"></div>
           {/* Custom sine wave lines via SVG */}
           <svg className="absolute bottom-0 right-0 w-[600px] h-[300px]" viewBox="0 0 600 300">
              <path d="M0,150 Q150,50 300,150 T600,150" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-50" />
              <path d="M0,200 Q150,100 300,200 T600,200" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-30" />
              <path d="M0,250 Q150,150 300,250 T600,250" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-20" />
           </svg>
        </div>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <p className="text-brand-blue font-bold text-xs tracking-widest uppercase mb-12">IMPACT THAT MATTERS</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
            <div className="py-4 lg:py-0 pr-8">
              <p className="text-5xl font-bold mb-2">10K+</p>
              <p className="text-sm text-gray-400">Companies Trust Us</p>
            </div>
            <div className="py-4 lg:py-0 lg:px-8">
              <p className="text-5xl font-bold mb-2">500K+</p>
              <p className="text-sm text-gray-400">Candidates Evaluated</p>
            </div>
            <div className="py-4 lg:py-0 lg:px-8">
              <p className="text-5xl font-bold mb-2">95%</p>
              <p className="text-sm text-gray-400">Faster Hiring</p>
            </div>
            <div className="py-4 lg:py-0 lg:pl-8">
              <p className="text-4xl font-bold mb-2">4.8/5</p>
              <div className="flex space-x-1 mb-2">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-brand-blue fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-400">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>      {/* 5. AI Proctoring Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto bg-white relative overflow-hidden">
        {/* Background Wavy Lines Graphic */}
        <div className="absolute top-1/2 left-[45%] transform -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none -z-10 opacity-40">
           {/* Faint wavy concentric paths */}
           <svg viewBox="0 0 100 100" className="w-full h-full text-brand-blue stroke-current">
              <path fill="none" strokeWidth="0.2" d="M20,50 Q40,10 60,50 T100,50" />
              <path fill="none" strokeWidth="0.2" d="M10,50 Q30,5 70,50 T100,50" />
              <path fill="none" strokeWidth="0.4" d="M0,50 Q50,-10 80,50 T100,50" />
              <path fill="none" strokeWidth="2" className="text-brand-blue" d="M30,70 Q45,30 65,70 T100,70" />
           </svg>
           {/* Center H logo */}
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-black rounded-full flex items-center justify-center shadow-2xl">
             <span className="text-white font-black text-6xl">H</span>
             <div className="absolute top-8 right-6 w-3 h-3 bg-brand-blue rounded-sm transform rotate-45"></div>
           </div>
           {/* Floating blue dots */}
           <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-brand-blue rounded-full"></div>
           <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-brand-blue rounded-full"></div>
           <div className="absolute top-1/2 left-10 w-2 h-2 bg-brand-blue rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-center">
          
          {/* Left: Text and Features */}
          <div className="xl:col-span-5 relative z-10">
            <div className="inline-flex items-center space-x-2 text-brand-blue font-bold text-xs tracking-widest uppercase mb-4">
              <span className="text-lg leading-none">✦</span>
              <span>AI PROCTORING</span>
              <span className="text-lg leading-none">✦</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6 text-black">
              Fair assessments.<br/>
              Built on trust,<br/>
              <span className="text-brand-blue">powered by AI.</span>
            </h2>
            
            <p className="text-gray-500 text-lg mb-10 max-w-md">
              Hirica's AI Proctoring ensures every assessment is fair, secure, and distraction-free — so you hire with complete confidence.
            </p>

            <div className="space-y-6">
              {[
                { title: 'Face & Behavior Detection', desc: 'AI monitors expressions and behavior in real-time.', icon: Users },
                { title: 'Tab & Window Monitoring', desc: 'Detects tab switches, copy attempts, and focus loss.', icon: ShieldCheck },
                { title: 'Audio Intelligence', desc: 'Detects background voices and suspicious audio patterns.', icon: Video },
                { title: 'Real-time Integrity Score', desc: 'Live integrity score updates throughout the assessment.', icon: ShieldCheck },
              ].map((f, i) => (
                <div key={i} className="flex items-start">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-brand-blue flex-shrink-0 mt-1">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-5">
                    <h4 className="font-bold text-black text-sm mb-1">{f.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Assessment Monitoring UI Card */}
          <div className="xl:col-span-7 z-10">
            <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100 flex overflow-hidden w-full h-[600px]">
              
              {/* Dark Sidebar */}
              <div className="w-16 bg-brand-black flex flex-col items-center py-6 border-r border-gray-800">
                 <div className="text-white font-black text-2xl mb-12">H</div>
                 <div className="flex flex-col space-y-6">
                   <LayoutDashboard className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                   <FileText className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                   <Users className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                   <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg">
                     <ShieldCheck className="w-5 h-5" />
                   </div>
                   <LineChart className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                   <MessageSquare className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                 </div>
                 <div className="mt-auto">
                   <Settings className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer" />
                 </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center">
                    <h3 className="font-bold text-lg text-black mr-4">Assessment Monitoring</h3>
                    <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      Live
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-3">Candidate: <strong className="text-black">Arlene McCoy</strong></span>
                    <img src="https://i.pravatar.cc/100?img=5" className="w-6 h-6 rounded-full" />
                  </div>
                </div>

                <div className="flex gap-6 mb-6">
                  {/* Integrity Score */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6 w-1/3 flex flex-col items-center justify-center">
                    <p className="text-xs font-bold text-gray-500 self-start mb-4">Integrity Score</p>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-green-500" strokeWidth="3" strokeDasharray="92, 100" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-3xl font-black text-black leading-none">92</p>
                        <p className="text-[10px] font-bold text-gray-400">/100</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-green-500">Low Risk</p>
                  </div>

                  {/* Monitoring Status Grid */}
                  <div className="w-2/3">
                    <p className="text-xs font-bold text-gray-500 mb-4">Monitoring Status</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Face Detected', val: 'Yes', color: 'green' },
                        { label: 'Multiple Faces', val: 'No', color: 'green' },
                        { label: 'Tab Switches', val: '1', color: 'yellow' },
                        { label: 'Looking Away', val: '2', color: 'yellow' },
                        { label: 'Voice Detected', val: 'Yes', color: 'green' },
                        { label: 'Background Noise', val: 'Low', color: 'green' },
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                          <p className="text-[10px] text-gray-500 mb-2">{item.label}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-black">{item.val}</span>
                            <span className={`w-2 h-2 rounded-full ${item.color === 'green' ? 'bg-green-500 border border-green-200' : 'bg-yellow-400 border border-yellow-200'}`}></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Graph */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-xs font-bold text-gray-500">Live Activity Timeline</p>
                    <div className="flex space-x-6 text-[9px] text-gray-400">
                      <span>00:00</span><span>05:00</span><span>10:00</span><span>15:00</span><span>20:00</span><span>25:00</span><span>30:00</span>
                      <span className="hidden lg:inline">35:00</span><span className="hidden lg:inline">40:00</span><span className="hidden lg:inline">45:00</span><span className="hidden lg:inline">50:00</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Rows */}
                    {[
                      { label: 'Face', color: 'bg-blue-500' },
                      { label: 'Gaze', color: 'bg-green-500' },
                      { label: 'Tabs', color: 'bg-yellow-400' },
                      { label: 'Audio', color: 'bg-purple-500' },
                      { label: 'Events', color: 'bg-red-500' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center text-[10px] font-bold text-gray-500 relative h-4">
                        <div className="w-12 flex items-center justify-between pr-2">
                          {row.label} <span className={`w-1.5 h-1.5 rounded-full ${row.color}`}></span>
                        </div>
                        <div className="flex-1 border-t border-gray-100 flex items-center relative">
                          {/* Random generated-looking bars for mock data */}
                          {i === 0 && <div className="absolute left-[5%] w-[90%] h-0.5 bg-blue-500 rounded-full"></div>}
                          {i === 1 && <div className="absolute left-[5%] w-[30%] h-0.5 bg-green-500 rounded-full"></div>}
                          {i === 1 && <div className="absolute left-[40%] w-[50%] h-0.5 bg-green-500 rounded-full"></div>}
                          {i === 2 && <div className="absolute left-[15%] w-[2%] h-0.5 bg-yellow-400 rounded-full"></div>}
                          {i === 2 && <div className="absolute left-[45%] w-[1%] h-0.5 bg-yellow-400 rounded-full"></div>}
                          {i === 3 && <div className="absolute left-[25%] w-[8%] h-0.5 bg-purple-300 rounded-full"></div>}
                          {i === 3 && <div className="absolute left-[65%] w-[12%] h-0.5 bg-purple-400 rounded-full"></div>}
                          {i === 4 && <div className="absolute left-[15%] w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                          {i === 4 && <div className="absolute left-[45%] w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tooltip & Scrubber Line */}
                  <div className="absolute top-10 bottom-8 left-[50%] w-px bg-black">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full"></div>
                    <div className="absolute top-1/2 left-2 bg-brand-black text-white text-[10px] p-2 rounded-md shadow-xl w-32 z-20">
                      <p className="font-bold mb-1">25:13</p>
                      <p className="text-gray-300 leading-tight">Tab switch detected Duration: 00:08</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-50 text-[9px] text-gray-400 font-bold">
                    <p>Monitoring is active for the entire assessment duration.</p>
                    <p>Assessment Time: 00:25:13 / 60:00</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. Trusted Companies & Footer CTA */}
      <section className="bg-brand-black text-white py-20 px-4 sm:px-6 lg:px-8 rounded-t-[40px] mt-10">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            
            <div className="lg:col-span-4">
              <div className="inline-flex items-center space-x-2 text-brand-blue font-bold text-xs tracking-widest uppercase mb-4">
                <span className="text-lg leading-none">✦</span>
                <span>TRUSTED BY LEADING COMPANIES</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8">
                Helping companies hire the <span className="text-brand-blue">right talent</span> around the world.
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-6 opacity-60">
                 {/* Fake logos via text/svg for layout */}
                 <div className="font-bold text-xl flex items-center">Google</div>
                 <div className="font-bold text-xl flex items-center"><div className="w-4 h-4 bg-white grid grid-cols-2 gap-0.5 mr-1.5"><div className="bg-brand-black"></div><div className="bg-brand-black"></div><div className="bg-brand-black"></div><div className="bg-brand-black"></div></div>Microsoft</div>
                 <div className="font-bold text-xl flex items-center italic">amazon</div>
                 <div className="font-bold text-xl flex items-center">airbnb</div>
                 <div className="font-bold text-xl flex items-center">Notion</div>
                 <div className="font-bold text-xl flex items-center">Spotify</div>
                 <div className="font-bold text-xl flex items-center">stripe</div>
                 <div className="font-bold text-xl flex items-center">slack</div>
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-6 lg:border-l lg:border-gray-800 lg:pl-10">
              <div>
                <p className="text-4xl font-bold mb-1">10K+</p>
                <p className="text-xs text-gray-400">Companies Trust Us</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-1">500K+</p>
                <p className="text-xs text-gray-400">Candidates Evaluated</p>
              </div>
              <div>
                <p className="text-4xl font-bold mb-1">95%</p>
                <p className="text-xs text-gray-400">Faster Hiring</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">4.8/5</p>
                <div className="flex space-x-0.5 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-3.5 h-3.5 text-brand-blue fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Customer Rating</p>
              </div>
            </div>

            <div className="lg:col-span-4 border border-gray-800 rounded-2xl p-8 relative">
              <div className="text-brand-blue font-serif text-5xl absolute top-6 left-6 leading-none">"</div>
              <p className="text-sm font-medium leading-relaxed mb-6 mt-4 relative z-10 pl-6">
                Hirica has completely transformed how we assess and hire talent. The AI proctoring and insights are unmatched.
              </p>
              <div className="flex items-center space-x-3 pl-6">
                <img src="https://i.pravatar.cc/100?img=12" alt="David Park" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm">David Park</p>
                  <p className="text-xs text-gray-400">Head of Talent, Notion</p>
                </div>
              </div>
              <div className="flex space-x-1 mt-6 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
              </div>
            </div>

          </div>
          
          {/* Footer Line */}
          <div className="border-t border-gray-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>© 2026 Hirica. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
