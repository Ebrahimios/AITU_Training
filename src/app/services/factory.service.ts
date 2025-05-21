import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService, FirebaseFactory, FirebaseSupervisor } from './firebase.service';

export interface Factory {
  id: number;
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
}

export interface Supervisor {
  id: number;
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
}

@Injectable({
  providedIn: 'root'
})
export class FactoryService {
  private factories = new BehaviorSubject<Factory[]>([]);
  factories$ = this.factories.asObservable();
  
  private supervisors = new BehaviorSubject<Supervisor[]>([]);
  supervisors$ = this.supervisors.asObservable();

  constructor(private authService: AuthService) {
    // Load factories and supervisors from Firebase when service initializes
    this.loadFactoriesFromFirebase();
    this.loadSupervisorsFromFirebase();
  }
  
  /**
   * Loads factories from Firebase and updates the BehaviorSubject
   */
  async loadFactoriesFromFirebase(): Promise<void> {
    try {
      const firebaseFactories = await this.authService.getAllFactories();
      
      // Convert Firebase factories to our local Factory interface
      const factories: Factory[] = firebaseFactories.map(f => ({
        id: Number(f.id) || Date.now(),
        name: f.name,
        capacity: f.capacity,
        assignedStudents: f.assignedStudents || 0,
        students: f.students || [],
        address: f.address,
        phone: f.phone,
        department: f.department,
        contactName: f.contactName,
        type: f.type || 'External',
        industry: f.industry
      }));
      
      this.factories.next(factories);
      console.log('Factories loaded from Firebase:', factories);
    } catch (error) {
      console.error('Error loading factories from Firebase:', error);
    }
  }

  getFactories(): Factory[] {
    return this.factories.value;
  }

  async addFactory(factory: Factory): Promise<void> {
    // Add to local state
    const currentFactories = this.factories.value;
    this.factories.next([...currentFactories, factory]);
    
    // Save to Firebase
    try {
      const firebaseFactory: FirebaseFactory = {
        id: factory.id.toString(),
        name: factory.name,
        capacity: factory.capacity,
        assignedStudents: factory.assignedStudents,
        students: factory.students || [],
        address: factory.address,
        phone: factory.phone,
        department: factory.department,
        contactName: factory.contactName,
        type: factory.type,
        industry: factory.industry,
        isApproved: true,
        createdAt: Date.now()
      };
      
      await this.authService.updateFactory(firebaseFactory);
    } catch (error) {
      console.error('Error saving factory to Firebase:', error);
    }
  }

  async updateFactory(updatedFactory: Factory): Promise<void> {
    // Update local state
    const currentFactories = this.factories.value;
    const index = currentFactories.findIndex(f => f.id === updatedFactory.id);
    if (index !== -1) {
      currentFactories[index] = updatedFactory;
      this.factories.next([...currentFactories]);
      
      // Update in Firebase
      try {
        const firebaseFactory: FirebaseFactory = {
          id: updatedFactory.id.toString(),
          name: updatedFactory.name,
          capacity: updatedFactory.capacity,
          assignedStudents: updatedFactory.assignedStudents,
          students: updatedFactory.students || [],
          address: updatedFactory.address,
          phone: updatedFactory.phone,
          department: updatedFactory.department,
          contactName: updatedFactory.contactName,
          type: updatedFactory.type,
          industry: updatedFactory.industry,
          isApproved: true,
          createdAt: Date.now()
        };
        
        await this.authService.updateFactory(firebaseFactory);
      } catch (error) {
        console.error('Error updating factory in Firebase:', error);
      }
    }
  }

  async deleteFactory(factoryId: number): Promise<void> {
    // Delete from local state
    const currentFactories = this.factories.value;
    this.factories.next(currentFactories.filter(f => f.id !== factoryId));
    
    // Delete from Firebase
    try {
      await this.authService.deleteFactory(factoryId.toString());
    } catch (error) {
      console.error('Error deleting factory from Firebase:', error);
    }
  }
  
  /**
   * Loads supervisors from Firebase and updates the BehaviorSubject
   */
  async loadSupervisorsFromFirebase(): Promise<void> {
    try {
      const firebaseSupervisors = await this.authService.getAllSupervisors();
      
      // Convert Firebase supervisors to our local Supervisor interface
      const supervisors: Supervisor[] = firebaseSupervisors.map(s => ({
        id: Number(s.id) || Date.now(),
        name: s.name,
        capacity: s.capacity,
        assignedStudents: s.assignedStudents || 0,
        students: s.students || [],
        address: s.address,
        phone: s.phone,
        department: s.department,
        contactName: s.contactName,
        type: s.type || 'Administrative Supervisor',
        industry: s.industry
      }));
      
      this.supervisors.next(supervisors);
      console.log('Supervisors loaded from Firebase:', supervisors);
    } catch (error) {
      console.error('Error loading supervisors from Firebase:', error);
    }
  }

  // Supervisor methods
  getSupervisors(): Supervisor[] {
    return this.supervisors.value;
  }

  async addSupervisor(supervisor: Supervisor): Promise<void> {
    // Add to local state
    const currentSupervisors = this.supervisors.value;
    this.supervisors.next([...currentSupervisors, supervisor]);
    
    // Save to Firebase
    try {
      const firebaseSupervisor: FirebaseSupervisor = {
        id: supervisor.id.toString(),
        name: supervisor.name,
        capacity: supervisor.capacity,
        assignedStudents: supervisor.assignedStudents,
        students: supervisor.students || [],
        address: supervisor.address,
        phone: supervisor.phone,
        department: supervisor.department,
        contactName: supervisor.contactName,
        type: supervisor.type,
        industry: supervisor.industry,
        isApproved: true,
        createdAt: Date.now()
      };
      
      await this.authService.updateSupervisor(firebaseSupervisor);
    } catch (error) {
      console.error('Error saving supervisor to Firebase:', error);
    }
  }

  async updateSupervisor(updatedSupervisor: Supervisor): Promise<void> {
    // Update local state
    const currentSupervisors = this.supervisors.value;
    const index = currentSupervisors.findIndex(s => s.id === updatedSupervisor.id);
    if (index !== -1) {
      currentSupervisors[index] = updatedSupervisor;
      this.supervisors.next([...currentSupervisors]);
      
      // Update in Firebase
      try {
        const firebaseSupervisor: FirebaseSupervisor = {
          id: updatedSupervisor.id.toString(),
          name: updatedSupervisor.name,
          capacity: updatedSupervisor.capacity,
          assignedStudents: updatedSupervisor.assignedStudents,
          students: updatedSupervisor.students || [],
          address: updatedSupervisor.address,
          phone: updatedSupervisor.phone,
          department: updatedSupervisor.department,
          contactName: updatedSupervisor.contactName,
          type: updatedSupervisor.type,
          industry: updatedSupervisor.industry,
          isApproved: true,
          createdAt: Date.now()
        };
        
        await this.authService.updateSupervisor(firebaseSupervisor);
      } catch (error) {
        console.error('Error updating supervisor in Firebase:', error);
      }
    }
  }

  async deleteSupervisor(supervisorId: number): Promise<void> {
    // Delete from local state
    const currentSupervisors = this.supervisors.value;
    this.supervisors.next(currentSupervisors.filter(s => s.id !== supervisorId));
    
    // Delete from Firebase
    try {
      await this.authService.deleteSupervisor(supervisorId.toString());
    } catch (error) {
      console.error('Error deleting supervisor from Firebase:', error);
    }
  }
}
