import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Factory } from './factory.service';

export interface Student {
  id: number;
  name: string;
  factory: string | null;
  supervisor: string | null;
  department: string;
  batch: string;
  stage: string;
  selected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DistributionService {
  // Shared students data
  private students = new BehaviorSubject<Student[]>([]);
  students$ = this.students.asObservable();

  constructor() {}

  // Get all students
  getStudents(): Student[] {
    return this.students.value;
  }

  // Update a student
  updateStudent(updatedStudent: Student): void {
    const currentStudents = this.students.value;
    const index = currentStudents.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
      currentStudents[index] = updatedStudent;
      this.students.next([...currentStudents]);
    }
  }

  // Add a student
  addStudent(student: Student): void {
    const currentStudents = this.students.value;
    this.students.next([...currentStudents, student]);
  }

  // Assign student to factory
  assignStudentToFactory(student: Student, factoryName: string | null): void {
    const currentStudents = this.students.value;
    const index = currentStudents.findIndex(s => s.id === student.id);
    if (index !== -1) {
      currentStudents[index].factory = factoryName;
      this.students.next([...currentStudents]);
    }
  }

  // Assign student to supervisor
  assignStudentToSupervisor(student: Student, supervisorName: string | null): void {
    const currentStudents = this.students.value;
    const index = currentStudents.findIndex(s => s.id === student.id);
    if (index !== -1) {
      currentStudents[index].supervisor = supervisorName;
      this.students.next([...currentStudents]);
    }
  }

  // Get unassigned students (no factory)
  getUnassignedFactoryStudents(): Student[] {
    return this.students.value.filter(student => !student.factory);
  }

  // Get unassigned students (no supervisor)
  getUnassignedSupervisorStudents(): Student[] {
    return this.students.value.filter(student => !student.supervisor);
  }

  // Get students assigned to a specific factory
  getStudentsByFactory(factoryName: string): Student[] {
    return this.students.value.filter(student => student.factory === factoryName);
  }

  // Get students assigned to a specific supervisor
  getStudentsBySupervisor(supervisorName: string): Student[] {
    return this.students.value.filter(student => student.supervisor === supervisorName);
  }
}
