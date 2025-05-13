import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

interface Student {
  id: number;
  student: string;
  department: string;
  factory: string;
  batch: string;
  stage: string;
  date: string;
  selected: boolean;
}

@Component({
    selector: 'app-edit-student-modal',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatSelectModule
    ],
    template: `
    <div class="modal-overlay" (click)="dialogRef.close()">
      <div class="student-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEdit ? 'Edit' : 'Add' }} Student</h2>
          <button mat-icon-button (click)="dialogRef.close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="modal-content">
          <form [formGroup]="studentForm" class="student-form">
            <div class="form-section">
              <h3>Student Information</h3>
              <div class="form-grid">
                <div class="form-item">
                  <label>Student Name</label>
                  <div class="input-with-icon">
                    <mat-icon class="field-icon">person</mat-icon>
                    <input matInput formControlName="student" placeholder="Enter student name">
                  </div>
                </div>

                <div class="form-item">
                  <label>Stage</label>
                  <div class="input-with-icon">
                    <mat-icon class="field-icon">school</mat-icon>
                    <mat-select formControlName="stage" (selectionChange)="onStageChange($event.value)">
                      <mat-option *ngFor="let stage of stages" [value]="stage">{{stage}}</mat-option>
                    </mat-select>
                  </div>
                </div>

                <div class="form-item">
                  <label>Batch</label>
                  <div class="input-with-icon">
                    <mat-icon class="field-icon">groups</mat-icon>
                    <mat-select formControlName="batch" [disabled]="!studentForm.get('stage')?.value">
                      <mat-option *ngFor="let batch of filteredBatches" [value]="batch">{{batch}}</mat-option>
                    </mat-select>
                  </div>
                </div>

                <div class="form-item">
                  <label>Department</label>
                  <div class="input-with-icon">
                    <mat-icon class="field-icon">business</mat-icon>
                    <mat-select formControlName="department">
                      <mat-option *ngFor="let dept of departments" [value]="dept">{{dept}}</mat-option>
                    </mat-select>
                  </div>
                </div>

                <div class="form-item">
                  <label>Factory</label>
                  <div class="input-with-icon">
                    <mat-icon class="field-icon">factory</mat-icon>
                    <mat-select formControlName="factory">
                      <mat-option *ngFor="let factory of factories" [value]="factory">{{factory}}</mat-option>
                    </mat-select>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button mat-button (click)="dialogRef.close()">
                <mat-icon>close</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" (click)="save()" [disabled]="studentForm.invalid">
                <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
                {{ isEdit ? 'Save Changes' : 'Add Student' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .student-modal {
      background: #ffffff;
      padding: 24px;
      max-width: 600px;
      width: 95%;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #edf2f7;
    }

    .modal-header h2 {
      margin: 0;
      color: #1a202c;
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-header button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #4a5568;
      transition: all 0.2s ease;
    }

    .modal-header button:hover {
      background: #edf2f7;
      transform: translateY(-1px);
    }

    .modal-content {
      max-height: 82vh;
      overflow-y: auto;
    }

    .form-section {
      background: #f7fafc;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }

    h3 {
      color: #1a202c;
      margin: 0 0 16px;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-grid {
      display: grid;
      gap: 24px;
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-item label {
      color: #2d3748;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 12px;
      color: #718096;
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
      z-index: 1;
    }

    .input-with-icon input,
    .input-with-icon mat-select {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #2d3748;
      transition: all 0.2s ease;
    }

    .input-with-icon input:focus,
    .input-with-icon mat-select:focus {
      border-color: #3182ce;
      box-shadow: 0 0 0 4px rgba(49, 130, 206, 0.1);
      outline: none;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    .form-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .form-actions button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    .form-actions button:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .form-actions button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 600px) {
      .student-modal {
        width: 90%;
        padding: 16px;
      }

      .modal-header h2 {
        font-size: 1.5rem;
      }

      .form-section {
        padding: 16px;
      }
    }
  `]
})
export class EditStudentModalComponent {
  studentForm!: FormGroup;
  departments = ['IT', 'Mechanics', 'Electrical'];
  factories = ['Factory A', 'Factory B', 'Factory C'];
  allBatches: string[] = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];
  batches: string[] = this.allBatches;
  stages: string[] = ['School', 'Institute', 'Faculty'];
  isEdit: boolean;

  constructor(
    public dialogRef: MatDialogRef<EditStudentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student?: Student, isEdit: boolean },
    private fb: FormBuilder
  ) {
    this.isEdit = data.isEdit;
    this.initializeForm();

    if (data.student) {
      this.studentForm.patchValue(data.student);
    }
  }

  initializeForm() {
    this.studentForm = this.fb.group({
      student: ['', [Validators.required, Validators.minLength(3)]],
      stage: ['', Validators.required],
      batch: ['', Validators.required],
      department: ['', Validators.required],
      factory: ['', Validators.required]
    });
  }

  get filteredBatches(): string[] {
    const stage = this.studentForm.get('stage')?.value;
    switch (stage) {
      case 'School': return ['Batch 1', 'Batch 2', 'Batch 3'];
      case 'Institute': return ['Batch 1', 'Batch 2'];
      case 'Faculty': return ['Batch 3', 'Batch 4'];
      default: return this.allBatches;
    }
  }

  onStageChange(stage: string) {
    this.studentForm.patchValue({ batch: '' });
  }

  save() {
    if (this.studentForm.valid) {
      const studentData = this.studentForm.value;
      if (this.isEdit && this.data.student) {
        studentData.id = this.data.student.id;
      }
      this.dialogRef.close(studentData);
    }
  }
}
