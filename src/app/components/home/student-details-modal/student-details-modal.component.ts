import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditStudentModalComponent } from '../edit-student-modal/edit-student-modal.component';
import { Student } from '../../../interfaces/student';
import { AuthService } from '../../../services/firebase.service';
import { FactoryService, Supervisor } from '../../../services/factory.service';

// Extended student type with performance metrics
interface StudentWithPerformance extends Student {
  progress?: number;
  attendance?: number;
  performance?: {
    technical: number;
    communication: number;
    teamwork: number;
  };
}

interface CapacityEvaluation {
  // Personal and Ethical Aspects
  neatAppearance: number; // 3 points
  responsivePersonality: number; // 3 points
  confidentRelations: number; // 3 points
  
  // Practical and Professional Aspects
  attendance: number; // 15 points
  understandingInstructions: number; // 3 points
  taskCompletion: number; // 3 points
  effectiveInteraction: number; // 3 points
  followUpWithSupervisor: number; // 3 points
  adherenceToInstructions: number; // 3 points
  reportWriting: number; // 10 points
  informationGathering: number; // 3 points
  adaptToWorkEnvironment: number; // 5 points
  maintenanceSkills: number; // 3 points
  
  overallRating: number; // Total out of 60
  comments: string;
  lastUpdated?: Date;
}

@Component({
    selector: 'app-student-details-modal',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule
    ],
    templateUrl: './student-details-modal.component.html',
    styleUrls: ['./student-details-modal.component.css']
})
export class StudentDetailsModalComponent implements OnInit {
  student!: StudentWithPerformance;
  evaluationForm!: FormGroup;
  isSupervisor: boolean = true;
  isLoading: boolean = false;
  showProgress: boolean = false;
  progressValue: number = 0;
  activeTab: 'basic' | 'progress' | 'evaluation' = 'basic';
  isEditMode: boolean = false;
  supervisors: Supervisor[] = [];
  supervisorNames: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<StudentDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: Student },
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private factoryService: FactoryService
  ) {
    // ✅ تصليح معالجة التاريخ
  }
  
  ngOnInit(): void {
    // Load supervisors from factory service
    this.factoryService.supervisors$.subscribe(supervisors => {
      this.supervisors = supervisors;
      this.supervisorNames = supervisors.map(s => s.name);
    });
    const validDate = (value: any): Date | null => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    this.student = {
      ...this.data.student,
      birthDate: validDate(this.data.student.birthDate)
    };

    this.initializeForm();
    this.loadStudentProgress();
  }

  // باقي الكود بدون تغيير...


  private initializeForm() {
    this.evaluationForm = this.fb.group({
      // Personal and Ethical Aspects (9 points total)
      neatAppearance: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      responsivePersonality: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      confidentRelations: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      
      // Practical and Professional Aspects (51 points total)
      attendance: [0, [Validators.required, Validators.min(0), Validators.max(15)]],
      understandingInstructions: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      taskCompletion: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      effectiveInteraction: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      followUpWithSupervisor: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      adherenceToInstructions: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      reportWriting: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      informationGathering: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      adaptToWorkEnvironment: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      maintenanceSkills: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      
      overallRating: [0],
      comments: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.evaluationForm.valueChanges.subscribe(() => {
      this.calculateOverallRating();
    });
  }

  private calculateAverageRating(values: any) {
    // Personal and Ethical Aspects (9 points total)
    const personalEthicalRatings = [
      values.neatAppearance || 0,
      values.responsivePersonality || 0,
      values.confidentRelations || 0
    ];
    
    // Practical and Professional Aspects (51 points total)
    const practicalProfessionalRatings = [
      values.attendance || 0,
      values.understandingInstructions || 0,
      values.taskCompletion || 0,
      values.effectiveInteraction || 0,
      values.followUpWithSupervisor || 0,
      values.adherenceToInstructions || 0,
      values.reportWriting || 0,
      values.informationGathering || 0,
      values.adaptToWorkEnvironment || 0,
      values.maintenanceSkills || 0
    ];
    
    // Calculate total points (out of 60)
    const totalPoints = [...personalEthicalRatings, ...practicalProfessionalRatings].reduce((a, b) => a + b, 0);
    
    this.evaluationForm.patchValue({ overallRating: totalPoints }, { emitEvent: false });
  }

  calculateOverallRating() {
    const values = this.evaluationForm.value;
    
    // Personal and Ethical Aspects (9 points total)
    const personalEthicalRatings = [
      values.neatAppearance || 0,
      values.responsivePersonality || 0,
      values.confidentRelations || 0
    ];
    
    // Practical and Professional Aspects (51 points total)
    const practicalProfessionalRatings = [
      values.attendance || 0,
      values.understandingInstructions || 0,
      values.taskCompletion || 0,
      values.effectiveInteraction || 0,
      values.followUpWithSupervisor || 0,
      values.adherenceToInstructions || 0,
      values.reportWriting || 0,
      values.informationGathering || 0,
      values.adaptToWorkEnvironment || 0,
      values.maintenanceSkills || 0
    ];
    
    // Calculate total points (out of 60)
    const totalPoints = [...personalEthicalRatings, ...practicalProfessionalRatings].reduce((a, b) => a + b, 0);
    
    this.evaluationForm.patchValue({ overallRating: totalPoints });
    return totalPoints;
  }

  private loadStudentProgress() {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.student = {
        ...this.data.student,
        // Initialize with random progress data for demo
        progress: Math.floor(Math.random() * 100),
        attendance: Math.floor(Math.random() * 100),
        performance: {
          technical: Math.floor(Math.random() * 100),
          communication: Math.floor(Math.random() * 100),
          teamwork: Math.floor(Math.random() * 100)
        }
      };
      this.isLoading = false;
    }, 1000);
  }

  openReport(reportType: string) {
    this.isLoading = true;
    // Simulate report generation
    setTimeout(() => {
      this.snackBar.open(`${reportType} report generated successfully`, 'Close', {
        duration: 3000
      });
      this.isLoading = false;
    }, 1500);
  }

  submitEvaluation() {
    if (this.evaluationForm.valid) {
      this.isLoading = true;
      // Simulate API call
      setTimeout(() => {
        const evaluation: CapacityEvaluation = {
          ...this.evaluationForm.value,
          lastUpdated: new Date()
        };
        console.log('Evaluation submitted:', evaluation);
        this.snackBar.open('Evaluation submitted successfully', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
        this.dialogRef.close();
      }, 1500);
    }
  }

  close() {
    this.dialogRef.close();
  }

  getProgressColor(value: number | undefined): string {
    if (!value) return '#F44336';
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#FFC107';
    return '#F44336';
  }

  getPerformanceStatus(value: number | undefined): string {
    if (!value) return 'Not Available';
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Average';
    return 'Needs Improvement';
  }

  toggleEditMode() {
  if (this.isEditMode) {
    this.isLoading = true;

    const updatedStudent: Student = {
      code: this.student.code || '',
      name: this.student.name?.trim() || '',
      phone: this.student.phone?.trim() || '',
      state: this.student.state?.trim() || '',
      address: this.student.address?.trim() || '',
      nationalID: this.student.nationalID?.trim() || '',
      email: this.student.email?.trim() || '',
      birthDate: this.student.birthDate ? new Date(this.student.birthDate) : new Date(),
      createOn: this.student.createOn ?? new Date(), // fallback لو مفيش تاريخ إنشاء
      gender: this.student.gender || 'غير محدد',
      department: this.student.department || '',
      birthAddress: this.student.birthAddress || '',
      factory: this.student.factory || '',
      grade: this.student.grade || 1,
      stage: this.student.stage || '',
      factoryType: this.student.factoryType || true,
      selected: this.student.selected ?? false
    };

    // تحقق إضافي قبل الإرسال
    if (!updatedStudent.code) {
      this.snackBar.open('Error: Missing student code!', 'Close', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    // التحديث
    this.authService.updateStudent(updatedStudent).then(success => {
      this.isLoading = false;
      if (success) {
        this.snackBar.open('Changes saved successfully', 'Close', { duration: 3000 });
        this.dialogRef.close({ action: 'update', student: updatedStudent });
      } else {
        this.snackBar.open('Error saving changes', 'Close', { duration: 3000 });
      }
    }).catch(err => {
      this.isLoading = false;
      console.error('Update failed:', err);
      this.snackBar.open('An error occurred while saving', 'Close', { duration: 3000 });
    });
  }

  // عكس وضع التعديل
  this.isEditMode = !this.isEditMode;
}


  Delete() {
    if (confirm('Are you sure you want to delete this student?')) {
      this.isLoading = true;
      this.authService.deleteStudent(this.student.code).then(success => {
        if (success) {
          this.snackBar.open('Student deleted successfully', 'Close', {
            duration: 3000
          });
          this.dialogRef.close({ action: 'delete', student: this.student });
        } else {
          this.snackBar.open('Error deleting student', 'Close', {
            duration: 3000
          });
        }
        this.isLoading = false;
      });
    }
    this.dialogRef.close();
  }
}
