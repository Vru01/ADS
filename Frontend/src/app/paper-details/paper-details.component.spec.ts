import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaperDetailsComponent } from './paper-details.component';

describe('PaperDetailsComponent', () => {
  let component: PaperDetailsComponent;
  let fixture: ComponentFixture<PaperDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaperDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaperDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
