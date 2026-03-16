import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { onAuthStateChange, signIn, signUp };
