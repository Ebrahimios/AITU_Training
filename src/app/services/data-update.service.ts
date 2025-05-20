import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {
  // Subject to notify components when student data is updated
  private studentDataUpdated = new Subject<void>();
  
  // Observable that components can subscribe to
  public studentDataUpdated$ = this.studentDataUpdated.asObservable();

  constructor() { }

  // Method to notify that student data has been updated
  notifyStudentDataUpdated(): void {
    this.studentDataUpdated.next();
  }
}
