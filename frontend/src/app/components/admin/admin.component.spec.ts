import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AdminService } from "../../services/admin.service";
import { AuthCustomService } from "../../services/auth-custom.service";

import { AdminComponent } from "./admin.component";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const adminServiceMock = {
    getAllUsers: jasmine.createSpy("getAllUsers").and.returnValue(
      of({
        users: [
          {
            _id: "123",
            name: "John",
            email: "john@test.com",
            role: "admin",
            dateJoined: new Date("2024-01-01"),
          },
        ],
      }),
    ),
    updateUserRole: jasmine.createSpy("updateUserRole").and.returnValue(of({})),
    deleteUser: jasmine.createSpy("deleteUser").and.returnValue(of({})),
  };

  const authServiceMock = {
    currentUser$: of({ _id: "u1" }),
  };

  const snackBarMock = {
    open: jasmine.createSpy("open"),
  };

  const dialogMock = {
    open: jasmine
      .createSpy("open")
      .and.returnValue({ afterClosed: () => of(false) }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AdminService, useValue: adminServiceMock },
        { provide: AuthCustomService, useValue: authServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    adminServiceMock.getAllUsers.calls.reset();
    adminServiceMock.updateUserRole.calls.reset();
    adminServiceMock.deleteUser.calls.reset();
    snackBarMock.open.calls.reset();
    dialogMock.open.calls.reset();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load users on init", () => {
    expect(adminServiceMock.getAllUsers).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
    expect(component.currentUserId).toBe("u1");
  });

  it("should map role labels correctly", () => {
    expect(component.getRoleLabel("admin")).toBe("Administrator");
    expect(component.getRoleLabel("editor")).toBe("Editor");
    expect(component.getRoleLabel("")).toBe("User");
  });

  it("should call updateUserRole in changeRole", () => {
    component.changeRole("u2", "editor", "Alice");

    expect(adminServiceMock.updateUserRole).toHaveBeenCalledWith(
      "u2",
      "editor",
    );
  });

  it("should open confirmation dialog when deleting user", () => {
    component.deleteUser("u2", "Alice");

    expect(dialogMock.open).toHaveBeenCalled();
  });
});
