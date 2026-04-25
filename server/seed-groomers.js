const mongoose = require("mongoose"); // MongoDB object modeling tool
require("dotenv").config(); // Load environment variables (like MONGO_URI)

// Import the Mongoose models we need to interact with the database
const Groomer = require("./src/models/Groomer");
const Booking = require("./src/models/Booking");
const SubscriptionPlan = require("./src/models/SubscriptionPlan");
const Subscription = require("./src/models/Subscription");

/**
 * Main seeding function to reset and populate the database with demo data
 */
const seedDB = async () => {
  try {
    // 1. Connect to the database using the URI from our .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // 2. Clear existing data to ensure a clean slate for every seed run
    await Groomer.deleteMany(); // Deletes all groomer records
    await Booking.deleteMany(); // Deletes all booking records
    await SubscriptionPlan.deleteMany(); // Deletes all subscription plan definitions
    await Subscription.deleteMany(); // Deletes all active subscriber records

    // 3. Insert fresh Groomer data with precise Dhaka coordinates for the map
    const groomers = await Groomer.insertMany([
      {
        name: "Sarah's Pet Spa",
        email: "sarah@petconnect.com",
        experience: "5 Years",
        rating: 4.9,
        reviewCount: 128,
        services: ["Bath & Brush", "Nail Trimming", "Ear Cleaning"],
        pricing: [{ packageName: "Basic Bath", price: 40, description: "Includes bath, brush out, and ear cleaning" }],
        // GeoJSON format: [longitude, latitude]. Essential for proximity search and tracking.
        location: { type: "Point", coordinates: [90.4152, 23.8161] },
        address: "Located in Gulshan 2, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "The Bark Butler",
        email: "barkbutler@petconnect.com",
        experience: "8 Years",
        rating: 4.8,
        reviewCount: 96,
        services: ["Full Grooming", "Teeth Brushing", "De-Shedding"],
        pricing: [{ packageName: "Full Works", price: 85, description: "Everything your pet needs." }],
        location: { type: "Point", coordinates: [90.4066, 23.7937] },
        address: "Located in Banani, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "Paws & Relax Grooming",
        email: "paws@petconnect.com",
        experience: "3 Years",
        rating: 4.7,
        reviewCount: 74,
        services: ["Flea Treatment", "Nail Trimming", "Bath & Brush"],
        pricing: [{ packageName: "Flea & Tick Combo", price: 60, description: "Flea removal and bath." }],
        location: { type: "Point", coordinates: [90.3881, 23.8724] },
        address: "Located in Uttara Sector 4, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "Dapper Dog Salon",
        email: "dapper@petconnect.com",
        experience: "10 Years",
        rating: 4.9,
        reviewCount: 211,
        services: ["Full Grooming", "Creative Styling", "Nail Trimming"],
        pricing: [
          { packageName: "Show Dog Prep", price: 120, description: "Get ready for the runway." },
          { packageName: "Standard Trim", price: 65, description: "Basic trim and styling." },
        ],
        location: { type: "Point", coordinates: [90.3742, 23.7461] },
        address: "Located in Dhanmondi 27, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1514984879728-be0aff75a6e8?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1518887499460-71d222eed89d?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "Squeaky Clean Pets",
        email: "squeaky@petconnect.com",
        experience: "2 Years",
        rating: 4.6,
        reviewCount: 53,
        services: ["Bath & Brush", "Ear Cleaning"],
        pricing: [{ packageName: "Puppy Intro", price: 30, description: "A gentle first bath experience." }],
        location: { type: "Point", coordinates: [90.3900, 23.7562] },
        address: "Located in Farmgate, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "Fluff & Puff Mobile",
        email: "fluff@petconnect.com",
        experience: "7 Years",
        rating: 4.8,
        reviewCount: 102,
        services: ["Full Grooming", "Bath & Brush", "Nail Trimming", "De-Shedding"],
        pricing: [{ packageName: "Mobile Full Service", price: 95, description: "We bring the salon to you!" }],
        location: { type: "Point", coordinates: [90.4126, 23.7231] },
        address: "Located in Gulistan, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1518288774672-b94e808873ff?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=500&auto=format&fit=crop&q=60",
        ],
      },
      {
        name: "Luxury Paw Spa",
        email: "luxury@petconnect.com",
        experience: "15 Years",
        rating: 5.0,
        reviewCount: 304,
        services: ["Bath & Brush", "Full Grooming", "Spa Massage"],
        pricing: [{ packageName: "Pampered Pooch", price: 150, description: "The absolute royal treatment." }],
        location: { type: "Point", coordinates: [90.4131, 23.7925] },
        address: "Located in Gulshan 1, Dhaka",
        portfolioImages: [
          "https://images.unsplash.com/photo-1522276498395-f4f68f7f8454?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1600256895807-f388c8066799?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1522858547137-f1dcec554f55?w=500&auto=format&fit=crop&q=60",
        ],
      },
    ]);

    // 4. Create Subscription Plans linked to specific groomers
    const subscriptionPlans = [
      {
        groomerId: groomers[0]._id, // Link to Sarah's Pet Spa
        title: "Starter Grooming Plan",
        price: 399,
        billingCycle: "Monthly",
        description: "A budget-friendly plan for regular bath, brush, and light hygiene care.",
        benefits: ["Priority booking", "Monthly bath reminder", "Free ear check"],
      },
      {
        groomerId: groomers[1]._id, // Link to The Bark Butler
        title: "Premium Bark Care",
        price: 599,
        billingCycle: "Monthly",
        description: "Premium grooming support for dogs that need styling, de-shedding, and dental care.",
        benefits: ["De-shedding care", "Style refresh", "Invoice every month"],
      },
      {
        groomerId: groomers[2]._id,
        title: "Family Pet Plan",
        price: 459,
        billingCycle: "Monthly",
        description: "Great for households with cats, birds, or small pets that need recurring care.",
        benefits: ["Pet reminders", "Flexible renewal", "SMS alerts"],
      },
      {
        groomerId: groomers[3]._id,
        title: "Show Groom Membership",
        price: 749,
        billingCycle: "Monthly",
        description: "For pets that need a polished look and regular maintenance before events.",
        benefits: ["Auto-renew enabled", "Invoice generation", "Priority support"],
      },
      {
        groomerId: groomers[4]._id,
        title: "Gentle Puppy Plan",
        price: 349,
        billingCycle: "Monthly",
        description: "Gentle care for young pets with reminders for intro grooming sessions.",
        benefits: ["Puppy-friendly care", "SMS reminders", "Easy cancellation"],
      },
      {
        groomerId: groomers[5]._id,
        title: "Mobile Care Pass",
        price: 679,
        billingCycle: "Monthly",
        description: "Mobile grooming subscription for customers who prefer home visits.",
        benefits: ["Home service support", "Recurring booking", "Payment receipt"],
      },
      {
        groomerId: groomers[6]._id,
        title: "Luxury Spa Membership",
        price: 899,
        billingCycle: "Monthly",
        description: "High-touch spa membership for premium pet care and recurring maintenance.",
        benefits: ["Spa massage add-on", "Auto-renew", "VIP invoice"],
      },
    ];

    // Insert all plans into the database
    const plans = await SubscriptionPlan.insertMany(subscriptionPlans);

    // 5. Create an active Subscription record to demonstrate the "My Subscription" view
    await Subscription.create({
      groomerId: groomers[0]._id,
      planId: plans[0]._id,
      subscriberName: "Amina Rahman",
      subscriberPhone: "01712345678",
      subscriberEmail: "amina@example.com",
      paymentMethod: "Bkash",
      bkashNumber: "01712345678",
      paymentReference: "BKASH-DEM0-458921",
      paymentStatus: "Paid",
      invoiceNumber: "INV-20260421-10001",
      autoRenew: true,
      status: "Active",
      subscribedAt: new Date(),
      nextBillingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
      reminders: [
        {
          channel: "SMS",
          message: "Your monthly grooming subscription is active. Next renewal is in 30 days.",
          sentAt: new Date(),
          status: "Sent",
        },
      ],
    });

    console.log("Database seeded with precision coordinates!");
    process.exit(0); // Exit process successfully
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1); // Exit process with error code
  }
};

// Execute the seed script
seedDB();
