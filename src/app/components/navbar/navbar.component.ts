import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { Notification } from '../../interfaces/notification';
import { FactoryService, Factory } from '../../services/factory.service';
import {
  AuthService,
  User,
  FirebaseFactory,
} from '../../services/firebase.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserProfileModalComponent } from './user-profile-modal/user-profile-modal.component';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css', './clickable-styles.css'],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    LanguageSwitcherComponent,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  showNotifications = false;
  showUserMenu = false;
  notificationCount = 3;
  hasNotifications = true;

  selectedFactory: Factory | null = null;

  // Current user information
  currentUser: User | null = null;
  private userSubscription: Subscription | null = null;
  private factoryRequestsSubscription: Subscription | null = null;

  constructor(
    public translationService: TranslationService,
    private factoryService: FactoryService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  // User display information
  admin = [
    {
      image: 'images/user-1.png',
      name: '',
      types: [''],
      timestamp: 0,
    },
  ];

  ngOnInit() {
    // Subscribe to the current user
    this.userSubscription = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        // Update the admin array with current user info
        this.admin = [
          {
            image: user.image || 'images/user-1.png', // Use user image or default
            name: `${user.firstName} ${user.lastName}`,
            types: [user.role], // Use the user's role
            timestamp: user.timestamp || Date.now(), // Use existing timestamp or current time
          },
        ];
      }
    });

    // Subscribe to factory requests
    this.factoryRequestsSubscription =
      this.authService.factoryRequests$.subscribe((factories) => {
        // Filter only non-approved factory requests
        const pendingFactories = factories.filter(
          (factory) => !factory.isApproved,
        );

        // Convert factory requests to notifications
        const factoryNotifications: Notification[] = pendingFactories.map(
          (factory) => ({
            id: factory.id,
            icon: 'bi-building-add',
            message: 'new_factory_added',
            time: this.getTimeAgo(factory.createdAt),
            type: 'factory_request',
            studentName: factory.studentName || 'Unknown Student',
            factoryName: factory.name,
          }),
        );

        // Combine factory notifications with other notifications
        // For now, we'll replace the static notifications with the dynamic ones
        this.notifications = factoryNotifications;
        this.notificationCount = this.notifications.length;
        this.hasNotifications = this.notificationCount > 0;
      });

    // Load factory requests initially
    this.authService.loadFactoryRequests();
  }

  // Helper method to format time ago
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} min ago`;
    } else {
      return 'just now';
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.factoryRequestsSubscription) {
      this.factoryRequestsSubscription.unsubscribe();
    }
  }

  // Initialize with empty array, will be populated from Firebase
  notifications: Notification[] = [];

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
  openGoogleMaps(
    longitude: number | undefined,
    latitude: number | undefined,
  ): void {
    if (longitude === undefined || latitude === undefined) {
      console.error('Invalid coordinates');
      return;
    }
    const zoom = 19;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
    window.open(url, '_blank');
  }
  // Track if the modal is currently open to prevent multiple instances
  private isUserProfileModalOpen = false;

  openUserProfileModal() {
    if (this.currentUser && !this.isUserProfileModalOpen) {
      // Close the user menu if it's open
      this.showUserMenu = false;

      // Set flag to indicate modal is open
      this.isUserProfileModalOpen = true;

      // Use the dialog service to open the modal with simple configuration
      const dialogRef = this.dialog.open(UserProfileModalComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: { user: this.currentUser },
        panelClass: 'centered-modal',
        disableClose: true, // Prevent closing by clicking outside
        autoFocus: false,
        hasBackdrop: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        // Reset the flag when modal is closed
        this.isUserProfileModalOpen = false;
        if (result && result.imageUrl) {
          // Update the user's profile image and timestamp in the admin array
          this.admin = [
            {
              ...this.admin[0],
              image: result.imageUrl,
              timestamp: result.timestamp,
            },
          ];

          // Update the current user with the new image and timestamp
          if (this.currentUser) {
            this.currentUser = {
              ...this.currentUser,
              image: result.imageUrl,
              timestamp: result.timestamp,
            };

            // Store updated user in localStorage for persistence
            localStorage.setItem(
              'currentUser',
              JSON.stringify(this.currentUser),
            );
          }

          // In a real implementation, you would also update the user's profile image in Firebase
          console.log('Profile image updated:', result.imageUrl);
          console.log(
            'Profile updated at:',
            new Date(result.timestamp).toLocaleString(),
          );
        }
      });
    }
  }

  handleFactoryRequest(
    notificationId: string | number,
    action: 'accept' | 'deny',
  ) {
    if (typeof notificationId === 'string') {
      // Call Firebase service to handle the factory request
      this.authService
        .handleFactoryRequest(notificationId, action)
        .then((success) => {
          if (success) {
            // Notification will be automatically updated via subscription
            console.log(`Factory request ${action}ed successfully`);
          } else {
            console.error(`Failed to ${action} factory request`);
          }
        });
    } else {
      // Handle legacy numeric IDs (if any)
      this.notifications = this.notifications.filter(
        (n) => n.id !== notificationId,
      );
      this.notificationCount = this.notifications.length;
      if (this.notificationCount === 0) {
        this.hasNotifications = false;
      }
    }
  }

  clearAllNotifications() {
    this.notifications = [];
    this.notificationCount = 0;
    this.hasNotifications = false;
    this.showNotifications = false;
  }

  logout() {
    this.authService.logout();
  }

  showFactoryDetails(factoryName: string | undefined) {
    if (!factoryName) return;

    // First check if it's a pending factory request from Firebase
    const pendingFactories = this.authService
      .getFactoryRequests()
      .filter((f) => !f.isApproved);
    const pendingFactory = pendingFactories.find((f) => f.name === factoryName);

    if (pendingFactory) {
      // Create a Factory object from the FirebaseFactory
      this.selectedFactory = {
        id: -1, // Temporary ID for UI purposes
        name: pendingFactory.name,
        capacity: pendingFactory.capacity,
        assignedStudents: pendingFactory.assignedStudents,
        students: pendingFactory.students || [],
        address: pendingFactory.address,
        phone: pendingFactory.phone,
        longitude: pendingFactory.longitude || 0,
        latitude: pendingFactory.latitude || 0,
        department: pendingFactory.department,
        contactName: pendingFactory.contactName || pendingFactory.studentName,
        type: 'Pending Approval',
        industry: pendingFactory.industry,
      };

      // Show the modal
      const modalElement = document.getElementById('factoryDetailsModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
      return;
    }

    // If not found in pending requests, check approved factories
    const factories = this.factoryService.getFactories();
    this.selectedFactory =
      factories.find((f) => f.name === factoryName) || null;

    if (this.selectedFactory) {
      // Show the modal
      const modalElement = document.getElementById('factoryDetailsModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    } else {
      // If factory not found in the service, check if it's in the notifications
      const factoryNotification = this.notifications.find(
        (n) => n.factoryName === factoryName,
      );
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
          contactName: factoryNotification.studentName,
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
    const notification = this.notifications.find(
      (n) =>
        n.factoryName === this.selectedFactory?.name &&
        n.type === 'factory_request',
    );

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
      console.error('No matching factory notification found');
    }
  }

  denyFactory() {
    if (!this.selectedFactory) return;

    // Find the notification related to this factory
    const notification = this.notifications.find(
      (n) =>
        n.factoryName === this.selectedFactory?.name &&
        n.type === 'factory_request',
    );

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
      console.error('No matching factory notification found');
    }
  }
}
