import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { User } from '../../interfaces/user.interface';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  snackBar = inject(MatSnackBar);
  
  users: User[] = [];
  loading = false;
  displayedColumns: string[] = ['name', 'email', 'dateJoined', 'role', 'actions'];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res.users;
        this.loading = false;
        this.snackBar.open('Users loaded successfully', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      },
    });
  }

  changeRole(userId: string, newRole: string, userName: string) {
    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        this.loadUsers();
        this.snackBar.open(`Role updated for ${userName}`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to update role', 'Close', { duration: 3000 });
      }
    });
  }

  deleteUser(userId: string, userName: string) {
    if (confirm(`Delete user "${userName}"? This action cannot be undone!`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open(`User ${userName} deleted`, 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getRoleBadgeColor(role?: 'admin' | 'editor' | ''): string {
    switch (role) {
      case 'admin': return 'primary';
      case 'editor': return 'accent';
      default: return '';
    }
  }

  getRoleLabel(role?: 'admin' | 'editor' | ''): string {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'editor': return 'Editor';
      default: return 'User';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
