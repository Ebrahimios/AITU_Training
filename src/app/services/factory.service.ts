import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AuthService,
  FirebaseFactory,
  FirebaseSupervisor,
} from './firebase.service';

export interface Factory {
  id: string;
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
  supervisors: any[],
  assignedSupervisors: number,
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
  type: string;
  supervisors: any[];
  assignedSupervisors: number;
}

@Injectable({
  providedIn: 'root',
})
export class FactoryService {
  private factories = new BehaviorSubject<Factory[]>([]);
  factories$ = this.factories.asObservable();

  private supervisors = new BehaviorSubject<Supervisor[]>([]);
  supervisors$ = this.supervisors.asObservable();

  constructor(private authService: AuthService) {
    // Subscribe to real-time data from Firebase
    this.subscribeToFactoriesStream();
    this.subscribeToSupervisorsStream();
  }

  /**
   * Subscribe to the real-time factories stream from the Firebase service
   */
  private subscribeToFactoriesStream(): void {
    this.authService.factories$.subscribe((firebaseFactories) => {
      // Filter out factories where isApproved is false
      const approvedFactories = firebaseFactories.filter(
        (f) => f.isApproved === true,
      );

      // Convert Firebase factories to our local Factory interface
      const factories: Factory[] = approvedFactories.map((f) => {
        // console.log(
        //   'Processing factory:',
        //   f.name,
        //   'with coordinates:',
        //   f.longitude,
        //   f.latitude,
        // );
        return {
          id: f.id!,
          name: f.name,
          capacity: f.capacity,
          assignedStudents: f.assignedStudents || 0,
          students: f.students || [],
          address: f.address,
          phone: f.phone,
          department: f.department,
          contactName: f.contactName,
          type: f.type || 'External',
          industry: f.industry,
          supervisors: f.supervisors || [],
          assignedSupervisors: f.assignedSupervisors || 0,
          longitude:
            f.longitude !== undefined ? Number(f.longitude) : undefined,
          latitude: f.latitude !== undefined ? Number(f.latitude) : undefined,
        };
      });

      this.factories.next(factories);
      console.log(
        'Real-time factories updated:',
        factories.length,
        'factories',
      );
    });
  }

  /**
   * Subscribe to the real-time supervisors stream from the Firebase service
   */
  private subscribeToSupervisorsStream(): void {
    this.authService.supervisors$.subscribe((firebaseSupervisors) => {
      // Filter out supervisors where isApproved is false
      const approvedSupervisors = firebaseSupervisors.filter(
        (s) => s.isApproved === true,
      );

      // Convert Firebase supervisors to our local Supervisor interface
      const supervisors: Supervisor[] = approvedSupervisors.map((s) => ({
        id: Number(s.id) || Date.now(),
        name: s.name,
        capacity: s.capacity,
        assignedStudents: s.assignedStudents || 0,
        students: s.students || [],
        address: s.address,
        phone: s.phone,
        department: s.department,
        type: s.type || 'Administrative Supervisor',
        supervisors: s.supervisors || [],
        assignedSupervisors: s.assignedSupervisors || 0,
      }));

      this.supervisors.next(supervisors);
      console.log(
        'Real-time supervisors updated:',
        supervisors.length,
        'supervisors',
      );
    });
  }

  /**
   * Loads factories from Firebase and updates the BehaviorSubject (legacy method)
   * @deprecated Use the real-time subscription instead
   */
  async loadFactoriesFromFirebase(): Promise<void> {
    try {
      const firebaseFactories = await this.authService.getAllFactories();

      // Filter out factories where isApproved is false
      const approvedFactories = firebaseFactories.filter(
        (f) => f.isApproved === true,
      );

      // Convert Firebase factories to our local Factory interface
      const factories: Factory[] = approvedFactories.map((f) => ({
        id: f.id!,
        name: f.name,
        capacity: f.capacity,
        assignedStudents: f.assignedStudents || 0,
        students: f.students || [],
        address: f.address,
        phone: f.phone,
        department: f.department,
        contactName: f.contactName,
        type: f.type || 'External',
        industry: f.industry,
        longitude: f.longitude,
        latitude: f.latitude,
        supervisors: f.supervisors || [],
        assignedSupervisors: f.assignedSupervisors || 0,
      }));

      this.factories.next(factories);
      console.log('Approved factories loaded from Firebase:', factories);
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
        longitude: factory.longitude,
        latitude: factory.latitude,
        isApproved: true,
        createdAt: Date.now(),
        supervisors: factory.supervisors || [],
        assignedSupervisors: factory.assignedSupervisors || 0,
      };

      await this.authService.updateFactory(firebaseFactory);
    } catch (error) {
      console.error('Error saving factory to Firebase:', error);
    }
  }

  async updateFactory(updatedFactory: Factory): Promise<void> {
    // Update local state
    const currentFactories = this.factories.value;
    const index = currentFactories.findIndex((f) => f.id === updatedFactory.id);
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
          longitude: updatedFactory.longitude,
          latitude: updatedFactory.latitude,
          isApproved: true,
          createdAt: Date.now(),
          supervisors: updatedFactory.supervisors || [],
          assignedSupervisors: updatedFactory.assignedSupervisors || 0,
        };

        await this.authService.updateFactory(firebaseFactory);
      } catch (error) {
        console.error('Error updating factory in Firebase:', error);
      }
    }
  }

  async deleteFactory(factoryId: string): Promise<void> {
    // Delete from local state
    const currentFactories = this.factories.value;
    this.factories.next(currentFactories.filter((f) => f.id !== factoryId));

    // Delete from Firebase
    try {
      await this.authService.deleteFactory(factoryId.toString());
    } catch (error) {
      console.error('Error deleting factory from Firebase:', error);
    }
  }

  /**
   * Loads supervisors from Firebase and updates the BehaviorSubject (legacy method)
   * @deprecated Use the real-time subscription instead
   */
  async loadSupervisorsFromFirebase(): Promise<void> {
    try {
      const firebaseSupervisors = await this.authService.getAllSupervisors();

      // Filter out supervisors where isApproved is false
      const approvedSupervisors = firebaseSupervisors.filter(
        (s) => s.isApproved === true,
      );

      // Convert Firebase supervisors to our local Supervisor interface
      const supervisors: Supervisor[] = approvedSupervisors.map((s) => ({
        id: Number(s.id) || Date.now(),
        name: s.name,
        capacity: s.capacity,
        assignedStudents: s.assignedStudents || 0,
        students: s.students || [],
        address: s.address,
        phone: s.phone,
        department: s.department,
        type: s.type || 'Administrative Supervisor',
        supervisors: s.supervisors || [],
        assignedSupervisors: s.assignedSupervisors || 0,
      }));

      this.supervisors.next(supervisors);
      console.log('Approved supervisors loaded from Firebase:', supervisors);
    } catch (error) {
      console.error('Error loading supervisors from Firebase:', error);
    }
  }

  // Supervisor methods
  getSupervisors(): Supervisor[] {
    return this.supervisors.value;
  }

  async addSupervisor(supervisor: FirebaseSupervisor): Promise<void> {
    // Add to local state
    const currentSupervisors = this.supervisors.value;
    this.supervisors.next([...currentSupervisors, supervisor as unknown as Supervisor]);

    // Save to Firebase
    try {
      const firebaseSupervisor: FirebaseSupervisor = {
        id: supervisor?.id?.toString(),
        name: supervisor.name,
        capacity: supervisor.capacity,
        assignedStudents: supervisor.assignedStudents,
        students: supervisor.students || [],
        address: supervisor.address,
        phone: supervisor.phone,
        department: supervisor.department,
        type: supervisor.type,
        isApproved: true,
        createdAt: Date.now(),
        supervisors: supervisor.supervisors || [],
        assignedSupervisors: supervisor.assignedSupervisors || 0,
      };

      await this.authService.updateSupervisor(firebaseSupervisor);
    } catch (error) {
      console.error('Error saving supervisor to Firebase:', error);
    }
  }

  async updateSupervisor(updatedSupervisor: Supervisor): Promise<void> {
    // Update local state
    const currentSupervisors = this.supervisors.value;
    const index = currentSupervisors.findIndex(
      (s) => s.id === updatedSupervisor.id,
    );
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
          type: updatedSupervisor.type,
          isApproved: true,
          createdAt: Date.now(),
          supervisors: updatedSupervisor.supervisors || [],
          assignedSupervisors: updatedSupervisor.assignedSupervisors || 0,
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
    this.supervisors.next(
      currentSupervisors.filter((s) => s.id !== supervisorId),
    );

    // Delete from Firebase
    try {
      await this.authService.deleteSupervisor(supervisorId.toString());
    } catch (error) {
      console.error('Error deleting supervisor from Firebase:', error);
    }
  }

  /**
   * Approve a factory request by setting isApproved to true
   * @param factoryId The ID of the factory to approve
   * @returns Promise<boolean> indicating success or failure
   */
  async approveFactoryRequest(factoryId: number): Promise<boolean> {
    try {
      // Call the AuthService to handle the factory request approval
      const success = await this.authService.handleFactoryRequest(
        factoryId.toString(),
        'accept',
      );

      if (success) {
        // Refresh the factories list to reflect the changes
        await this.loadFactoriesFromFirebase();
        console.log('Factory request approved successfully');
      }

      return success;
    } catch (error) {
      console.error('Error approving factory request:', error);
      return false;
    }
  }
}
