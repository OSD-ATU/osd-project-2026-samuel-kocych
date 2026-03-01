import { Component, inject } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthCustomService } from '../../services/auth-custom.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatSnackBarModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIcon,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private route = inject(ActivatedRoute);
  returnUrl: string = '';
  loginForm: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthCustomService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  onSubmit() {
    const values = this.loginForm.value;
    this.authService.login(values.email, values.password).subscribe({
      next: (response: any) => {
        // navigate to the return url
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: any) => {
        this.openErrorSnackBar('Incorrect email or password');
        console.log(err);
      },
    });
  }

  get email() {
    return this.loginForm.get('email')?.value;
  }

  get password() {
    return this.loginForm.get('password')?.value;
  }

  openErrorSnackBar(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  hide = true;
  hidePass = true;
  hideConfirm = true;

  navigateRegister() {
    this.router.navigate(['/register']);
  }

  navigateLogin() {
    this.router.navigate(['/login']);
  }
}
