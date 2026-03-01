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
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

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
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  
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
        this.showSnackBar('Users loaded successfully', 'success');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.showSnackBar('Failed to load users', 'error');
      },
    });
  }

  changeRole(userId: string, newRole: string, userName: string) {
    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        this.loadUsers();
        this.showSnackBar(`Role updated for ${userName}`, 'success');
      },
      error: (err) => {
        console.error(err);
        this.showSnackBar('Failed to update role', 'error');
      }
    });
  }

  deleteUser(userId: string, userName: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Delete User',
        message: `Delete user "${userName}"? This action cannot be undone!`,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deleteUser(userId).subscribe({
          next: () => {
            this.loadUsers();
            this.showSnackBar(`User ${userName} deleted`, 'success');
          },
          error: (err) => {
            console.error(err);
            this.showSnackBar('Failed to delete user', 'error');
          }
        });
      }
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, type === 'success' ? 'OK' : 'Dismiss', {
      duration: type === 'success' ? 3500 : 8000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
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
