import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';
import { FactoryService, Factory } from '../../services/factory.service';
import { DistributionService, Student } from '../../services/distribution.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService, FirebaseFactory, FirebaseSupervisor } from '../../services/firebase.service';
import { Student as FirebaseStudent } from '../../interfaces/student';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { createSafeChart } from '../../utils/chart-utils';
  interface ChartTypeRegistry {}
  interface ChartType {}
  interface ChartData {}
  interface Plugin {}
  interface ChartComponentLike {}
  interface ChartComponent {}
  interface ChartDatasetProperties {}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  // Charts
  departmentChart: any;
  factoryDistributionChart: any;
  monthlyTrendsChart: any;
  capacityUtilizationChart: any;

  // Data
  students: Student[] = [];
  firebaseStudents: FirebaseStudent[] = [];
  factories: Factory[] = [];
  firebaseFactories: FirebaseFactory[] = [];
  supervisors: FirebaseSupervisor[] = [];
  departments: string[] = [];
  departmentCounts: number[] = [];
  factoryNames: string[] = [];
  factoryStudentCounts: number[] = [];
  factoryCapacities: number[] = [];
  supervisorNames: string[] = [];
  supervisorStudentCounts: number[] = [];
  stageData: { name: string, count: number }[] = [];
  batchData: { name: string, count: number }[] = [];

  // Monthly data
  monthlyData: number[] = [];
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Filters
  selectedYear: string = '2025';
  years: string[] = ['2023', '2024', '2025'];

  // KPIs
  totalStudents: number = 0;
  totalFactories: number = 0;
  totalSupervisors: number = 0;
  averageUtilization: number = 0;
  growthRate: number = 12.5; // Example value

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private distributionService: DistributionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load all data from Firebase
    this.loadAllData();

    // Also subscribe to service observables for real-time updates
    this.subscriptions.push(
      this.factoryService.factories$.subscribe(factories => {
        this.factories = factories;
        this.totalFactories = factories.length;
        this.calculateKPIs();
        this.prepareChartData();

        // Only update existing charts, don't reinitialize
        // Charts should only be initialized once during loadAllData()
        if (this.departmentChart && this.factoryDistributionChart &&
            this.monthlyTrendsChart && this.capacityUtilizationChart) {
          this.updateCharts();
        }
      })
    );

    this.subscriptions.push(
      this.factoryService.supervisors$.subscribe(supervisors => {
        this.totalSupervisors = supervisors.length;
      })
    );

    this.subscriptions.push(
      this.distributionService.students$.subscribe(students => {
        this.students = students;
      })
    );
  }

  /**
   * Load all data from Firebase for analytics
   */
  async loadAllData(): Promise<void> {
    try {
      // Load students from Firebase
      this.firebaseStudents = await this.authService.getAllStudents();
      this.totalStudents = this.firebaseStudents.length;

      // Load factories from Firebase
      this.firebaseFactories = await this.authService.getAllFactories();
      this.totalFactories = this.firebaseFactories.length;

      // Load supervisors from Firebase
      this.supervisors = await this.authService.getAllSupervisors();
      this.totalSupervisors = this.supervisors.length;

      // Calculate KPIs and prepare chart data
      this.calculateKPIs();
      this.prepareChartData();
      this.calculateMonthlyData();
      this.initCharts();
    } catch (error) {
      console.error('Error loading data for analytics:', error);
    }
  }

  /**
   * Clean up subscriptions and destroy charts when component is destroyed
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Destroy all chart instances to prevent 'Canvas is already in use' errors
    this.destroyCharts();
  }

  /**
   * Destroy all chart instances to prevent 'Canvas is already in use' errors
   */
  destroyCharts(): void {
    // Destroy department chart
    if (this.departmentChart) {
      this.departmentChart.destroy();
      this.departmentChart = null;
    }

    // Destroy factory distribution chart
    if (this.factoryDistributionChart) {
      this.factoryDistributionChart.destroy();
      this.factoryDistributionChart = null;
    }

    // Destroy monthly trends chart
    if (this.monthlyTrendsChart) {
      this.monthlyTrendsChart.destroy();
      this.monthlyTrendsChart = null;
    }

    // Destroy capacity utilization chart
    if (this.capacityUtilizationChart) {
      this.capacityUtilizationChart.destroy();
      this.capacityUtilizationChart = null;
    }
  }

  /**
   * Prepare data for charts
   */
  prepareChartData(): void {
    // Prepare department data from Firebase students
    const departmentMap = new Map<string, number>();
    this.firebaseStudents.forEach(student => {
      if (student.department) {
        departmentMap.set(student.department, (departmentMap.get(student.department) || 0) + 1);
      }
    });

    this.departments = Array.from(departmentMap.keys());
    this.departmentCounts = Array.from(departmentMap.values());

    // Prepare factory data from Firebase factories
    this.factoryNames = this.firebaseFactories.map(f => f.name);
    this.factoryStudentCounts = this.firebaseFactories.map(f => f.assignedStudents);
    this.factoryCapacities = this.firebaseFactories.map(f => f.capacity);

    // Prepare supervisor data
    this.supervisorNames = this.supervisors.map(s => s.name);
    this.supervisorStudentCounts = this.supervisors.map(s => s.assignedStudents);

    // Prepare stage data
    const stageMap = new Map<string, number>();
    this.firebaseStudents.forEach(student => {
      if (student.stage) {
        stageMap.set(student.stage, (stageMap.get(student.stage) || 0) + 1);
      }
    });
    this.stageData = Array.from(stageMap.entries()).map(([name, count]) => ({ name, count }));

    // Prepare batch data
    const batchMap = new Map<string, number>();
    this.firebaseStudents.forEach(student => {
      if (student.batch) {
        batchMap.set(student.batch, (batchMap.get(student.batch) || 0) + 1);
      }
    });
    this.batchData = Array.from(batchMap.entries()).map(([name, count]) => ({ name, count }));
  }

  /**
   * Calculate KPIs from Firebase data
   */
  calculateKPIs(): void {
    // Calculate average utilization from Firebase factories
    if (this.firebaseFactories.length > 0) {
      const totalCapacity = this.firebaseFactories.reduce((sum, factory) => sum + factory.capacity, 0);
      const totalAssigned = this.firebaseFactories.reduce((sum, factory) => sum + factory.assignedStudents, 0);
      this.averageUtilization = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;
    }

    // Calculate growth rate based on student creation dates
    this.calculateGrowthRate();
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

    this.firebaseStudents.forEach(student => {
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
      this.growthRate = ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
    } else {
      this.growthRate = currentMonthCount > 0 ? 100 : 0;
    }

    // Ensure growth rate is not negative for display purposes
    this.growthRate = Math.max(0, this.growthRate);
  }

  /**
   * Calculate monthly data for trends chart
   */
  calculateMonthlyData(): void {
    // Initialize monthly data array with zeros
    this.monthlyData = Array(12).fill(0);

    // Count students created in each month of the selected year
    const selectedYearNum = parseInt(this.selectedYear);

    this.firebaseStudents.forEach(student => {
      if (student.createOn) {
        const createDate = new Date(student.createOn);
        const createYear = createDate.getFullYear();
        const createMonth = createDate.getMonth();

        if (createYear === selectedYearNum) {
          this.monthlyData[createMonth]++;
        }
      }
    });
  }

  /**
   * Initialize or reinitialize all charts
   * This method will destroy existing charts before creating new ones
   */
  initCharts(): void {
    // Now initialize new chart instances using our safe chart utility
    this.initDepartmentChart();
    this.initFactoryDistributionChart();
    this.initMonthlyTrendsChart();
    this.initCapacityUtilizationChart();
  }

  updateCharts(): void {
    if (this.departmentChart) {
      this.departmentChart.data.labels = this.departments;
      this.departmentChart.data.datasets[0].data = this.departmentCounts;
      this.departmentChart.update();
    }

    if (this.factoryDistributionChart) {
      this.factoryDistributionChart.data.labels = this.factoryNames;
      this.factoryDistributionChart.data.datasets[0].data = this.factoryStudentCounts;
      this.factoryDistributionChart.update();
    }

    if (this.capacityUtilizationChart) {
      this.capacityUtilizationChart.data.labels = this.factoryNames;
      this.capacityUtilizationChart.data.datasets[0].data = this.factoryStudentCounts;
      this.capacityUtilizationChart.data.datasets[1].data = this.factoryCapacities;
      this.capacityUtilizationChart.update();
    }
  }

  initDepartmentChart(): void {
    // Use our safe chart creation utility to handle destroying existing charts
    this.departmentChart = createSafeChart('departmentChart', {
      type: 'pie',
      data: {
        labels: this.departments,
        datasets: [{
          data: this.departmentCounts,
          backgroundColor: [
            '#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722', '#607D8B'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: this.translationService.translate('department_distribution')
          }
        }
      }
    });
  }

  initFactoryDistributionChart(): void {
    // Use our safe chart creation utility to handle destroying existing charts
    this.factoryDistributionChart = createSafeChart('factoryDistributionChart', {
      type: 'bar',
      data: {
        labels: this.factoryNames,
        datasets: [{
          label: this.translationService.translate('students'),
          data: this.factoryStudentCounts,
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('students')
            }
          },
          x: {
            title: {
              display: true,
              text: this.translationService.translate('factories')
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('students_distribution')
          }
        }
      }
    });
  }

  initMonthlyTrendsChart(): void {
    this.monthlyTrendsChart = createSafeChart('monthlyTrendsChart', {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [{
          label: this.translationService.translate('students'),
          data: this.monthlyData,
          fill: false,
          borderColor: '#10B981',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('students')
            }
          },
          x: {
            title: {
              display: true,
              text: this.translationService.translate('month')
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('year') + ' ' + this.selectedYear
          }
        }
      }
    });
  }

  initCapacityUtilizationChart(): void {
    this.capacityUtilizationChart = createSafeChart('capacityUtilizationChart', {
      type: 'bar',
      data: {
        labels: this.factoryNames,
        datasets: [
          {
            label: this.translationService.translate('assigned_students'),
            data: this.factoryStudentCounts,
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 1
          },
          {
            label: this.translationService.translate('capacity'),
            data: this.factoryCapacities,
            backgroundColor: '#F59E0B',
            borderColor: '#D97706',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: this.translationService.translate('students')
            }
          },
          x: {
            title: {
              display: true,
              text: this.translationService.translate('factories')
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: this.translationService.translate('capacity') + ' ' + this.translationService.translate('vs') + ' ' + this.translationService.translate('assigned_students')
          }
        }
      }
    });
  }

  /**
   * Handle year change for monthly trends chart
   */
  onYearChange(): void {
    // Recalculate monthly data based on selected year
    this.calculateMonthlyData();

    // Update monthly trends chart
    if (this.monthlyTrendsChart) {
      this.monthlyTrendsChart.data.datasets[0].data = this.monthlyData;
      if (this.monthlyTrendsChart.options && this.monthlyTrendsChart.options.plugins && this.monthlyTrendsChart.options.plugins.title) {
        this.monthlyTrendsChart.options.plugins.title.text = this.translationService.translate('year') + ' ' + this.selectedYear;
      }
      this.monthlyTrendsChart.update();
    }
  }

  /**
   * Navigate to home
   */
  navigateToDashboard(): void {
    this.router.navigate(['/home']);
  }
}
