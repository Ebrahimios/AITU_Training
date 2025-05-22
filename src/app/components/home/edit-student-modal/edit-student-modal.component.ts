import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Student } from '../../../interfaces/student';
import { AuthService } from '../../../services/firebase.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-edit-student-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEdit ? 'Edit' : 'Add' }} Student</h5>
          <button type="button" class="btn-close" (click)="dialogRef.close()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <form [formGroup]="studentForm" (ngSubmit)="save()">
        <div class="modal-body">
          <div class="mb-3">
            <label for="code" class="form-label">Student Code</label>
              <input type="text" class="form-control" id="code" formControlName="code" placeholder="Enter student code">
              <div class="text-danger" *ngIf="studentForm.get('code')?.touched && studentForm.get('code')?.errors?.['required']">
                Student code is required.
              </div>
          </div>

          <div class="mb-3">
            <label for="name" class="form-label">Student Name</label>
              <input type="text" class="form-control" id="name" formControlName="name" placeholder="Enter student name">
              <div class="text-danger" *ngIf="studentForm.get('name')?.touched && studentForm.get('name')?.errors?.['required']">
                Student name is required.
              </div>
          </div>

          <div class="mb-3">
            <label for="address" class="form-label">Student Address</label>
              <input type="text" class="form-control" id="address" formControlName="address" placeholder="Enter student address">
              <div class="text-danger" *ngIf="studentForm.get('address')?.touched && studentForm.get('address')?.errors?.['required']">
                Address is required
              </div>
          </div>

          <div class="mb-3">
            <label for="nationalID" class="form-label">National ID</label>
              <input type="text" class="form-control" id="nationalID" formControlName="nationalID" placeholder="Enter National ID (15 digits)">
              <div class="text-danger" *ngIf="studentForm.get('nationalID')?.touched && studentForm.get('nationalID')?.errors?.['required']">
                National ID is required.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('nationalID')?.touched && studentForm.get('nationalID')?.errors?.['minlength']">
                National ID must be at least 15 characters.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('nationalID')?.touched && studentForm.get('nationalID')?.errors?.['maxlength']">
                National ID must be at most 15 characters.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('nationalID')?.touched && studentForm.get('nationalID')?.errors?.['pattern']">
                National ID must contain only numbers.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('nationalID')?.touched && studentForm.get('nationalID')?.errors?.['nationalIDExists']">
                National ID already exists.
              </div>
          </div>

          <div class="mb-3">
            <label for="phone" class="form-label">Phone Number</label>
              <input type="tel" class="form-control" id="phone" formControlName="phone" placeholder="Enter phone number">
              <div class="text-danger" *ngIf="studentForm.get('phone')?.touched && studentForm.get('phone')?.errors?.['required']">
                Phone number is required.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('phone')?.touched && studentForm.get('phone')?.errors?.['maxlength']">
                Phone number must be at most 15 characters.
              </div>
              <div class="text-danger" *ngIf="studentForm.get('phone')?.touched && studentForm.get('phone')?.errors?.['pattern']">
                Phone number must contain only numbers.
              </div>
          </div>

          <div class="mb-3">
            <label for="state" class="form-label">Student Status</label>
              <select class="form-select" id="state" formControlName="state">
                <option value="">Select Status</option>
              <option *ngFor="let stat of states" [value]="stat">{{stat}}</option>
              </select>
              <div class="text-danger" *ngIf="studentForm.get('state')?.touched && studentForm.get('state')?.errors?.['required']">
                Status is required.
              </div>
            </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            {{ isEdit ? 'Save Changes' : 'Add Student' }}
          </button>
        </div>
        </form>
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
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      margin: 20px;
      position: relative;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
                  0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      color: #718096;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background-color: #f7fafc;
      color: #4a5568;
    }

    .btn-close i {
      font-size: 1.25rem;
    }

    .form-label {
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 0.5rem;
      display: block;
    }

    .form-control, .form-select {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #2d3748;
      transition: all 0.2s;
    }

    .form-control::placeholder {
      color: #a0aec0;
    }

    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    .modal-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.625rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background-color: #edf2f7;
      border: 1px solid #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background-color: #e2e8f0;
    }

    .btn-primary {
      background-color: #4299e1;
      border: 1px solid #3182ce;
      color: white;
    }

    .btn-primary:hover {
      background-color: #3182ce;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .text-danger {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `]
})
export class EditStudentModalComponent {
  studentForm!: FormGroup;
  states = ['New', 'Returner'];
  isEdit: boolean;
  student?: Student;

  constructor(
    public dialogRef: MatDialogRef<EditStudentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student?: Student, isEdit: boolean },
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.isEdit = data.isEdit;
    this.student = data.student;
    this.initForm(this.student);
  }

  private initForm(student?: Student) {
    this.studentForm = this.fb.group({
      code: [student?.code || '', Validators.required],
      name: [student?.name || '', Validators.required],
      address: [student?.address || '', Validators.required],
      nationalID: [
        student?.nationalID || '',
        [
          Validators.required,
          Validators.minLength(15),
          Validators.maxLength(15),
          Validators.pattern('^[0-9]*$'),
          this.nationalIDExistsValidator.bind(this)
        ]
      ],
      phone: [student?.phone || '', [
        Validators.required,
        Validators.maxLength(15),
        Validators.pattern('^[0-9]*$')
      ]],
      state: [student?.state || '', Validators.required]
    });
  }

  private nationalIDExistsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const nationalID = control.value;
    if (!nationalID || nationalID.length !== 15) {
      return new Observable(subscriber => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return new Observable<ValidationErrors | null>(subscriber => {
      this.authService.getAllStudents()
        .then((students: Student[]) => {
          const nationalIDExists = students.some((student: Student) =>
            student.nationalID === nationalID && (!this.isEdit || student.code !== this.student?.code)
          );
          subscriber.next(nationalIDExists ? { nationalIDExists: true } : null);
          subscriber.complete();
        })
        .catch(error => {
          console.error('Error validating National ID:', error);
          subscriber.next(null);
          subscriber.complete();
        });
    });
  }

  // Add a method to check form validity and log details
  checkFormValidity() {
    console.log('Form validity check:');
    console.log('Form valid:', this.studentForm.valid);
    console.log('code valid:', this.studentForm.get('code')?.valid);
    console.log('name valid:', this.studentForm.get('name')?.valid);
    console.log('address valid:', this.studentForm.get('address')?.valid);
    console.log('nationalID valid:', this.studentForm.get('nationalID')?.valid);
    console.log('phone valid:', this.studentForm.get('phone')?.valid);
    console.log('state valid:', this.studentForm.get('state')?.valid);
    
    // Log errors if any
    if (this.studentForm.get('nationalID')?.errors) {
      console.log('nationalID errors:', this.studentForm.get('nationalID')?.errors);
    }
    if (this.studentForm.get('phone')?.errors) {
      console.log('phone errors:', this.studentForm.get('phone')?.errors);
    }
  }

  save() {
    // Log form validity before saving
    this.checkFormValidity();
    
    try {
      console.log('Attempting to save student data...');
      // Get form values regardless of validity
      const formValue = this.studentForm.value;
      console.log('Form values:', formValue);
      
      // Create student data object
      const studentData: Student = {
        code: formValue.code,
        name: formValue.name,
        address: formValue.address,
        nationalID: formValue.nationalID,
        phone: formValue.phone,
        state: formValue.state,
        selected: false
      };
      console.log('Student data to save:', studentData);

      if (this.isEdit) {
        console.log('Updating existing student...');
        // Update existing student
        this.authService.updateStudent(studentData)
          .then(() => {
            console.log('Student updated successfully!');
            this.dialogRef.close(studentData);
          })
          .catch((error: any) => {
            console.error('Error updating student:', error);
            alert('Failed to update student: ' + (error?.message || 'Unknown error'));
          });
      } else {
        console.log('Adding new student...');
        // Add new student
        this.authService.sendStudentData(studentData)
          .then(() => {
            console.log('Student added successfully!');
            this.dialogRef.close(studentData);
          })
          .catch((error: any) => {
            console.error('Error adding student:', error);
            alert('Failed to add student: ' + (error?.message || 'Unknown error'));
          });
      }
    } catch (error: any) {
      console.error('Unexpected error in save method:', error);
      alert('An unexpected error occurred: ' + (error?.message || 'Unknown error'));
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
