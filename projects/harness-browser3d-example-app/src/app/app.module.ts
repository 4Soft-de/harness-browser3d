import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HarnessBrowser3dLibraryModule } from 'harness-browser3d-library';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";

@NgModule({
  declarations: [AppComponent],
    imports: [
        BrowserModule,
        HarnessBrowser3dLibraryModule,
        BrowserAnimationsModule,
        MatCardModule,
        FlexLayoutModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatTableModule,
        MatInputModule,
        MatIconModule,
        MatListModule,
        MatToolbarModule,
        MatSlideToggleModule,
    ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
