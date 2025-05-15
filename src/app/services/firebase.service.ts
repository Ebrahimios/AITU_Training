import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, DocumentData } from '@angular/fire/firestore';
import { Student } from '../interfaces/student';
import { DataSource } from '@angular/cdk/collections';

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

export interface student {

}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private students: Student[] = [];
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
  public async sendStudentData(student: Student){
    try{
      const userDocRef = doc(this.firestore, 'StudentsTable', student.code);
      await setDoc(userDocRef, {
        code: student.code,
        name: student.name,
        phone: student.phone,
        state: student.state,
        address: student.address,
        nationalID: student.nationalID,
        factory: "",
        department: "",
        birthAddress: "",
        birthDate: Date.now(),
        email: "",
        stage: "",
        gender: "",
        factoryType: true,
        grade: 0
      });
    }
    catch (error) {
      console.error('Error sending student data:', error);
    }
  }
  public async getStudentData(code: string): Promise<Student | null> {
    const userDocRef = doc(this.firestore, 'StudentsTable', code);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data() as Student;
      return {
        code: data.code,
        name: data.name,
        phone: data.phone,
        state: data.state,
        address: data.address,
        nationalID: data.nationalID,
        factory: data.factory,
        department: data.department,
        grade: data.grade,
        birthAddress: data.birthAddress,
        birthDate: data.birthDate,
        email: data.email,
        gender: data.gender,
        stage: data.stage,
        factoryType: data.factoryType
      };
    } else {
      console.error('No such document in Firestore!');
      return null;
    }
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