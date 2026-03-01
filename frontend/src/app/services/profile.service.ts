import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  private apiUrl = `${environment.apiUri}/users/me/profile`;
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
    return this.http.delete(this.apiUrl, {
      body: { confirm: true },
      withCredentials: true,
    });
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
}
