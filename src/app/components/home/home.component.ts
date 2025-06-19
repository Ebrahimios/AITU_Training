import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  TranslationService,
  TranslationKeys,
} from '../../services/translation.service';
import { AuthService } from '../../services/firebase.service';
import { EditStudentModalComponent } from './edit-student-modal/edit-student-modal.component';
import { StudentDetailsModalComponent } from './student-details-modal/student-details-modal.component';
import {
  FactoryService,
  Factory,
  Supervisor,
} from '../../services/factory.service';
import { DataUpdateService } from '../../services/data-update.service';
import { Subscription } from 'rxjs';

import { Student } from '../../interfaces/student';
import { userSerivce } from '../../services/user.service';

// Using imported TranslationKeys from translation service

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    RouterModule,
    NavbarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  Math = Math;
  isSidebarOpen = true;
  isModalOpen = false;
  students: Student[] = [];
  filteredStudents: Student[] = [];
  totalStudents: number = 0;
  totalFactories: number = 0;
  growthRate: number = 0;
  searchTerm: string = '';
  allSupervisors: any[] = [];
  allFactories: any[] = [];

  departments: string[] = [];
  factories: string[] = [];
  supervisors: string[] = [];
  allBatches: string[] = [];
  batches: string[] = [];
  stages: string[] = [];
  selectedDepartment: string = '';
  selectedFactory: string = '';
  selectedSupervisor: string = '';
  selectedBatch: string = '';
  selectedStage: string = '';
  selectedYear: string = '';
  selectedMonth: string = '';
  selectedDay: string = '';
  showFilters: boolean = false;
  showSort: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Date filter options
  years: string[] = this.generateYearsArray(2017, new Date().getFullYear() + 1);
  months: { value: string; name: string }[] = [];
  days = Array.from({ length: 30 }, (_, i) => ({
    value: (i + 1).toString(),
    name: (i + 1).toString(),
  }));
  sortOptions: { value: string; label: string }[] = [];
  selectedSort: string = '';

  private dataUpdateSubscription: Subscription | null = null;
  private languageSubscription: Subscription | null = null;
  private SuperVisorsSubscription: Subscription | null = null;

  constructor(
    public translationService: TranslationService,
    public userService: userSerivce,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private factoryService: FactoryService,
    private dataUpdateService: DataUpdateService,
  ) {
    // Initialize with empty array, total will be updated after loading
    this.students = [];
    this.filteredStudents = [];
    this.totalStudents = 0;
    this.totalFactories = 0;

    // Initialize all translated content
    this.initializeTranslatedContent();

    // Subscribe to language changes
    this.languageSubscription = this.translationService.currentLang$.subscribe(
      () => {
        this.initializeTranslatedContent();
      },
    );

    // Get supervisors from factory service
    this.factoryService.supervisors$.subscribe((supervisors) => {
      this.supervisors = supervisors.map((s) => s.name);
    });

    // Get factories count
    this.factoryService.factories$.subscribe((factories) => {
      this.totalFactories = factories.length;
    });
  }

  private initializeTranslatedContent() {
    // Initialize departments
    this.departments = [
      this.translationService.translate('information_technology'),
      this.translationService.translate('mechanics'),
      this.translationService.translate('electrical'),
    ];

    // Initialize factories
    this.factories = [
      this.translationService.translate('factory_a'),
      this.translationService.translate('factory_b'),
      this.translationService.translate('factory_c'),
    ];

    // Initialize supervisors
    this.supervisors = [
      this.translationService.translate('supervisor_a'),
      this.translationService.translate('supervisor_b'),
      this.translationService.translate('supervisor_c'),
    ];

    // Initialize batches
    this.allBatches = [
      this.translationService.translate('batch_1'),
      this.translationService.translate('batch_2'),
      this.translationService.translate('batch_3'),
      this.translationService.translate('batch_4'),
    ];
    this.batches = this.allBatches;

    // Initialize stages
    this.stages = [
      this.translationService.translate('school'),
      this.translationService.translate('institute'),
      this.translationService.translate('faculty'),
    ];

    // Initialize months
    this.months = [
      { value: '0', name: this.translationService.translate('january') },
      { value: '1', name: this.translationService.translate('february') },
      { value: '2', name: this.translationService.translate('march') },
      { value: '3', name: this.translationService.translate('april') },
      { value: '4', name: this.translationService.translate('may') },
      { value: '5', name: this.translationService.translate('june') },
      { value: '6', name: this.translationService.translate('july') },
      { value: '7', name: this.translationService.translate('august') },
      { value: '8', name: this.translationService.translate('september') },
      { value: '9', name: this.translationService.translate('october') },
      { value: '10', name: this.translationService.translate('november') },
      { value: '11', name: this.translationService.translate('december') },
    ];

    // Initialize sort options
    this.sortOptions = [
      {
        value: 'name_asc',
        label: this.translationService.translate('name_asc'),
      },
      {
        value: 'name_desc',
        label: this.translationService.translate('name_desc'),
      },
      {
        value: 'date_new',
        label: this.translationService.translate('date_new'),
      },
      {
        value: 'date_old',
        label: this.translationService.translate('date_old'),
      },
    ];
  }

  async ngOnInit(): Promise<void> {
    await this.loadAllData();
    this.totalStudents = this.students.length;
    this.filteredStudents = [...this.students];

    // Get the total number of factories from factory service
    this.factoryService.factories$.subscribe((factories) => {
      this.totalFactories = factories.length;
    });

    // Subscribe to student data updates
    this.dataUpdateSubscription =
      this.dataUpdateService.studentDataUpdated$.subscribe(async () => {
        console.log('Student data updated, refreshing dashboard...');
        await this.loadStudents();
        this.applyFilters(); // Apply any active filters after reloading
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.dataUpdateSubscription) {
      this.dataUpdateSubscription.unsubscribe();
      this.dataUpdateSubscription = null;
    }
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  // Helper method to generate years array from startYear to endYear (inclusive)
  private generateYearsArray(startYear: number, endYear: number): string[] {
    const years: string[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year.toString());
    }
    return years;
  }

  // Helper method to get Unix timestamp (seconds since epoch)
  getTimestamp(date: Date | string | number | undefined): string {
    if (!date) return '';

    let timestamp: number;

    if (date instanceof Date) {
      timestamp = date.getTime();
    } else if (typeof date === 'string') {
      // Convert string to Date then to timestamp
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return '';
      timestamp = parsedDate.getTime();
    } else if (typeof date === 'number') {
      // Already a timestamp
      timestamp = date;
    } else {
      return '';
    }

    // Format the date with time first
    return this.formatDateWithTime(new Date(timestamp));
  }

  formatDateWithTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  }

  async loadStudents() {
    try {
      this.students = [];
      let studentsData;
      console.log(this.userService)
      const userData = this.userService?.userData;
      if (
        !this.userService.isAdmin &&
        userData &&
        userData.firstName &&
        userData.lastName
      ) {
        const supervisorId = userData.id;
        const superName = `${userData.firstName} ${userData.lastName}`;
        studentsData = await this.authService.getAllStudents(supervisorId,superName);
      } else {
        studentsData = await this.authService.getAllStudents();
      }

      // Process each student to ensure dates are handled correctly
      this.students = studentsData.map((student) => {
        // Make a copy of the student object
        const processedStudent = { ...student };

        // Format both birthDate and createOn as strings
        if (processedStudent.createOn) {
          // If createOn is a number (timestamp), convert to string in ISO format
          if (typeof processedStudent.createOn === 'string') {
            const date = new Date(processedStudent.createOn);
            processedStudent.createOn = date.toISOString(); // YYYY-MM-DD format
          }
          // If it's already a string, leave it as is
        }

        // For birthDate, ensure it's a string
        if (processedStudent.birthDate) {
          // If it's a number (timestamp), convert to string in ISO format
          if (typeof processedStudent.birthDate === 'string') {
            const date = new Date(processedStudent.birthDate);
            processedStudent.birthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
          // If it's already a string, leave it as is
        }

        return processedStudent;
      });
      this.filteredStudents = [...this.students];
      this.totalStudents = this.students.length;
    } catch (error) {
      console.error('Error loading students:', error);
      // Initialize with empty arrays if there's an error
      this.students = [];
      this.filteredStudents = [];
      this.totalStudents = 0;
    }
  }

  async loadAllData(): Promise<void> {
    try {
      // Get all students from Firebase
      const userData = this.userService.userData;
      if (
        !this.userService.isAdmin &&
        userData &&
        userData.firstName &&
        userData.lastName
      ) {
        const supervisorId = userData.id;
        const superName = `${userData.firstName} ${userData.lastName}`;
        const students: Student[] = await this.authService.getAllStudents(supervisorId,superName);
        this.students = students;
        this.filteredStudents = students;
        this.totalStudents = students.length;
      } else {
        const students : Student[] = await this.authService.getAllStudents();
        this.students = students;
        this.filteredStudents = students;
        this.totalStudents = students.length;
      }

      // Get all factories from Firebase
      const factories = await this.authService.getAllFactories();
      this.allFactories = factories;
      this.totalFactories = factories.length;

      // Extract all unique departments, stages, and batches from students
      this.extractUniqueValues();

      // Get all supervisors from Firebase
      this.allSupervisors = await this.authService.getAllSupervisors();

      // Calculate growth rate based on student creation dates
      this.calculateGrowthRate();

      // Apply default sorting
      this.applySorting('name_asc');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  /**
   * Extract unique values from student data for filtering
   */
  extractUniqueValues(): void {
    // Extract unique departments
    const departmentsSet = new Set<string>();
    this.students.forEach((student) => {
      if (student.department) {
        departmentsSet.add(student.department);
      }
    });
    this.departments = Array.from(departmentsSet);

    // Extract unique stages
    const stagesSet = new Set<string>();
    this.students.forEach((student) => {
      if (student.stage) {
        stagesSet.add(student.stage);
      }
    });
    this.stages = Array.from(stagesSet);

    // Extract unique batches
    const batchesSet = new Set<string>();
    this.students.forEach((student) => {
      if (student.batch) {
        batchesSet.add(student.batch);
      }
    });
    this.allBatches = Array.from(batchesSet);
    this.batches = this.allBatches;
  }
  async onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send file to Supabase function
      const response = await fetch(
        'https://notvzcfdvyebmjwafocg.supabase.co/functions/v1/csv-to-object',
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        alert('Failed to parse CSV file.');
        return;
      }

      const studentsToAdd = await response.json();
      console.log('Parsed students:', studentsToAdd);
      // studentsToAdd should be an array of objects with the correct fields
      if (!Array.isArray(studentsToAdd['data'])) {
        alert('CSV parsing failed: returned data is not a list of students.');
        console.error('studentsToAdd is not an array:', studentsToAdd);
        return;
      }
      let addedCount = 0;
      for (const student of studentsToAdd['data']) {
        // Ensure required fields exist
        if (student['Student Code'] && student['Student Name']) {
          try {
            await this.authService.sendStudentData({
              code: student['Student Code'],
              name: student['Student Name'],
              address: student['Student Address'],
              nationalID: student['National ID'],
              phone: student['Phone Number'],
              state: student['Student Status'],
              selected: false,
              createOn: Date.now().toString(), // Set current date as createOn
            });
            addedCount++;
          } catch (err) {
            console.error('Error adding student:', student, err);
          }
        }
      }

      alert(`${addedCount} students imported successfully!`);
      await this.loadStudents();
      this.applyFilters();
    } catch (error) {
      alert('Error uploading or processing CSV file.');
      console.error(error);
    }
  }
  /**
   * Calculate growth rate based on student creation dates
   */
  calculateGrowthRate(): void {
    // Get current month and previous month
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    // Count students created in current month and previous month
    let currentMonthCount = 0;
    let previousMonthCount = 0;

    this.students.forEach((student) => {
      if (student.createOn) {
        const createDate = new Date(student.createOn);
        const createMonth = createDate.getMonth();

        if (createMonth === currentMonth) {
          currentMonthCount++;
        } else if (createMonth === previousMonth) {
          previousMonthCount++;
        }
      }
    });

    // Calculate growth rate
    if (previousMonthCount > 0) {
      this.growthRate =
        ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    } else {
      this.growthRate = currentMonthCount > 0 ? 100 : 0;
    }

    // Ensure growth rate is not negative for display purposes
    this.growthRate = Math.max(0, this.growthRate);
  }

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

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  editStudent(student: Student) {
    const dialogRef = this.dialog.open(EditStudentModalComponent, {
      width: '500px',
      data: { student, isEdit: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const index = this.students.findIndex((s) => s.code === result.code);
        if (index !== -1) {
          this.students[index] = result;
          this.filteredStudents = [...this.students];
          this.applyFilters();
        }
      }
    });
  }

  addStudent() {
    const dialogRef = this.dialog.open(EditStudentModalComponent, {
      width: '500px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Generate a new code for the student
        result.birthDate = new Date(); // Set current date for new students

        this.students.unshift(result);
        this.filteredStudents = [...this.students];
        this.totalStudents = this.students.length;
        this.applyFilters();
      }
    });
  }

  toggleAll(event: any) {
    const checked = event.target.checked;
    this.filteredStudents.forEach((student) => (student.selected = checked));
  }

  updateSearchTerm(event: any) {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleSort() {
    this.showSort = !this.showSort;
  }

  filterByDepartment(department: string) {
    this.selectedDepartment = department;
    this.applyFilters();
  }

  filterByFactory(factory: string) {
    this.selectedFactory = factory;
    this.applyFilters();
  }

  filterBySupervisor(supervisor: string) {
    this.selectedSupervisor = supervisor;
    this.applyFilters();
  }

  filterByBatch(batch: string) {
    // Changed from filterByGroup
    this.selectedBatch = batch;
    this.applyFilters();
  }

  filterByStage(stage: string) {
    this.selectedStage = stage;
    this.selectedBatch = '';
    this.applyFilters();
  }

  filterByYear(year: string) {
    this.selectedYear = year;
    this.applyFilters();
  }

  filterByMonth(month: string) {
    this.selectedMonth = month;
    this.applyFilters();
  }

  filterByDay(day: string) {
    this.selectedDay = day;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredStudents = this.students.filter((student) => {
      // Basic info filtering
      const matchesSearch = this.searchTerm
        ? student.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      const matchesDepartment =
        !this.selectedDepartment ||
        student.department === this.selectedDepartment;
      const matchesFactory =
        !this.selectedFactory || student.factory === this.selectedFactory;
      const matchesSupervisor =
        !this.selectedSupervisor ||
        student.supervisor === this.selectedSupervisor;

      // Batch filtering - check if student.batch matches selectedBatch
      const matchesBatch =
        !this.selectedBatch || student.batch === this.selectedBatch;

      const matchesStage =
        !this.selectedStage || student.stage === this.selectedStage;

      // Date filtering using createOn timestamp
      let matchesYear = true;
      let matchesMonth = true;
      let matchesDay = true;

      if (this.selectedYear && student.createOn) {
        // Convert timestamp to Date to get year
        const date = new Date(student.createOn);
        matchesYear = date.getFullYear().toString() === this.selectedYear;
      }

      if (this.selectedMonth && student.createOn) {
        // Convert timestamp to Date to get month
        const date = new Date(student.createOn);
        matchesMonth = date.getMonth().toString() === this.selectedMonth;
      }

      if (this.selectedDay && student.createOn) {
        // Convert timestamp to Date to get day
        const date = new Date(student.createOn);
        matchesDay = date.getDate().toString() === this.selectedDay;
      }

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesFactory &&
        matchesSupervisor &&
        matchesBatch &&
        matchesStage &&
        matchesYear &&
        matchesMonth &&
        matchesDay
      );
    });

    // Reset to first page when filters change
    this.currentPage = 1;
  }

  applySorting(sortValue: string) {
    this.selectedSort = sortValue;

    switch (sortValue) {
      case 'name_asc':
        this.filteredStudents.sort(
          (a, b) => a.name?.localeCompare(b.name || '') || 0,
        );
        break;
      case 'name_desc':
        this.filteredStudents.sort(
          (a, b) => b.name?.localeCompare(a.name || '') || 0,
        );
        break;
      case 'date_new':
        // Sort by createOn timestamp (newest first)
        this.filteredStudents.sort((a, b) => {
          // Convert date strings to timestamps for comparison
          const dateA = a.createOn ? new Date(a.createOn).getTime() : 0;
          const dateB = b.createOn ? new Date(b.createOn).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'date_old':
        // Sort by createOn timestamp (oldest first)
        this.filteredStudents.sort((a, b) => {
          // Convert date strings to timestamps for comparison
          const dateA = a.createOn ? new Date(a.createOn).getTime() : 0;
          const dateB = b.createOn ? new Date(b.createOn).getTime() : 0;
          return dateA - dateB;
        });
        break;
    }
  }

  deleteStudent(student: Student) {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
    const index = this.students.findIndex((s) => s.code === student.code);
    if (index !== -1) {
      this.students.splice(index, 1);
      this.filteredStudents = [...this.students];
      this.totalStudents = this.students.length;
      this.applyFilters();
    }
  }

  exportData() {
    const headers = [
      'ID',
      'Student',
      'Department',
      'Factory',
      'Batch',
      'Stage',
      'Date',
      'Supervisor',
    ];
    const csvData = this.filteredStudents.map((student) => [
      student.code || '',
      student.name || '',
      student.department || '',
      student.factory || '',
      student.batch || '',
      student.stage || '',
      student.createOn ? new Date(student.createOn).toLocaleDateString() : '',
      student.supervisor || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'students_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  

  get departmentStats() {
    const stats = this.departments.map((dept) => {
      const count = this.students.filter((s) => s.department === dept).length;
      return {
        name: dept,
        count,
        percentage: (count / this.students.length) * 100,
      };
    });
    return stats;
  }

  get filteredBatches(): string[] {
    switch (this.selectedStage) {
      case 'School':
        return ['Batch 1', 'Batch 2', 'Batch 3'];
      case 'Institute':
        return ['Batch 1', 'Batch 2'];
      case 'Faculty':
        return ['Batch 3', 'Batch 4'];
      default:
        return this.allBatches;
    }
  }

  // Reset all filters
  resetFilters() {
    this.selectedDepartment = '';
    this.selectedFactory = '';
    this.selectedBatch = '';
    this.selectedStage = '';
    this.selectedYear = '';
    this.selectedMonth = '';
    this.selectedDay = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  logout(): void {
    this.authService.logout();
  }
  openStudentDetails(student: Student) {
    const dialogRef = this.dialog.open(StudentDetailsModalComponent, {
      width: '1500px',
      data: { student: student },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      await this.loadStudents();
      if (result) {
        // Reload students from Firebase after any change

        this.applyFilters(); // Reapply any active filters
      }
    });
  }

  isReturningStudent(student: Student): boolean {
    return student.state === 'Active';
  }

  getStudentStatus(student: Student): 'student_returning' | 'student_new' {
    return this.isReturningStudent(student)
      ? 'student_returning'
      : 'student_new';
  }

  getStudentStatusText(student: Student): string {
    return student.state || 'Inactive';
  }
}
