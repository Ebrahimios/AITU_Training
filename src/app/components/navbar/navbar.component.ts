import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { Notification } from '../../interfaces/notification';
import { FactoryService, Factory } from '../../services/factory.service';
import * as bootstrap from 'bootstrap';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent]
})
export class NavbarComponent {
  showNotifications = false;
  showUserMenu = false;
  notificationCount = 3;
  hasNotifications = true;

  selectedFactory: Factory | null = null;

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService
  ) {}

  admin = [{
    image: 'images/user-1.png',
    name: 'Ahmed Saad',
    types: ['Admin', 'Administrative', 'Technical']
  }];

  notifications: Notification[] = [
    {
      icon: 'bi-building-add',
      message: 'new_factory_added',
      time: '1 min ago',
      type: 'factory_request',
      id: 1,
      studentName: 'Mohammed Ahmed',
      factoryName: 'Hope Factory'
    },
    {
      icon: 'bi-person-plus',
      message: 'new_student_registered',
      time: '5 min ago',
      type: 'registration'
    },
    {
      icon: 'bi-building',
      message: 'factory_capacity_updated',
      time: '1 hour ago',
      type: 'factory_update'
    }
  ];
  
  // Get translated message for notification
  getNotificationMessage(notification: Notification): string {
    return this.translationService.translate(notification.message as any);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showUserMenu) this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showNotifications) this.showNotifications = false;
  }

  handleFactoryRequest(notificationId: number, action: 'accept' | 'deny') {
    // Here you would typically make an API call to update the factory request status
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notificationCount = this.notifications.length;
    if (this.notificationCount === 0) {
      this.hasNotifications = false;
    }
  }

  clearAllNotifications() {
    this.notifications = [];
    this.notificationCount = 0;
    this.hasNotifications = false;
    this.showNotifications = false;
  }

  logout() {
    // Implement logout logic
  }

  showFactoryDetails(factoryName: string | undefined) {
    if (!factoryName) return;
    
    // Find the factory by name
    const factories = this.factoryService.getFactories();
    this.selectedFactory = factories.find(f => f.name === factoryName) || null;
    
    if (this.selectedFactory) {
      // Show the modal
      const modalElement = document.getElementById('factoryDetailsModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    } else {
      // If factory not found in the service, check if it's in the notifications
      const factoryNotification = this.notifications.find(n => n.factoryName === factoryName);
      if (factoryNotification) {
        // Create a temporary factory object with available information
        this.selectedFactory = {
          id: -1, // Temporary ID
          name: factoryName,
          capacity: 0,
          assignedStudents: 0,
          students: [],
          type: 'Pending Approval',
          // Add any other information from the notification if available
          contactName: factoryNotification.studentName
        };
        
        // Show the modal
        const modalElement = document.getElementById('factoryDetailsModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }
    }
  }

  acceptFactory() {
    if (!this.selectedFactory) return;
    
    // Find the notification related to this factory
    const notification = this.notifications.find(n => n.factoryName === this.selectedFactory?.name && n.type === 'factory_request');
    
    if (notification && notification.id) {
      // Use the existing handleFactoryRequest method
      this.handleFactoryRequest(notification.id, 'accept');
      
      // Close the modal
      const modalElement = document.getElementById('factoryDetailsModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    } else {
      // If no matching notification found, just show a message
      alert('Factory request accepted!');
    }
  }

  denyFactory() {
    if (!this.selectedFactory) return;
    
    // Find the notification related to this factory
    const notification = this.notifications.find(n => n.factoryName === this.selectedFactory?.name && n.type === 'factory_request');
    
    if (notification && notification.id) {
      // Use the existing handleFactoryRequest method
      this.handleFactoryRequest(notification.id, 'deny');
      
      // Close the modal
      const modalElement = document.getElementById('factoryDetailsModal');
      if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
    } else {
      // If no matching notification found, just show a message
      alert('Factory request denied!');
    }
  }
}
