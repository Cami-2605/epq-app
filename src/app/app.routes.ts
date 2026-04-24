import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { UserComponent } from './features/dashboard/user/user';
import { AdminComponent } from './features/dashboard/admin/admin';
import { UploadComponent } from './features/excel/upload/upload';
import { ReportesComponent } from './features/reportes/reportes/reportes';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard-user', component: UserComponent, canActivate: [authGuard] },
  { path: 'dashboard-admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'excel', component: UploadComponent, canActivate: [authGuard] },
  { path: 'reportes', component: ReportesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];