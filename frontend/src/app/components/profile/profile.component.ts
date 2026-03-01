import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  hide: boolean = true;
  editingField: 'name' | 'email' | 'password' | null = null;
  originalValues: any = {};

  constructor(
    private profileService: ProfileService,
    private fb: FormBuilder,
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.profileService.getProfile().subscribe((profile) => {
      this.profileForm.patchValue({
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        password: '',
      });
      this.originalValues = {
        name: profile?.name ?? '',
        email: profile?.email ?? '',
      };
    });
  }

  toggleEdit(field: 'name' | 'email' | 'password') {
    this.editingField = field;
    if (field !== 'password') {
      this.profileForm.get(field)?.setValue(this.originalValues[field]);
    } else {
      this.profileForm.get('password')?.setValue('');
    }
  }

  saveField(field: 'name' | 'email' | 'password') {
    if (field === 'password' && !this.profileForm.get('password')?.value) {
      alert('Password must not be empty!');
      return;
    }
    const payload: any = {};
    if (field === 'password') {
      payload.password = this.profileForm.get('password')?.value;
    } else {
      payload[field] = this.profileForm.get(field)?.value;
    }
    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.editingField = null;
        this.loadProfile();
      },
      error: (err) => {
        alert(
          'Error while updating!\n' +
            (err?.error?.message || JSON.stringify(err?.error) || ''),
        );
      },
    });
  }

  cancelEdit(field: 'name' | 'email' | 'password') {
    if (field === 'password') {
      this.profileForm.patchValue({ password: '' });
    } else {
      this.profileForm.get(field)?.setValue(this.originalValues[field]);
    }
    this.editingField = null;
  }

  onSubmit() {
    // Not used, editing is per-field
  }

  onLogout() {
    if (typeof this.profileService.logout === 'function') {
      this.profileService.logout();
    } else {
      console.warn('Logout method not implemented in ProfileService');
    }
  }

  onDeleteAccount() {
    this.profileService.deleteProfile().subscribe(() => {
      // handle post-delete
    });
  }
}
