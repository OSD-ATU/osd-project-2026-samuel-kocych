import { Component, inject } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatInputModule } from "@angular/material/input";
import { AuthCustomService } from "../../services/auth-custom.service";
import { Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent {
  registerForm: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthCustomService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
        role: [""],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get("password")?.value;
    const confirmPassword = form.get("confirmPassword")?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.showSnackBar("Please fix errors before submitting.", "error");
      return;
    }
    const { name, email, password, role } = this.registerForm.value;
    this.authService.register(name, email, password, role).subscribe({
      next: (res) => {
        this.showSnackBar("Registered successfully! Please login.", "success");
        this.router.navigate(["/login"]);
      },
      error: (err) => {
        this.showSnackBar(
          "Registration failed. Email may already exist.",
          "error",
        );
        console.error(err);
      },
    });
  }

  private showSnackBar(message: string, type: "success" | "error"): void {
    this.snackBar.open(message, type === "success" ? "OK" : "Dismiss", {
      duration: type === "success" ? 3500 : 8000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: "end",
      verticalPosition: "bottom",
    });
  }

  hide = true;
  hidePass = true;
  hideConfirm = true;

  navigateRegister() {
    this.router.navigate(["/register"]);
  }

  navigateLogin() {
    this.router.navigate(["/login"]);
  }
}
