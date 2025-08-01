import { Component, OnInit, ViewChildren, QueryList, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { NavbarComponent } from '../navbar/navbar.component';
import { TranslationService } from '../../services/translation.service';
import { FactoryService } from '../../services/factory.service';
import { AuthService, FirebaseFactory, FirebaseSupervisor, Supervisor } from '../../services/firebase.service';
import { DataUpdateService } from '../../services/data-update.service';
import { Student } from '../../interfaces/student';
import * as bootstrap from 'bootstrap';

// Define Factory interface locally to work with Student from interfaces directory
export interface Factory {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  contactName?: string;
  industry?: string;
  capacity: number;
  supervisorCapacity?: number;
  type: string;
  students: Student[];
  supervisors: Supervisor[];
  assignedStudents: number;
  assignedSupervisors: number;
  longitude?: number; 
  latitude?: number; 
}

@Component({
  selector: 'app-student-distribution',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    DragDropModule,
    RouterModule,
  ],
  templateUrl: './student-distribution.component.html',
  styleUrls: ['./student-distribution.component.css'],
})
export class StudentDistributionComponent implements OnInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;
  activeTab: 'students' | 'supervisors' = 'students';
  _filteredSupervisors: Supervisor[] = [];

  factoryTypes: string[] = ['Internal', 'External'];
  selectedFactoryType: string = 'All';
  isEditing: boolean = false;
  originalFactoryData: Factory | null = null;
  coordinatesInput: string = '';
  factoryCoordinates: string = '';

  // Error messages
  nameError: string = '';
  addressError: string = '';
  phoneError: string = '';
  industryError: string = '';
  contactNameError: string = '';
  coordinatesError: string = '';

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private authService: AuthService,
    private dataUpdateService: DataUpdateService,
  ) {
    this.loadSuperVisorsData()
  }

  async loadSuperVisorsData() {
    this._filteredSupervisors = await this.authService.getAllSupervisorsUsers()
  }

  setActiveTab(tab: 'students' | 'supervisors') {
    this.activeTab = tab;
  }

  students: Student[] = [];

  factories: Factory[] = [];
  factoryDropLists: string[] = [];

  departments: string[] = [];
  stages: string[] = [];
  batches: any[] = [];
  selectedDepartment: string = 'All';
  selectedStage: string = 'All';
  selectedBatch: string = 'All';
  searchTerm: string = '';
  factorySearchTerm: string = '';
  selectAll: boolean = false;
  selectAllSupervisors: boolean = false;
  selectedFactory: Factory | null = null;

  industries: string[] = [
    'Manufacturing',
    'Technology',
    'Healthcare',
    'Construction',
    'Agriculture',
    'Energy',
    'Transportation',
    'Retail',
  ];
  newIndustry: string = '';

  get filteredStudents(): Student[] {
    return this.students.filter((student) => {
      const matchesDistributionType = student.distribution_type === 'college';
      const matchesDepartment =
        this.selectedDepartment === 'All' ||
        student.department === this.selectedDepartment;
      const matchesStage =
        this.selectedStage === 'All' || student.stage === this.selectedStage;
      const matchesBatch =
        this.selectedBatch === 'All' || student.batch === this.selectedBatch;
      const matchesSearch = student.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());
      const notAssigned = !student.factory || student.factory === '';

      return (
        matchesDistributionType &&
        matchesDepartment &&
        matchesStage &&
        matchesBatch &&
        matchesSearch &&
        notAssigned
      );
    });
  }

  get filteredSupervisors(): Supervisor[]{
    return this._filteredSupervisors.filter((supervisor)=>{
      return (supervisor.firstName + " " + supervisor.lastName).toLocaleLowerCase().includes(this.searchTerm.toLowerCase());
    })
  }
  

  get filteredFactories(): Factory[] {
    return this.factories
      .filter(
        (f) =>
          this.selectedFactoryType === 'All' ||
          f.type === this.selectedFactoryType,
      )
      .filter((f) =>
        f.name.toLowerCase().includes(this.factorySearchTerm.toLowerCase()),
      );
  }

  get selectedStudents(): Student[] {
    return this.students.filter((student) => student.selected);
  }

  get selectedSupervisors(): Supervisor[] {
    return this._filteredSupervisors.filter((supervisor) => supervisor.selected);
  }

  async ngOnInit(): Promise<void> {
    try {
      console.log('Initializing student-distribution component');
      this.batches = this.filteredBatches

      // Subscribe to factories
      this.factoryService.factories$.subscribe((factories) => {

        // Convert factory service factories to our local Factory interface
        this.factories = factories.map((f : Factory) => {
          return {
            id: f.id.toString(),
            name: f.name,
            address: f.address,
            phone: f.phone,
            contactName: f.contactName,
            industry: f.industry,
            capacity: f.capacity,
            type: f.type,
            longitude: f.longitude,
            latitude: f.latitude,
            students: [],
            assignedStudents: f.assignedStudents,
            assignedSupervisors: f.assignedSupervisors,
            supervisors: f.supervisors,
            supervisorCapacity: f.supervisorCapacity,
          }
        });
        this.factoryDropLists = this.factories.map((f) => `supervisor-factory-${f.id}`);

        // Load students after factories are loaded
        this.loadStudentsFromFirebase();
        
        this.dataUpdateService.selectedFactoryUpdated$.subscribe((_factory:Factory)=>{
          this.selectedFactory = _factory
        })
        
      });
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }
  }
  handelStageChange(){
    this.selectedBatch = "All"
  }
  get filteredBatches(): string[] {
    switch (this.selectedStage) {
      case 'مدرسة':
        return ['1', '2', '3'];
      case 'كلية متوسطة':
        return ['1', '2'];
      case 'كلية عليا':
        return ['3', '4'];
      default:
        return this.batches;
    }
  }
  async loadStudentsFromFirebase(): Promise<void> {
    try {
      // Get students from Firebase
      const firebaseStudents = await this.authService.getAllStudents();

      // Store all students
      this.students = firebaseStudents;

      // استخراج القيم الفريدة للفلاتر
      this.extractUniqueFilterValues();

      // Update factory assignments for students that already have factories
      this.students.forEach((student) => {
        if (student.factory) {
          const factory = this.factories.find(
            (f) => f.name === student.factory,
          );
          if (
            factory &&
            !factory.students.some((s) => s.code === student.code)
          ) {
            factory.students.push(student);
            factory.assignedStudents = factory.students.length;
          }
        }
      });

      this.updateFactoryAssignments();
    } catch (error) {
      console.error('Error loading students from Firebase:', error);
      this.students = [];
    }
  }

  private extractUniqueFilterValues(): void {
    this.departments = Array.from(
      new Set(
        this.students.map((s) => s.department).filter((v): v is string => !!v),
      ),
    );

    this.stages = Array.from(
      new Set(
        this.students.map((s) => s.stage).filter((v): v is string => !!v),
      ),
    );
  }

  ngAfterViewInit(): void {
    this.dropLists.changes.subscribe(() => {
      this.factoryDropLists = this.factories.map((f) => `supervisor-factory-${f.id}`);
      
    });
  }

  // Add missing resetFormErrors method
  private resetFormErrors(): void {
    this.nameError = '';
    this.addressError = '';
    this.phoneError = '';
    this.contactNameError = '';
    this.industryError = '';
    this.coordinatesError = '';
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

  closeFactoryDetails():void{
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
  }

  startEditing(): void {
    this.isEditing = true;
    if (this.selectedFactory) {
      // Make sure we have a copy of the original data
      this.originalFactoryData = { ...this.selectedFactory };
      // Set the coordinates input with current values
      this.coordinatesInput = `${this.selectedFactory.latitude}, ${this.selectedFactory.longitude}`;
    }
  }

  cancelEditing(): void {
    if (this.selectedFactory && this.originalFactoryData) {
      Object.assign(this.selectedFactory, this.originalFactoryData);
    }
    this.isEditing = false;
    this.coordinatesInput = '';
    this.coordinatesError = '';
  }

  saveChanges(): void {
    if (this.selectedFactory) {
      // Parse coordinates
      const parsedCoordinates = this.parseCoordinates(this.coordinatesInput);
      console.log('Parsed coordinates:', parsedCoordinates);

      if (!parsedCoordinates) {
        this.coordinatesError =
          'Invalid coordinates format. Please use format: latitude, longitude';
        return;
      }

      // Update coordinates
      this.selectedFactory.latitude = parsedCoordinates.latitude;
      this.selectedFactory.longitude = parsedCoordinates.longitude;
      console.log('Updated factory coordinates:', this.selectedFactory);

      if (confirm('Are you sure you want to save these changes?')) {
        // Convert our local Factory to the service Factory type
        const serviceFactory = {
          ...this.selectedFactory,
        };
        console.log('Saving factory with coordinates:', serviceFactory);
        this.factoryService.updateFactory(serviceFactory);
        this.isEditing = false;
        this.coordinatesInput = '';
        this.coordinatesError = '';

        // Close the modal
        this.closeFactoryDetails();
        alert('Changes saved successfully');
      }
    }
  }

  private parseCoordinates(
    coordinates: string,
  ): { latitude: number; longitude: number } | null {
    try {
      const [lat, lng] = coordinates
        .split(',')
        .map((coord) => parseFloat(coord.trim()));
      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }
      return { latitude: lat, longitude: lng };
    } catch (error) {
      return null;
    }
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.filteredStudents.forEach((student) => {
      student.selected = this.selectAll;
    });
  }

  toggleSelectAllSupervisors(): void {
    this.selectAll = !this.selectAll;
    this._filteredSupervisors.forEach((supervisor) => {
      supervisor.selected = this.selectAll;
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


  toggleSelectionSupervisor(event: MouseEvent, supervisor: Supervisor): void {
    if (event.ctrlKey || event.metaKey) {
      supervisor.selected = !supervisor.selected;
    } else if (event.shiftKey && this.lastSelectedSupervisor) {
      const currentIndex = this._filteredSupervisors.indexOf(supervisor);
      const lastIndex = this._filteredSupervisors.indexOf(this.lastSelectedSupervisor);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);

      for (let i = start; i <= end; i++) {
        this._filteredSupervisors[i].selected = true;
      }
    } else {
      supervisor.selected = !supervisor.selected;
    }

  }

  private lastSelectedStudent: Student | null = null;
  private lastSelectedSupervisor: Supervisor | null = null;

  private updateSelectAllState(): void {
    const filteredStudents = this.filteredStudents;
    this.selectAll =
      filteredStudents.length > 0 &&
      filteredStudents.every((student) => student.selected);
  }

  trackByFn(index: number, item: Factory): any {
    return item.id; 
  }
  

  onDrop(event: CdkDragDrop<any[]>, factory?: Factory): void {
    console.log("fired!")
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      const selectedStudents = this.selectedStudents;
      const selectedSupervisors = this.selectedSupervisors;

      if (selectedStudents.length > 0) {
        // Handle multiple students drop
        if (factory) {
          // Check if factory has enough capacity
          if (
            factory.assignedStudents + selectedStudents.length >
            factory.capacity
          ) {
            alert(
              `Factory ${factory.name} doesn't have enough capacity for ${selectedStudents.length} students`,
            );
            return;
          }

          // Remove from previous factories if exists
          selectedStudents.forEach((student) => {
            if (student.factory) {
              const prevFactory = this.factories.find(
                (f) => f.name === student.factory,
              );
              if (prevFactory) {
                const index = prevFactory.students.findIndex(
                  (s) => s.code === student.code,
                );
                if (index > -1) {
                  prevFactory.students.splice(index, 1);
                  prevFactory.assignedStudents--;
                }
              }
            }

            // Assign student to factory
            this.assignToFactory(student, factory);
          });
        }
      } else {
        // Handle single student drop
        const student = event.item.data as Student;
        console.log(student)
        if (student.isStudent && factory) {
          // Check if factory has enough capacity
          if (factory.assignedStudents >= factory.capacity) {
            alert(`Factory ${factory.name} is already at full capacity`);
            return;
          }

          // Remove from previous factory if exists
          if (student.factory) {
            const prevFactory = this.factories.find(
              (f) => f.name === student.factory,
            );
            if (prevFactory) {
              const index = prevFactory.students.findIndex(
                (s) => s.code === student.code,
              );
              if (index > -1) {
                prevFactory.students.splice(index, 1);
                prevFactory.assignedStudents--;
              }
            }
          }

          this.assignToFactory(student, factory);
        }
      }

      if (this.selectedSupervisors.length > 0) {
         // Handle multiple supervisors drop
        if (factory) {
            // Check if factory has enough supervisor capacity
            // if (
            //     factory.assignedSupervisors + selectedSupervisors.length >
            //     (factory?.supervisorCapacity || 0)
            // ) {
            //     alert(
            //         `Factory ${factory.name} doesn't have enough supervisor capacity for ${selectedSupervisors.length} supervisors`,
            //     );
            //     return;
            // }

            this.assignToFactorySupervisors(selectedSupervisors,factory);
        }
      } else {
        // Handle single supervisor drop
          const supervisor = event.item.data as Supervisor;

          if (factory) {
            // Check if factory has enough supervisor capacity
            // if (factory.assignedSupervisors >= (factory.supervisorCapacity || 0)) {
            //   alert(`Factory ${factory.name} is already at full supervisor capacity`);
            //   return;
            // }


            this.assignToFactorySupervisor(supervisor, factory);
        }
      }
    }
  }

  assignToFactory(student: Student, factory: Factory): void {
    // Update student's factory assignment
    const index = this.students.findIndex((s) => s.code === student.code);
    if (index !== -1) {
      // Update in local array
      this.students[index].factory = factory.name;
      student.factory = factory.name;
      student.selected = false;

      // Update in service (Firebase)
      this.updateStudentFactory(student, factory.name);

      // Update factory students list
      if (!factory.students.some((s) => s.code === student.code)) {
        factory.students.push(student);
        factory.assignedStudents = factory.students.length;
      }
    }
  }

  assignToFactorySupervisor(supervisor: Supervisor, factory: Factory): void {
    // Update supervisor's factory assignment
    const index = this._filteredSupervisors.findIndex((s) => s.id === supervisor.id);
    if (index !== -1) {
      // Update in local array
      this._filteredSupervisors[index].factory = factory.name;
      supervisor.factory = factory.name;
      supervisor.selected = false;

      // Update in service (Firebase)
      this.updateSupervisorFactory(supervisor, factory.name,factory.id);

      // Update factory supervisors list
      if (!factory.supervisors.some((s) => s.id === supervisor.id)) {
        factory.supervisors.push(supervisor);
        factory.assignedSupervisors = factory.supervisors.length;
      }
    }
  }


  assignToFactorySupervisors(supervisors: Supervisor[], factory: Factory): void {
    // Update supervisors' factory assignment
    supervisors.forEach(supervisor => {
      const index = this._filteredSupervisors.findIndex((s) => s.id === supervisor.id);
      if (index !== -1) {
        // Update in local array
        this._filteredSupervisors[index].factory = factory.name;
        supervisor.factory = factory.name;
        supervisor.selected = false;

        // Update factory supervisors list
        if (!factory.supervisors.some((s) => s.id === supervisor.id)) {
          factory.supervisors.push(supervisor);
          factory.assignedSupervisors = factory.supervisors.length;
        }
      }
    });

    // Update in service (Firebase) - using addSupervisorsToFactory for bulk operation
    this.updateSupervisorsFactory(supervisors, factory.name, factory.id);
  }

  private async updateStudentFactory(
    student: Student,
    factoryName: string | null,
  ): Promise<void> {
    try {
      // Create a copy of the student with the factory updated
      const updatedStudent = {
        ...student,
        factory: factoryName,
      };

      // Update the student in Firebase
      await this.authService.updateStudent(updatedStudent);
      console.log(
        `Student ${student.name} assigned to factory ${factoryName || 'None'}`,
      );

      // Notify that student data has been updated
      this.dataUpdateService.notifyStudentDataUpdated();
      
    } catch (error) {
      console.error('Error updating student factory:', error);
    }
  }

  


  private async updateSupervisorFactory(
    supervisor: Supervisor,
    factoryName: string | null,
    factoryId : string | null
  ): Promise<void> {
    try {
      // Create a copy of the supervisor with the factory updated
      const updatedSupervisor = {
        ...supervisor,
        factory: factoryName,
      };

      // Update the supervisor in Firebase
      // await this.authService.updateSupervisorUser(updatedSupervisor as unknown as FirebaseSupervisor);
      await this.authService.addSuperVisorToFactory(factoryId!,supervisor)
      console.log(
        `Supervisor ${supervisor.firstName} ${supervisor.lastName} assigned to factory ${factoryName || 'None'}`,
      );

      // Notify that supervisor data has been updated
      this.dataUpdateService.notifySupervisorDataUpdated();
    } catch (error) {
      console.error('Error updating supervisor factory:', error);
    }
  }

  private async updateSupervisorsFactory(
    supervisors: Supervisor[],
    factoryName: string | null,
    factoryId : string | null
  ): Promise<void> {
    try {
      // Add supervisors to factory using the service
      await this.authService.addSupervisorsToFactory(factoryId!, supervisors);
      console.log(
        `${supervisors.length} supervisors assigned to factory ${factoryName || 'None'}`,
      );

      // Notify that supervisor data has been updated
      this.dataUpdateService.notifySupervisorDataUpdated();
    } catch (error) {
      console.error('Error updating supervisors factory:', error);
    }
  }

  removeFromFactory(student: Student, event: MouseEvent): void {
    event.stopPropagation();

    // Find the factory this student is assigned to
    const factory = this.factories.find((f) => f.name === student.factory);
    if (factory) {
      // Remove from factory's student list
      const factoryStudentIndex = factory.students.findIndex(
        (s) => s.code === student.code,
      );
      if (factoryStudentIndex !== -1) {
        factory.students.splice(factoryStudentIndex, 1);
        factory.assignedStudents = factory.students.length;
      }
    }

    // Update student's factory assignment
    const index = this.students.findIndex((s) => s.code === student.code);
    if (index !== -1) {
      // Update in local array
      this.students[index].factory = null;

      // Update in service (Firebase)
      this.updateStudentFactory(student, null);
      this.dataUpdateService.notifySelectedFactoryDataUpdatet(factory!);

    }
  }

  async removeSupervisorFromFactory(supervisor: Supervisor, factoryId: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    try {
      // Remove supervisor from factory using the service
      const success = await this.authService.removeSupervisorFromFactory(factoryId, supervisor);
      
      if (success) {
        // Find the factory and remove supervisor from local array
        const factory = this.factories.find((f) => f.id === factoryId);
        const selectedFactorySupervisor = this.selectedFactory?.supervisors.find((f)=>f.id === factoryId);
        if (factory) {
          const supervisorIndex = factory.supervisors.findIndex((s: any) => s.id === supervisor.id);
          if (supervisorIndex !== -1) {
            factory.supervisors.splice(supervisorIndex, 1);
            factory.assignedSupervisors = factory.supervisors.length;
          }
        }

        
        const superVisorSelectedIndex = this.selectedFactory?.supervisors.findIndex((s:any)=> s.id === supervisor.id);
        if(superVisorSelectedIndex !== -1){
          this.selectedFactory?.supervisors.splice(superVisorSelectedIndex!,1);
          console.log(this.selectedFactory)
        }



        console.log(`Supervisor ${supervisor.firstName} ${supervisor.lastName} removed from factory`);
        
        // Notify that supervisor data has been updated
        this.dataUpdateService.notifySupervisorDataUpdated();
        this.dataUpdateService.notifySelectedFactoryDataUpdatet(factory!);
      } else {
        console.error('Failed to remove supervisor from factory');
        alert('Failed to remove supervisor from factory. Please try again.');
      }
    } catch (error) {
      console.error('Error removing supervisor from factory:', error);
      alert('An error occurred while removing the supervisor. Please try again.');
    }
  }

  private updateFactoryAssignments(): void {
    // Clear factory students first
    this.factories.forEach((factory) => {
      factory.students = [];
      factory.assignedStudents = 0;
    });

    // Get all students and assign them to factories
    if (this.students && this.students.length > 0) {
      this.students.forEach((student) => {
        if (student.factory) {
          const factory = this.factories.find(
            (f) => f.name === student.factory,
          );
          if (factory) {
            factory.students.push(student);
            factory.assignedStudents = factory.students.length;
          }
        }
      });
    }

    console.log(
      'Factory assignments updated:',
      this.factories.map((f) => ({
        name: f.name,
        count: f.assignedStudents,
        students: f.students.length > 0 ? f.students.map((s) => s.name) : [],
        supervisors:f.supervisors
      })),
    );
  }

  async addFactory(
    name: string,
    address: string,
    phone: string,
    contactName: string,
    industry: string,
    capacity: number,
    type: string,
    coordinates: string,
  ): Promise<void> {
    // Reset error messages
    this.resetFormErrors();

    // Validate inputs
    let hasError = false;
    let errorMessages: string[] = [];

    // Name validation
    if (!name || name.trim().length < 3) {
      this.nameError = this.translationService.translate('factory_name_required');
      errorMessages.push(this.nameError);
      hasError = true;
    }

    // Address validation
    if (!address || address.trim().length < 5) {
      this.addressError = this.translationService.translate('address_required');
      errorMessages.push(this.addressError);
      hasError = true;
    }

    // Phone validation - must be exactly 11 or 15 digits
    const phoneRegex = /^[0-9]{11}$|^[0-9]{15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      this.phoneError = this.translationService.translate('phone_validation_error');
      errorMessages.push(this.phoneError);
      hasError = true;
    }

    // Contact name validation
    if (!contactName || contactName.trim().length < 3) {
      this.contactNameError = this.translationService.translate('contact_name_required');
      errorMessages.push(this.contactNameError);
      hasError = true;
    }

    // Industry validation
    if (!industry) {
      this.industryError = this.translationService.translate('industry_required');
      errorMessages.push(this.industryError);
      hasError = true;
    }

    // Capacity validation
    if (!capacity || capacity <= 0) {
      this.industryError = this.translationService.translate('capacity_required');
      errorMessages.push(this.industryError);
      hasError = true;
    }

    // Type validation
    if (!type || type === 'All') {
      this.industryError = this.translationService.translate('type_required');
      errorMessages.push(this.industryError);
      hasError = true;
    }

    // Parse coordinates
    const parsedCoordinates = this.parseCoordinates(coordinates);
    if (!parsedCoordinates) {
      this.coordinatesError = this.translationService.translate('coordinates_validation_error');
      errorMessages.push(this.coordinatesError);
      hasError = true;
    }

    if (hasError) {
      // Show alert with all error messages
      const errorMessage = errorMessages.join('\n');
      alert(errorMessage);

      // Keep modal open by preventing the default form submission
      const modalElement = document.getElementById('addFactoryModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          // Ensure modal stays open
          const newModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
          });
          newModal.show();
        }
      }
      return;
    }

    try {
      // Create a unique ID for the factory - use timestamp as numeric ID for consistency
      const timestamp = Date.now();
      const factoryId = timestamp.toString();
      const firebaseFactory: FirebaseFactory = {
        id: factoryId,
        name,
        address,
        phone,
        contactName,
        industry,
        capacity,
        type,
        students: [],
        assignedStudents: 0,
        isApproved: true,
        studentName: this.authService.currentUserValue?.firstName || 'Unknown',
        createdAt: Date.now(),
        longitude: parsedCoordinates!.longitude,
        latitude: parsedCoordinates!.latitude,
        supervisors: [],
        assignedSupervisors: 0,
      };

      console.log('Submitting factory to Firebase:', firebaseFactory);

      // Save to Firebase directly
      const success = await this.authService.submitFactoryRequest(firebaseFactory);

      if (success) {
        console.log('Factory saved to Firebase successfully with ID:', factoryId);

        // Also add to the local factory service for immediate display
        const newFactory: Factory = {
          id: factoryId,
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          contactName: contactName.trim(),
          industry,
          capacity,
          type,
          students: [],
          assignedStudents: 0,
          assignedSupervisors:0,
          supervisors:[],
          longitude: parsedCoordinates!.longitude,
          latitude: parsedCoordinates!.latitude,
        };

        // Convert our local Factory to the service Factory type
        const serviceFactory = {
          ...newFactory,
          id: timestamp.toString(),
        };

        // Add to factory service to ensure it persists
        await this.factoryService.addFactory(serviceFactory);
        console.log('Factory added to FactoryService successfully');

        // Show success message
        alert('Factory added successfully');

        // Close modal only on success
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

        // Reset form errors
        this.resetFormErrors();
      } else {
        console.error('Failed to save factory to Firebase');
        alert('Failed to add factory. Please try again.');
      }
    } catch (error) {
      console.error('Error adding factory:', error);
      alert('An error occurred while adding the factory. Please try again.');
    }
  }

  addNewIndustry() {
    if (this.newIndustry && !this.industries.includes(this.newIndustry)) {
      this.industries.push(this.newIndustry);
      this.newIndustry = '';
    }
  }

  /**
   * Delete the currently selected factory
   * This will remove the factory from both the UI and Firebase
   */
  async deleteFactory(): Promise<void> {
    if (!this.selectedFactory) return;

    // Check if factory has assigned students
    if (this.selectedFactory.students.length > 0) {
      alert(
        `Cannot delete factory "${this.selectedFactory.name}" because it has ${this.selectedFactory.students.length} assigned students. Please reassign or remove all students first.`,
      );
      return;
    }

    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to delete factory "${this.selectedFactory.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      // Delete factory from Firebase
      await this.factoryService.deleteFactory(this.selectedFactory.id);

      // Remove from local factories array
      this.factories = this.factories.filter(
        (f) => f.id !== this.selectedFactory?.id,
      );

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

      // Show success message
      alert('Factory deleted successfully');

      // Reset selected factory
      this.selectedFactory = null;
    } catch (error) {
      console.error('Error deleting factory:', error);
      alert('An error occurred while deleting the factory. Please try again.');
    }
  }

  private hasValidCoordinates(factory: Factory | null): boolean {
    return (
      factory !== null &&
      factory.longitude !== undefined &&
      factory.longitude !== null &&
      factory.latitude !== undefined &&
      factory.latitude !== null
    );
  }

  openGoogleMaps(
    longitude: number | undefined,
    latitude: number | undefined,
  ): void {
    if (longitude === undefined || latitude === undefined) {
      console.error('Invalid coordinates');
      return;
    }
    const zoom = 19;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
    window.open(url, '_blank');
  }
}
