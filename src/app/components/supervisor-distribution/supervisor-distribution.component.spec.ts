import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorDistributionComponent } from './supervisor-distribution.component';

describe('SupervisorDistributionComponent', () => {
  let component: SupervisorDistributionComponent;
  let fixture: ComponentFixture<SupervisorDistributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupervisorDistributionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupervisorDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
