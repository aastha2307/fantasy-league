import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCWQ5AQjLMKm3bdtkV9SvFYBoQF_zrWp8Q",
  authDomain: "ipl-fantasy-league-71959.firebaseapp.com",
  projectId: "ipl-fantasy-league-71959",
  storageBucket: "ipl-fantasy-league-71959.firebasestorage.app",
  messagingSenderId: "6454448286",
  appId: "1:6454448286:web:886fa7b0685880cb112b8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (only runs in browser)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
