import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageLayout } from "@/components/FeaturePageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Users, CreditCard, Plus, Check, X, 
  Trash2, UserPlus, Coins, Clock, IndianRupee
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Expert {
  id: string;
  name: string;
  title: string;
  company: string | null;
  bio: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  price_per_session: number;
  available: boolean | null;
  rating: number | null;
  total_sessions: number | null;
  linkedin_url: string | null;
  calendar_link: string | null;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  credits_added: number;
  transaction_id: string;
  status: string | null;
  created_at: string | null;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [showAddExpert, setShowAddExpert] = useState(false);
  
  // New expert form
  const [newExpert, setNewExpert] = useState({
    name: "",
    title: "",
    company: "",
    bio: "",
    specializations: "",
    years_experience: "",
    linkedin_url: "",
    calendar_link: "",
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await Promise.all([fetchExperts(), fetchPendingTransactions()]);
    setLoading(false);
  };

  const fetchExperts = async () => {
    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching experts:", error);
    } else {
      setExperts(data || []);
    }
  };

  const fetchPendingTransactions = async () => {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setTransactions(data || []);
    }
  };

  const addExpert = async () => {
    if (!newExpert.name || !newExpert.title) {
      toast.error("Name and title are required");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from("experts").insert({
      name: newExpert.name,
      title: newExpert.title,
      company: newExpert.company || null,
      bio: newExpert.bio || null,
      specializations: newExpert.specializations 
        ? newExpert.specializations.split(",").map(s => s.trim()) 
        : [],
      years_experience: newExpert.years_experience 
        ? parseInt(newExpert.years_experience) 
        : null,
      linkedin_url: newExpert.linkedin_url || null,
      calendar_link: newExpert.calendar_link || null,
      created_by: session?.user.id,
      available: true,
      price_per_session: 500,
    });

    if (error) {
      console.error("Error adding expert:", error);
      toast.error("Failed to add expert");
    } else {
      toast.success("Expert added successfully");
      setShowAddExpert(false);
      setNewExpert({
        name: "",
        title: "",
        company: "",
        bio: "",
        specializations: "",
        years_experience: "",
        linkedin_url: "",
        calendar_link: "",
      });
      fetchExperts();
    }
  };

  const toggleExpertAvailability = async (expert: Expert) => {
    const { error } = await supabase
      .from("experts")
      .update({ available: !expert.available })
      .eq("id", expert.id);

    if (error) {
      toast.error("Failed to update expert");
    } else {
      toast.success(`Expert ${expert.available ? "disabled" : "enabled"}`);
      fetchExperts();
    }
  };

  const deleteExpert = async (id: string) => {
    const { error } = await supabase.from("experts").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete expert");
    } else {
      toast.success("Expert deleted");
      fetchExperts();
    }
  };

  const approveTransaction = async (transaction: CreditTransaction) => {
    const { data: { session } } = await supabase.auth.getSession();

    // Update transaction status
    const { error: txError } = await supabase
      .from("credit_transactions")
      .update({ 
        status: "approved",
        verified_by: session?.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (txError) {
      toast.error("Failed to approve transaction");
      return;
    }

    // Check if user has credits record
    const { data: existingCredits } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", transaction.user_id)
      .single();

    if (existingCredits) {
      // Update existing credits
      await supabase
        .from("user_credits")
        .update({ credits: existingCredits.credits + transaction.credits_added })
        .eq("user_id", transaction.user_id);
    } else {
      // Create new credits record
      await supabase.from("user_credits").insert({
        user_id: transaction.user_id,
        credits: transaction.credits_added,
      });
    }

    toast.success(`Approved! Added ${transaction.credits_added} credits`);
    fetchPendingTransactions();
  };

  const rejectTransaction = async (transaction: CreditTransaction) => {
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("credit_transactions")
      .update({ 
        status: "rejected",
        verified_by: session?.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (error) {
      toast.error("Failed to reject transaction");
    } else {
      toast.success("Transaction rejected");
      fetchPendingTransactions();
    }
  };

  if (loading) {
    return (
      <FeaturePageLayout
        icon={Shield}
        title="Admin Panel"
        description="Loading..."
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </FeaturePageLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <FeaturePageLayout
      icon={Shield}
      title="Admin Panel"
      description="Manage experts and verify payments"
    >
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pending Payments ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="experts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Experts ({experts.length})
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No pending transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-card border border-border flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <IndianRupee className="w-3 h-3 mr-1" />
                          {tx.amount}
                        </Badge>
                        <Badge variant="secondary">
                          <Coins className="w-3 h-3 mr-1" />
                          {tx.credits_added} credits
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Transaction ID: <code className="text-foreground">{tx.transaction_id}</code>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tx.created_at && new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-500 hover:text-green-600"
                        onClick={() => approveTransaction(tx)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => rejectTransaction(tx)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Experts Tab */}
          <TabsContent value="experts" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddExpert} onOpenChange={setShowAddExpert}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Expert
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Expert</DialogTitle>
                    <DialogDescription>
                      Add a new industry expert to the community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Name *</label>
                        <Input
                          value={newExpert.name}
                          onChange={(e) => setNewExpert({ ...newExpert, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Title *</label>
                        <Input
                          value={newExpert.title}
                          onChange={(e) => setNewExpert({ ...newExpert, title: e.target.value })}
                          placeholder="Senior Engineer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Company</label>
                        <Input
                          value={newExpert.company}
                          onChange={(e) => setNewExpert({ ...newExpert, company: e.target.value })}
                          placeholder="Google"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Years Experience</label>
                        <Input
                          type="number"
                          value={newExpert.years_experience}
                          onChange={(e) => setNewExpert({ ...newExpert, years_experience: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Specializations (comma-separated)</label>
                      <Input
                        value={newExpert.specializations}
                        onChange={(e) => setNewExpert({ ...newExpert, specializations: e.target.value })}
                        placeholder="Tech Leadership, System Design"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Bio</label>
                      <Textarea
                        value={newExpert.bio}
                        onChange={(e) => setNewExpert({ ...newExpert, bio: e.target.value })}
                        placeholder="Brief introduction..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground">LinkedIn URL</label>
                        <Input
                          value={newExpert.linkedin_url}
                          onChange={(e) => setNewExpert({ ...newExpert, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Calendar Link</label>
                        <Input
                          value={newExpert.calendar_link}
                          onChange={(e) => setNewExpert({ ...newExpert, calendar_link: e.target.value })}
                          placeholder="https://calendly.com/..."
                        />
                      </div>
                    </div>
                    <Button className="w-full" variant="hero" onClick={addExpert}>
                      Add Expert
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {experts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No experts added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {experts.map((expert) => (
                  <div
                    key={expert.id}
                    className="p-4 rounded-xl bg-card border border-border flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{expert.name}</h4>
                        <Badge variant={expert.available ? "default" : "secondary"}>
                          {expert.available ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {expert.title} {expert.company && `@ ${expert.company}`}
                      </p>
                      {expert.specializations && expert.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {expert.specializations.map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpertAvailability(expert)}
                      >
                        {expert.available ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteExpert(expert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FeaturePageLayout>
  );
};

export default AdminPanel;