db = db.getSiblingDB('sportslot');

db.createCollection('users');
db.createCollection('sports');
db.createCollection('bookings');

// Seed sports
db.sports.insertMany([
  {
    name: 'Cricket',
    description: 'Book the cricket court for practice or matches.',
    image: 'https://i.pinimg.com/736x/42/4a/17/424a17359ec7bbbd0925f13b6f52a045.jpg',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Football',
    description: 'Book the football pitch for training or friendly games.',
    image: 'https://i.pinimg.com/736x/68/4f/54/684f54fe669f24f6f81406ef38376fc5.jpg',
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
