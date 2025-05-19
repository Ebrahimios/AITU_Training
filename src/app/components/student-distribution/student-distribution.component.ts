import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { NavbarComponent } from '../navbar/navbar.component';
import { TranslationService } from '../../services/translation.service';
import { FactoryService, Factory } from '../../services/factory.service';
import { DistributionService, Student } from '../../services/distribution.service';
import * as bootstrap from 'bootstrap';

// Using Student interface from distribution.service

@Component({
    selector: 'app-student-distribution',
    imports: [CommonModule, FormsModule, MatDialogModule, DragDropModule, RouterModule],
    templateUrl: './student-distribution.component.html',
    styleUrls: ['./student-distribution.component.css']
})
export class StudentDistributionComponent implements OnInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;

  factoryTypes: string[] = ['All', 'Internal', 'External'];
  selectedFactoryType: string = 'All';
  isEditing: boolean = false;
  originalFactoryData: Factory | null = null;

  // Error messages
  nameError: string = '';
  addressError: string = '';
  phoneError: string = '';
  industryError: string = '';
  contactNameError: string = '';

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private distributionService: DistributionService
  ) {}

  students: Student[] = [];

  factories: Factory[] = [];
  factoryDropLists: string[] = [];

  departments: string[] = ['All', 'IT', 'Mechanics', 'Electrical'];
  stages: string[] = ['All', 'School', 'Institute', 'Faculty'];
  batches: string[] = ['All', 'Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  selectedDepartment: string = 'All';
  selectedStage: string = 'All';
  selectedBatch: string = 'All';
  searchTerm: string = '';
  factorySearchTerm: string = '';
  selectAll: boolean = false;
  selectedFactory: Factory | null = null;

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
      const notAssigned = !student.factory;

      return matchesDepartment && matchesStage && matchesBatch && matchesSearch && notAssigned;
    });
  }

  get filteredFactories(): Factory[] {
    return this.factories
      .filter(f => this.selectedFactoryType === 'All' || f.type === this.selectedFactoryType)
      .filter(f => f.name.toLowerCase().includes(this.factorySearchTerm.toLowerCase()));
  }

  get selectedStudents(): Student[] {
    return this.students.filter(student => student.selected);
  }
  ngOnInit(): void {
    // Subscribe to factories
    this.factoryService.factories$.subscribe(factories => {
      this.factories = factories;
      this.updateFactoryAssignments();
      this.factoryDropLists = this.factories.map(f => `factory-${f.id}`);
    });
    
    // Subscribe to students
    this.distributionService.students$.subscribe(students => {
      this.students = students;
    });
  }

  ngAfterViewInit(): void {
    this.dropLists.changes.subscribe(() => {
      this.factoryDropLists = this.factories.map(f => `factory-${f.id}`);
    });
  }

  openFactoryDetails(factory: Factory): void {
    this.selectedFactory = factory;
    this.isEditing = false;
    this.originalFactoryData = { ...factory };
    const modalElement = document.getElementById('factoryDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.selectedFactory && this.originalFactoryData) {
      Object.assign(this.selectedFactory, this.originalFactoryData);
    }
    this.isEditing = false;
  }

  saveChanges(): void {
    if (this.selectedFactory) {
      if (confirm('Are you sure you want to save these changes?')) {
        this.factoryService.updateFactory(this.selectedFactory);
        this.isEditing = false;

        // Close the modal
        const modalElement = document.getElementById('factoryDetailsModal');
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

  onDrop(event: CdkDragDrop<Student[]>, factory?: Factory): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const selectedStudents = this.selectedStudents;

      if (selectedStudents.length > 0) {
        // Handle multiple students drop
        if (factory) {
          // Check if factory has enough capacity
          if (factory.assignedStudents + selectedStudents.length > factory.capacity) {
            alert(`Factory ${factory.name} doesn't have enough capacity for ${selectedStudents.length} students`);
            return;
          }

          // Remove from previous factories if exists
          selectedStudents.forEach(student => {
            if (student.factory) {
              const prevFactory = this.factories.find(f => f.name === student.factory);
              if (prevFactory) {
                const index = prevFactory.students.indexOf(student);
                if (index > -1) {
                  prevFactory.students.splice(index, 1);
                  prevFactory.assignedStudents--;
                  // Update the previous factory
                  this.factoryService.updateFactory(prevFactory);
                }
              }
            }
            
            // Update student in distribution service
            this.distributionService.assignStudentToFactory(student, factory.name);
            
            // Update local reference
            student.factory = factory.name;
          });

          // Add all selected students to the new factory, avoiding duplicates
          selectedStudents.forEach(student => {
            // Check if student with same name already exists in the factory
            const isDuplicate = factory.students.some(existingStudent => existingStudent.name === student.name);
            if (!isDuplicate) {
              factory.students.push(student);
            }
          });
          factory.assignedStudents = factory.students.length;
          
          // Update the factory
          this.factoryService.updateFactory(factory);
        }
      } else {
        // Handle single student drop
        const student: Student = event.item.data;
        if (factory) {
          if (factory.assignedStudents >= factory.capacity) {
            alert(`Factory ${factory.name} is at full capacity (${factory.capacity})`);
            return;
          }
          if (student.factory) {
            const prevFactory = this.factories.find(f => f.name === student.factory);
            if (prevFactory) {
              const index = prevFactory.students.indexOf(student);
              if (index > -1) {
                prevFactory.students.splice(index, 1);
                prevFactory.assignedStudents--;
                // Update the previous factory
                this.factoryService.updateFactory(prevFactory);
              }
            }
          }
          
          // Update student in distribution service
          this.distributionService.assignStudentToFactory(student, factory.name);
          
          // Update local reference
          student.factory = factory.name;
          
          // Check if student with same name already exists in the factory
          const isDuplicate = factory.students.some(existingStudent => existingStudent.name === student.name);
          
          if (!isDuplicate) {
            transferArrayItem(
              event.previousContainer.data,
              event.container.data,
              event.previousIndex,
              event.currentIndex
            );
            factory.students = [...event.container.data];
            factory.assignedStudents = factory.students.length;
            
            // Update the factory
            this.factoryService.updateFactory(factory);
          } else {
            // If duplicate, don't transfer but update the UI to show it's assigned
            // Remove from visible list without transferring to factory again
            const index = event.previousContainer.data.indexOf(student);
            if (index > -1) {
              event.previousContainer.data.splice(index, 1);
            }
          }
        }
      }
    }
  }

  removeFromFactory(student: Student, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const factory = this.factories.find(f => f.name === student.factory);
    if (factory) {
      // Find the student by name and id to handle potential duplicates
      const index = factory.students.findIndex(s => s.id === student.id && s.name === student.name);
      if (index > -1) {
        factory.students.splice(index, 1);
        factory.assignedStudents--;
        
        // Update the factory in the service
        this.factoryService.updateFactory(factory);
        
        // Update the student in the distribution service
        this.distributionService.assignStudentToFactory(student, null);
      }
    }
  }

  private updateFactoryAssignments(): void {
    this.factories.forEach(factory => {
      factory.assignedStudents = factory.students.length;
    });
  }

  addFactory(name: string, address: string, phone: string, contactName: string, industry: string, capacity: string, type: string): void {
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

    // Validate capacity
    let capacityValue = parseInt(capacity);
    if (isNaN(capacityValue) || capacityValue <= 0) {
      this.industryError = this.translationService.translate('invalid_capacity');
      return;
    }

    const newFactory: Factory = {
      id: this.factories.length + 1,
      name: name.trim(),
      capacity: capacityValue,
      assignedStudents: 0,
      students: [],
      address: address.trim(),
      phone: phone.trim(),
      industry,
      contactName: contactName.trim(),
      type: type || 'Internal'
    };

    this.factoryService.addFactory(newFactory);

    // Close the modal
    const modalElement = document.getElementById('addFactoryModal');
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
