import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  User, Scissors, ChevronLeft, Check, Bell, X, Edit2, Trash2,
  FileText, Plus, RotateCcw, AlertCircle, CheckCircle, Info, CreditCard
} from "lucide-react";
import ImageWithFallback from "../components/ImageWithFallback";
import { getGroomerAvatar } from "../utils/groomerAvatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PAYMENT_OPTIONS = [
  { id: "Bkash", label: "🔵 bKash" },
  { id: "COD", label: "💵 Cash on Delivery" }
];

const defaultPlanForm = {
  title: "",
  price: "",
  billingCycle: "Monthly",
  description: "",
  benefits: "",
};

const defaultSubscriberForm = {
  subscriberName: "",
  subscriberPhone: "",
  subscriberEmail: "",
  paymentMethod: "Bkash",
  bkashNumber: "",
  autoRenew: false,
};

const SubscriptionHub = () => {
  const location = useLocation();
  const [role, setRole] = useState(""); // "customer", "groomer", or ""
  const [groomers, setGroomers] = useState([]);
  const [selectedGroomerId, setSelectedGroomerId] = useState("");
  const [confirmedGroomer, setConfirmedGroomer] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [planForm, setPlanForm] = useState(defaultPlanForm);
  const [subscriberForm, setSubscriberForm] = useState(defaultSubscriberForm);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type, message }
  const [invoice, setInvoice] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const selectedGroomer = useMemo(
    () => groomers.find((g) => g._id === selectedGroomerId),
    [groomers, selectedGroomerId]
  );

  const notify = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  const fetchGroomers = async () => {
    const { data } = await axios.get(`${API}/api/groomers/search`);
    setGroomers(data.data || []);
  };

  const fetchPlans = async (groomerId) => {
    if (!groomerId) return;
    const { data } = await axios.get(`${API}/api/subscriptions/plans?groomerId=${groomerId}`);
    setPlans(data.data || []);
  };

  const fetchSubscriptions = async (groomerId, subscriberPhone = "") => {
    if (!groomerId) return;
    const query = subscriberPhone
      ? `${API}/api/subscriptions?groomerId=${groomerId}&subscriberPhone=${encodeURIComponent(subscriberPhone)}`
      : `${API}/api/subscriptions?groomerId=${groomerId}`;
    const { data } = await axios.get(query);
    setSubscriptions(data.data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchGroomers();
      } catch (error) {
        console.error("Failed to load subscription hub data:", error);
        notify("error", "Unable to load subscription data right now.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedGroomerId) return;

    const loadGroomerData = async () => {
      try {
        const subscriberPhone = role === "customer" ? subscriberForm.subscriberPhone : "";
        await Promise.all([fetchPlans(selectedGroomerId), fetchSubscriptions(selectedGroomerId, subscriberPhone)]);
      } catch (error) {
        console.error("Failed to refresh subscription hub:", error);
      }
    };

    loadGroomerData();
  }, [selectedGroomerId, role, subscriberForm.subscriberPhone]);

  useEffect(() => {
    setConfirmedGroomer(false);
  }, [selectedGroomerId]);

  useEffect(() => {
    resetPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const handlePlanChange = (e) => {
    const { name, value } = e.target;
    setPlanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubscriberChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubscriberForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "paymentMethod" && value === "COD") {
        next.autoRenew = false;
      }
      return next;
    });
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setInvoice(null);
    setNotice(null);
  };

  const resetPortal = () => {
    setRole("");
    setSelectedGroomerId("");
    setConfirmedGroomer(false);
    setPlans([]);
    setSubscriptions([]);
    setPlanForm(defaultPlanForm);
    setSubscriberForm(defaultSubscriberForm);
    setNotice(null);
    setInvoice(null);
    setEditingPlanId(null);
    fetchGroomers();
  };

  const createPlan = async (e) => {
    e.preventDefault();
    if (!selectedGroomerId || !confirmedGroomer) {
      notify("error", "Please select and confirm your groomer profile first.");
      return;
    }

    try {
      setActionLoading(true);
      const benefits = planForm.benefits
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      await axios.post(`${API}/api/subscriptions/plans`, {
        groomerId: selectedGroomerId,
        title: planForm.title,
        price: Number(planForm.price),
        billingCycle: planForm.billingCycle,
        description: planForm.description,
        benefits,
      });

      setPlanForm(defaultPlanForm);
      notify("success", "Subscription plan created successfully.");
      await fetchPlans(selectedGroomerId);
    } catch (error) {
      console.error("Failed to create plan:", error);
      notify("error", "Plan creation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const startEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setPlanForm({
      title: plan.title || "",
      price: String(plan.price || ""),
      billingCycle: plan.billingCycle || "Monthly",
      description: plan.description || "",
      benefits: (plan.benefits || []).join("\n"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditPlan = () => {
    setEditingPlanId(null);
    setPlanForm(defaultPlanForm);
  };

  const updatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlanId || !selectedGroomerId || !confirmedGroomer) return;

    try {
      setActionLoading(true);
      const benefits = planForm.benefits
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      await axios.put(`${API}/api/subscriptions/plans/${editingPlanId}`, {
        title: planForm.title,
        price: Number(planForm.price),
        billingCycle: planForm.billingCycle,
        description: planForm.description,
        benefits,
      });

      notify("success", "Subscription plan updated successfully.");
      setEditingPlanId(null);
      setPlanForm(defaultPlanForm);
      await fetchPlans(selectedGroomerId);
    } catch (error) {
      console.error("Failed to update plan:", error);
      notify("error", "Plan update failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const deletePlan = async (planId) => {
    if (!selectedGroomerId || !confirmedGroomer) return;
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      setActionLoading(true);
      await axios.delete(`${API}/api/subscriptions/plans/${planId}`);
      if (editingPlanId === planId) {
        setEditingPlanId(null);
        setPlanForm(defaultPlanForm);
      }
      notify("info", "Subscription plan deleted.");
      await fetchPlans(selectedGroomerId);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      notify("error", "Plan deletion failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const subscribeToPlan = async (planId) => {
    if (!selectedGroomerId) return;

    if (!subscriberForm.subscriberName || !subscriberForm.subscriberPhone) {
      notify("error", "Please provide your name and phone number.");
      return;
    }

    if (subscriberForm.paymentMethod === "Bkash" && !subscriberForm.bkashNumber.trim()) {
      notify("error", "Please enter your bKash number.");
      return;
    }

    try {
      setActionLoading(true);
      const { data } = await axios.post(`${API}/api/subscriptions/subscribe`, {
        groomerId: selectedGroomerId,
        planId,
        subscriberName: subscriberForm.subscriberName,
        subscriberPhone: subscriberForm.subscriberPhone,
        subscriberEmail: subscriberForm.subscriberEmail,
        paymentMethod: subscriberForm.paymentMethod,
        bkashNumber: subscriberForm.paymentMethod === "Bkash" ? subscriberForm.bkashNumber : "",
        autoRenew: subscriberForm.paymentMethod === "COD" ? false : subscriberForm.autoRenew,
      });

      notify("success", data.message || "Subscription created! Welcome aboard.");
      setSubscriberForm((prev) => ({
        ...prev,
        subscriberName: "",
        subscriberPhone: "",
        subscriberEmail: "",
        bkashNumber: "",
      }));
      await fetchSubscriptions(selectedGroomerId, subscriberForm.subscriberPhone);
    } catch (error) {
      console.error("Failed to subscribe:", error);
      notify("error", error.response?.data?.error || "Subscription failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoRenew = async (subscriptionId, autoRenew) => {
    try {
      setActionLoading(true);
      await axios.put(`${API}/api/subscriptions/${subscriptionId}/auto-renew`, { autoRenew });
      notify("info", `Auto-renew ${autoRenew ? "enabled" : "disabled"}.`);
      await fetchSubscriptions(selectedGroomerId, subscriberForm.subscriberPhone);
    } catch (error) {
      console.error("Failed to update auto renew:", error);
      notify("error", "Could not update auto-renew.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to unsubscribe?")) return;
    try {
      setActionLoading(true);
      await axios.put(`${API}/api/subscriptions/${subscriptionId}/cancel`);
      notify("info", "Subscription cancelled.");
      await fetchSubscriptions(selectedGroomerId, subscriberForm.subscriberPhone);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      notify("error", "Cancellation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvoice = async (subscriptionId) => {
    try {
      setActionLoading(true);
      const { data } = await axios.get(`${API}/api/subscriptions/${subscriptionId}/invoice`);
      setInvoice(data.data);
      notify("success", `Invoice ${data.data.invoiceNumber} generated.`);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
      notify("error", "Invoice generation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReminder = async (subscriptionId) => {
    try {
      setActionLoading(true);
      await axios.post(`${API}/api/subscriptions/${subscriptionId}/reminder`);
      notify("info", "SMS reminder sent to customer.");
      await fetchSubscriptions(selectedGroomerId, subscriberForm.subscriberPhone);
    } catch (error) {
      console.error("Failed to send reminder:", error);
      notify("error", "Reminder failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !selectedGroomerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
        <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Page Header */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900" style={{ fontWeight: 800, fontSize: "clamp(1.25rem, 3vw, 1.75rem)", letterSpacing: "-0.02em" }}>
                Subscriptions
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Manage grooming plans for customers and groomers.</p>
            </div>
            {role && (
              <button
                onClick={resetPortal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Role Selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notice && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-top-2"
            style={{
              background: notice.type === "success" ? "#F0FDF4" : notice.type === "error" ? "#FFF1F2" : "#EFF6FF",
              borderColor: notice.type === "success" ? "#BBF7D0" : notice.type === "error" ? "#FECDD3" : "#BFDBFE",
              color: notice.type === "success" ? "#166534" : notice.type === "error" ? "#9F1239" : "#1E40AF",
            }}
          >
            {notice.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
              notice.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> :
                <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!role && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-slate-900 mb-2" style={{ fontWeight: 700, fontSize: "1.35rem" }}>Who are you?</h2>
              <p className="text-slate-500 text-sm">Select your role to access the right subscription experience.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RoleCard
                icon={<User className="w-7 h-7" />}
                title="I'm a Customer"
                subtitle="Browse and subscribe to grooming plans"
                color="#0D9488"
                bg="#CCFBF1"
                onClick={() => handleRoleSelect("customer")}
                bullets={["Browse groomer plans", "Subscribe online", "Manage & view invoices"]}
              />
              <RoleCard
                icon={<Scissors className="w-7 h-7" />}
                title="I'm a Groomer"
                subtitle="Create and manage your subscription plans"
                color="#7C3AED"
                bg="#EDE9FE"
                onClick={() => handleRoleSelect("groomer")}
                bullets={["Create subscription plans", "Edit & delete plans", "Track your offerings"]}
              />
            </div>
          </div>
        )}

        {role === "customer" && (
          <div className="space-y-7">
            {/* Select Groomer */}
            <Section title="Select Your Groomer" subtitle="Choose a groomer to see their available subscription plans.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {groomers.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => setSelectedGroomerId(g._id)}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all active:scale-95"
                    style={{
                      borderColor: selectedGroomerId === g._id ? "#0D9488" : "#E2E8F0",
                      background: selectedGroomerId === g._id ? "#F0FDFA" : "white",
                      boxShadow: selectedGroomerId === g._id ? "0 0 0 3px #CCFBF1" : "none",
                    }}
                  >
                    <ImageWithFallback src={getGroomerAvatar(g)} alt={g.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 700 }}>{g.name}</p>
                      <p className="text-slate-400 text-xs truncate">{g.address || "Location not specified"}</p>
                      {selectedGroomerId === g._id && (
                        <span className="text-xs font-semibold" style={{ color: "#0D9488" }}>✓ Selected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Available Plans */}
            {selectedGroomerId && (
              <Section title={`Plans by ${selectedGroomer?.name}`} subtitle="Choose a plan and fill in your details to subscribe.">
                {plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                      <FileText className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm max-w-xs">This groomer has no active plans right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {plans.map((plan) => (
                      <PlanSubscribeCard
                        key={plan._id}
                        plan={plan}
                        subscriberForm={subscriberForm}
                        handleSubscriberChange={handleSubscriberChange}
                        onSubscribe={() => subscribeToPlan(plan._id)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Active Subscriptions */}
            {subscriptions.length > 0 && (
              <Section title="Active Subscriptions" subtitle="Your current grooming subscriptions.">
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <ActiveSubCard
                      key={sub._id}
                      sub={sub}
                      onAutoRenew={() => handleAutoRenew(sub._id, !sub.autoRenew)}
                      onCancel={() => handleCancel(sub._id)}
                      onInvoice={() => handleInvoice(sub._id)}
                      onReminder={() => handleReminder(sub._id)}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Invoice Detail */}
            {invoice && (
              <Section title="Latest Invoice" subtitle={`Invoice #${invoice.invoiceNumber} details`}>
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-slate-400 text-xs">Customer</p><p className="text-slate-700 text-sm font-bold">{invoice.customerName}</p></div>
                    <div><p className="text-slate-400 text-xs">Plan</p><p className="text-slate-700 text-sm font-bold">{invoice.planTitle}</p></div>
                    <div><p className="text-slate-400 text-xs">Amount</p><p className="text-teal-700 text-sm font-bold">৳{invoice.amount.toLocaleString()}</p></div>
                    <div><p className="text-slate-400 text-xs">Next Billing</p><p className="text-slate-700 text-sm font-bold">{new Date(invoice.nextBillingDate).toLocaleDateString()}</p></div>
                  </div>
                </div>
              </Section>
            )}
          </div>
        )}

        {role === "groomer" && (
          <div className="space-y-7">
            {/* Confirm Profile */}
            <Section title="Your Groomer Profile" subtitle="Select and confirm your account before managing plans.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {groomers.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => { setSelectedGroomerId(g._id); setConfirmedGroomer(false); }}
                    disabled={confirmedGroomer && selectedGroomerId !== g._id}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all active:scale-95 disabled:opacity-40"
                    style={{
                      borderColor: selectedGroomerId === g._id ? "#7C3AED" : "#E2E8F0",
                      background: selectedGroomerId === g._id ? "#FAF5FF" : "white",
                    }}
                  >
                    <ImageWithFallback src={getGroomerAvatar(g)} alt={g.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 700 }}>{g.name}</p>
                      <p className="text-slate-400 text-xs truncate">{g.address || "Location not specified"}</p>
                    </div>
                  </button>
                ))}
              </div>
              {!confirmedGroomer ? (
                <button
                  onClick={() => { if (selectedGroomerId) { setConfirmedGroomer(true); notify("success", `Account confirmed as ${selectedGroomer?.name}.`); } }}
                  disabled={!selectedGroomerId}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "#7C3AED" }}
                >
                  Confirm — This is My Account
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <CheckCircle className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-violet-800 text-sm font-semibold">Account confirmed as {selectedGroomer?.name}</p>
                    <p className="text-violet-500 text-xs">You can now create and manage subscription plans.</p>
                  </div>
                  <button onClick={() => setConfirmedGroomer(false)} className="ml-auto text-violet-400 hover:text-violet-600">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </Section>

            {/* Plan Form */}
            {confirmedGroomer && (
              <Section title={editingPlanId ? "Update Plan" : "Create Subscription Plan"} subtitle="Define the plan details your customers will see.">
                <form onSubmit={editingPlanId ? updatePlan : createPlan} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Plan Title *</label>
                    <input name="title" value={planForm.title} onChange={handlePlanChange} placeholder="e.g. Monthly Care Plan" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 transition-all text-sm" required />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Price (৳) *</label>
                    <input name="price" type="number" value={planForm.price} onChange={handlePlanChange} placeholder="e.g. 2800" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 transition-all text-sm" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Description *</label>
                    <textarea name="description" value={planForm.description} onChange={handlePlanChange} rows={2} placeholder="Briefly describe what this plan offers..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 transition-all text-sm resize-none" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Benefits (one per line) *</label>
                    <textarea name="benefits" value={planForm.benefits} onChange={handlePlanChange} rows={3} placeholder={"2 grooming sessions/month\nFree nail trims\nPriority booking"} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 transition-all text-sm resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 transition-all active:scale-95 disabled:opacity-50">
                      {editingPlanId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingPlanId ? "Update Plan" : "Create Plan"}
                    </button>
                    {editingPlanId && (
                      <button type="button" onClick={cancelEditPlan} className="px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                    )}
                  </div>
                </form>
              </Section>
            )}

            {/* List Plans */}
            {confirmedGroomer && (
              <Section title="Your Active Plans" subtitle={`${plans.length} plans currently listed for subscribers.`}>
                {plans.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-400 text-sm">You haven't created any plans yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <div key={plan._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-slate-900" style={{ fontWeight: 700 }}>{plan.title}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-violet-50 text-violet-700">{plan.billingCycle}</span>
                            </div>
                            <p className="text-slate-500 text-xs mb-3">{plan.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {plan.benefits?.map((b, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-violet-50 text-violet-700 font-medium">{b}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#7C3AED" }}>৳{plan.price?.toLocaleString()}</span>
                            <div className="flex gap-2">
                              <button onClick={() => startEditPlan(plan)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-violet-100 text-violet-600 hover:bg-violet-50"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                              <button onClick={() => deletePlan(plan._id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.05rem" }}>{title}</h2>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function RoleCard({ icon, title, subtitle, color, bg, onClick, bullets }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-7 rounded-2xl bg-white border-2 border-transparent hover:border-current shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:scale-95 w-full"
      style={{ borderColor: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: bg, color }}>
        {icon}
      </div>
      <h3 className="text-slate-900 mb-1" style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
      <p className="text-slate-500 text-xs mb-4">{subtitle}</p>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-slate-600">
            <Check className="w-3.5 h-3.5 shrink-0" style={{ color }} />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
        Continue <ChevronLeft className="w-4 h-4 rotate-180" />
      </div>
    </button>
  );
}

function PlanSubscribeCard({ plan, subscriberForm, handleSubscriberChange, onSubscribe, actionLoading }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1rem" }}>{plan.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">
              {plan.billingCycle}
            </span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0D9488" }}>
            ৳{plan.price?.toLocaleString()}
          </span>
        </div>
        <p className="text-slate-500 text-xs mb-3 leading-relaxed">{plan.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {plan.benefits?.map((b, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-teal-50 text-teal-700 font-medium">{b}</span>
          ))}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
          style={{ background: expanded ? "#94A3B8" : "linear-gradient(135deg, #0D9488, #14B8A6)" }}
        >
          {expanded ? "Close" : "Subscribe to This Plan"}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Full Name</label>
              <input name="subscriberName" value={subscriberForm.subscriberName} onChange={handleSubscriberChange} className="w-full px-3 py-2 rounded-lg border text-sm focus:border-teal-400 outline-none" placeholder="Sakib Al Hasan" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Phone</label>
              <input name="subscriberPhone" value={subscriberForm.subscriberPhone} onChange={handleSubscriberChange} className="w-full px-3 py-2 rounded-lg border text-sm focus:border-teal-400 outline-none" placeholder="01XXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSubscriberChange({ target: { name: "paymentMethod", value: opt.id } })}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${subscriberForm.paymentMethod === opt.id ? "bg-teal-50 border-teal-600 text-teal-700" : "bg-white border-slate-100 text-slate-500"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {subscriberForm.paymentMethod === "Bkash" && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">bKash Number</label>
              <input name="bkashNumber" value={subscriberForm.bkashNumber} onChange={handleSubscriberChange} className="w-full px-3 py-2 rounded-lg border text-sm focus:border-teal-400 outline-none" placeholder="01XXXXXXXXX" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="autoRenew" checked={subscriberForm.autoRenew} onChange={handleSubscriberChange} disabled={subscriberForm.paymentMethod === "COD"} />
            <span className="text-xs text-slate-600">Enable Auto-Renew {subscriberForm.paymentMethod === "COD" && "(Unavailable for COD)"}</span>
          </label>
          <button onClick={onSubscribe} disabled={actionLoading} className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 transition-all active:scale-95 shadow-md shadow-teal-100">
            {actionLoading ? "Processing..." : "Confirm Subscription"}
          </button>
        </div>
      )}
    </div>
  );
}

function ActiveSubCard({ sub, onAutoRenew, onCancel, onInvoice, onReminder, actionLoading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-teal-600">Active</span>
            <h3 className="text-slate-900" style={{ fontWeight: 700 }}>{sub.planId?.title || "Plan"}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            <div><p className="text-slate-400 text-xs">Subscriber</p><p className="text-slate-700 text-sm font-medium">{sub.subscriberName}</p></div>
            <div><p className="text-slate-400 text-xs">Phone</p><p className="text-slate-700 text-sm font-medium">{sub.subscriberPhone}</p></div>
            <div><p className="text-slate-400 text-xs">Payment</p><p className="text-slate-700 text-sm font-medium">{sub.paymentMethod}{sub.bkashNumber ? ` (${sub.bkashNumber})` : ""}</p></div>
            <div><p className="text-slate-400 text-xs">Invoice #</p><p className="text-slate-700 text-sm font-medium">{sub.invoiceNumber}</p></div>
            <div><p className="text-slate-400 text-xs">Next Billing</p><p className="text-slate-700 text-sm font-medium">{new Date(sub.nextBillingDate).toLocaleDateString()}</p></div>
            <div><p className="text-slate-400 text-xs">Auto-Renew</p><p className="text-slate-700 text-sm font-medium">{sub.autoRenew ? "Enabled" : "Disabled"}</p></div>
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button onClick={onInvoice} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"><FileText className="w-3.5 h-3.5" /> Invoice</button>
          <button onClick={onReminder} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-100 text-blue-600 hover:bg-blue-50"><Bell className="w-3.5 h-3.5" /> Reminder</button>
          <button onClick={onAutoRenew} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" /> {sub.autoRenew ? "Disable Auto" : "Enable Auto"}</button>
          <button onClick={onCancel} disabled={actionLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-100 text-red-500 hover:bg-red-50"><X className="w-3.5 h-3.5" /> Unsubscribe</button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionHub;

