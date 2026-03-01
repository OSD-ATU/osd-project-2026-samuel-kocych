import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs/internal/Observable";
import { User } from "../interfaces/user.interface";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.lambdaUri;

  getAllUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(`${this.baseUrl}/users`);
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${userId}`, { role });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${userId}`);
  }
}
