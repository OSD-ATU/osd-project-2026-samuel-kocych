import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { AdminService } from "./admin.service";
import { User } from "../interfaces/user.interface";
import { environment } from "../../environments/environment.development";

describe("AdminService", () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch all users", () => {
    const mockUsers: User[] = [
      {
        _id: "1",
        name: "Alice",
        role: "admin",
        email: "alice@example.com",
        dateJoined: new Date("2023-01-01"),
      },
      {
        _id: "2",
        name: "Bob",
        role: "editor",
        email: "bob@example.com",
        dateJoined: new Date("2023-02-15"),
      },
    ];

    service.getAllUsers().subscribe((res) => {
      expect(res.users.length).toBe(2);
      expect(res.users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${environment.lambdaUri}/users`);
    expect(req.request.method).toBe("GET");
    req.flush({ users: mockUsers });
  });

  it("should update user role", () => {
    const userId = "1";
    const role = "editor";

    service.updateUserRole(userId, role).subscribe((res) => {
      expect(res.message).toBe("Role updated successfully");
      expect(res.role).toBe(role);
    });

    const req = httpMock.expectOne(`${environment.lambdaUri}/users/${userId}`);
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ role });
    req.flush({ message: "Role updated successfully", userId, role });
  });

  it("should delete user", () => {
    const userId = "1";

    service.deleteUser(userId).subscribe((res) => {
      expect(res.message).toBe("User deleted successfully");
    });

    const req = httpMock.expectOne(`${environment.lambdaUri}/users/${userId}`);
    expect(req.request.method).toBe("DELETE");
    req.flush({ message: "User deleted successfully" });
  });
});
