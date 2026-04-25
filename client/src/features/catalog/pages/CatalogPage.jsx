import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster, toast } from 'react-hot-toast';
import SubscriptionBox from '../components/SubscriptionBox';
import BreedVerification from '../components/BreedVerification';
import { getUser } from '../../auth/utils/auth';

function CatalogPage() {
    const [activeMainTab, setActiveMainTab] = useState('products');
    
    // Products states
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [showCart, setShowCart] = useState(false);
    const [cart, setCart] = useState({ items: [], subtotal: 0 });
    const [showOrders, setShowOrders] = useState(false);
    const [orders, setOrders] = useState([]);
    
    // Filter states
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [filters, setFilters] = useState({
        category: '',
        brand: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        search: ''
    });
    
    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState('bkash');

    const currentUser = getUser();
    const userEmail = currentUser?.email || 'test@user.com';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Fetch products with filters
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.brand) params.append('brand', filters.brand);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.minRating) params.append('minRating', filters.minRating);
            if (filters.search) params.append('search', filters.search);
            
            const response = await fetch(`${API_URL}/products?${params}`);
            const data = await response.json();
            setProducts(data.products || []);
            if (data.categories) setCategories(data.categories);
            if (data.brands) setBrands(data.brands);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // Fetch cart
    const fetchCart = async () => {
        try {
            const response = await fetch(`${API_URL}/cart/${userEmail}`);
            const data = await response.json();
            setCart({ items: data.cart?.items || [], subtotal: data.subtotal || 0 });
            setCartCount(data.cart?.items?.length || 0);
        } catch (error) {
            console.error('Failed to fetch cart', error);
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/orders/${userEmail}`);
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        }
    };

    // Add to cart
    const addToCart = async (productId) => {
        try {
            const response = await fetch(`${API_URL}/cart/${userEmail}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 })
            });
            if (response.ok) {
                toast.success('Added to cart!');
                fetchCart();
            }
        } catch (error) {
            toast.error('Failed to add to cart');
        }
    };

    // Remove from cart
    const removeFromCart = async (itemId) => {
        try {
            const response = await fetch(`${API_URL}/cart/${userEmail}/remove/${itemId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success('Removed from cart');
                fetchCart();
            }
        } catch (error) {
            toast.error('Failed to remove');
        }
    };

    // Apply coupon
    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Enter a coupon code');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, subtotal: cart.subtotal })
            });
            const data = await response.json();
            
            if (data.success) {
                setCouponDiscount(data.coupon.discountAmount);
                setAppliedCoupon(data.coupon);
                toast.success(`Coupon applied! Saved ৳${data.coupon.discountAmount}`);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Invalid coupon');
        }
    };

    // Create order
    const createOrder = async () => {
        const paymentMethodNames = {
            bkash: 'bKash',
            sslcommerz: 'SSLCommerz',
            cod: 'Cash on Delivery'
        };
        
        const shippingAddress = {
            fullName: 'Test User',
            phone: '01712345678',
            address: '123 Pet Street, Dhaka',
            city: 'Dhaka'
        };

        try {
            const response = await fetch(`${API_URL}/orders/${userEmail}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    shippingAddress, 
                    paymentMethod: paymentMethodNames[selectedPayment],
                    couponDiscount 
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Order placed via ${paymentMethodNames[selectedPayment]}! ID: ${data.order.orderId}`);
                setShowCart(false);
                setCouponDiscount(0);
                setAppliedCoupon(null);
                setCouponCode('');
                fetchCart();
                fetchOrders();
            }
        } catch (error) {
            toast.error('Failed to create order');
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            category: '',
            brand: '',
            minPrice: '',
            maxPrice: '',
            minRating: '',
            search: ''
        });
    };

    // Go to Home (close cart and orders)
    const goToHome = () => {
        setShowCart(false);
        setShowOrders(false);
    };

    // Toggle functions
    const toggleCart = () => {
        setShowCart(!showCart);
        setShowOrders(false);
    };

    const toggleOrders = () => {
        setShowOrders(!showOrders);
        setShowCart(false);
    };

    useEffect(() => {
        if (activeMainTab === 'products') {
            fetchProducts();
            fetchCart();
            fetchOrders();
        }
    }, [filters, activeMainTab]);

    const totalAmount = Math.max(0, (cart.subtotal || 0) - couponDiscount);

    // Render stars
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    };

    return (
        <div className="container mt-4"
          style={{
            background: "linear-gradient(to bottom right, #eef2f7, #e2e8f0)",
            padding: "20px",
            borderRadius: "16px"
  }}
        >
            <Toaster />
            
            {/* Main Navigation Tabs */}
            <nav className="navbar navbar-dark bg-primary rounded mb-4 p-3"
              style={{
                background: "linear-gradient(135deg, rgba(95,90,162,0.9), rgba(47,111,143,0.9))",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                borderRadius: "16px"
  }}
            >
                <div className="container-fluid">
                    <span className="navbar-brand h1">🐾 PetConnect</span>
                    <div>
                        <button 
                        style={{
                            borderRadius: "10px",
                            padding: "6px 14px",
                            fontWeight: "500"
                            }}
                            className={`btn me-2 ${activeMainTab === 'products' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setActiveMainTab('products')}
                        >
                            🛍️ Products
                        </button>
                        <button 
                        style={{
                            borderRadius: "10px",
                            padding: "6px 14px",
                            fontWeight: "500"
                            }}
                            className={`btn me-2 ${activeMainTab === 'subscription' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setActiveMainTab('subscription')}
                        >
                            📦 Subscription Box
                        </button>
                        <button 
                        style={{
                            borderRadius: "10px",
                            padding: "6px 14px",
                            fontWeight: "500"
                            }}
                            className={`btn ${activeMainTab === 'verification' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setActiveMainTab('verification')}
                        >
                            🐕 Breed Verification
                        </button>
                    </div>
                </div>
            </nav>

            {/* Products Tab */}
            {activeMainTab === 'products' && (
                <>
                    {/* Header for Products */}
                    <nav className="navbar rounded mb-4 p-2"
                      style={{
                        background: "#6ba6d6",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    >
                        <div className="container-fluid">
                            <span className="navbar-brand small">Product Catalog</span>
                            <div>
                                <button className="btn btn-sm btn-light me-2" onClick={toggleCart}>
                                    🛒 Cart ({cartCount})
                                </button>
                                <button className="btn btn-sm btn-light" onClick={toggleOrders}>
                                    📦 Orders ({orders.length})
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Cart Section */}
                    {showCart && (
                        <div className="card mb-4 p-4"
                            style={{
                                borderRadius: "16px",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                                border: "none"
                            }}
                             >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4>🛒 Your Shopping Cart</h4>
                                <button className="btn btn-secondary" onClick={goToHome}>
                                    ← Back to Products
                                </button>
                            </div>
                            {cart.items?.length === 0 ? (
                                <p>Your cart is empty. Add some products!</p>
                            ) : (
                                <>
                                    {cart.items.map((item, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                                            <div>
                                                <strong>{item.product?.name}</strong>
                                                <br />
                                                <small>৳{item.priceAtAdd} x {item.quantity}</small>
                                            </div>
                                            <div>
                                                <strong>৳{(item.priceAtAdd * item.quantity).toFixed(2)}</strong>
                                                <button className="btn btn-danger btn-sm ms-3" onClick={() => removeFromCart(item._id)}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <div className="input-group">
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    style={{ borderRadius: "10px" }}
                                                    placeholder="Coupon Code (SAVE10, SAVE20, FLAT50)"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                />
                                                <button className="btn btn-outline-primary" onClick={applyCoupon}>
                                                    Apply Coupon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {appliedCoupon && (
                                        <div className="alert alert-success mt-2">
                                            ✅ Coupon {appliedCoupon.code} applied! Saved ৳{couponDiscount}
                                        </div>
                                    )}
                                    
                                    <div className="text-end mt-3">
                                        <h6>Subtotal: ৳{cart.subtotal?.toFixed(2) || 0}</h6>
                                        {couponDiscount > 0 && <h6 className="text-success">Discount: -৳{couponDiscount.toFixed(2)}</h6>}
                                        <h4>Total: ৳{totalAmount.toFixed(2)}</h4>
                                    </div>

                                    <div className="mt-3 p-3 border rounded bg-light">
                                        <h5>💳 Select Payment Method</h5>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-check mb-2">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        name="paymentMethod" 
                                                        id="bkash" 
                                                        value="bkash"
                                                        checked={selectedPayment === 'bkash'}
                                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="bkash">
                                                        📱 bKash
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-check mb-2">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        name="paymentMethod" 
                                                        id="sslcommerz" 
                                                        value="sslcommerz"
                                                        checked={selectedPayment === 'sslcommerz'}
                                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="sslcommerz">
                                                        💳 SSLCommerz
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-check mb-2">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        name="paymentMethod" 
                                                        id="cod" 
                                                        value="cod"
                                                        checked={selectedPayment === 'cod'}
                                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                                    />
                                                    <label className="form-check-label" htmlFor="cod">
                                                        💵 Cash on Delivery
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-end mt-3">
                                        <button className="btn btn-success btn-lg" onClick={createOrder}>
                                            ✅ Place Order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Orders Section */}
                    {showOrders && (
                        <div className="card mb-4 p-3"
                            style={{
                                background: "rgba(255,255,255,0.7)",
                                backdropFilter: "blur(6px)",
                                borderRadius: "16px",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                border: "1px solid rgba(255,255,255,0.4)"
                            }}                      
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4>📦 Your Orders</h4>
                                <button className="btn btn-secondary" onClick={goToHome}>
                                    ← Back to Products
                                </button>
                            </div>
                            {orders.length === 0 ? (
                                <p>No orders yet. Add items to cart and place an order!</p>
                            ) : (
                                orders.map((order) => (
                                    <div key={order._id} className="border-bottom pb-3 mb-3">
                                        <div className="d-flex justify-content-between">
                                            <strong>Order ID: {order.orderId}</strong>
                                            <span className={`badge bg-${order.status === 'Pending' ? 'warning' : order.status === 'Shipped' ? 'info' : 'success'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between mt-1">
                                            <small>Payment: {order.paymentMethod || 'bKash'}</small>
                                            <small>Total: ৳{order.total?.toFixed(2)}</small>
                                        </div>
                                        <small className="d-block text-muted">{new Date(order.createdAt).toLocaleDateString()}</small>
                                        
                                        <div className="mt-2">
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div className="progress-bar bg-success" style={{ 
                                                    width: order.status === 'Pending' ? '25%' : 
                                                           order.status === 'Confirmed' ? '50%' : 
                                                           order.status === 'Shipped' ? '75%' : '100%' 
                                                }}></div>
                                            </div>
                                            <div className="d-flex justify-content-between small mt-1">
                                                <span>📦 Pending</span>
                                                <span>✅ Confirmed</span>
                                                <span>🚚 Shipped</span>
                                                <span>🏠 Delivered</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Product Catalog Section */}
                    {!showCart && !showOrders && (
                        <>
                            <div className="card mb-4 p-3">
                                <h4 className="mb-3">🐕 Product Catalog</h4>
                                
                                <div className="mb-3">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-lg" 
                                        style={{
                                            borderRadius: "12px",
                                            border: "1px solid #7896d7"
                                            }}
                                        placeholder="🔍 Search products..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    />
                                </div>
                                
                                <div className="row"
                                    style={{
                                        background: "#ffffff",
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "1px solid #f1f5f9"
                                    }}
                                >
                                    <div className="col-md-3 mb-2">
                                        <label className="form-label">Category</label>
                                        <select 
                                            className="form-select" 
                                            style={{ borderRadius: "10px" }}
                                            value={filters.category} 
                                            onChange={(e) => setFilters({...filters, category: e.target.value})}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-3 mb-2">
                                        <label className="form-label">Brand</label>
                                        <select 
                                            className="form-select" 
                                            style={{ borderRadius: "10px" }}
                                            value={filters.brand} 
                                            onChange={(e) => setFilters({...filters, brand: e.target.value})}
                                        >
                                            <option value="">All Brands</option>
                                            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2 mb-2">
                                        <label className="form-label">Min Price</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            style={{ borderRadius: "10px" }} 
                                            placeholder="Min"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-2 mb-2">
                                        <label className="form-label">Max Price</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            style={{ borderRadius: "10px" }}
                                            placeholder="Max"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-2 mb-2">
                                        <label className="form-label">Min Rating</label>
                                        <select 
                                            className="form-select" 
                                            style={{ borderRadius: "10px" }}
                                            value={filters.minRating} 
                                            onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                                        >
                                            <option value="">Any Rating</option>
                                            <option value="4">4★ & above</option>
                                            <option value="3">3★ & above</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <button className="btn btn-outline-secondary" onClick={resetFilters}>
                                        🗑️ Clear All Filters
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-5"><h4>Loading products...</h4></div>
                            ) : products.length === 0 ? (
                                <div className="alert alert-info text-center">No products found.</div>
                            ) : (
                                <div className="row">
                                    {products.map((product) => (
                                        <div key={product._id} className="col-md-3 mb-4">
                                            <div className="card h-100 shadow-sm"
                                                style={{
                                                    background: "#ffffff",
                                                    borderRadius: "16px",
                                                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                                    border: "1px solid #f1f5f9",
                                                    transition: "all 0.25s ease"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "translateY(-6px)";
                                                    e.currentTarget.style.boxShadow = "0 16px 35px rgba(0,0,0,0.12)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
                                                }}                                            
                                            >
                                                <div className="card-body">
                                                    <span 
                                                      className="badge mb-2"
                                                        style={{
                                                            background: "#e0f2fe",
                                                            color: "#0284c7",
                                                            borderRadius: "8px"
                                                        }}
                                                    >{product.category}</span>
                                                    <h5 className="card-title">{product.name}</h5>
                                                    <p className="card-text text-muted small">{product.brand}</p>
                                                    <div className="mb-2">
                                                        <span className="text-warning">{renderStars(product.ratings?.average || 0)}</span>
                                                        <small className="text-muted ms-1">({product.ratings?.count || 0})</small>
                                                    </div>
                                                    <p className="card-text">
                                                        {product.discount > 0 && <span className="text-danger me-2">-{product.discount}%</span>}
                                                        <strong className="h5 text-primary">৳{product.price}</strong>
                                                    </p>
                                                    <button 
                                                        className="btn w-100 mt-2 text-white"
                                                        style={{
                                                        background: "linear-gradient(135deg, #5f5aa2, #2f6f8f)",
                                                        border: "none",
                                                        borderRadius: "10px",
                                                        fontWeight: "500"
                                                        }}
                                                        onClick={() => addToCart(product._id)}
                                                        disabled={product.stock === 0}
                                                    >
                                                        🛒 Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Subscription Tab */}
            {activeMainTab === 'subscription' && <SubscriptionBox />}

            {/* Breed Verification Tab */}
            {activeMainTab === 'verification' && <BreedVerification />}
        </div>
    );
}


export default CatalogPage;
