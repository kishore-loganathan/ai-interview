require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const listUsers = async () => {
    try {
        console.log('\n👥 User Roles Report\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MongoDB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({})
            .select('name email role createdAt')
            .sort({ createdAt: 1 });

        if (users.length === 0) {
            console.log('❌ No users found in database\n');
            process.exit(0);
        }

        console.log(`📊 Total Users: ${users.length}\n`);

        // Group users by role
        const roleGroups = users.reduce((acc, user) => {
            if (!acc[user.role]) acc[user.role] = [];
            acc[user.role].push(user);
            return acc;
        }, {});

        // Display role summary
        console.log('📈 Role Summary:');
        Object.keys(roleGroups).forEach(role => {
            const count = roleGroups[role].length;
            const emoji = role === 'admin' ? '🛡️' : role === 'superadmin' ? '👑' : '👤';
            console.log(`   ${emoji} ${role}: ${count} user${count !== 1 ? 's' : ''}`);
        });
        console.log('');

        // Display detailed user list
        console.log('📋 Detailed User List:\n');
        
        // Show admins first
        if (roleGroups.admin) {
            console.log('🛡️  ADMINS:');
            roleGroups.admin.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name}`);
                console.log(`      Email: ${user.email}`);
                console.log(`      ID: ${user._id}`);
                console.log(`      Created: ${user.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

        // Show superadmins if any
        if (roleGroups.superadmin) {
            console.log('👑 SUPER ADMINS:');
            roleGroups.superadmin.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name}`);
                console.log(`      Email: ${user.email}`);
                console.log(`      ID: ${user._id}`);
                console.log(`      Created: ${user.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

        // Show regular users
        if (roleGroups.user) {
            console.log('👤 REGULAR USERS:');
            roleGroups.user.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email})`);
            });
            console.log('');
        }

        // Show first user info
        const firstUser = users[0];
        console.log('🥇 First User (should be admin):');
        console.log(`   Name: ${firstUser.name}`);
        console.log(`   Email: ${firstUser.email}`);
        console.log(`   Role: ${firstUser.role} ${firstUser.role === 'admin' ? '✅' : '❌'}`);
        console.log(`   Created: ${firstUser.createdAt.toLocaleString()}`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
};

listUsers();