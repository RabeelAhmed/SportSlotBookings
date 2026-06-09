db = db.getSiblingDB('sportslot');

db.createCollection('users');
db.createCollection('sports');
db.createCollection('bookings');

// Seed sports
db.sports.insertMany([
  {
    name: 'Cricket',
    description: 'Book the cricket court for practice or matches.',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Football',
    description: 'Book the football pitch for training or friendly games.',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format',
    isActive: true,
    createdAt: new Date()
  }
]);

// Seed admin user
// Password: Admin@1234  (hashed with bcrypt, 10 rounds)
db.users.insertOne({
  name: 'Admin',
  email: 'admin@sportslot.com',
  phone: '03000000000',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  role: 'admin',
  createdAt: new Date()
});

print('SportSlot database initialized.');
