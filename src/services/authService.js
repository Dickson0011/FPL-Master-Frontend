// src/services/authService.js
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';

/**
 * Authentication service wrapper for Firebase Auth
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  /**
   * Set up auth state listener
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        };
        
        // Fetch additional user data from Firestore
        try {
          const userDoc = await this.getUserData(user.uid);
          this.currentUser = { ...this.currentUser, ...userDoc };
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        this.currentUser = null;
      }
      
      callback(this.currentUser);
    });
  }

  /**
   * Register new user with email and password
   */
  async register(email, password, displayName = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Create user document in Firestore
      await this.createUserDocument(user.uid, {
        email: user.email,
        displayName: displayName || '',
        createdAt: new Date(),
        preferences: {
          favoriteTeam: null,
          riskTolerance: 'medium',
          notifications: true,
        },
        fplData: {
          managerId: null,
          teamName: null,
          lastSynced: null,
        }
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: displayName || '',
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Failed to sign out. Please try again.'
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent. Check your inbox.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  /**
   * Create user document in Firestore
   */
  async createUserDocument(uid, userData) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  /**
   * Get user data from Firestore
   */
  async getUserData(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        console.log('No user document found');
        return {};
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {};
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(uid, preferences) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        preferences,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: 'Failed to update preferences'
      };
    }
  }

  /**
   * Update user's FPL manager data
   */
  async updateFplData(uid, fplData) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { 
        fplData: {
          ...fplData,
          lastSynced: new Date()
        },
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating FPL data:', error);
      return {
        success: false,
        error: 'Failed to update FPL data'
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Convert Firebase auth error codes to user-friendly messages
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;