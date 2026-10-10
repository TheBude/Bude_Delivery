import { db } from './db/storage';

console.log('Seeding initial data for Bude Delivery...');
console.log('Suppliers:', db.getAllSuppliers().map((s) => ({ id: s.id, name: s.company_name })));
console.log('Seed completed successfully!');
