import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ShellComponent } from './app/shell/shell';

bootstrapApplication(ShellComponent, appConfig).catch(console.error);