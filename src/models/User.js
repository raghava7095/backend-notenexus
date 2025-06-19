import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.authenticationMethod === 'password';
    },
    trim: true
  },
  googleId: {
    type: String,
    required: function() {
      return this.authenticationMethod === 'google';
    },
    unique: true,
    sparse: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  authenticationMethod: {
    type: String,
    enum: ['password', 'google'],
    required: true,
    default: 'password'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  resetPasswordAt: {
    type: Date,
    default: null
  },
  resetPasswordAt: {
    type: Date,
    default: null
  },
}, {
  toJSON: {
    transform: function(doc, ret) {
      // Remove password from JSON output
      delete ret.password;
    }
  },
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash if using password authentication
    if (this.authenticationMethod === 'password' && this.password) {
      console.log('Password before hash:', this.password);
      console.log('Password length:', this.password?.length);
      
      if (!this.password.trim()) {
        console.log('Password is empty or whitespace');
        return next(new Error('Password cannot be empty'));
      }

      // Always hash the password if it exists
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      console.log('Generated hash:', hashedPassword);
      this.password = hashedPassword;
      console.log('Password hashed successfully');
    }

    this.updatedAt = new Date();
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password:', candidatePassword);
    console.log('Candidate password length:', candidatePassword?.length);
    
    if (!this.password) {
      console.log('No stored password found');
      return false;
    }
    
    console.log('Stored password:', this.password);
    console.log('Stored password is hashed:', this.password.startsWith('$2b$'));
    
    // Verify password is properly hashed
    if (!this.password.startsWith('$2b$')) {
      console.log('Stored password is not properly hashed');
      return false;
    }
    
    // Trim whitespace from candidate password
    const trimmedPassword = candidatePassword.trim();
    console.log('Trimmed password:', trimmedPassword);
    
    const isMatch = await bcrypt.compare(trimmedPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Method to check if user can authenticate with password
userSchema.methods.canAuthenticateWithPassword = function() {
  console.log('Authentication method:', this.authenticationMethod);
  return this.authenticationMethod === 'password';
};

// Method to get user data for authentication
userSchema.methods.getAuthData = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture
  };
};

// Static method to find user by email
userSchema.statics.findByEmail = async function(email) {
  console.log('Searching user with email:', email);
  return this.findOne({ email });
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password:', candidatePassword);
    console.log('Stored password exists:', !!this.password);
    
    if (!this.password) {
      console.log('No stored password found');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Method to check if user can authenticate with password
userSchema.methods.canAuthenticateWithPassword = function() {
  console.log('Authentication method:', this.authenticationMethod);
  return this.authenticationMethod === 'password';
};

// Method to get user data for authentication
userSchema.methods.getAuthData = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture
  };
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing password:', candidatePassword);
  console.log('Stored password exists:', !!this.password);
  
  if (!this.password) {
    console.log('No stored password found');
    return false;
  }
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can authenticate with password
userSchema.methods.canAuthenticateWithPassword = function() {
  console.log('Authentication method:', this.authenticationMethod);
  return this.authenticationMethod === 'password';
};

const User = mongoose.model('User', userSchema);

// Enable debugging for this model
User.schema.set('debug', true);

export default User;
