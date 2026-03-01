import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component';
import { AboutComponent } from './components/about/about.component';
import { RecipeDetailsComponent } from './components/recipe-details/recipe-details.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminComponent } from './components/admin/admin.component';
import { authGuard } from './guards/auth.guard';
import { editorGuard } from './guards/editor.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // recipe crud
  { path: 'create', component: RecipeFormComponent, canActivate: [editorGuard] },
  { path: 'edit/:id', component: RecipeFormComponent, canActivate: [editorGuard] },
  { path: 'recipes/:id', component: RecipeDetailsComponent, canActivate: [authGuard] },
  { path: 'public-recipes/:id', component: RecipeDetailsComponent, canActivate: [authGuard], data: { source: 'external' } },
  { path: 'favourites', component: FavoritesComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path : '**', redirectTo: '' }
];
  