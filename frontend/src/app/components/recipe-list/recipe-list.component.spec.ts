import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalRecipesComponent } from './recipe-list.component';

describe('InternalRecipesComponent', () => {
  let component: InternalRecipesComponent;
  let fixture: ComponentFixture<InternalRecipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalRecipesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalRecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
