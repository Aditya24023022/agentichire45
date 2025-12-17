import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Star, TrendingUp, TrendingDown, Target, Award, AlertCircle, CheckCircle2 } from "lucide-react";

interface InterviewReportProps {
  score: number;
  feedback: string;
  questions: string[];
  responses: string[];
  duration: number;
  interviewType: 'hr' | 'technical';
}

const InterviewReport = ({ score, feedback, questions, responses, duration, interviewType }: InterviewReportProps) => {
  // Calculate skill scores based on responses (simulated analysis)
  const skillScores = interviewType === 'hr' ? [
    { skill: "Communication", score: Math.min(100, score + Math.random() * 15 - 5), fullMark: 100 },
    { skill: "Confidence", score: Math.min(100, score + Math.random() * 20 - 10), fullMark: 100 },
    { skill: "Problem Solving", score: Math.min(100, score + Math.random() * 15 - 8), fullMark: 100 },
    { skill: "Teamwork", score: Math.min(100, score + Math.random() * 18 - 6), fullMark: 100 },
    { skill: "Leadership", score: Math.min(100, score + Math.random() * 20 - 12), fullMark: 100 },
    { skill: "Adaptability", score: Math.min(100, score + Math.random() * 15 - 5), fullMark: 100 },
  ] : [
    { skill: "Technical Knowledge", score: Math.min(100, score + Math.random() * 15 - 5), fullMark: 100 },
    { skill: "Problem Solving", score: Math.min(100, score + Math.random() * 20 - 10), fullMark: 100 },
    { skill: "System Design", score: Math.min(100, score + Math.random() * 15 - 8), fullMark: 100 },
    { skill: "Code Quality", score: Math.min(100, score + Math.random() * 18 - 6), fullMark: 100 },
    { skill: "Communication", score: Math.min(100, score + Math.random() * 20 - 12), fullMark: 100 },
    { skill: "Best Practices", score: Math.min(100, score + Math.random() * 15 - 5), fullMark: 100 },
  ];

  // Performance breakdown
  const performanceData = skillScores.map(s => ({
    name: s.skill.split(' ')[0],
    score: Math.round(s.score),
    color: s.score >= 75 ? 'hsl(var(--primary))' : s.score >= 50 ? 'hsl(45, 100%, 50%)' : 'hsl(0, 70%, 50%)'
  }));

  // Identify strengths and areas to improve
  const sortedSkills = [...skillScores].sort((a, b) => b.score - a.score);
  const strengths = sortedSkills.slice(0, 2);
  const improvements = sortedSkills.slice(-2).reverse();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 80) return 'Very Good';
    if (s >= 70) return 'Good';
    if (s >= 60) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/30 text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-background/50 flex items-center justify-center border-4 border-primary">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
          <p className={`text-lg font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
          <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
          <div className="flex justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-5 h-5 ${i < Math.floor(score / 20) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-foreground">Top Strengths</h3>
          </div>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s.skill}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${s.score}%` }} 
                    />
                  </div>
                  <span className="text-xs text-green-500 font-medium w-8">{Math.round(s.score)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Areas to Improve</h3>
          </div>
          <div className="space-y-3">
            {improvements.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s.skill}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${s.score}%` }} 
                    />
                  </div>
                  <span className="text-xs text-amber-500 font-medium w-8">{Math.round(s.score)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Skill Radar</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillScores}>
                <PolarGrid stroke="hsl(var(--muted))" />
                <PolarAngleAxis 
                  dataKey="skill" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Performance Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-primary">{questions.length}</p>
          <p className="text-xs text-muted-foreground">Questions</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-accent">{responses.length}</p>
          <p className="text-xs text-muted-foreground">Responses</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{formatDuration(duration)}</p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground capitalize">{interviewType}</p>
          <p className="text-xs text-muted-foreground">Type</p>
        </div>
      </div>

      {/* Feedback Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Interviewer Feedback</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{feedback}</p>
      </div>

      {/* Actionable Tips */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Actionable Recommendations</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <h4 className="text-sm font-medium text-green-500 mb-2">What you did well</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Completed all {questions.length} questions</li>
              {score >= 70 && <li>• Demonstrated strong communication skills</li>}
              {score >= 60 && <li>• Showed willingness to engage with questions</li>}
              {responses.length >= 5 && <li>• Provided detailed responses throughout</li>}
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-sm font-medium text-amber-500 mb-2">Areas for improvement</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {score < 80 && <li>• Practice structuring answers using STAR method</li>}
              {score < 70 && <li>• Work on providing more specific examples</li>}
              {score < 60 && <li>• Build confidence through more practice sessions</li>}
              <li>• Review {interviewType === 'hr' ? 'common behavioral' : 'technical'} questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;