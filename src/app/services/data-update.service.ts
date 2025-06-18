import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Factory } from '../components/student-distribution/student-distribution.component';

@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {
  // Subject to notify components when student data is updated
  private studentDataUpdated = new Subject<void>();
  private supervisorDataUpdated = new Subject<void>();
  private selectedFactoryUpdated = new Subject<Factory>();
  
  // Observable that components can subscribe to
  public studentDataUpdated$ = this.studentDataUpdated.asObservable();
  public superVisorDataUpdated$ = this.supervisorDataUpdated.asObservable();
  public selectedFactoryUpdated$ = this.selectedFactoryUpdated.asObservable();

  constructor() { }

  // Method to notify that student data has been updated
  notifyStudentDataUpdated(): void {
    this.studentDataUpdated.next();
  }

  // Method to notify that supervisor data has been updated
  notifySupervisorDataUpdated(): void {
    this.supervisorDataUpdated.next();
  }


  notifySelectedFactoryDataUpdatet(factory:Factory){
    this.selectedFactoryUpdated.next(factory);
  }
}
