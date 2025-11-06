import { Component, OnInit } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WebService } from '../web.service';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {

error = '';
  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder, private router: Router, private webService: WebService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // throw new Error('Method not implemented.');
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.webService.signUp(this.form.value as any).subscribe({
      next: (res: any) =>{
        console.log(res);
        if(res && res['status'] === 200){
          this.snackBar.open('Signup successful', 'Close', { duration: 3000 });
          this.router.navigate(['/sign-in']);
        } else {
          this.snackBar.open( (res?.message || 'Unknown error'), 'Close', { duration: 3000 });
          this.error = res?.message || 'Signup failed';
        }
      },
      error: (e) => { this.error = e?.error?.message || 'Signup failed'; this.loading = false; },
      complete: () => this.loading = false
    });
  }
}
