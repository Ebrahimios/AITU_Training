import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { NavbarComponent } from '../navbar/navbar.component';
import { TranslationService } from '../../services/translation.service';
import { FactoryService, Factory, Supervisor } from '../../services/factory.service';
import { DistributionService, Student } from '../../services/distribution.service';
import * as bootstrap from 'bootstrap';

// Using Student interface from distribution.service

@Component({
    selector: 'app-student-distribution',
    imports: [CommonModule, FormsModule, MatDialogModule, DragDropModule, RouterModule],
    templateUrl: './supervisor-distribution.component.html',
    styleUrls: ['./supervisor-distribution.component.css']
})
export class SupervisorDistributionComponent implements OnInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;

  supervisorTypes: string[] = ['All', 'Administrative Supervisor', 'Technical Supervisor'];
  selectedSupervisorType: string = 'All';
  isEditing: boolean = false;
  originalSupervisorData: Supervisor | null = null;

  // Error messages
  nameError: string = '';
  addressError: string = '';
  phoneError: string = '';
  departmentError: string = '';
  contactNameError: string = '';
  industryError: string = '';

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private distributionService: DistributionService
  ) {}

  students: Student[] = [];

  supervisors: Supervisor[] = [];
  supervisorDropLists: string[] = [];

  departments: string[] = ['All', 'IT', 'Mechanics', 'Electrical'];
  stages: string[] = ['All', 'School', 'Institute', 'Faculty'];
  batches: string[] = ['All', 'Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  selectedDepartment: string = 'All';
  selectedStage: string = 'All';
  selectedBatch: string = 'All';
  searchTerm: string = '';
  supervisorSearchTerm: string = '';
  selectAll: boolean = false;
  selectedSupervisor: Supervisor | null = null;

  industries: string[] = [
    'Manufacturing',
    'Technology',
    'Healthcare',
    'Construction',
    'Agriculture',
    'Energy',
    'Transportation',
    'Retail'
  ];
  newIndustry: string = '';

  get filteredStudents(): Student[] {
    return this.students.filter(student => {
      const matchesDepartment = this.selectedDepartment === 'All' || student.department === this.selectedDepartment;
      const matchesStage = this.selectedStage === 'All' || student.stage === this.selectedStage;
      const matchesBatch = this.selectedBatch === 'All' || student.batch === this.selectedBatch;
      const matchesSearch = student.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const notAssigned = !student.supervisor;

      return matchesDepartment && matchesStage && matchesBatch && matchesSearch && notAssigned;
    });
  }

  get filteredSupervisors(): Supervisor[] {
    return this.supervisors
      .filter(s => this.selectedSupervisorType === 'All' || s.type === this.selectedSupervisorType)
      .filter(s => s.name.toLowerCase().includes(this.supervisorSearchTerm.toLowerCase()));
  }

  get selectedStudents(): Student[] {
    return this.students.filter(student => student.selected);
  }

  ngOnInit(): void {
    // Subscribe to supervisors
    this.factoryService.supervisors$.subscribe(supervisors => {
      this.supervisors = supervisors;
      this.updateSupervisorAssignments();
      this.supervisorDropLists = this.supervisors.map(s => `supervisor-${s.id}`);
    });
    
    // Subscribe to students
    this.distributionService.students$.subscribe(students => {
      this.students = students;
    });
  }

  ngAfterViewInit(): void {
    this.dropLists.changes.subscribe(() => {
      this.supervisorDropLists = this.supervisors.map(s => `supervisor-${s.id}`);
    });
  }

  openSupervisorDetails(supervisor: Supervisor): void {
    this.selectedSupervisor = supervisor;
    this.isEditing = false;
    this.originalSupervisorData = { ...supervisor };
    const modalElement = document.getElementById('supervisorDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.selectedSupervisor && this.originalSupervisorData) {
      Object.assign(this.selectedSupervisor, this.originalSupervisorData);
    }
    this.isEditing = false;
  }

  saveChanges(): void {
    if (this.selectedSupervisor) {
      if (confirm('Are you sure you want to save these changes?')) {
        this.factoryService.updateSupervisor(this.selectedSupervisor);
        this.isEditing = false;

        // Close the modal
        const modalElement = document.getElementById('supervisorDetailsModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
              backdrop.remove();
            }
          }
        }
        alert('Changes saved successfully');
      }
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.filteredStudents.forEach(student => {
      student.selected = this.selectAll;
    });
  }

  toggleSelection(event: MouseEvent, student: Student): void {
    if (event.ctrlKey || event.metaKey) {
      student.selected = !student.selected;
    } else if (event.shiftKey && this.lastSelectedStudent) {
      const currentIndex = this.filteredStudents.indexOf(student);
      const lastIndex = this.filteredStudents.indexOf(this.lastSelectedStudent);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);

      for (let i = start; i <= end; i++) {
        this.filteredStudents[i].selected = true;
      }
    } else {
      student.selected = !student.selected;
    }
    this.lastSelectedStudent = student;
    this.updateSelectAllState();
  }

  private lastSelectedStudent: Student | null = null;

  private updateSelectAllState(): void {
    const filteredStudents = this.filteredStudents;
    this.selectAll = filteredStudents.length > 0 && filteredStudents.every(student => student.selected);
  }

  onDrop(event: CdkDragDrop<Student[]>, supervisor?: Supervisor): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const selectedStudents = this.selectedStudents;

      if (selectedStudents.length > 0) {
        // Handle multiple students drop
        if (supervisor) {
          // Check if supervisor has enough capacity
          if (supervisor.assignedStudents + selectedStudents.length > supervisor.capacity) {
            alert(`Supervisor ${supervisor.name} doesn't have enough capacity for ${selectedStudents.length} students`);
            return;
          }

          // Remove from previous supervisors if exists
          selectedStudents.forEach(student => {
            if (student.supervisor) {
              const prevSupervisor = this.supervisors.find(s => s.name === student.supervisor);
              if (prevSupervisor) {
                const index = prevSupervisor.students.indexOf(student);
                if (index > -1) {
                  prevSupervisor.students.splice(index, 1);
                  prevSupervisor.assignedStudents--;
                  // Update the previous supervisor
                  this.factoryService.updateSupervisor(prevSupervisor);
                }
              }
            }
            
            // Update student in distribution service
            this.distributionService.assignStudentToSupervisor(student, supervisor.name);
            
            // Update local reference
            student.supervisor = supervisor.name;
          });

          // Add all selected students to the new supervisor
          supervisor.students.push(...selectedStudents);
          supervisor.assignedStudents = supervisor.students.length;
          
          // Update the supervisor
          this.factoryService.updateSupervisor(supervisor);
        }
      } else {
        // Handle single student drop
        const student: Student = event.item.data;
        if (supervisor) {
          if (supervisor.assignedStudents >= supervisor.capacity) {
            alert(`Supervisor ${supervisor.name} is at full capacity (${supervisor.capacity})`);
            return;
          }
          if (student.supervisor) {
            const prevSupervisor = this.supervisors.find(s => s.name === student.supervisor);
            if (prevSupervisor) {
              const index = prevSupervisor.students.indexOf(student);
              if (index > -1) {
                prevSupervisor.students.splice(index, 1);
                prevSupervisor.assignedStudents--;
                // Update the previous supervisor
                this.factoryService.updateSupervisor(prevSupervisor);
              }
            }
          }
          
          // Update student in distribution service
          this.distributionService.assignStudentToSupervisor(student, supervisor.name);
          
          // Update local reference
          student.supervisor = supervisor.name;
        }
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
        if (supervisor) {
          supervisor.students = [...event.container.data];
          supervisor.assignedStudents = supervisor.students.length;
          // Update the supervisor
          this.factoryService.updateSupervisor(supervisor);
        }
      }
    }
  }

  removeFromSupervisor(student: Student, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const supervisor = this.supervisors.find(s => s.name === student.supervisor);
    if (supervisor) {
      const index = supervisor.students.indexOf(student);
      if (index > -1) {
        supervisor.students.splice(index, 1);
        supervisor.assignedStudents--;
        
        // Update the supervisor in the service
        this.factoryService.updateSupervisor(supervisor);
        
        // Update the student in the distribution service
        this.distributionService.assignStudentToSupervisor(student, null);
      }
    }
  }

  private updateSupervisorAssignments(): void {
    this.supervisors.forEach(supervisor => {
      supervisor.assignedStudents = supervisor.students.length;
    });
  }

  addSupervisor(name: string, address: string, phone: string, industry: string, contactName: string): void {
    // Reset error messages
    this.nameError = '';
    this.addressError = '';
    this.phoneError = '';
    this.industryError = '';
    this.contactNameError = '';

    let hasError = false;

    // Name validation
    if (!name || name.trim().length < 3) {
      this.nameError = 'Factory name must be at least 3 characters long';
      hasError = true;
    }

    // Address validation
    if (!address || address.trim().length < 5) {
      this.addressError = 'Address must be at least 5 characters long';
      hasError = true;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      this.phoneError = 'Phone number must contain only numbers (10-15 digits)';
      hasError = true;
    }

    // Industry validation
    if (!industry || industry === '') {
      this.industryError = 'Please select an industry';
      hasError = true;
    }

    // Contact Name validation
    if (!contactName || contactName.trim().length < 3) {
      this.contactNameError = 'Contact name must be at least 3 characters long';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const newSupervisor: Supervisor = {
      id: this.supervisors.length + 1,
      name: name.trim(),
      capacity: 5,
      assignedStudents: 0,
      students: [],
      address: address.trim(),
      phone: phone.trim(),
      industry,
      contactName: contactName.trim(),
      type: 'Administrative Supervisor'
    };

    this.factoryService.addSupervisor(newSupervisor);

    // Close the modal
    const modalElement = document.getElementById('addSupervisorModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
    }

    alert('Factory added successfully');
  }

  addNewIndustry() {
    if (this.newIndustry && !this.industries.includes(this.newIndustry)) {
      this.industries.push(this.newIndustry);
      this.newIndustry = '';
    }
  }
}
