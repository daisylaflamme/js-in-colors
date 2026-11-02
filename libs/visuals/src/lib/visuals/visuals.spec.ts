import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Visuals } from './visuals';

describe('Visuals', () => {
  let component: Visuals;
  let fixture: ComponentFixture<Visuals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Visuals]
    }).compileComponents();

    fixture = TestBed.createComponent(Visuals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
