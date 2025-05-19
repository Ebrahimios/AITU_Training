import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../services/translation.service';
import { FactoryService, Factory } from '../../services/factory.service';
import { DistributionService, Student } from '../../services/distribution.service';
import { NavbarComponent } from '../navbar/navbar.component';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AnalyticsComponent implements OnInit {
  // Charts
  departmentChart: any;
  factoryDistributionChart: any;
  monthlyTrendsChart: any;
  capacityUtilizationChart: any;

  // Data
  students: Student[] = [];
  factories: Factory[] = [];
  departments: string[] = [];
  departmentCounts: number[] = [];
  factoryNames: string[] = [];
  factoryStudentCounts: number[] = [];
  factoryCapacities: number[] = [];
  monthlyData: number[] = [12, 19, 15, 25, 22, 30, 28, 32, 35, 40, 38, 42];
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Filters
  selectedYear: string = '2025';
  years: string[] = ['2023', '2024', '2025'];
  
  // KPIs
  totalStudents: number = 0;
  totalFactories: number = 0;
  averageUtilization: number = 0;
  growthRate: number = 12.5; // Example value

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private distributionService: DistributionService
  ) {}

  ngOnInit(): void {
    // Subscribe to data services
    this.factoryService.factories$.subscribe(factories => {
      this.factories = factories;
      this.totalFactories = factories.length;
      this.calculateKPIs();
      this.prepareChartData();
      this.initCharts();
    });
    
    this.distributionService.students$.subscribe(students => {
      this.students = students;
      this.totalStudents = students.length;
      this.calculateKPIs();
      this.prepareChartData();
      if (this.departmentChart) {
        this.updateCharts();
      }
    });
  }

  prepareChartData(): void {
    // Prepare department data
    const departmentMap = new Map<string, number>();
    this.students.forEach(student => {
      if (student.department) {
        departmentMap.set(student.department, (departmentMap.get(student.department) || 0) + 1);
      }
    });
    
    this.departments = Array.from(departmentMap.keys());
    this.departmentCounts = Array.from(departmentMap.values());
    
    // Prepare factory data
    this.factoryNames = this.factories.map(f => f.name);
    this.factoryStudentCounts = this.factories.map(f => f.assignedStudents);
    this.factoryCapacities = this.factories.map(f => f.capacity);
  }

  calculateKPIs(): void {
    // Calculate average utilization
    if (this.factories.length > 0) {
      const totalCapacity = this.factories.reduce((sum, factory) => sum + factory.capacity, 0);
      const totalAssigned = this.factories.reduce((sum, factory) => sum + factory.assignedStudents, 0);
      this.averageUtilization = totalCapacity > 0 ? (totalAssigned / totalCapacity) * 100 : 0;
    }
  }

  initCharts(): void {
    this.initDepartmentChart();
    this.initFactoryDistributionChart();
    this.initMonthlyTrendsChart();
    this.initCapacityUtilizationChart();
  }

  updateCharts(): void {
    this.departmentChart.data.labels = this.departments;
    this.departmentChart.data.datasets[0].data = this.departmentCounts;
    this.departmentChart.update();
    
    this.factoryDistributionChart.data.labels = this.factoryNames;
    this.factoryDistributionChart.data.datasets[0].data = this.factoryStudentCounts;
    this.factoryDistributionChart.update();
    
    this.capacityUtilizationChart.data.labels = this.factoryNames;
    this.capacityUtilizationChart.data.datasets[0].data = this.factoryStudentCounts;
    this.capacityUtilizationChart.data.datasets[1].data = this.factoryCapacities;
    this.capacityUtilizationChart.update();
  }

  initDepartmentChart(): void {
    const ctx = document.getElementById('departmentChart') as HTMLCanvasElement;
    if (ctx) {
      this.departmentChart = new Chart(ctx, {
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
  }

  initFactoryDistributionChart(): void {
    const ctx = document.getElementById('factoryDistributionChart') as HTMLCanvasElement;
    if (ctx) {
      this.factoryDistributionChart = new Chart(ctx, {
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
  }

  initMonthlyTrendsChart(): void {
    const ctx = document.getElementById('monthlyTrendsChart') as HTMLCanvasElement;
    if (ctx) {
      this.monthlyTrendsChart = new Chart(ctx, {
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
  }

  initCapacityUtilizationChart(): void {
    const ctx = document.getElementById('capacityUtilizationChart') as HTMLCanvasElement;
    if (ctx) {
      this.capacityUtilizationChart = new Chart(ctx, {
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
  }

  onYearChange(): void {
    // Update monthly trends chart title
    if (this.monthlyTrendsChart) {
      this.monthlyTrendsChart.options.plugins.title.text = this.translationService.translate('year') + ' ' + this.selectedYear;
      this.monthlyTrendsChart.update();
    }
  }
}
