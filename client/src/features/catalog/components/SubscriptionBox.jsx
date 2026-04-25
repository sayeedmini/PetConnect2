import { useEffect, useState } from 'react';
import { getSubscriptionPlans, createSubscription, getUserSubscription, cancelSubscription } from '../services/catalogApi';
import { getUser } from '../../auth/utils/auth';

function SubscriptionBox() {
    const [plans, setPlans] = useState([]);
    const [mySubscription, setMySubscription] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [address, setAddress] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: ''
    });

    const currentUser = getUser();
    const userEmail = currentUser?.email || 'test@user.com';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const plansData = await getSubscriptionPlans();
        if (plansData.success) {
            setPlans(plansData.plans);
        }
        
        const subData = await getUserSubscription(userEmail);
        if (subData.success && subData.subscription) {
            setMySubscription(subData.subscription);
        } else {
            setMySubscription(null);
        }
        setLoading(false);
    };

    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
        setShowAddressForm(true);
    };

    const handleSubscribe = async () => {
        if (!selectedPlan) {
            alert('Please select a plan');
            return;
        }
        if (!address.fullName || !address.phone || !address.address) {
            alert('Please fill delivery address');
            return;
        }

        const result = await createSubscription({
            userEmail,
            planId: selectedPlan,
            deliveryAddress: address,
            paymentMethod: 'bKash'
        });

        if (result.success) {
            alert('🎉 Subscription created successfully!');
            setShowAddressForm(false);
            setSelectedPlan(null);
            setAddress({ fullName: '', phone: '', address: '', city: '' });
            loadData();
        } else {
            alert('Failed to create subscription: ' + (result.message || 'Unknown error'));
        }
    };

    const handleCancelSubscription = async () => {
        const result = await cancelSubscription(mySubscription._id);
        
        if (result.success) {
            alert('❌ Subscription cancelled successfully! You can now subscribe to a new plan.');
            setShowCancelConfirm(false);
            loadData();
        } else {
            alert('Failed to cancel subscription');
        }
    };

    const handleCancel = () => {
        setShowAddressForm(false);
        setSelectedPlan(null);
        setAddress({ fullName: '', phone: '', address: '', city: '' });
    };

    const selectedPlanDetails = plans.find(p => p._id === selectedPlan);

    if (loading) return <div className="text-center py-5"><h4>Loading...</h4></div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">📦 Pet Subscription Box</h2>
            
            {/* Active Subscription Card with Cancel Button */}
            {mySubscription && (
                <div className="card mb-4 bg-success text-white">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h4>Your Active Subscription</h4>
                                <p><strong>Plan:</strong> {mySubscription.planId?.name}</p>
                                <p><strong>Status:</strong> {mySubscription.status}</p>
                                <p><strong>Start Date:</strong> {new Date(mySubscription.startDate).toLocaleDateString()}</p>
                                <p><strong>Next Billing:</strong> {mySubscription.nextBillingDate ? new Date(mySubscription.nextBillingDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <button 
                                className="btn btn-danger btn-lg"
                                onClick={() => setShowCancelConfirm(true)}
                            >
                                ❌ Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="card mb-4 p-3" style={{ backgroundColor: '#fff3cd', border: '2px solid #ffc107' }}>
                    <h4 className="text-warning">⚠️ Confirm Cancellation</h4>
                    <p>Are you sure you want to cancel your <strong>{mySubscription?.planId?.name}</strong> subscription?</p>
                    <p>You will lose access to all subscription benefits immediately.</p>
                    <div>
                        <button className="btn btn-danger" onClick={handleCancelSubscription}>
                            Yes, Cancel My Subscription
                        </button>
                        <button className="btn btn-secondary ms-2" onClick={() => setShowCancelConfirm(false)}>
                            No, Keep It
                        </button>
                    </div>
                </div>
            )}

            {/* Available Plans - Only show if no active subscription */}
            {!mySubscription && (
                <>
                    <h4 className="mb-3">Available Plans</h4>
                    <div className="row">
                        {plans.map(plan => (
                            <div key={plan._id} className="col-md-4 mb-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{plan.name}</h5>
                                        <h6 className="text-primary">${plan.price}/{plan.duration}</h6>
                                        <p className="card-text">{plan.description}</p>
                                        <button 
                                            className="btn btn-primary w-100"
                                            onClick={() => handleSelectPlan(plan._id)}
                                        >
                                            Select Plan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Message when user has active subscription */}
            {mySubscription && !showCancelConfirm && (
                <div className="alert alert-info mt-3">
                    ℹ️ You have an active subscription. Cancel it first to choose a different plan.
                </div>
            )}

            {/* Address Form */}
            {showAddressForm && selectedPlanDetails && (
                <div className="card mt-4 p-3" style={{ backgroundColor: '#f8f9fa', border: '2px solid #007bff' }}>
                    <h4 className="text-primary">Complete Your Subscription</h4>
                    <p><strong>Selected Plan:</strong> {selectedPlanDetails.name} - ${selectedPlanDetails.price}/{selectedPlanDetails.duration}</p>
                    <hr />
                    <h5>Delivery Address</h5>
                    <div className="row">
                        <div className="col-md-6 mb-2">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Full Name *"
                                value={address.fullName}
                                onChange={(e) => setAddress({...address, fullName: e.target.value})}
                            />
                        </div>
                        <div className="col-md-6 mb-2">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Phone Number *"
                                value={address.phone}
                                onChange={(e) => setAddress({...address, phone: e.target.value})}
                            />
                        </div>
                        <div className="col-md-8 mb-2">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Street Address *"
                                value={address.address}
                                onChange={(e) => setAddress({...address, address: e.target.value})}
                            />
                        </div>
                        <div className="col-md-4 mb-2">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="City *"
                                value={address.city}
                                onChange={(e) => setAddress({...address, city: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <button className="btn btn-success" onClick={handleSubscribe}>
                            ✅ Confirm Subscription
                        </button>
                        <button className="btn btn-secondary ms-2" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubscriptionBox;