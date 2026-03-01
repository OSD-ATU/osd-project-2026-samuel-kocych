import { Component, inject, effect } from '@angular/core';
import {
  FormBuilder,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { InternalRecipeService } from '../../services/internal-recipe.service';
import { Recipe } from '../../interfaces/recipe.interface';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './recipe-form.component.html',
  styleUrls: ['./recipe-form.component.scss'],
})
export class RecipeFormComponent {
  // services
  private recipeService = inject(InternalRecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // state
  recipeId: string | null = null;
  isEditMode = false;

  // form builder instance
  private fb = inject(FormBuilder);

  // form
  recipeForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    image: [''],
    ingredients: this.fb.array([this.fb.control('', Validators.required)]),
    instructions: ['', [Validators.required, Validators.minLength(10)]],
    difficulty: ['medium', Validators.required],
  });

  constructor() {
    // load recipe if in edit mode
    effect(() => {
      this.recipeId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.recipeId;
      if (this.isEditMode && this.recipeId) {
        this.loadRecipe(this.recipeId);
      }
    });
  }

  get title() {
    return this.recipeForm.get('title');
  }

  get instructions() {
    return this.recipeForm.get('instructions');
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  // add ingredient
  addIngredient(): void {
    this.ingredients.push(this.fb.control('', Validators.required));
  }

  // remove ingredient
  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    }
  }

  // load recipe for edit
  loadRecipe(id: string): void {
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        // store current recipe to preserve comments on update
        this.currentRecipe = recipe;

        // patch scalar fields
        this.recipeForm.patchValue({
          title: recipe.title,
          image: recipe.image || '',
          instructions: recipe.instructions,
          difficulty: recipe.difficulty || 'medium',
        });
        // rebuild ingredients array, avoid losing first item
        const ingArray =
          recipe.ingredients && recipe.ingredients.length > 0
            ? recipe.ingredients
            : [''];
        const controls = ingArray.map((value) =>
          this.fb.control(value, Validators.required),
        );
        this.recipeForm.setControl('ingredients', this.fb.array(controls));
        // ensure form state reflects loaded data
        this.ingredients.markAsDirty();
      },
      error: (err: Error) =>
        this.showSnackBar('Failed to load recipe: ' + err.message, 'error'),
    });
  }

  // current recipe with all fields including comments
  private currentRecipe: Recipe | null = null;

  // submit form
  onSubmit(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      return;
    }

    const recipe: Recipe = {
      title: this.recipeForm.value.title || '',
      image: (this.recipeForm.value.image || '').trim() || undefined,
      ingredients:
        (this.recipeForm.value.ingredients?.filter((i) => i) as string[]) || [],
      instructions: this.recipeForm.value.instructions || '',
      difficulty: this.recipeForm.value.difficulty as
        | 'easy'
        | 'medium'
        | 'hard',
    };

    if (this.isEditMode && this.recipeId) {
      // preserve existing comments and id when updating
      if (this.currentRecipe?.notes) {
        recipe.notes = this.currentRecipe.notes;
      }
      if (this.currentRecipe?._id) {
        recipe._id = this.currentRecipe._id;
      }

      this.recipeService.updateRecipe(this.recipeId, recipe).subscribe({
        next: () => {
          this.showSnackBar('Recipe updated', 'success');
          this.router.navigateByUrl(`/recipes/${this.recipeId}`);
        },
        error: (err: Error) =>
          this.showSnackBar('Failed to update recipe: ' + err.message, 'error'),
      });
    } else {
      this.recipeService.createRecipe(recipe).subscribe({
        next: () => {
          this.showSnackBar('Recipe created', 'success');
          this.router.navigateByUrl('/');
        },
        error: (err: Error) => {
          if (err.message && err.message.includes('Image must be a valid URL')) {
            this.showSnackBar('Image must be a valid URL', 'error');
          } else {
            this.showSnackBar('Could not create recipe: ' + err.message, 'error');
          }
        },
      });
    }
  }

  // show snackbar notification
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, type === 'success' ? 'OK' : 'Dismiss', {
      duration: type === 'success' ? 3500 : 8000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
