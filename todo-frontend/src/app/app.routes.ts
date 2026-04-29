import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { App } from './app';

export const routes: Routes = [
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'todos',    component: App },
  { path: '',         redirectTo: '/login', pathMatch: 'full' },
  { path: '**',       redirectTo: '/login' }
];