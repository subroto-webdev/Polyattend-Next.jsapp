import mongoose from 'mongoose';
import Department from './models/Department';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null, seeded: false };

async function autoSeedDepartments() {
  if (cached.seeded) return;
  try {
    const defaultDepartments = [
      { name: 'Computer Science & Technology', code: 'CST', technologyCode: '85' },
      { name: 'Mechatronics Technology', code: 'MCT', technologyCode: '92' },
      { name: 'Architecture Technology', code: 'ARC', technologyCode: '61' },
      { name: 'Food Technology', code: 'FT', technologyCode: '69' },
      { name: 'Refrigeration & Air Conditioning Technology', code: 'RAC', technologyCode: '72' },
    ];
    const count = await Department.countDocuments();
    if (count === 0) {
      await Department.insertMany(defaultDepartments.map(d => ({ ...d, isActive: true })));
      console.log('✅ TPI Departments seeded successfully!');
    } else {
      for (const dept of defaultDepartments) {
        const exists = await Department.findOne({ code: dept.code });
        if (!exists) {
          await Department.create({ ...dept, isActive: true });
        } else if (exists.technologyCode !== dept.technologyCode || !exists.technologyCode) {
          await Department.updateOne({ code: dept.code }, { $set: { technologyCode: dept.technologyCode, name: dept.name } });
        }
      }
    }
    cached.seeded = true;
  } catch (err) {
    console.error('⚠️ Department seed error:', err.message);
  }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set');
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  await autoSeedDepartments();
  return cached.conn;
}
