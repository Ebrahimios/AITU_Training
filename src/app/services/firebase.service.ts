import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential,
  reauthenticateWithCredential,
  updateEmail,
  EmailAuthProvider,
  updatePassword,
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  DocumentData,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from '@angular/fire/firestore';
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
  longitude?: number;
  latitude?: number;
  department?: string;
  contactName?: string;
  type: string;
  industry?: string;
  isApproved: boolean;
  studentName?: string;
  createdAt: number;
}

export interface FirebaseSupervisor {
  id?: string;
  name: string;
  capacity: number;
  assignedStudents: number;
  students: any[];
  address?: string;
  phone?: string;
  department?: string;
  type: string;
  isApproved: boolean;
  createdAt: number;
}

export interface student {}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Factory request notifications
  private factoryRequestsSubject = new BehaviorSubject<any[]>([]);
  public factoryRequests$ = this.factoryRequestsSubject.asObservable();

  // Students real-time data
  private studentsSubject = new BehaviorSubject<Student[]>([]);
  public students$ = this.studentsSubject.asObservable();

  // Factories real-time data
  private factoriesSubject = new BehaviorSubject<FirebaseFactory[]>([]);
  public factories$ = this.factoriesSubject.asObservable();

  // Supervisors real-time data
  private supervisorsSubject = new BehaviorSubject<FirebaseSupervisor[]>([]);
  public supervisors$ = this.supervisorsSubject.asObservable();

  // Store unsubscribe functions for cleanup
  private unsubscribeStudents: (() => void) | null = null;
  private unsubscribeFactories: (() => void) | null = null;
  private unsubscribeSupervisors: (() => void) | null = null;
  // Helper method to convert any date value to a timestamp
  private convertToTimestamp(dateValue: any): number | undefined {
    if (!dateValue) return undefined;

    // If already a number (timestamp), return it
    if (typeof dateValue === 'number') return dateValue;

    // If it's a string, convert to timestamp
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? undefined : date.getTime();
    }

    // If it's a Firestore timestamp, convert to milliseconds
    if (dateValue && typeof dateValue === 'object' && 'toMillis' in dateValue) {
      return dateValue.toMillis();
    }

    return undefined;
  }

  // Helper method to convert any date value to a string in YYYY-MM-DD format
  private formatBirthDateToString(dateValue: any): string | undefined {
    if (!dateValue) return undefined;

    // If already a string, validate and return it or convert to standard format
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0]; // Ensure YYYY-MM-DD format
    }

    // If it's a number (timestamp), convert to string
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    }

    // If it's a Firestore timestamp, convert to string
    if (dateValue && typeof dateValue === 'object' && 'toMillis' in dateValue) {
      const date = new Date(dateValue.toMillis());
      return date.toISOString().split('T')[0];
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
    this.currentUserSubject = new BehaviorSubject<User | null>(
      savedUser ? JSON.parse(savedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // Initialize real-time data subscriptions
    this.subscribeToStudents();
    this.subscribeToFactories();
    this.subscribeToSupervisors();

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
            token: token,
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
  public async sendStudentData(student: Student) {
    try {
      // Ensure birthDate is stored as a string in YYYY-MM-DD format
      // If birthDate is already a string, use it; otherwise convert from Date or use current date
      const birthDateString =
        typeof student.birthDate === 'string'
          ? student.birthDate
          : this.formatBirthDateToString(student.birthDate || new Date()) ||
            new Date().toISOString().split('T')[0];

      const userDocRef = doc(this.firestore, 'StudentsTable', student.code);
      await setDoc(userDocRef, {
        code: student.code,
        name: student.name,
        phone: student.phone,
        state: student.state,
        address: student.address,
        nationalID: student.nationalID,
        selected: student.selected,
        createOn: new Date().toISOString().split('T')[0], // Set to current date in YYYY-MM-DD format
        factory: '',
        department: '',
        birthAddress: '',
        birthDate: birthDateString, // Store as string in YYYY-MM-DD format
        email: '',
        stage: '',
        gender: '',
        factoryType: true,
        grade: 0,
        supervisor: student.supervisor || null, // Add supervisor field with default null
      });
    } catch (error) {
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
        batch: data.batch,
        birthAddress: data.birthAddress,
        birthDate: data['birthDate']
          ? this.formatBirthDateToString(data['birthDate'])
          : undefined, // Ensure birthDate is a string
        email: data.email,
        gender: data.gender,
        stage: data.stage,
        factoryType: data.factoryType,
        supervisor: data.supervisor, // Add supervisor field
      };
    } else {
      console.error('No such document in Firestore!');
      return null;
    }
  }
  async login(email: string, password: string): Promise<boolean> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      const token = await userCredential.user.getIdToken();

      const userData = await this.getUserDataFromFirestore(
        userCredential.user.uid,
      );

      if (userData) {
        const fullUser: User = {
          id: userCredential.user.uid,
          firstName: userData['firstName'],
          lastName: userData['lastName'],
          email: userData['email'],
          phone: userData['phone'],
          role: userData['role'],
          password: password,
          token: token,
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

  async register(
    user: Omit<User, 'id' | 'token'> & { password: string },
  ): Promise<boolean> {
    try {
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(
          this.auth,
          user.email,
          user.password,
        );

      // Save extra user data to Firestore
      const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
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

  private async getUserDataFromFirestore(
    uid: string,
  ): Promise<DocumentData | null> {
    const userDocRef = doc(this.firestore, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.error('No such document in Firestore!');
      return null;
    }
  }

  /**
   * Subscribe to real-time updates for students
   * Call this method once when your component initializes
   */
  public subscribeToStudents(): void {
    // Unsubscribe from any existing subscription
    if (this.unsubscribeStudents) {
      this.unsubscribeStudents();
    }

    try {
      const studentsCollection = collection(this.firestore, 'StudentsTable');

      // Set up real-time listener
      this.unsubscribeStudents = onSnapshot(
        studentsCollection,
        (snapshot) => {
          const students: Student[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const student: Student = {
              code: data['code'],
              name: data['name'],
              phone: data['phone'],
              state: data['state'],
              address: data['address'],
              nationalID: data['nationalID'],
              email: data['email'],
              birthDate: data['birthDate'], // Ensure birthDate is a string
              createOn: data['createOn'], // Ensure createOn is a string
              gender: data['gender'],
              department: data['department'],
              birthAddress: data['birthAddress'],
              factory: data['factory'],
              batch: data['batch'],
              stage: data['stage'],
              factoryType: data['factoryType'],
              selected: data['selected'],
              supervisor: data['supervisor'], // Add supervisor field
            };
            students.push(student);
          });

          // Update the BehaviorSubject with new data
          this.studentsSubject.next(students);
          console.log(
            'Real-time students data updated:',
            students.length,
            'students',
          );
        },
        (error) => {
          console.error('Error getting real-time students:', error);
        },
      );
    } catch (error) {
      console.error('Error setting up students listener:', error);
    }
  }

  /**
   * Get all students (one-time fetch, kept for backward compatibility)
   */
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
          birthDate: data['birthDate'], // Ensure birthDate is a string
          createOn: data['createOn'], // Ensure createOn is a string
          gender: data['gender'],
          department: data['department'],
          birthAddress: data['birthAddress'],
          factory: data['factory'],
          batch: data['batch'],
          stage: data['stage'],
          selected: data['selected'],
          supervisor: data['supervisor'], // Add supervisor field
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
      // Ensure birthDate is stored as a string in YYYY-MM-DD format
      // If birthDate is already a string, use it; otherwise convert from Date or use current date
      const birthDateString =
        typeof student.birthDate === 'string'
          ? student.birthDate
          : this.formatBirthDateToString(student.birthDate || new Date()) ||
            new Date().toISOString().split('T')[0];

      const userDocRef = doc(this.firestore, 'StudentsTable', student.code);
      await updateDoc(userDocRef, {
        name: student.name,
        phone: student.phone,
        state: student.state,
        address: student.address,
        nationalID: student.nationalID,
        email: student.email,
        birthDate: birthDateString, // Store as formatted string
        gender: student.gender,
        department: student.department,
        birthAddress: student.birthAddress,
        factory: student.factory,
        batch: student.batch,
        stage: student.stage,
        selected: student.selected,
        supervisor: student.supervisor, // Add supervisor field to update
      });
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    }
  }

  public async deleteStudent(studentCode: string): Promise<boolean> {
    try {
      // First, get the student to check if they have a factory
      const studentDocRef = doc(this.firestore, 'StudentsTable', studentCode);
      const studentDoc = await getDoc(studentDocRef);
      const studentData = studentDoc.data();

      if (studentData && studentData['factory']) {
        // If student has a factory, update the factory's list
        const factoriesRef = collection(this.firestore, 'Factories');
        const q = query(
          factoriesRef,
          where('name', '==', studentData['factory']),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const factoryDoc = querySnapshot.docs[0];
          const factoryData = factoryDoc.data();

          // Remove student from factory's students array
          const updatedStudents = factoryData['students'].filter(
            (s: any) => s.code !== studentCode,
          );

          // Update factory document
          await updateDoc(doc(this.firestore, 'Factories', factoryDoc.id), {
            students: updatedStudents,
            assignedStudents: updatedStudents.length,
          });
        }
      }

      // Finally, delete the student
      await deleteDoc(studentDocRef);
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  // Factory methods
  /**
   * Subscribe to real-time updates for factories
   * Call this method once when your component initializes
   */
  public subscribeToFactories(): void {
    // Unsubscribe from any existing subscription
    if (this.unsubscribeFactories) {
      this.unsubscribeFactories();
    }

    try {
      const factoriesCollection = collection(this.firestore, 'Factories');

      // Set up real-time listener
      this.unsubscribeFactories = onSnapshot(
        factoriesCollection,
        (snapshot) => {
          const factories: FirebaseFactory[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Raw factory data from Firebase:', data);
            const factory = {
              id: doc.id,
              name: data['name'] || 'Unknown Factory',
              capacity: data['capacity'] || 0,
              assignedStudents: data['assignedStudents'] || 0,
              students: data['students'] || [],
              address: data['address'],
              phone: data['phone'],
              department: data['department'],
              contactName: data['contactName'],
              type: data['type'],
              industry: data['industry'],
              isApproved:
                data['isApproved'] !== undefined ? data['isApproved'] : true,
              createdAt: data['createdAt'] || Date.now(),
              longitude:
                data['longitude'] !== undefined
                  ? Number(data['longitude'])
                  : undefined,
              latitude:
                data['latitude'] !== undefined
                  ? Number(data['latitude'])
                  : undefined,
            };
            console.log('Processed factory:', factory);
            factories.push(factory);
          });

          // Update the BehaviorSubject with new data
          this.factoriesSubject.next(factories);
          console.log(
            'Real-time factories data updated:',
            factories.length,
            'factories',
          );
        },
        (error) => {
          console.error('Error getting real-time factories:', error);
        },
      );
    } catch (error) {
      console.error('Error setting up factories listener:', error);
    }
  }

  /**
   * Get all factories (one-time fetch, kept for backward compatibility)
   */
  public async getAllFactories(): Promise<FirebaseFactory[]> {
    try {
      const factoriesCollection = collection(this.firestore, 'Factories');
      const querySnapshot = await getDocs(factoriesCollection);
      const factories: FirebaseFactory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        factories.push({
          id: doc.id,
          name: data['name'] || 'Unknown Factory',
          capacity: data['capacity'] || 0,
          assignedStudents: data['assignedStudents'] || 0,
          students: data['students'] || [],
          address: data['address'],
          phone: data['phone'],
          department: data['department'],
          contactName: data['contactName'],
          type: data['type'],
          industry: data['industry'],
          isApproved:
            data['isApproved'] !== undefined ? data['isApproved'] : true,
          createdAt: data['createdAt'] || Date.now(),
        });
      });

      return factories;
    } catch (error) {
      console.error('Error getting factories:', error);
      return [];
    }
  }

  public async updateFactory(factory: FirebaseFactory): Promise<boolean> {
    try {
      const factoryId = factory.id || `factory_${Date.now()}`;
      const factoryRef = doc(this.firestore, 'Factories', factoryId);

      // Remove undefined values to prevent Firestore errors
      const cleanedData = Object.entries(factory).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      await setDoc(factoryRef, cleanedData, { merge: true });
      console.log(
        'Factory updated successfully in Firebase with ID:',
        factoryId,
      );
      return true;
    } catch (error) {
      console.error('Error updating factory in Firebase:', error);
      return false;
    }
  }

  public async deleteFactory(factoryId: string): Promise<boolean> {
    try {
      const factoryRef = doc(this.firestore, 'Factories', factoryId);
      await deleteDoc(factoryRef);
      console.log(
        'Factory deleted successfully from Firebase with ID:',
        factoryId,
      );
      return true;
    } catch (error) {
      console.error('Error deleting factory from Firebase:', error);
      return false;
    }
  }

  // Supervisor methods
  /**
   * Subscribe to real-time updates for supervisors
   * Call this method once when your component initializes
   */
  public subscribeToSupervisors(): void {
    // Unsubscribe from any existing subscription
    if (this.unsubscribeSupervisors) {
      this.unsubscribeSupervisors();
    }

    try {
      const supervisorsCollection = collection(this.firestore, 'Supervisors');

      // Set up real-time listener
      this.unsubscribeSupervisors = onSnapshot(
        supervisorsCollection,
        (snapshot) => {
          const supervisors: FirebaseSupervisor[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            supervisors.push({
              id: doc.id,
              name: data['name'] || 'Unknown Supervisor',
              capacity: data['capacity'] || 0,
              assignedStudents: data['assignedStudents'] || 0,
              students: data['students'] || [],
              address: data['address'],
              phone: data['phone'],
              department: data['department'],
              type: data['type'],
              isApproved:
                data['isApproved'] !== undefined ? data['isApproved'] : true,
              createdAt: data['createdAt'] || Date.now(),
            });
          });

          // Update the BehaviorSubject with new data
          this.supervisorsSubject.next(supervisors);
          console.log(
            'Real-time supervisors data updated:',
            supervisors.length,
            'supervisors',
          );
        },
        (error) => {
          console.error('Error getting real-time supervisors:', error);
        },
      );
    } catch (error) {
      console.error('Error setting up supervisors listener:', error);
    }
  }

  /**
   * Get all supervisors (one-time fetch, kept for backward compatibility)
   */
  public async getAllSupervisors(): Promise<FirebaseSupervisor[]> {
    try {
      const supervisorsCollection = collection(this.firestore, 'Supervisors');
      const supervisorsSnapshot = await getDocs(supervisorsCollection);
      const supervisors: FirebaseSupervisor[] = [];

      supervisorsSnapshot.forEach((doc) => {
        const data = doc.data();
        supervisors.push({
          id: doc.id,
          name: data['name'] || 'Unknown Supervisor',
          capacity: data['capacity'] || 0,
          assignedStudents: data['assignedStudents'] || 0,
          students: data['students'] || [],
          address: data['address'],
          phone: data['phone'],
          department: data['department'],
          type: data['type'],
          isApproved:
            data['isApproved'] !== undefined ? data['isApproved'] : true,
          createdAt: data['createdAt'] || Date.now(),
        });
      });

      return supervisors;
    } catch (error) {
      console.error('Error getting supervisors:', error);
      return [];
    }
  }

  public async updateSupervisor(
    supervisor: FirebaseSupervisor,
  ): Promise<boolean> {
    try {
      const supervisorId = supervisor.id || `supervisor_${Date.now()}`;
      const supervisorRef = doc(this.firestore, 'Supervisors', supervisorId);

      // Remove undefined values to prevent Firestore errors
      const cleanedData = Object.entries(supervisor).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      await setDoc(supervisorRef, cleanedData, { merge: true });
      console.log(
        'Supervisor updated successfully in Firebase with ID:',
        supervisorId,
      );
      return true;
    } catch (error) {
      console.error('Error updating supervisor in Firebase:', error);
      return false;
    }
  }

  public async deleteSupervisor(supervisorId: string): Promise<boolean> {
    try {
      const supervisorRef = doc(this.firestore, 'Supervisors', supervisorId);
      await deleteDoc(supervisorRef);
      console.log(
        'Supervisor deleted successfully from Firebase with ID:',
        supervisorId,
      );
      return true;
    } catch (error) {
      console.error('Error deleting supervisor from Firebase:', error);
      return false;
    }
  }

  // Factory request methods
  public async submitFactoryRequest(
    factoryData: FirebaseFactory,
  ): Promise<boolean> {
    try {
      console.log('Submitting factory request:', factoryData);

      // Generate a unique ID for the factory if not provided
      const factoryId = factoryData.id || `factory_${Date.now()}`;
      const factoryRef = doc(this.firestore, 'Factories', factoryId);

      // Ensure coordinates are numbers
      const factoryWithTimestamp = {
        ...factoryData,
        id: factoryId,
        isApproved:
          factoryData.isApproved !== undefined ? factoryData.isApproved : false,
        createdAt: factoryData.createdAt || Date.now(),
        longitude:
          factoryData.longitude !== undefined
            ? Number(factoryData.longitude)
            : undefined,
        latitude:
          factoryData.latitude !== undefined
            ? Number(factoryData.latitude)
            : undefined,
      };

      // Remove undefined values to prevent Firestore errors
      const cleanedData = Object.entries(factoryWithTimestamp).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

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

      console.log(
        `Found ${querySnapshot.size} documents in Factories collection`,
      );

      const factories: FirebaseFactory[] = [];

      // Process documents if they exist
      if (!querySnapshot.empty) {
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
            longitude: data['longitude'] || 0,
            latitude: data['latitude'] || 0,
            department: data['department'] || '',
            contactName: data['contactName'] || '',
            type: data['type'] || '',
            industry: data['industry'] || '',
            isApproved: data['isApproved'] || false,
            studentName: data['studentName'] || '',
            createdAt: this.convertToTimestamp(data['createdAt']) || Date.now(),
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

  public async handleFactoryRequest(
    factoryId: string,
    action: 'accept' | 'deny',
  ): Promise<boolean> {
    try {
      console.log(
        `Handling factory request ${factoryId} with action: ${action}`,
      );

      if (action === 'accept') {
        // Get the factory data to find the student who sent the request
        const factoryRef = doc(this.firestore, 'Factories', factoryId);
        const factorySnap = await getDoc(factoryRef);

        if (factorySnap.exists()) {
          const factoryData = factorySnap.data() as FirebaseFactory;
          const studentName = factoryData.studentName;

          // Find the student by name
          if (studentName) {
            const students = await this.getAllStudents();
            const student = students.find((s) => s.name === studentName);

            if (student) {
              console.log(
                `Found student ${student.name} with code ${student.code}`,
              );

              // Update the factory's students array and assignedStudents count
              const currentStudents = factoryData.students || [];
              const updatedStudents = [...currentStudents, student.code];
              const assignedStudents = updatedStudents.length;

              // Update the factory document
              await updateDoc(factoryRef, {
                isApproved: true,
                updatedAt: Date.now(),
                students: updatedStudents,
                assignedStudents: assignedStudents,
              });

              // Update the student's factory field
              if (student.code) {
                const studentsCollection = collection(
                  this.firestore,
                  'StudentsTable',
                );
                const studentQuery = query(
                  studentsCollection,
                  where('code', '==', student.code),
                );
                const studentQuerySnapshot = await getDocs(studentQuery);

                if (!studentQuerySnapshot.empty) {
                  const studentDoc = studentQuerySnapshot.docs[0];
                  await updateDoc(
                    doc(this.firestore, 'StudentsTable', studentDoc.id),
                    {
                      factory: factoryData.name,
                    },
                  );
                  console.log(
                    `Updated student ${student.name} with factory ${factoryData.name}`,
                  );
                }
              }

              console.log('Factory approved successfully and student assigned');
            } else {
              console.log(`Student with name ${studentName} not found`);
              // Still approve the factory even if student is not found
              await updateDoc(factoryRef, {
                isApproved: true,
                updatedAt: Date.now(),
              });
              console.log('Factory approved successfully');
            }
          } else {
            // No student name found, just approve the factory
            await updateDoc(factoryRef, {
              isApproved: true,
              updatedAt: Date.now(),
            });
            console.log('Factory approved successfully');
          }
        }
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
      console.error(
        `Error ${action === 'accept' ? 'accepting' : 'denying'} factory request:`,
        error,
      );
      return false;
    }
  }

  public getFactoryRequests(): FirebaseFactory[] {
    return this.factoryRequestsSubject.value;
  }
  public async updateUserProfileAndAuth(
    userId: string,
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
    },
    currentPassword: string,
  ): Promise<boolean> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user found');

      const credential = EmailAuthProvider.credential(
        userData.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      if (userData.email && userData.email !== currentUser.email) {
        await updateEmail(currentUser, userData.email);
      }
      if (userData.password) {
        await updatePassword(currentUser, userData.password);
      }

      // تحديث بيانات المستخدم في Firestore
      const userDocRef = doc(this.firestore, 'users', userId);
      const updateData: any = {};
      if (userData.firstName) updateData.firstName = userData.firstName;
      if (userData.lastName) updateData.lastName = userData.lastName;
      if (userData.email) updateData.email = userData.email;
      if (userData.phone) updateData.phone = userData.phone;

      updateData.timestamp = Date.now();

      await updateDoc(userDocRef, updateData);
      if (userData.password) updateData.password = userData.password;
      // حدث بيانات المستخدم في localStorage أيضاً
      const updatedUser = { ...this.currentUserValue, ...updateData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);

      return true;
    } catch (error) {
      console.error('Error updating user profile and auth:', error);
      return false;
    }
  }
}
