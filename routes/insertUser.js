const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure this path is correct

mongoose.connect('mongodb://localhost:27017/inkfusion', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const newUser = new User({
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'securepassword'
});

newUser.save()
  .then(user => console.log('User saved:', user))
  .catch(err => console.error('Error:', err));
