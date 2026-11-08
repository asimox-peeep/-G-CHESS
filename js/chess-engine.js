const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

const fsReady = (() => {
  if (!window.firebase) return false;
  if (!firebaseConfig.apiKey) {
    console.info('Firebase config not supplied. Firebase features remain off until configured.');
    return false;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    return true;
  } catch (error) {
    console.warn('Firebase initialization failed.', error);
    return false;
  }
})();

window.gChessFirebase = {
  ready: fsReady,
  getAuth: () => fsReady ? firebase.auth() : null,
  getFirestore: () => fsReady ? firebase.firestore() : null,
  signInWithEmail: async (email, password) => {
    if (!fsReady) {
      return { ok: false, reason: 'Firebase not configured.' };
    }
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, reason: error.message };
    }
  },
  registerWithEmail: async (email, password) => {
    if (!fsReady) {
      return { ok: false, reason: 'Firebase not configured.' };
    }
    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      return { ok: true, user: result.user };
    } catch (error) {
      return { ok: false, reason: error.message };
    }
  }
};
