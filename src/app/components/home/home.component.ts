import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/firebase.service';
import { EditStudentModalComponent } from './edit-student-modal/edit-student-modal.component';
import { StudentDetailsModalComponent } from './student-details-modal/student-details-modal.component';
import { Student } from '../../interfaces/student';



export type TranslationKeys =
  | 'dashboard'
  | 'students_distribution'
  | 'analytics'
  | 'settings'
  | 'student'
  | 'filters'
  | 'sort'
  | 'export'
  | 'add_student'
  | 'total_students'
  | 'departments'
  | 'active'
  | 'growth'
  | 'sort_by'
  | 'department'
  | 'factory'
  | 'batch'
  | 'stage'
  | 'year'
  | 'month'
  | 'department_distribution'
  | 'showing'
  | 'to'
  | 'of'
  | 'entries'
  | 'per_page_5'
  | 'per_page_10'
  | 'per_page_20'
  | 'reset';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatIconModule,
        RouterModule,
        NavbarComponent
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  Math = Math;
  isSidebarOpen = true;
  isModalOpen = false; // Add flag to track modal state
  students: Student[] = [];
  filteredStudents: Student[] = [];
  totalStudents: number = 0;
  searchTerm: string = '';
  departments: string[] = ['IT', 'Mechanics', 'Electrical'];
  factories: string[] = ['Factory A', 'Factory B', 'Factory C'];
  allBatches: string[] = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  batches: string[] = this.allBatches;
  stages: string[] = ['School', 'Institute', 'Faculty'];
  selectedDepartment: string = '';
  selectedFactory: string = '';
  selectedBatch: string = ''; // Changed from selectedGroup
  selectedStage: string = '';
  selectedYear: string = '';
  selectedMonth: string = '';
  selectedDay: string = ''; // New property for day filter
  showFilters: boolean = false;
  showSort: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Date filter options
  years: string[] = ['2020', '2021', '2022', '2023'];
  months = [
    { value: '0', name: 'January' },
    { value: '1', name: 'February' },
    { value: '2', name: 'March' },
    { value: '3', name: 'April' },
    { value: '4', name: 'May' },
    { value: '5', name: 'June' },
    { value: '6', name: 'July' },
    { value: '7', name: 'August' },
    { value: '8', name: 'September' },
    { value: '9', name: 'October' },
    { value: '10', name: 'November' },
    { value: '11', name: 'December' }
  ];

  days = Array.from({ length: 30 }, (_, i) => ({ value: (i + 1).toString(), name: (i + 1).toString() }));

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'date_new', label: 'Newest First' },
    { value: 'date_old', label: 'Oldest First' }
  ];
  selectedSort: string = '';

  constructor(
    public translationService: TranslationService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize with empty array, total will be updated after loading
    this.students = [];
    this.filteredStudents = [];
    this.totalStudents = 0;
  }

  async ngOnInit(): Promise<void> {
    await this.loadStudents();
    this.totalStudents = this.students.length;
    this.filteredStudents = [...this.students];
  }

  async loadStudents() {
    try {
      this.students = [];
      this.students = await this.authService.getAllStudents();
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

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  editStudent(student: Student) {
    const dialogRef = this.dialog.open(EditStudentModalComponent, {
      width: '500px',
      data: { student, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.students.findIndex(s => s.code === result.code);
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
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
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
    this.filteredStudents.forEach(student => student.selected = checked);
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

  filterByBatch(batch: string) { // Changed from filterByGroup
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
    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDepartment = !this.selectedDepartment || student.department === this.selectedDepartment;
      const matchesFactory = !this.selectedFactory || student.factory === this.selectedFactory;
      const matchesBatch = !this.selectedBatch || student.grade?.toString() === this.selectedBatch;
      const matchesStage = !this.selectedStage || student.stage === this.selectedStage;
      const matchesYear = !this.selectedYear || student.birthDate?.getFullYear().toString() === this.selectedYear;
      const matchesMonth = !this.selectedMonth || student.birthDate?.getMonth().toString() === this.selectedMonth;
      const matchesDay = !this.selectedDay || student.birthDate?.getDate().toString() === this.selectedDay;

      return matchesSearch && matchesDepartment && matchesFactory && matchesBatch && matchesStage && matchesYear && matchesMonth && matchesDay;
    });
    this.currentPage = 1;
  }

  applySorting(sortValue: string) {
    this.selectedSort = sortValue;

    switch (sortValue) {
      case 'name_asc':
        this.filteredStudents.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        this.filteredStudents.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date_new':
        this.filteredStudents.sort((a, b) => (b.birthDate?.getTime() || 0) - (a.birthDate?.getTime() || 0));
        break;
      case 'date_old':
        this.filteredStudents.sort((a, b) => (a.birthDate?.getTime() || 0) - (b.birthDate?.getTime() || 0));
        break;
    }
  }

  deleteStudent(student: Student) {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
    const index = this.students.findIndex(s => s.code === student.code);
    if (index !== -1) {
      this.students.splice(index, 1);
      this.filteredStudents = [...this.students];
      this.totalStudents = this.students.length;
      this.applyFilters();
    }
  }

  exportData() {
    const headers = ['ID', 'Student', 'Department', 'Factory', 'Batch', 'Stage', 'Date'];
    const csvData = this.filteredStudents.map(student => [
      student.code,
      student.name,
      student.department,
      student.factory,
      student.grade,
      student.stage,
      student.birthDate?.toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
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
    const stats = this.departments.map(dept => {
      const count = this.students.filter(s => s.department === dept).length;
      return {
        name: dept,
        count,
        percentage: (count / this.students.length) * 100
      };
    });
    return stats;
  }

  get filteredBatches(): string[] {
    switch (this.selectedStage) {
      case 'School': return ['Batch 1', 'Batch 2', 'Batch 3'];
      case 'Institute': return ['Batch 1', 'Batch 2'];
      case 'Faculty': return ['Batch 3', 'Batch 4'];
      default: return this.allBatches;
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
      width: '800px',
      data: { student: student }
    });

    dialogRef.afterClosed().subscribe(async result => {
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
    return this.isReturningStudent(student) ? 'student_returning' : 'student_new';
  }

  getStudentStatusText(student: Student): string {
    return student.state || 'Inactive';
  }
}


