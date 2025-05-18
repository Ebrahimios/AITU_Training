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

@Injectable({
  providedIn: 'root'
})
export class FactoryService {
  private factories = new BehaviorSubject<Factory[]>([]);
  factories$ = this.factories.asObservable();

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
        type: 'Internal',
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
        type: 'External',
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
        type: 'Internal',
        industry: 'Energy'
      }
    ];
    this.factories.next(defaultFactories);
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
}
