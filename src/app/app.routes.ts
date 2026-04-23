import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { UserComponent } from './features/dashboard/user/user';
import { AdminComponent } from './features/dashboard/admin/admin';
import { UploadComponent } from './features/excel/upload/upload';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard-user', component: UserComponent },
  { path: 'dashboard-admin', component: AdminComponent },
  { path: 'excel', component: UploadComponent },
  { path: '**', redirectTo: '' }
];