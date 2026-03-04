const bcrypt = require('bcrypt');

const passwordToHash = '476622@Blog';
const saltRounds = 10; // The cost factor; higher is more secure but slower

bcrypt.hash(passwordToHash, saltRounds, function(err, hash) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Original Password:', passwordToHash);
  console.log('Hashed Password:', hash); // This is what you store in your database
});
