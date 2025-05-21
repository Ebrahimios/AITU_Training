import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, DocumentData, collection, getDocs, deleteDoc, updateDoc } from '@angular/fire/firestore';
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
  image?: string;
  timestamp?: number;
}

export interface FirebaseFactory {
  id?: string;
  name: string;
  capacity: number;
  assignedStudents: number;
  students: any[];
  address?: string;
  phone?: string;
  department?: string;
  contactName?: string;
  type: string;
  industry?: string;
  isApproved: boolean;
  studentName?: string;
  createdAt: number;
}

export interface student {

}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Factory request notifications
  private factoryRequestsSubject = new BehaviorSubject<any[]>([]);
  public factoryRequests$ = this.factoryRequestsSubject.asObservable();
  // Helper method to convert any date value to timestamp
  private convertToTimestamp(dateValue: any): number | undefined {
    if (!dateValue) return undefined;
    
    // If already a number, return it
    if (typeof dateValue === 'number') return dateValue;
    
    // If string, convert to timestamp
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.getTime(); // Convert to timestamp (milliseconds)
      }
    }
    
    // If Date object, convert to timestamp
    if (dateValue instanceof Date) {
      return dateValue.getTime();
    }
    
    return undefined;
  }
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private students: Student[] = [];
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  constructor(private router: Router) {
    // Load factory requests on initialization
    this.loadFactoryRequests();
    // Initialize from localStorage if available
    const savedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser ? JSON.parse(savedUser) : null);
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
          // Save to localStorage and update BehaviorSubject
          localStorage.setItem('currentUser', JSON.stringify(fullUser));
          this.currentUserSubject.next(fullUser);
        }
      } else {
        // Clear from localStorage and update BehaviorSubject
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      }
    });
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  public async sendStudentData(student: Student){
    try{
      // Convert birthDate to timestamp if provided
      const birthDateTimestamp = this.convertToTimestamp(student.birthDate || Date.now());
      
      const userDocRef = doc(this.firestore, 'StudentsTable', student.code);
      await setDoc(userDocRef, {
        code: student.code,
        name: student.name,
        phone: student.phone,
        state: student.state,
        address: student.address,
        nationalID: student.nationalID,
        selected: student.selected,
        createOn: Date.now(),
        factory: "",
        department: "",
        birthAddress: "",
        birthDate: birthDateTimestamp, // Store as timestamp
        email: "",
        stage: "",
        gender: "",
        factoryType: true,
        grade: 0,
        supervisor: student.supervisor || null // Add supervisor field with default null
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
        birthDate: data['birthDate'] ? this.convertToTimestamp(data['birthDate']) : undefined, // Ensure birthDate is a timestamp
        email: data.email,
        gender: data.gender,
        stage: data.stage,
        factoryType: data.factoryType,
        supervisor: data.supervisor // Add supervisor field
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
        // Save to localStorage and update BehaviorSubject
        localStorage.setItem('currentUser', JSON.stringify(fullUser));
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
    // Clear from localStorage and update BehaviorSubject
    localStorage.removeItem('currentUser');
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

  public async getAllStudents(): Promise<Student[]> {
    try {
      const studentsCollection = collection(this.firestore, 'StudentsTable');
      const querySnapshot = await getDocs(studentsCollection);
      const students: Student[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const student: Student = {
          code: data['code'],
          name: data['name'],
          phone: data['phone'],
          state: data['state'],
          address: data['address'],
          nationalID: data['nationalID'],
          email: data['email'],
          birthDate: this.convertToTimestamp(data['birthDate']), // Ensure birthDate is a timestamp
          createOn: this.convertToTimestamp(data['createOn']), // Ensure createOn is a timestamp
          gender: data['gender'],
          department: data['department'],
          birthAddress: data['birthAddress'],
          factory: data['factory'],
          grade: data['grade'],
          stage: data['stage'],
          factoryType: data['factoryType'],
          selected: data['selected'],
          supervisor: data['supervisor'] // Add supervisor field
        };
        students.push(student);
      });

      return students;
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  public async updateStudent(student: Student): Promise<boolean> {
    try {
      // Convert birthDate to timestamp if provided
      const birthDateTimestamp = this.convertToTimestamp(student.birthDate);
      
      const userDocRef = doc(this.firestore, 'StudentsTable', student.code);
      await updateDoc(userDocRef, {
        name: student.name,
        phone: student.phone,
        state: student.state,
        address: student.address,
        nationalID: student.nationalID,
        email: student.email,
        birthDate: birthDateTimestamp, // Store as timestamp
        createOn: Date.now(),
        gender: student.gender,
        department: student.department,
        birthAddress: student.birthAddress,
        factory: student.factory,
        grade: student.grade,
        stage: student.stage,
        factoryType: student.factoryType,
        selected: student.selected,
        supervisor: student.supervisor // Add supervisor field to update
      });
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    }
  }

  public async deleteStudent(studentCode: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'StudentsTable', studentCode);
      await deleteDoc(userDocRef);
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  // Factory request methods
  public async submitFactoryRequest(factoryData: FirebaseFactory): Promise<boolean> {
    try {
      console.log('Submitting factory request:', factoryData);
      
      // Generate a unique ID for the factory if not provided
      const factoryId = factoryData.id || `factory_${Date.now()}`;
      const factoryRef = doc(this.firestore, 'Factories', factoryId);

      // Preserve the isApproved status from the input or default to false
      // This allows direct creation of approved factories when needed
      const factoryWithTimestamp = {
        ...factoryData,
        id: factoryId,
        isApproved: factoryData.isApproved !== undefined ? factoryData.isApproved : false,
        createdAt: factoryData.createdAt || Date.now()
      };

      // Remove undefined values to prevent Firestore errors
      const cleanedData = Object.entries(factoryWithTimestamp).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('Saving factory data to Firestore:', cleanedData);
      await setDoc(factoryRef, cleanedData);
      console.log('Factory saved successfully to Firebase with ID:', factoryId);
      
      // Reload factory requests
      await this.loadFactoryRequests();
      return true;
    } catch (error) {
      console.error('Error saving factory to Firebase:', error);
      return false;
    }
  }

  public async loadFactoryRequests(): Promise<void> {
    try {
      console.log('Loading factory requests from Firebase...');
      const factoriesCollection = collection(this.firestore, 'Factories');
      const querySnapshot = await getDocs(factoriesCollection);
      
      console.log(`Found ${querySnapshot.size} documents in Factories collection`);
      
      const factories: FirebaseFactory[] = [];

      // If no documents exist yet, create a sample factory request for testing
      if (querySnapshot.empty) {
        console.log('No factory requests found, creating a sample factory request for testing...');
        // Create a sample factory request
        await this.submitFactoryRequest({
          name: 'Sample Factory',
          capacity: 10,
          assignedStudents: 0,
          students: [],
          address: '123 Test Street',
          phone: '01234567890',
          department: 'IT',
          contactName: 'Test Contact',
          type: 'Manufacturing',
          industry: 'Technology',
          isApproved: false,
          studentName: 'Test Student',
          createdAt: Date.now()
        });
        
        // Fetch again after creating the sample
        const updatedSnapshot = await getDocs(factoriesCollection);
        updatedSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Factory data:', data);
          factories.push({
            id: doc.id,
            name: data['name'] || 'Unknown Factory',
            capacity: data['capacity'] || 0,
            assignedStudents: data['assignedStudents'] || 0,
            students: data['students'] || [],
            address: data['address'] || '',
            phone: data['phone'] || '',
            department: data['department'] || '',
            contactName: data['contactName'] || '',
            type: data['type'] || '',
            industry: data['industry'] || '',
            isApproved: data['isApproved'] || false,
            studentName: data['studentName'] || '',
            createdAt: this.convertToTimestamp(data['createdAt']) || Date.now()
          });
        });
      } else {
        // Process existing documents
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Factory data:', data);
          factories.push({
            id: doc.id,
            name: data['name'] || 'Unknown Factory',
            capacity: data['capacity'] || 0,
            assignedStudents: data['assignedStudents'] || 0,
            students: data['students'] || [],
            address: data['address'] || '',
            phone: data['phone'] || '',
            department: data['department'] || '',
            contactName: data['contactName'] || '',
            type: data['type'] || '',
            industry: data['industry'] || '',
            isApproved: data['isApproved'] || false,
            studentName: data['studentName'] || '',
            createdAt: this.convertToTimestamp(data['createdAt']) || Date.now()
          });
        });
      }

      console.log('Processed factories:', factories);
      
      // Update the BehaviorSubject
      this.factoryRequestsSubject.next(factories);
    } catch (error) {
      console.error('Error loading factory requests:', error);
      this.factoryRequestsSubject.next([]);
    }
  }

  public async handleFactoryRequest(factoryId: string, action: 'accept' | 'deny'): Promise<boolean> {
    try {
      console.log(`Handling factory request ${factoryId} with action: ${action}`);
      
      if (action === 'accept') {
        // Update the factory document to set isApproved to true
        const factoryRef = doc(this.firestore, 'Factories', factoryId);
        console.log('Updating factory to approved status');
        await updateDoc(factoryRef, {
          isApproved: true,
          updatedAt: Date.now()
        });
        console.log('Factory approved successfully');
      } else if (action === 'deny') {
        // Delete the factory document
        const factoryRef = doc(this.firestore, 'Factories', factoryId);
        console.log('Deleting factory request');
        await deleteDoc(factoryRef);
        console.log('Factory request deleted successfully');
      }

      // Reload factory requests
      await this.loadFactoryRequests();
      return true;
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'denying'} factory request:`, error);
      return false;
    }
  }

  public getFactoryRequests(): FirebaseFactory[] {
    return this.factoryRequestsSubject.value;
  }
}
