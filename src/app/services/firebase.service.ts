import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, DocumentData } from '@angular/fire/firestore';

export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  constructor(private router: Router) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const userData = await this.getUserDataFromFirestore(user.uid);

        if (userData) {
          const fullUser: User = {
            id: user.uid,
            firstName: userData['firstName'],
            lastName: userData['lastName'],
            email: userData['email'],
            phone: userData['phone'],
            role: userData['role'],
            token: token
          };
          this.currentUserSubject.next(fullUser);
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const token = await userCredential.user.getIdToken();

      const userData = await this.getUserDataFromFirestore(userCredential.user.uid);

      if (userData) {
        const fullUser: User = {
          id: userCredential.user.uid,
          firstName: userData['firstName'],
          lastName: userData['lastName'],
          email: userData['email'],
          phone: userData['phone'],
          role: userData['role'],
          token: token
        };
        this.currentUserSubject.next(fullUser);
        return true;
      } else {
        console.error('No user data found in Firestore');
        return false;
      }

    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async register(user: Omit<User, 'id' | 'token'> & { password: string }): Promise<boolean> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(this.auth, user.email, user.password);

      // Save extra user data to Firestore
      const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      });

      console.log('Registered user & saved to Firestore');
      return true;

    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.token || null;
  }

  private async getUserDataFromFirestore(uid: string): Promise<DocumentData | null> {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.error('No such document in Firestore!');
      return null;
    }
  }
}
