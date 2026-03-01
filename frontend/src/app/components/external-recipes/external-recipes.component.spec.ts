import { ExternalRecipesComponent } from './external-recipes.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('ExternalRecipesComponent', () => {
  let component: ExternalRecipesComponent;
  let fixture: ComponentFixture<ExternalRecipesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalRecipesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalRecipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
