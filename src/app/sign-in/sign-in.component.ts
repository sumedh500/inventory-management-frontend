import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { WebService } from '../web.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  error = '';
  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder, private auth: WebService, private router: Router) { }

  ngOnInit(): void {
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.signIn(this.form.value as any).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res && res['status'] == 200) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user.user));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('email', res.user.email);
          this.router.navigateByUrl('/category');
        } else {
          this.error = res?.message || 'Login failed';
        }
      },
      error: (e) => { this.error = e?.error?.message || 'Login failed'; this.loading = false; },
      complete: () => this.loading = false
    });
  }



}
