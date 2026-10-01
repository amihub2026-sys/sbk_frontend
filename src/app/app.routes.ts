import { Routes } from "@angular/router";
import { adminGuard, judgeGuard } from "./core/guards/admin.guard";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "register" },
  {
    path: "register",
    title: "Student Application | Chithiram Thiruvila",
    loadComponent: () => import("./features/public/register/register.component").then((m) => m.RegisterComponent),
  },
  {
  path: "cash-registration",
  title: "Cash Registration | Chithiram Thiruvila",
  loadComponent: () =>
    import("./features/public/cash-register/cash-register.component")
      .then((m) => m.CashRegisterComponent),
},
  {
    path: "find-pass",
    title: "Find Participant Pass | Chithiram Thiruvila",
    loadComponent: () => import("./features/public/pass/pass.component").then((m) => m.PassComponent),
  },
  {
    path: "pass",
    title: "Participant Pass | Chithiram Thiruvila",
    loadComponent: () => import("./features/public/pass/pass.component").then((m) => m.PassComponent),
  },
  {
    path: "admin",
    pathMatch: "full",
    title: "Admin Sign In | Chithiram Thiruvila",
    data: { role: "admin" },
    loadComponent: () => import("./features/auth/auth.component").then((m) => m.AuthComponent),
  },
  {
    path: "admin",
    canActivate: [adminGuard],
    loadComponent: () => import("./features/admin/shell/shell.component").then((m) => m.ShellComponent),
    children: [
      { path: "dashboard", loadComponent: () => import("./features/admin/dashboard/dashboard.component").then((m) => m.DashboardComponent) },
      { path: "registrations", loadComponent: () => import("./features/admin/registrations/registrations.component").then((m) => m.RegistrationsComponent) },
      { path: "offline-registration", data: { resource: "offline" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "competitions", data: { resource: "competitions" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "categories", data: { resource: "categories" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "slots", data: { resource: "slots" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "judges", data: { resource: "judges" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "check-in", data: { resource: "check-in" }, loadComponent: () => import("./features/admin/manage/manage.component").then((m) => m.ManageComponent) },
      { path: "marks", loadComponent: () => import("./features/admin/judging/judging.component").then((m) => m.JudgingComponent) },
      { path: "settings", loadComponent: () => import("./features/admin/settings/settings.component").then((m) => m.SettingsComponent) },
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
    ],
  },
  {
    path: "judge",
    pathMatch: "full",
    title: "Judge Sign In | Chithiram Thiruvila",
    data: { role: "judge" },
    loadComponent: () => import("./features/auth/auth.component").then((m) => m.AuthComponent),
  },
  {
    path: "judge/participants",
    canActivate: [judgeGuard],
    title: "Judge Participants | Chithiram Thiruvila",
    loadComponent: () => import("./features/admin/judging/judging.component").then((m) => m.JudgingComponent),
  },
  { path: "**", redirectTo: "register" },
];
