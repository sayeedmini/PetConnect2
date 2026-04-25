const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const { CatalogSubscriptionPlan } = require('./src/models/CatalogSubscription');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petconnect';

const products = [
  { name: 'Premium Dog Food', price: 2599, category: 'Food', brand: 'Royal Canin', discount: 10, stock: 50, description: 'High quality dog food for healthy daily nutrition.', ratings: { average: 4.5, count: 120 } },
  { name: 'Cat Toy Mouse', price: 699, category: 'Toys', brand: 'PetFun', discount: 0, stock: 100, description: 'Interactive toy mouse for active cats.', ratings: { average: 4.2, count: 85 } },
  { name: 'Orthopedic Pet Bed', price: 4599, category: 'Bedding', brand: 'PetComfort', discount: 15, stock: 30, description: 'Comfortable memory foam bed for dogs and cats.', ratings: { average: 4.8, count: 200 } },
  { name: 'Nylon Dog Leash', price: 899, category: 'Accessories', brand: 'PetSafe', discount: 5, stock: 75, description: 'Durable nylon leash for safe walking.', ratings: { average: 4.3, count: 150 } },
  { name: 'Grain-Free Cat Food', price: 3299, category: 'Food', brand: 'Blue Buffalo', discount: 10, stock: 40, description: 'Healthy grain-free food for cats.', ratings: { average: 4.6, count: 95 } },
  { name: 'Pet Grooming Kit', price: 3999, category: 'Grooming', brand: 'PetGroom Pro', discount: 20, stock: 25, description: 'Complete grooming kit for home pet care.', ratings: { average: 4.4, count: 60 } },
];

const plans = [
  { name: 'Basic Pet Box', price: 2999, duration: 'monthly', description: 'Essential pet supplies delivered monthly.', isActive: true },
  { name: 'Premium Pet Box', price: 4999, duration: 'monthly', description: 'Premium products including toys and treats.', isActive: true },
  { name: 'Deluxe Pet Box', price: 7999, duration: 'monthly', description: 'Food, toys, and grooming supplies in one box.', isActive: true },
  { name: 'Quarterly Supply', price: 14999, duration: 'quarterly', description: 'Three months of supplies delivered together.', isActive: true },
  { name: 'Annual Premium', price: 49999, duration: 'yearly', description: 'Yearly subscription with maximum savings.', isActive: true },
];

async function seedCatalog() {
  await mongoose.connect(MONGO_URI);

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(products);
    console.log('Catalog products seeded.');
  } else {
    console.log('Catalog products already exist. Skipping products.');
  }

  const planCount = await CatalogSubscriptionPlan.countDocuments();
  if (planCount === 0) {
    await CatalogSubscriptionPlan.insertMany(plans);
    console.log('Catalog subscription plans seeded.');
  } else {
    console.log('Catalog subscription plans already exist. Skipping plans.');
  }

  await mongoose.disconnect();
}

seedCatalog().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
