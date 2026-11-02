import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonEngine } from './lesson-engine';

describe('LessonEngine', () => {
  let component: LessonEngine;
  let fixture: ComponentFixture<LessonEngine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonEngine]
    }).compileComponents();

    fixture = TestBed.createComponent(LessonEngine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
