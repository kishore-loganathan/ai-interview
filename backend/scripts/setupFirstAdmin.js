require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const setupFirstAdmin = async () => {
    try {
        console.log('\n🔧 First Admin Setup\n');
        console.log('This script will help you create your first admin user.\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MongoDB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check if any admin exists
        const existingAdmin = await User.findOne({ 
            role: { $in: ['admin', 'superadmin'] } 
        });

        if (existingAdmin) {
            console.log('⚠️  An admin user already exists:');
            console.log(`   Name: ${existingAdmin.name}`);
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Role: ${existingAdmin.role}\n`);
            
            const proceed = await question('Do you want to create another admin? (yes/no): ');
            if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
                console.log('\n✓ Setup cancelled');
                process.exit(0);
            }
            console.log('');
        }

        // Get user details
        const name = await question('Enter admin name: ');
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 6 characters): ');

        // Validate inputs
        if (!name || !email || !password) {
            console.error('\n✗ All fields are required');
            process.exit(1);
        }

        if (password.length < 6) {
            console.error('\n✗ Password must be at least 6 characters');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`\n⚠️  User with email "${email}" already exists`);
            const makeAdmin = await question('Make this user an admin? (yes/no): ');
            
            if (makeAdmin.toLowerCase() === 'yes' || makeAdmin.toLowerCase() === 'y') {
                existingUser.role = 'admin';
                await existingUser.save();
                console.log(`\n✓ Successfully made ${existingUser.name} an admin`);
                console.log(`  Email: ${existingUser.email}`);
                console.log(`  Role: ${existingUser.role}`);
            } else {
                console.log('\n✓ Setup cancelled');
            }
            process.exit(0);
        }

        // Create new admin user
        const adminUser = await User.create({
            name,
            email,
            password,
            role: 'admin'
        });

        console.log('\n✓ Admin user created successfully!');
        console.log(`  Name: ${adminUser.name}`);
        console.log(`  Email: ${adminUser.email}`);
        console.log(`  Role: ${adminUser.role}`);
        console.log(`  User ID: ${adminUser._id}`);
        console.log('\n🎉 You can now login with these credentials and access the admin panel at /admin\n');

        process.exit(0);
    } catch (error) {
        console.error('\n✗ Error:', error.message);
        process.exit(1);
    }
};

setupFirstAdmin();
