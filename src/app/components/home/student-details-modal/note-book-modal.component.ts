import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface NoteBookEntry {
  time: string;
  note: string;
}

@Component({
  selector: 'app-note-book-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="notebook-modal-overlay"></div>
    <div class="notebook-modal-container">
      <div class="notebook-modal-header">
        <h2 class="notebook-modal-title">Notebook for {{ data.notebookDate | date:'fullDate' }}</h2>
        <h3 class="notebook-modal-subtitle">Student ID: {{ data.studentId }}</h3>
        <h3 class="notebook-modal-subtitle">factory : {{ data.studentFactory }}</h3>
      </div>
      
      <div class="notebook-modal-content">
        <div class="notebook-details">
          <div class="notebook-section">
            <h4 class="section-title">Notebook</h4>
            <div class="entries-container">
              <div *ngIf="data.noteBookText && data.noteBookText.trim().length; else noNotebookText">
                <p class="notebook-text">{{ data.noteBookText }}</p>
              </div>
              <ng-template #noNotebookText>
                <p class="notebook-empty">No notebook text for this date.</p>
              </ng-template>
              
            </div>
          </div>
        </div>
        
        <div class="image-slider">
          <h4 class="section-title">Supporting Images</h4>
          <div class="slider-container">
            <button mat-icon-button class="nav-button prev-button" (click)="prevImage()" [disabled]="currentImageIndex === 0">
                <span>&lt;</span>
            </button>
            <div class="image-container">
              <img [src]="images[currentImageIndex]" alt="Notebook Image {{ currentImageIndex + 1 }}" class="slider-image">
              <div class="image-counter">{{ currentImageIndex + 1 }} / {{ images.length }}</div>
            </div>
            <button mat-icon-button class="nav-button next-button" (click)="nextImage()" [disabled]="currentImageIndex === images.length - 1">
                <span>&gt;</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="notebook-modal-actions">
        <button mat-stroked-button color="primary" (click)="close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 2001 !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .notebook-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.45);
      z-index: 2001;
    }
    .notebook-modal-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      z-index: 2002;
      width: 80vw;
    //   max-width: 1200px;
      min-height: 500px;
      height:90vh;
    //   max-height: 90vh;
      padding: 32px;
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.25s;
    }
    .notebook-modal-header {
      margin-bottom: 24px;
    //   text-align: center;
    }
    .notebook-modal-title {
      margin: 0 0 8px 0;
      font-size: 1.8rem;
      font-weight: 600;
      color: #2d3a4a;
    }
    .notebook-modal-subtitle {
      margin: 0;
      font-size: 1.2rem;
      font IMS weight: 400;
      color: #666;
    }
    .notebook-modal-content {
      display: flex;
    //   flex: 1;
      gap: 24px;
      overflow: hidden;
    }
    .notebook-details {
      flex: 1;
      overflow-y: auto;
      padding-right: 16px;
    }
    .image-slider {
    //   flex: 1;
      width:70%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 500;
      color: #2d3a4a;
      margin: 0 0 16px 0;
    }
    .entries-container {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
    }
    .notebook-text {
      color: #444;
      margin: 0 0 16px 0;
      padding: 12px;
      background: #fff;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    .entry-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .entry-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .notebook-time {
      font-weight: 500;
      color: #1976d2;
      min-width: 70px;
      margin-right: 16px;
    }
    .notebook-note {
      color: #444;
      flex: 1;
    }
    .notebook-empty {
      color: #888;
      text-align: center;
      margin: 32px 0;
      font-style: italic;
    }
    .slider-container {
      position: relative;
      width: 100%;
      max-width: 800px;
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
    }
    .slider-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }
    .image-counter {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.9rem;
    }
    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      line-height:10px;
      z-index:2004;
      text-align:center;
    }
    .prev-button {
      left: -20px;
    }
    .next-button {
      right: -20px;
    }
    .nav-button:disabled {
      background: rgba(255,255,255,0.5);
      cursor: not-allowed;
    }
    .nav-button mat-icon {
      color: #1976d2;
    }
    .notebook-modal-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .notebook-modal-actions button[mat-stroked-button] {
      min-width: 120px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 24px;
      padding: 8px 24px;
      border-width: 2px;
      border-color: #1976d2;
      color: #1976d2;
      background: #f5faff;
      transition: all 0.2s;
    }
    .notebook-modal-actions button[mat-stroked-button]:hover {
      background: #1976d2;
      color: #fff;
      box-shadow: 0 4px 16px rgba(25, 118, 210, 0.18);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -60%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
  `]
})
export class NoteBookModalComponent {
  

  images: string[] = [
    'https://placehold.co/600x400',
  ];
  currentImageIndex: number = 0;

  constructor(
    public dialogRef: MatDialogRef<NoteBookModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      notebookDate: Date,
      studentId: string,
      noteBookText: string,
      studentImages: string[],
      studentFactory:string,
    }
  ) {
    // If studentImages provided and is a non-empty array, use it instead of placeholders
    if (data.studentImages && Array.isArray(data.studentImages) && data.studentImages.length > 0) {
      this.images = data.studentImages;
    }
  }

  close() {
    this.dialogRef.close();
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
    }
  }
}