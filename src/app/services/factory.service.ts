import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  constructor() {
    // Initialize with default factories
    const defaultFactories: Factory[] = [
      {
        id: 1,
        name: 'Factory A',
        capacity: 3,
        assignedStudents: 0,
        students: [],
        address: '123 Industrial Zone',
        phone: '01012345678',
        department: 'IT',
        contactName: 'Ahmed Ibrahim',
        type: 'Administrative Supervisor',
        industry: 'Technology'
      },
      {
        id: 2,
        name: 'Factory B',
        capacity: 2,
        assignedStudents: 0,
        students: [],
        address: '456 Business Park',
        phone: '01087654321',
        department: 'Mechanics',
        contactName: 'Mahmoud Ali',
        type: 'Technical Supervisor',
        industry: 'Manufacturing'
      },
      {
        id: 3,
        name: 'Factory C',
        capacity: 2,
        assignedStudents: 0,
        students: [],
        address: '789 Tech Valley',
        phone: '01011223344',
        department: 'Electrical',
        contactName: 'Sara Hassan',
        type: 'Administrative Supervisor',
        industry: 'Energy'
      }
    ];
    this.factories.next(defaultFactories);
    
    // Initialize with default supervisors
    const defaultSupervisors: Supervisor[] = [
      {
        id: 1,
        name: 'Supervisor A',
        capacity: 3,
        assignedStudents: 0,
        students: [],
        address: '123 University Campus',
        phone: '01012345678',
        department: 'IT',
        contactName: 'Mohamed Ahmed',
        type: 'Administrative Supervisor',
        industry: 'Education'
      },
      {
        id: 2,
        name: 'Supervisor B',
        capacity: 2,
        assignedStudents: 0,
        students: [],
        address: '456 Research Center',
        phone: '01087654321',
        department: 'Mechanics',
        contactName: 'Ali Hassan',
        type: 'Technical Supervisor',
        industry: 'Research'
      },
      {
        id: 3,
        name: 'Supervisor C',
        capacity: 2,
        assignedStudents: 0,
        students: [],
        address: '789 Innovation Hub',
        phone: '01011223344',
        department: 'Electrical',
        contactName: 'Nora Mahmoud',
        type: 'Administrative Supervisor',
        industry: 'Innovation'
      }
    ];
    this.supervisors.next(defaultSupervisors);
  }

  getFactories(): Factory[] {
    return this.factories.value;
  }

  addFactory(factory: Factory): void {
    const currentFactories = this.factories.value;
    this.factories.next([...currentFactories, factory]);
  }

  updateFactory(updatedFactory: Factory): void {
    const currentFactories = this.factories.value;
    const index = currentFactories.findIndex(f => f.id === updatedFactory.id);
    if (index !== -1) {
      currentFactories[index] = updatedFactory;
      this.factories.next([...currentFactories]);
    }
  }

  deleteFactory(factoryId: number): void {
    const currentFactories = this.factories.value;
    this.factories.next(currentFactories.filter(f => f.id !== factoryId));
  }
  
  // Supervisor methods
  getSupervisors(): Supervisor[] {
    return this.supervisors.value;
  }

  addSupervisor(supervisor: Supervisor): void {
    const currentSupervisors = this.supervisors.value;
    this.supervisors.next([...currentSupervisors, supervisor]);
  }

  updateSupervisor(updatedSupervisor: Supervisor): void {
    const currentSupervisors = this.supervisors.value;
    const index = currentSupervisors.findIndex(s => s.id === updatedSupervisor.id);
    if (index !== -1) {
      currentSupervisors[index] = updatedSupervisor;
      this.supervisors.next([...currentSupervisors]);
    }
  }

  deleteSupervisor(supervisorId: number): void {
    const currentSupervisors = this.supervisors.value;
    this.supervisors.next(currentSupervisors.filter(s => s.id !== supervisorId));
  }
}
