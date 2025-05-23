const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateAdminCredentials() {
  console.log('🔐 Admin Credential Generator\n');
  
  // Get username
  const username = await new Promise((resolve) => {
    rl.question('Enter admin username: ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!username) {
    console.log('❌ Username cannot be empty!');
    rl.close();
    return;
  }

  // Get password
  const password = await new Promise((resolve) => {
    rl.question('Enter admin password: ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!password) {
    console.log('❌ Password cannot be empty!');
    rl.close();
    return;
  }

  if (password.length < 6) {
    console.log('❌ Password must be at least 6 characters long!');
    rl.close();
    return;
  }

  try {
    // Generate salt and hash the password
    const saltRounds = 12; // More secure than default 10
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('\n✅ Admin credentials generated successfully!\n');
    console.log('📋 Copy this into your authController.ts:\n');
    console.log('const ADMIN_USERS = [');
    console.log('  {');
    console.log(`    username: '${username}',`);
    console.log(`    passwordHash: '${hashedPassword}',`);
    console.log('    role: \'admin\'');
    console.log('  }');
    console.log('];\n');
    
    console.log('🔒 Your credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Save these credentials safely - the password won\'t be shown again!');

  } catch (error) {
    console.error('❌ Error generating credentials:', error);
  }

  rl.close();
}

// Run the generator
generateAdminCredentials().catch(console.error); 