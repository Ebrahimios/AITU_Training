import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditStudentModalComponent } from '../edit-student-modal/edit-student-modal.component';

interface Student {
  id: number;
  studentCode: string;
  studentName: string;
  email: string;
  phoneNumber: string;
  birthDate: Date;
  gender: 'Male' | 'Female';
  localAddress: string;
  department: string;
  factory: string;
  factoryType: string;
  stage: string;
  batch: string;
  ssn: string;
  status: string;
  date: Date;
  selected: boolean;
  progress?: number;
  attendance?: number;
  performance?: {
    technical: number;
    communication: number;
    teamwork: number;
  };
}

interface CapacityEvaluation {
  technicalSkills: number;
  communication: number;
  teamwork: number;
  problemSolving: number;
  attendance: number;
  overallRating: number;
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
export class StudentDetailsModalComponent {
  student: Student;
  evaluationForm!: FormGroup;
  isSupervisor: boolean = true;
  isLoading: boolean = false;
  showProgress: boolean = false;
  progressValue: number = 0;
  activeTab: 'basic' | 'progress' | 'evaluation' = 'basic';
  isEditMode: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<StudentDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: Student },
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.student = {
      ...data.student,
      birthDate: data.student.birthDate ? new Date(data.student.birthDate) : new Date(),
      date: data.student.date ? new Date(data.student.date) : new Date()
    };
    this.initializeForm();
    this.loadStudentProgress();
  }

  private initializeForm() {
    this.evaluationForm = this.fb.group({
      technicalSkills: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      communication: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      teamwork: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      problemSolving: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      attendance: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      comments: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.evaluationForm.valueChanges.subscribe(() => {
      this.calculateOverallRating();
    });
  }

  private calculateAverageRating(values: any) {
    const ratings = [
      values.technicalSkills,
      values.communication,
      values.teamwork,
      values.problemSolving,
      values.attendance
    ];
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    this.evaluationForm.patchValue({ overallRating: average }, { emitEvent: false });
  }

  calculateOverallRating() {
    const values = this.evaluationForm.value;
    const ratings = [
      values.technicalSkills || 0,
      values.communication || 0,
      values.teamwork || 0,
      values.problemSolving || 0,
      values.attendance || 0
    ];
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    this.evaluationForm.patchValue({ overallRating: average });
  }

  private loadStudentProgress() {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.student.progress = Math.floor(Math.random() * 100);
      this.student.attendance = Math.floor(Math.random() * 100);
      this.student.performance = {
        technical: Math.floor(Math.random() * 100),
        communication: Math.floor(Math.random() * 100),
        teamwork: Math.floor(Math.random() * 100)
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

  Edit() {
    this.dialogRef.close();
    const dialogRef = this.dialog.open(EditStudentModalComponent, {
      width: '500px',
      data: {
        student: {
          ...this.student,
          date: this.student.date,
          birthDate: this.student.birthDate
        },
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.student = {
          ...this.student,
          ...result,
          date: result.date ? new Date(result.date) : this.student.date,
          birthDate: result.birthDate ? new Date(result.birthDate) : this.student.birthDate
        };
      }
    });
  }

  toggleEditMode() {
    if (this.isEditMode) {
      // Save changes
      this.snackBar.open('Changes saved successfully', 'Close', {
        duration: 3000
      });
    }
    this.isEditMode = !this.isEditMode;
  }

  Delete() {
    if (confirm('Are you sure you want to delete this student?')) {
      this.dialogRef.close({ action: 'delete', student: this.student });
    }
  }
}
