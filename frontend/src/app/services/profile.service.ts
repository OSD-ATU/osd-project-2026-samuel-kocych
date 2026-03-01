import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/api/v1/users/me/profile';
  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl, { withCredentials: true });
  }

  updateProfile(
    data: Partial<{ name: string; email: string; password: string }>,
  ): Observable<any> {
    return this.http.put(this.apiUrl, data, { withCredentials: true });
  }

  deleteProfile(): Observable<any> {
    return this.http.delete(this.apiUrl, { withCredentials: true });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }
}
