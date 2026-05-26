require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const makeAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MongoDB_URI);
        console.log('✓ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`✗ User with email "${email}" not found`);
            process.exit(1);
        }

        // Update role to admin
        user.role = 'admin';
        await user.save();

        console.log(`✓ Successfully made ${user.name} (${user.email}) an admin`);
        console.log(`  User ID: ${user._id}`);
        console.log(`  Role: ${user.role}`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Usage: node makeAdmin.js <email>');
    console.error('Example: node makeAdmin.js user@example.com');
    process.exit(1);
}

makeAdmin(email);
