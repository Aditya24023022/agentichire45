import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import EmailWriter from "./pages/EmailWriter";
import InterviewPrep from "./pages/InterviewPrep";
import MockInterview from "./pages/MockInterview";
import ATSAnalyzer from "./pages/ATSAnalyzer";
import CoverLetter from "./pages/CoverLetter";
import LinkedInOptimizer from "./pages/LinkedInOptimizer";
import SkillsGap from "./pages/SkillsGap";
import SalaryCoach from "./pages/SalaryCoach";
import FollowUpEmail from "./pages/FollowUpEmail";
import JobMatch from "./pages/JobMatch";
import PortfolioDescriber from "./pages/PortfolioDescriber";
import NetworkingMessages from "./pages/NetworkingMessages";
import CareerAdvisor from "./pages/CareerAdvisor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resume-optimizer" element={<ResumeOptimizer />} />
          <Route path="/email-writer" element={<EmailWriter />} />
          <Route path="/interview-prep" element={<InterviewPrep />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/ats-analyzer" element={<ATSAnalyzer />} />
          <Route path="/cover-letter" element={<CoverLetter />} />
          <Route path="/linkedin-optimizer" element={<LinkedInOptimizer />} />
          <Route path="/skills-gap" element={<SkillsGap />} />
          <Route path="/salary-coach" element={<SalaryCoach />} />
          <Route path="/follow-up-email" element={<FollowUpEmail />} />
          <Route path="/job-match" element={<JobMatch />} />
          <Route path="/portfolio-describer" element={<PortfolioDescriber />} />
          <Route path="/networking-messages" element={<NetworkingMessages />} />
          <Route path="/career-advisor" element={<CareerAdvisor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
