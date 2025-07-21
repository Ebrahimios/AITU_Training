import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditStudentModalComponent } from '../edit-student-modal/edit-student-modal.component';
import { Student, StudentReport } from '../../../interfaces/student';
import { AuthService } from '../../../services/firebase.service';
import { FactoryService, Supervisor } from '../../../services/factory.service';
import {
  collection,
  query,
  where,
  doc,
  setDoc,
  getDoc, updateDoc,
  getDocs,
} from '@angular/fire/firestore';
import { userSerivce } from '../../../services/user.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NoteBookModalComponent } from './note-book-modal.component';


// Extended student type with performance metrics
interface StudentWithPerformance extends Student {
  progress?: number;
  attendance?: number;
  performance?: {
    // Personal and Ethical Aspects
    neatAppearance: number;
    responsivePersonality: number;
    confidentRelations: number;

    // Practical and Professional Aspects
    attendance: number;
    understandingInstructions: number;
    taskCompletion: number;
    effectiveInteraction: number;
    followUpWithSupervisor: number;
    adherenceToInstructions: number;
    reportWriting: number;
    informationGathering: number;
    adaptToWorkEnvironment: number;
    maintenanceSkills: number;
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
  lastUpdated?: number;
  birthDateString?: string; // For date input field
}

@Component({
  selector: 'app-student-details-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, NoteBookModalComponent],
  templateUrl: './student-details-modal.component.html',
  styleUrls: ['./student-details-modal.component.css'],
})
export class StudentDetailsModalComponent implements OnInit {
  student!: StudentWithPerformance;
  evaluationForm!: FormGroup;
  isSupervisor: boolean = true;
  isLoading: boolean = false;
  showProgress: boolean = false;
  progressValue: number = 0;
  activeTab: 'basic' | 'progress' | 'evaluation' | 'report' = 'basic';
  isEditMode: boolean = false;
  isLoadingReport: boolean = false;
  isLoadingReports: boolean = false; // Added property for reports loading state
  studentReports: StudentReport[] = []; // Added property for student reports
  attendanceReports: any[] = [];
  isLoadingAttendanceReports = false;
  supervisors: Supervisor[] = [];
  birthDateString: string = ''; // For date input field
  supervisorNames: string[] = [];

  constructor(
    public userService : userSerivce,
    public dialogRef: MatDialogRef<StudentDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: Student },
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private factoryService: FactoryService,
  ) {
    // Convert dates to appropriate formats
    if (this.data && this.data.student) {
      this.convertDates(this.data.student);
    }
  }

  // Helper method to convert dates to appropriate formats
  private convertDates(student: Student): void {
    // For birthDate, ensure it's a string in YYYY-MM-DD format
    if (student.birthDate) {
      if (typeof student.birthDate === 'number') {
        // Convert timestamp to string
        const date = new Date(student.birthDate);
        if (!isNaN(date.getTime())) {
          student.birthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }
      // If it's already a string, leave it as is
    }

    // For createOn, ensure it's a string in YYYY-MM-DD format
    if (student.createOn) {
      if (typeof student.createOn === 'number') {
        // Convert timestamp to string
        const date = new Date(student.createOn);
        if (!isNaN(date.getTime())) {
          student.createOn = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }
      // If it's already a string, leave it as is
    }

    // For birthDate, ensure it's a string in YYYY-MM-DD format
    if (student.birthDate) {
      if (typeof student.birthDate === 'number') {
        // Convert timestamp to string
        const date = new Date(student.birthDate);
        if (!isNaN(date.getTime())) {
          student.birthDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }
    }
  }

  ngOnInit(): void {
    // Load supervisors from factory service
    this.factoryService.supervisors$.subscribe((supervisors) => {
      this.supervisors = supervisors;
      this.supervisorNames = supervisors.map((s) => s.name);
    });

    // Format dates appropriately
    const formatBirthDate = (value: any): string | null | undefined => {
      if (!value) return undefined;

      // If already a string, return it
      if (typeof value === 'string') return value;

      // If number (timestamp), convert to string
      if (typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime())
          ? undefined
          : date.toISOString().split('T')[0];
      }

      return undefined;
    };

    const formatCreateOnToString = (value: any): string | undefined => {
      if (!value) return undefined;

      // If already a string, validate and return it
      if (typeof value === 'string') return value;

      // If number (timestamp), convert to string
      if (typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime())
          ? undefined
          : date.toISOString().split('T')[0];
      }

      return undefined;
    };

    this.student = {
      ...this.data.student,
      birthDate: formatBirthDate(this.data.student.birthDate) || undefined,
      createOn: formatCreateOnToString(this.data.student.createOn),
    };

    // Convert timestamp to date string for the date input field
    this.updateBirthDateString();

    this.initializeForm();
    this.loadStudentProgress();

    // Load student reports when the component initializes
    this.loadStudentReports();

    this.loadAttendanceReports();
  }

  // باقي الكود بدون تغيير...

  private initializeForm() {
    this.evaluationForm = this.fb.group({
      // Personal and Ethical Aspects (9 points total)
      neatAppearance: [
    
        0,

        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      responsivePersonality: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      confidentRelations: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],

      // Practical and Professional Aspects (51 points total)
      attendance: [
        0,
        [Validators.required, Validators.min(0), Validators.max(15)],
      ],
      understandingInstructions: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      taskCompletion: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      effectiveInteraction: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      followUpWithSupervisor: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      adherenceToInstructions: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      reportWriting: [
        0,
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
      informationGathering: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],
      adaptToWorkEnvironment: [
        0,
        [Validators.required, Validators.min(0), Validators.max(5)],
      ],
      maintenanceSkills: [
        0,
        [Validators.required, Validators.min(0), Validators.max(3)],
      ],

      overallRating: [0],
      comments: ['', [Validators.required, Validators.minLength(10)]],
    });

    if (!this.userService.isAdmin) {
      Object.keys(this.evaluationForm.controls).forEach(key => {
        if(key == "attendance"){
          this.evaluationForm.get(key)?.disable();
        }
      });
    }
  }

  private calculateAverageRating(values: any) {
    // Personal and Ethical Aspects (9 points total)
    const personalEthicalRatings = [
      values.neatAppearance || 0,
      values.responsivePersonality || 0,
      values.confidentRelations || 0,
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
      values.maintenanceSkills || 0,
    ];

    // Calculate total points (out of 60)
    const totalPoints = [
      ...personalEthicalRatings,
      ...practicalProfessionalRatings,
    ].reduce((a, b) => a + b, 0);

    this.evaluationForm.patchValue(
      { overallRating: totalPoints },
      { emitEvent: false },
    );
  }

  /**
   * Updates the evaluation form with data loaded from Firebase
   * @param evaluationData The evaluation data from Firebase
   */
  private updateEvaluationFormWithData(
    evaluationData: CapacityEvaluation,
  ): void {
    if (!evaluationData) return;

    // Update form with loaded evaluation data
    this.evaluationForm.patchValue({
      // Personal and Ethical Aspects
      neatAppearance: evaluationData.neatAppearance || 0,
      responsivePersonality: evaluationData.responsivePersonality || 0,
      confidentRelations: evaluationData.confidentRelations || 0,

      // Practical and Professional Aspects
      attendance: evaluationData.attendance || 0,
      understandingInstructions: evaluationData.understandingInstructions || 0,
      taskCompletion: evaluationData.taskCompletion || 0,
      effectiveInteraction: evaluationData.effectiveInteraction || 0,
      followUpWithSupervisor: evaluationData.followUpWithSupervisor || 0,
      adherenceToInstructions: evaluationData.adherenceToInstructions || 0,
      reportWriting: evaluationData.reportWriting || 0,
      informationGathering: evaluationData.informationGathering || 0,
      adaptToWorkEnvironment: evaluationData.adaptToWorkEnvironment || 0,
      maintenanceSkills: evaluationData.maintenanceSkills || 0,

      // Overall rating and comments
      overallRating: evaluationData.overallRating || 0,
      comments: evaluationData.comments || '',
    });
  }
  async loadAttendanceReports() {
    this.isLoadingAttendanceReports = true;
    this.attendanceReports = [];
    try {
      const firestore = this.authService['firestore'];
      const reportsRef = collection(firestore, 'Attendances');
      const q = query(reportsRef, where('Student_ID', '==', this.student.code));
      const querySnapshot = await getDocs(q);
      this.attendanceReports = querySnapshot.docs.map((doc) => doc.data());
      console.log(this.attendanceReports);
    } catch (error) {
      console.error('Error loading attendance reports:', error);
    }
    this.isLoadingAttendanceReports = false;
  }
  downloadAttendanceReportsPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${this.student.name} - Attendance Reports`, 14, 14);

    autoTable(doc, {
      head: [
        [
          'Date',
          'Status',
          'Duration',
          'Supervisor Rating',
          'Environment Rating',
          'Benefit Rating',
          'Notes',
          'Factory Location',
          'Entry Near Factory?',
          'Entry Distance (m)',
          'Exit Near Factory?',
          'Exit Distance (m)',
        ],
      ],
      body: this.attendanceReports.map((r) => [
        r.Date?.toDate
          ? r.Date.toDate().toLocaleString()
          : r.Date
            ? new Date(r.Date).toLocaleString()
            : '',
        r.Status || '',
        r.TrainingDuration || '',
        r.SupervisorRating || '',
        r.EnvironmentRating || '',
        r.BenefitRating || '',
        r.Notes || '',
        r.FactoryLocation
          ? `[${r.FactoryLocation.latitude}, ${r.FactoryLocation.longitude}]`
          : '',
        this.isNearFactory(r, 'entry').near === null
          ? 'N/A'
          : this.isNearFactory(r, 'entry').near
            ? 'Yes'
            : 'No',
        this.isNearFactory(r, 'entry').distance === null
          ? 'N/A'
          : this.isNearFactory(r, 'entry').distance,
        this.isNearFactory(r, 'exit').near === null
          ? 'N/A'
          : this.isNearFactory(r, 'exit').near
            ? 'Yes'
            : 'No',
        this.isNearFactory(r, 'exit').distance === null
          ? 'N/A'
          : this.isNearFactory(r, 'exit').distance,
      ]),
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      margin: { left: 8, right: 8 },
    });

    const fileName = `${this.student.name || 'student'}-attendance.pdf`;
    doc.save(fileName);
  }

  private calculateDistanceMeters(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number },
  ): number {
    if (!loc1 || !loc2) return NaN;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  isNearFactory(
    report: any,
    type: 'entry' | 'exit',
    thresholdMeters = 400,
  ): { near: boolean | null; distance: number | null } {
    const factoryLoc = report.FactoryLocation;
    const pointLoc =
      type === 'entry' ? report.EnteringLocation : report.ExitingLocation;

    if (
      !factoryLoc ||
      !factoryLoc.latitude ||
      !factoryLoc.longitude ||
      !pointLoc ||
      !pointLoc.latitude ||
      !pointLoc.longitude
    ) {
      return { near: null, distance: null };
    }

    const distance = this.calculateDistanceMeters(factoryLoc, pointLoc);
    return { near: distance <= thresholdMeters, distance };
  }

  downloadEvaluationPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${this.student.name} - Evaluation Report`, 14, 14);

    autoTable(doc, {
      head: [['Aspect', 'Score', 'Max']],
      body: [
        ['Neat Appearance', this.student.performance?.neatAppearance, 3],
        [
          'Responsive Personality',
          this.student.performance?.responsivePersonality,
          3,
        ],
        [
          'Confident Relations',
          this.student.performance?.confidentRelations,
          3,
        ],
        ['Attendance', this.student.performance?.attendance, 15],
        [
          'Understanding Instructions',
          this.student.performance?.understandingInstructions,
          3,
        ],
        ['Task Completion', this.student.performance?.taskCompletion, 3],
        [
          'Effective Interaction',
          this.student.performance?.effectiveInteraction,
          3,
        ],
        [
          'Follow Up With Supervisor',
          this.student.performance?.followUpWithSupervisor,
          3,
        ],
        [
          'Adherence To Instructions',
          this.student.performance?.adherenceToInstructions,
          3,
        ],
        ['Report Writing', this.student.performance?.reportWriting, 10],
        [
          'Information Gathering',
          this.student.performance?.informationGathering,
          3,
        ],
        [
          'Adapt To Work Environment',
          this.student.performance?.adaptToWorkEnvironment,
          5,
        ],
        ['Maintenance Skills', this.student.performance?.maintenanceSkills, 3],
        [
          'Overall Rating',
          this.evaluationForm.get('overallRating')?.value || 0,
          60,
        ],
        ['Comments', this.evaluationForm.get('comments')?.value || '', ''],
      ],
      startY: 22,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      margin: { left: 8, right: 8 },
    });

    const fileName = `${this.student.name || 'student'}-evaluation.pdf`;
    doc.save(fileName);
  }
  downloadAllReportsPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${this.student.name} - Attendance Reports`, 14, 14);

    // Attendance Table
    autoTable(doc, {
      head: [
        [
          'Date',
          'Status',
          'Duration',
          'Supervisor Rating',
          'Environment Rating',
          'Benefit Rating',
          'Notes',
          'Entry Near Factory?',
          'Entry Distance (m)',
          'Exit Near Factory?',
          'Exit Distance (m)',
        ],
      ],
      body: this.attendanceReports.map((r) => [
        r.Date?.toDate
          ? r.Date.toDate().toLocaleString()
          : r.Date
            ? new Date(r.Date).toLocaleString()
            : '',
        r.Status || '',
        r.TrainingDuration || '',
        r.SupervisorRating || '',
        r.EnvironmentRating || '',
        r.BenefitRating || '',
        r.Notes || '',
        this.isNearFactory(r, 'entry').near === null
          ? 'N/A'
          : this.isNearFactory(r, 'entry').near
            ? 'Yes'
            : 'No',
        this.isNearFactory(r, 'entry').distance === null
          ? 'N/A'
          : this.isNearFactory(r, 'entry').distance,
        this.isNearFactory(r, 'exit').near === null
          ? 'N/A'
          : this.isNearFactory(r, 'exit').near
            ? 'Yes'
            : 'No',
        this.isNearFactory(r, 'exit').distance === null
          ? 'N/A'
          : this.isNearFactory(r, 'exit').distance,
      ]),
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      margin: { left: 8, right: 8 },
    });

    // Evaluation Table
    const y = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 10
      : 40;
    doc.text(`${this.student.name} - Evaluation Report`, 14, y);

    autoTable(doc, {
      head: [['Aspect', 'Score', 'Max']],
      body: [
        ['Neat Appearance', this.student.performance?.neatAppearance, 3],
        [
          'Responsive Personality',
          this.student.performance?.responsivePersonality,
          3,
        ],
        [
          'Confident Relations',
          this.student.performance?.confidentRelations,
          3,
        ],
        ['Attendance', this.student.performance?.attendance, 15],
        [
          'Understanding Instructions',
          this.student.performance?.understandingInstructions,
          3,
        ],
        ['Task Completion', this.student.performance?.taskCompletion, 3],
        [
          'Effective Interaction',
          this.student.performance?.effectiveInteraction,
          3,
        ],
        [
          'Follow Up With Supervisor',
          this.student.performance?.followUpWithSupervisor,
          3,
        ],
        [
          'Adherence To Instructions',
          this.student.performance?.adherenceToInstructions,
          3,
        ],
        ['Report Writing', this.student.performance?.reportWriting, 10],
        [
          'Information Gathering',
          this.student.performance?.informationGathering,
          3,
        ],
        [
          'Adapt To Work Environment',
          this.student.performance?.adaptToWorkEnvironment,
          5,
        ],
        ['Maintenance Skills', this.student.performance?.maintenanceSkills, 3],
        [
          'Overall Rating',
          this.evaluationForm.get('overallRating')?.value || 0,
          60,
        ],
        ['Comments', this.evaluationForm.get('comments')?.value || '', ''],
      ],
      startY: y + 6,
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      margin: { left: 8, right: 8 },
    });

    const fileName = `${this.student.name || 'student'}-all-reports.pdf`;
    doc.save(fileName);
  }

  downloadAllReportsWord() {
    let content = `${this.student.name} - Attendance Reports\n\n`;
    content +=
      'Date\tStatus\tDuration\tSupervisor Rating\tEnvironment Rating\tBenefit Rating\tNotes\tEntry Near Factory?\tEntry Distance (m)\tExit Near Factory?\tExit Distance (m)\n';
    this.attendanceReports.forEach((r) => {
      content +=
        `${r.Date?.toDate ? r.Date.toDate().toLocaleString() : r.Date ? new Date(r.Date).toLocaleString() : ''}\t` +
        `${r.Status || ''}\t` +
        `${r.TrainingDuration || ''}\t` +
        `${r.SupervisorRating || ''}\t` +
        `${r.EnvironmentRating || ''}\t` +
        `${r.BenefitRating || ''}\t` +
        `${r.Notes || ''}\t` +
        `${this.isNearFactory(r, 'entry').near === null ? 'N/A' : this.isNearFactory(r, 'entry').near ? 'Yes' : 'No'}\t` +
        `${this.isNearFactory(r, 'entry').distance === null ? 'N/A' : this.isNearFactory(r, 'entry').distance}\t` +
        `${this.isNearFactory(r, 'exit').near === null ? 'N/A' : this.isNearFactory(r, 'exit').near ? 'Yes' : 'No'}\t` +
        `${this.isNearFactory(r, 'exit').distance === null ? 'N/A' : this.isNearFactory(r, 'exit').distance}\n`;
    });

    content += `\n${this.student.name} - Evaluation Report\n\n`;
    content += 'Aspect\tScore\tMax\n';
    content += `Neat Appearance\t${this.student.performance?.neatAppearance}\t3\n`;
    content += `Responsive Personality\t${this.student.performance?.responsivePersonality}\t3\n`;
    content += `Confident Relations\t${this.student.performance?.confidentRelations}\t3\n`;
    content += `Attendance\t${this.student.performance?.attendance}\t15\n`;
    content += `Understanding Instructions\t${this.student.performance?.understandingInstructions}\t3\n`;
    content += `Task Completion\t${this.student.performance?.taskCompletion}\t3\n`;
    content += `Effective Interaction\t${this.student.performance?.effectiveInteraction}\t3\n`;
    content += `Follow Up With Supervisor\t${this.student.performance?.followUpWithSupervisor}\t3\n`;
    content += `Adherence To Instructions\t${this.student.performance?.adherenceToInstructions}\t3\n`;
    content += `Report Writing\t${this.student.performance?.reportWriting}\t10\n`;
    content += `Information Gathering\t${this.student.performance?.informationGathering}\t3\n`;
    content += `Adapt To Work Environment\t${this.student.performance?.adaptToWorkEnvironment}\t5\n`;
    content += `Maintenance Skills\t${this.student.performance?.maintenanceSkills}\t3\n`;
    content += `Overall Rating\t${this.evaluationForm.get('overallRating')?.value || 0}\t60\n`;
    content += `Comments\t${this.evaluationForm.get('comments')?.value || ''}\n`;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.student.name || 'student'}-all-reports.doc`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  downloadEvaluationWord() {
    let content = `${this.student.name} - Evaluation Report\n\n`;
    content += 'Aspect\tScore\tMax\n';
    content += `Neat Appearance\t${this.student.performance?.neatAppearance}\t3\n`;
    content += `Responsive Personality\t${this.student.performance?.responsivePersonality}\t3\n`;
    content += `Confident Relations\t${this.student.performance?.confidentRelations}\t3\n`;
    content += `Attendance\t${this.student.performance?.attendance}\t15\n`;
    content += `Understanding Instructions\t${this.student.performance?.understandingInstructions}\t3\n`;
    content += `Task Completion\t${this.student.performance?.taskCompletion}\t3\n`;
    content += `Effective Interaction\t${this.student.performance?.effectiveInteraction}\t3\n`;
    content += `Follow Up With Supervisor\t${this.student.performance?.followUpWithSupervisor}\t3\n`;
    content += `Adherence To Instructions\t${this.student.performance?.adherenceToInstructions}\t3\n`;
    content += `Report Writing\t${this.student.performance?.reportWriting}\t10\n`;
    content += `Information Gathering\t${this.student.performance?.informationGathering}\t3\n`;
    content += `Adapt To Work Environment\t${this.student.performance?.adaptToWorkEnvironment}\t5\n`;
    content += `Maintenance Skills\t${this.student.performance?.maintenanceSkills}\t3\n`;
    content += `Overall Rating\t${this.evaluationForm.get('overallRating')?.value || 0}\t60\n`;
    content += `Comments\t${this.evaluationForm.get('comments')?.value || ''}\n`;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.student.name || 'student'}-evaluation.doc`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  calculateOverallRating() {
    console.log('hello world');
    const values = this.evaluationForm.value;

    // Personal and Ethical Aspects (9 points total)
    const personalEthicalRatings = [
      values.neatAppearance || 0,
      values.responsivePersonality || 0,
      values.confidentRelations || 0,
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
      values.maintenanceSkills || 0,
    ];

    // Calculate total points (out of 60)
    const totalPoints = [
      ...personalEthicalRatings,
      ...practicalProfessionalRatings,
    ].reduce((a, b) => a + b, 0);
    this.evaluationForm.patchValue({ overallRating: totalPoints });
    return totalPoints;
  }

  private async loadStudentProgress() {
    if (!this.student || !this.student.code) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    try {
      // Get a reference to the Firestore instance
      const firestore = this.authService['firestore'];

      // Create a reference to the student's evaluation document
      const evaluationRef = doc(
        firestore,
        'StudentsTable',
        this.student.code,
        'evaluations',
        'performance',
      );

      // Get the evaluation data
      const evaluationDoc = await getDoc(evaluationRef);

      if (evaluationDoc.exists()) {
        const evaluationData = evaluationDoc.data() as CapacityEvaluation;

        // Update the student object with the evaluation data
        this.student = {
          ...this.data.student,
          // Calculate progress based on overall rating (60 is max)
          progress: Math.round((evaluationData.overallRating / 60) * 100),
          // Calculate attendance based on attendance rating (15 is max)
          attendance: Math.round((evaluationData.attendance / 15) * 100),
          performance: {
            // Personal and Ethical Aspects
            neatAppearance: evaluationData.neatAppearance,
            responsivePersonality: evaluationData.responsivePersonality,
            confidentRelations: evaluationData.confidentRelations,

            // Practical and Professional Aspects
            attendance: evaluationData.attendance,
            understandingInstructions: evaluationData.understandingInstructions,
            taskCompletion: evaluationData.taskCompletion,
            effectiveInteraction: evaluationData.effectiveInteraction,
            followUpWithSupervisor: evaluationData.followUpWithSupervisor,
            adherenceToInstructions: evaluationData.adherenceToInstructions,
            reportWriting: evaluationData.reportWriting,
            informationGathering: evaluationData.informationGathering,
            adaptToWorkEnvironment: evaluationData.adaptToWorkEnvironment,
            maintenanceSkills: evaluationData.maintenanceSkills,
          },
        };

        // Update the evaluation form with the loaded data
        this.updateEvaluationFormWithData(evaluationData);
      } else {
        // No evaluation data found, initialize with default values
        this.student = {
          ...this.data.student,
          progress: 0,
          attendance: 0,
          performance: {
            // Personal and Ethical Aspects
            neatAppearance: 0,
            responsivePersonality: 0,
            confidentRelations: 0,

            // Practical and Professional Aspects
            attendance: 0,
            understandingInstructions: 0,
            taskCompletion: 0,
            effectiveInteraction: 0,
            followUpWithSupervisor: 0,
            adherenceToInstructions: 0,
            reportWriting: 0,
            informationGathering: 0,
            adaptToWorkEnvironment: 0,
            maintenanceSkills: 0,
          },
        };
      }
    } catch (error) {
      console.error('Error loading student evaluation:', error);
      // Initialize with default values in case of error
      this.student = {
        ...this.data.student,
        progress: 0,
        attendance: 0,
        performance: {
          // Initialize with zeros
          neatAppearance: 0,
          responsivePersonality: 0,
          confidentRelations: 0,
          attendance: 0,
          understandingInstructions: 0,
          taskCompletion: 0,
          effectiveInteraction: 0,
          followUpWithSupervisor: 0,
          adherenceToInstructions: 0,
          reportWriting: 0,
          informationGathering: 0,
          adaptToWorkEnvironment: 0,
          maintenanceSkills: 0,
        },
      };
    } finally {
      this.isLoading = false;
    }
  }

  openReport(reportType: string) {
    this.isLoading = true;
    // Simulate report generation
    setTimeout(() => {
      this.snackBar.open(
        `${reportType} report generated successfully`,
        'Close',
        {
          duration: 3000,
        },
      );
      this.isLoading = false;
    }, 1500);
  }

  /**
   * Loads student reports from Firebase
   */
  loadStudentReports(): void {
    if (!this.student || !this.student.code) {
      return;
    }

    this.isLoadingReports = true;

    // In a real implementation, this would fetch reports from Firebase
    // For now, we'll simulate the fetch with sample data
    setTimeout(() => {
      // Sample reports data - in a real app, this would come from Firebase
      this.studentReports = [
        {
          id: '1',
          name: 'Student Progress Report',
          date: new Date().getTime(), // Current date
          url: 'https://firebasestorage.example.com/reports/student-report.pdf',
          status: 'approved',
          feedback: 'Good work!',
        },
      ];

      this.isLoadingReports = false;
    }, 1000);




    // In a real implementation with Firebase, it would look something like this:
    /*
    this.firestore
      .collection('students')
      .doc(this.student.code)
      .collection('reports')
      .get()
      .subscribe(snapshot => {
        this.studentReports = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            date: data.date,
            url: data.url,
            type: data.type,
            description: data.description
          };
        });
        this.isLoadingReports = false;
      }, error => {
        console.error('Error fetching reports:', error);
        this.isLoadingReports = false;
        this.snackBar.open('Error loading reports', 'Close', {
          duration: 3000
        });
      });
    */
  }

  

  /**
   * Opens a report in a new tab
   * @param report The report to view
   */
  viewReport(report: StudentReport): void {
    // In a real app, this would open the report URL in a new tab
    window.open(report.url, '_blank');

    this.snackBar.open(`Opening ${report.name}...`, 'Close', {
      duration: 3000,
    });
  }

  /**
   * Downloads a report
   * @param report The report to download
   */
  downloadReport(report: StudentReport): void {
    // In a real app, this would initiate the download
    // For now, we'll just show a notification
    this.snackBar.open(`Downloading ${report.name}...`, 'Close', {
      duration: 3000,
    });
  }

  submitEvaluation() {
    if (this.evaluationForm.valid && this.student && this.student.code) {
      this.isLoading = true;

      const cleaned = Object.fromEntries(
        Object.entries(this.student.performance as any).filter(([_, value]) => value !== undefined)
      );
      const evaluation: CapacityEvaluation = {
        ...cleaned,
        ...this.evaluationForm.value,
        lastUpdated: new Date().getTime(), // Store as timestamp
      };

      // Create a reference to the student's evaluation document
      const studentCode = this.student.code;

      // Save evaluation to Firebase
      this.saveEvaluationToFirebase(studentCode, evaluation)
        .then((success) => {
          if (success) {
            // Update the student's performance data in memory
            if (this.student) {
              this.student.performance = {
                neatAppearance: evaluation.neatAppearance,
                responsivePersonality: evaluation.responsivePersonality,
                confidentRelations: evaluation.confidentRelations,
                attendance: evaluation.attendance,
                understandingInstructions: evaluation.understandingInstructions,
                taskCompletion: evaluation.taskCompletion,
                effectiveInteraction: evaluation.effectiveInteraction,
                followUpWithSupervisor: evaluation.followUpWithSupervisor,
                adherenceToInstructions: evaluation.adherenceToInstructions,
                reportWriting: evaluation.reportWriting,
                informationGathering: evaluation.informationGathering,
                adaptToWorkEnvironment: evaluation.adaptToWorkEnvironment,
                maintenanceSkills: evaluation.maintenanceSkills,
              };

              // Update progress and attendance percentages
              this.student.progress = Math.round(
                (evaluation.overallRating / 60) * 100,
              );
              this.student.attendance = Math.round(
                (evaluation.attendance / 15) * 100,
              );
            }

            this.snackBar.open(
              'Evaluation submitted successfully to Firebase',
              'Close',
              {
                duration: 3000,
              },
            );
          } else {
            this.snackBar.open(
              'Error submitting evaluation to Firebase',
              'Close',
              {
                duration: 3000,
              },
            );
          }
        })
        .finally(() => {
          this.isLoading = false;
        });
    } else {
      this.snackBar.open('Please fill out all required fields', 'Close', {
        duration: 3000,
      });
    }
  }

  /**
   * Saves the student evaluation to Firebase
   * @param studentCode The student code
   * @param evaluation The evaluation data
   * @returns Promise resolving to boolean indicating success
   */
  private async saveEvaluationToFirebase(
    studentCode: string,
    evaluation: CapacityEvaluation,
  ): Promise<boolean> {
    try {
      // Get a reference to the Firestore instance
      const firestore = this.authService['firestore'];

      // Create a reference to the student's evaluation document
      const evaluationRef = doc(
        firestore,
        'StudentsTable',
        studentCode,
        'evaluations',
        'performance',
      );

      // Save the evaluation data
      await setDoc(evaluationRef, {
        ...evaluation,
        updatedBy: this.authService.currentUserValue?.id || 'unknown',
        updatedAt: new Date().getTime(),
      });

      console.log('Evaluation saved to Firebase for student:', studentCode);
      return true;
    } catch (error) {
      console.error('Error saving evaluation to Firebase:', error);
      return false;
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
    return 'Needs Improvement';
  }

  /**
   * Adjusts the rating value when clicking directly on the slider track
   * @param event The click event
   * @param controlName The form control name to update
   * @param maxValue The maximum value for this rating
   */
  adjustRating(event: MouseEvent, controlName: string, maxValue: number): void {
    // Get the clicked element
    const sliderElement = event.currentTarget as HTMLElement;

    // Calculate the position of the click relative to the slider width
    const rect = sliderElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;

    // Calculate the new rating value based on click position
    // The calculation maps the click position (0 to sliderWidth) to rating value (0 to maxValue)
    let newValue = Math.round((clickX / sliderWidth) * maxValue);

    // Ensure the value is within bounds
    newValue = Math.max(0, Math.min(newValue, maxValue));

    // Update the form control value
    this.evaluationForm.get(controlName)?.setValue(newValue);

    // Recalculate the overall rating
    this.calculateOverallRating();
  }

  /**
   * Converts any date value (timestamp, Date object, or date string) to a formatted string
   * @param dateValue The date value to format
   * @param format The format to use ('input' for YYYY-MM-DD, 'display' for localized format)
   * @returns Formatted date string or empty string if invalid date
   */
  formatDateToString(
    dateValue: number | string | Date | undefined,
    format: 'input' | 'display' = 'display',
  ): string {
    if (!dateValue) return '';

    // Convert to Date object
    const date =
      typeof dateValue === 'object' ? dateValue : new Date(dateValue);

    // Check if date is valid
    if (isNaN(date.getTime())) return '';

    // Return formatted string based on requested format
    if (format === 'input') {
      // Format as YYYY-MM-DD for input[type=date]
      return date.toISOString();
    } else {
      // Format for display with locale
      return date.toLocaleDateString();
    }
  }

  // Update birthDateString from student.birthDate
  updateBirthDateString(): void {
    if (this.student && this.student.birthDate) {
      // If birthDate is already a string in YYYY-MM-DD format, use it directly
      if (typeof this.student.birthDate === 'string') {
        this.birthDateString = this.student.birthDate;
      } else {
        // If it's somehow a number (should not happen with updated interface)
        const date = new Date(this.student.birthDate);
        if (!isNaN(date.getTime())) {
          this.birthDateString = date.toISOString().split('T')[0];
        } else {
          this.birthDateString = '';
        }
      }
    } else {
      this.birthDateString = '';
    }
  }

  // Update student.birthDate from birthDateString
  updateBirthDateFromString(): void {
    if (this.birthDateString) {
      // Validate the date string
      const date = new Date(this.birthDateString);
      if (!isNaN(date.getTime())) {
        if (this.student) {
          // Store as string in YYYY-MM-DD format
          this.student.birthDate = this.birthDateString;
        }
      }
    } else {
      if (this.student) {
        this.student.birthDate = undefined;
      }
    }
  }


  async showNoteBookModal(notebookDate:Date,noteBookText:string){
    let images : string[] = []
    if(notebookDate && this.student.code) {
      images = await this?.authService?.getStudentTrainingImage(notebookDate,this.student.code);
    }
    this.dialog.open(NoteBookModalComponent, {
      data: {
        notebookDate: notebookDate,
        studentId: this.student.code || '',
        noteBookText: noteBookText || '',
        studentImages:images,
        studentFactory:this.student.factory
      },
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      // Update date string when entering edit mode
      this.updateBirthDateString();
    } else if (!this.isEditMode && this.birthDateString) {
      // Update birthDate from string when exiting edit mode
      this.updateBirthDateFromString();
    }

    if (!this.isEditMode) {
      //this.isLoading = true;

      if (this.student) {
        const updatedStudent: Student = {
          code: this.student.code || '',
          name: this.student.name?.trim() || '',
          phone: this.student.phone?.trim() || '',
          state: this.student.state?.trim() || '',
          address: this.student.address?.trim() || '',
          nationalID: this.student.nationalID?.trim() || '',
          email: this.student.email?.trim() || '',
          birthDate:
            this.student.birthDate || new Date().toISOString().split('T')[0],
          createOn: this.student.createOn || new Date().toISOString(),
          gender: this.student.gender || 'غير محدد',
          department: this.student.department || '',
          birthAddress: this.student.birthAddress || '',
          factory: this.student.factory || '',
          batch: this.student.batch?.toString() || '',
          stage: this.student.stage || '',
          factoryType: this.student.factoryType || true,
          selected: this.student.selected ?? false,
          supervisor: this.student.supervisor || '',
          certificate: this.student.certificate || '',
          distribution_type: this.student.distribution_type || '',
        };
        // Additional validation before sending
        if (!updatedStudent.code) {
          this.snackBar.open('Error: Missing student code!', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
          return;
        }
        console.log(updatedStudent);

        // Update student
        this.authService
          .updateStudent(updatedStudent)
          .then((success: any) => {
            this.isLoading = false;
            if (success) {
              this.snackBar.open('Changes saved successfully', 'Close', {
                duration: 3000,
              });
              this.dialogRef.close({
                action: 'update',
                student: updatedStudent,
              });
            } else {
              this.snackBar.open('Error saving changes', 'Close', {
                duration: 3000,
              });
            }
          })
          .catch((err: any) => {
            this.isLoading = false;
            console.error('Update failed:', err);
            this.snackBar.open('An error occurred while saving', 'Close', {
              duration: 3000,
            });
          });
      } else {
        this.isLoading = false;
        this.snackBar.open('Error: Student data is missing', 'Close', {
          duration: 3000,
        });
      }
    }
  }

  Delete(): void {
    if (confirm('Are you sure you want to delete this student?')) {
      this.isLoading = true;
      if (this.student && this.student.code) {
        this.authService
          .deleteStudent(this.student.code)
          .then((success: any) => {
            if (success) {
              this.snackBar.open('Student deleted successfully', 'Close', {
                duration: 3000,
              });
              this.dialogRef.close({ action: 'delete', student: this.student });
            } else {
              this.snackBar.open('Error deleting student', 'Close', {
                duration: 3000,
              });
            }
            this.isLoading = false;
          });
      } else {
        this.snackBar.open('Error: Student code is missing', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      }
    } else {
      this.dialogRef.close();
    }
  }
}
