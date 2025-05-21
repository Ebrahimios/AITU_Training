import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { TranslationService } from '../../../services/translation.service';
import { AuthService, User } from '../../../services/firebase.service';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.css']
})
export class UserProfileModalComponent {
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<UserProfileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    public translationService: TranslationService,
    private authService: AuthService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.previewImage();
    }
  }

  previewImage(): void {
    if (!this.selectedFile) {
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  uploadImage(): void {
    if (this.selectedFile && this.data.user.id) {
      // Here you would implement the actual upload to Firebase Storage
      // For now, we'll just update the user profile with a placeholder URL
      console.log('Uploading image:', this.selectedFile.name);
      
      // Update the user profile with the new image URL and timestamp
      // In a real implementation, you would upload to Firebase Storage first
      // and then update the user profile with the actual URL
      const imageUrl = this.previewUrl as string;
      const timestamp = Date.now(); // Current timestamp in milliseconds
      
      // For demonstration, we'll just close the dialog
      // In a real implementation, you would update the user profile in Firebase
      this.dialogRef.close({ imageUrl, timestamp });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
