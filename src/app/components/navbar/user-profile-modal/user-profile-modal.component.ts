import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { TranslationService } from '../../../services/translation.service';
import { AuthService, User } from '../../../services/firebase.service';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.css'],
})
export class UserProfileModalComponent {
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isEditMode = false;
  isUpdating = false;
  updateError = '';
  confirmPassword = '';
  currentPassword = '';
  userData: any = {};

  constructor(
    public dialogRef: MatDialogRef<UserProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    public translationService: TranslationService,
    private authService: AuthService,
  ) {
    this.userData = { ...data.user };
    this.dialogRef.disableClose = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.previewImage();
    }
  }

  previewImage(): void {
    if (!this.selectedFile) return;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(this.selectedFile);
  }

  toggleEdit() {
    this.isEditMode = true;
  }

  async save() {
    this.isUpdating = true;
    this.updateError = '';

    try {
      if (this.confirmPassword !== this.userData.password) {
        this.updateError = 'Passwords do not match.';
        this.isUpdating = false;
        return;
      }
      // تحديث البيانات في فايرستور وفايربيز Auth
      const success = await this.authService.updateUserProfileAndAuth(
        this.userData.id,
        this.userData,
        this.data.user.password!,
      );
      if (success) {
        this.isEditMode = false;
        this.dialogRef.close({ updated: true, user: this.userData });
      } else {
        this.updateError = 'Faild updating profile';
      }
    } catch (err) {
      this.updateError = 'Error updating profile.';
    }
    this.isUpdating = false;
  }

  closeDialog(): void {
    document.body.style.overflow = '';
    this.dialogRef.close();
  }
}
