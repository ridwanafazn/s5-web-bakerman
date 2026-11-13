const mongoose = require('mongoose');

const env = require('./config/env');
const Product = require('./models/Product');
const User = require('./models/User');
const Location = require('./models/Location');
const DailyStock = require('./models/DailyStock');
const PickupSlot = require('./models/PickupSlot');
const { sugarLevelFor } = require('./utils/sugar');
const { isoDateJakarta, addDaysIso } = require('./utils/time');

const DEMO_EMAIL = 'bakerman@gmail.com';

const products = [
  {
    slug: 'roti-susu-pandan',
    name: 'Roti Susu Pandan',
    description: 'Roti lembut dengan krim susu pandan, rendah gula.',
    price: 18000,
    sugar: 8,
    category: 'Breads',
    tags: ['low-sugar'],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['tepung', 'susu', 'pandan', 'ragi', 'mentega'],
    image: 'category/breads.jpg',
    stock: 20,
  },
  {
    slug: 'banana-bread-rendah-gula',
    name: 'Banana Bread Rendah Gula',
    description: 'Banana bread lembut dengan pemanis alami dari pisang.',
    price: 25000,
    sugar: 10,
    category: 'Breads',
    tags: ['low-sugar'],
    allergens: ['gluten', 'egg', 'dairy'],
    ingredients: ['pisang', 'tepung', 'telur', 'mentega'],
    image: 'epic-morning-buns.webp',
    stock: 18,
  },
  {
    slug: 'croissant-almond',
    name: 'Croissant Almond',
    description: 'Croissant butter dengan topping almond panggang.',
    price: 28000,
    sugar: 12,
    category: 'Breads',
    tags: [],
    allergens: ['gluten', 'dairy', 'nuts'],
    ingredients: ['tepung', 'mentega', 'almond', 'gula'],
    image: 'category/breads.jpg',
    stock: 16,
  },
  {
    slug: 'cookie-cokelat-hitam',
    name: 'Cookie Cokelat Hitam',
    description: 'Cookie renyah dengan dark chocolate chunk.',
    price: 22000,
    sugar: 14,
    category: 'Cookies',
    tags: [],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['tepung', 'dark chocolate', 'mentega', 'telur'],
    image: 'category/cookies.jpg',
    stock: 24,
  },
  {
    slug: 'pandan-chiffon-slice',
    name: 'Pandan Chiffon Slice',
    description: 'Chiffon pandan ringan dan fluffy.',
    price: 26000,
    sugar: 16,
    category: 'Cakes',
    tags: [],
    allergens: ['gluten', 'egg'],
    ingredients: ['tepung', 'telur', 'pandan', 'gula'],
    image: 'category/cakes.webp',
    stock: 14,
  },
  {
    slug: 'brownie-gluten-free',
    name: 'Brownie Gluten-Free',
    description: 'Brownie fudgy tanpa gluten, cocok untuk yang sensitif gluten.',
    price: 30000,
    sugar: 16,
    category: 'Cakes',
    tags: ['gluten-free'],
    allergens: ['egg', 'dairy'],
    ingredients: ['cokelat', 'telur', 'mentega', 'tepung almond'],
    image: 'category/cakes.webp',
    stock: 12,
  },
  {
    slug: 'donat-gula-klasik',
    name: 'Donat Gula Klasik',
    description: 'Donat empuk dengan gula halus.',
    price: 20000,
    sugar: 18,
    category: 'Donuts',
    tags: [],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['tepung', 'ragi', 'gula', 'mentega'],
    image: 'category/donuts.jpg',
    stock: 24,
  },
  {
    slug: 'cinnamon-roll',
    name: 'Cinnamon Roll',
    description: 'Cinnamon roll dengan glaze manis dan aroma kayu manis.',
    price: 32000,
    sugar: 22,
    category: 'Breads',
    tags: ['indulgent'],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['tepung', 'kayu manis', 'gula', 'mentega'],
    image: 'category/breads.jpg',
    stock: 14,
  },
  {
    slug: 'banana-pudding-klasik',
    name: 'Banana Pudding Klasik',
    description: 'Banana pudding creamy dengan biskuit dan pisang.',
    price: 36000,
    sugar: 28,
    category: 'Icebox Desserts',
    tags: ['indulgent'],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['pisang', 'krim', 'biskuit', 'gula'],
    image: 'classic-banana-pudding.webp',
    stock: 12,
  },
  {
    slug: 'chocolate-fudge-cake',
    name: 'Chocolate Fudge Cake',
    description: 'Slice chocolate fudge cake dengan ganache pekat.',
    price: 42000,
    sugar: 35,
    category: 'Cakes',
    tags: ['indulgent'],
    allergens: ['gluten', 'dairy', 'egg'],
    ingredients: ['cokelat', 'tepung', 'telur', 'mentega', 'gula'],
    image: 'category/cakes.webp',
    stock: 10,
  },
].map((product) => ({
  ...product,
  sugarLevel: sugarLevelFor(product.sugar),
  active: true,
}));

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildSlotTimes() {
  const slots = [];
  for (let hour = 11; hour < 20; hour += 1) {
    for (const minute of [0, 30]) {
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      slots.push({
        startTime: `${pad(hour)}:${pad(minute)}`,
        endTime: `${pad(endHour)}:${pad(endMinute)}`,
      });
    }
  }
  return slots;
}

async function seed() {
  if (env.isProduction && process.env.SEED_FORCE !== 'true') {
    console.error(
      'Seed dibatalkan: NODE_ENV=production. Gunakan SEED_FORCE=true hanya jika benar-benar yakin.'
    );
    process.exitCode = 1;
    return;
  }

  if (!env.mongoUri || env.mongoUri.includes('USER:PASSWORD')) {
    console.error(
      'Seed dibatalkan: MONGODB_URI di server/.env belum diisi. ' +
        'Jalankan "docker compose up -d mongo" untuk Atlas Local.'
    );
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });

    const location = await Location.findOneAndUpdate(
      { name: 'Bakerman Dago' },
      {
        $set: {
          address: 'Jl. Ir. H. Juanda No. 100, Dago, Bandung',
          city: 'Bandung',
          timezone: 'Asia/Jakarta',
          active: true,
          openingHours: {
            monFri: '11:00-20:00',
            satSun: '10:00-21:00',
          },
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    await Product.deleteMany({});
    const createdProducts = await Product.insertMany(products);
    await DailyStock.deleteMany({});

    const today = isoDateJakarta();
    const stockDates = Array.from({ length: 7 }, (_, offset) =>
      addDaysIso(today, offset)
    );

    const stockOperations = [];
    createdProducts.forEach((product, index) => {
      stockDates.forEach((date) => {
        stockOperations.push({
          updateOne: {
            filter: { locationId: location._id, productId: product._id, date },
            update: {
              $setOnInsert: {
                total: 12 + (index % 5) * 2,
                reserved: 0,
                sold: 0,
              },
            },
            upsert: true,
          },
        });
      });
    });
    await DailyStock.bulkWrite(stockOperations);

    const slotTimes = buildSlotTimes();
    const slotOperations = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const date = addDaysIso(today, offset);
      slotTimes.forEach((slot) => {
        slotOperations.push({
          updateOne: {
            filter: {
              locationId: location._id,
              date,
              startTime: slot.startTime,
            },
            update: {
              $setOnInsert: {
                endTime: slot.endTime,
                capacity: 8,
                booked: 0,
                active: true,
              },
            },
            upsert: true,
          },
        });
      });
    }
    await PickupSlot.bulkWrite(slotOperations);

    const demoUser = await User.findOneAndUpdate(
      { email: DEMO_EMAIL },
      {
        $set: {
          role: 'admin',
          budgetPreset: 'seimbang',
          weeklyBudgetGrams: 90,
          budgetMode: 'guide',
        },
        $setOnInsert: {
          name: 'Bakerman Demo',
          chances: 3,
          chancesResetAt: new Date(),
          stravaLink: '',
          buyHistory: [
            {
              productList: 'Roti Susu Pandan x2',
              price: 36000,
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              productList: 'Banana Pudding Klasik',
              price: 36000,
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    console.log(`Seed berhasil: ${createdProducts.length} produk.`);
    console.log(`Outlet: ${location.name} (${location.city})`);
    console.log(`Stok harian: ${stockDates.join(', ')}`);
    console.log(`Pickup slot: 7 hari ke depan`);
    console.log(`Demo admin: ${demoUser.email} (role: ${demoUser.role})`);
  } catch (error) {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
