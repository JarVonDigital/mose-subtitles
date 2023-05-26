import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../../@services/auth/auth.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ElectronService} from "../../../core/services";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // Login Form
  protected loginForm: FormGroup<any>;

  protected app: ElectronService = inject(ElectronService);
  protected authService: AuthService = inject(AuthService);

  ngOnInit(): void {
    this.setupLoginForm();
  }

  async onSignIn() {
    try {
      const email = this.loginForm.getRawValue().email;
      const password = this.loginForm.getRawValue().password;
      await this.authService.signIn(email, password);
    } catch (err) {
      console.log(`Credentials don't match, please try email and password again`);
    }
  }

  async onLogout() {
    try {
      if(window.confirm('You\'re about to logout. Are you sure?')) {
        await this.authService.signOut();
      }
    } catch (err) {
      console.log(err);
    }
  }

  private setupLoginForm() {

    const emailValue: string = localStorage.getItem('email') ?? '';
    const passwordValue: string = localStorage.getItem('password') ?? '';

    // Setup Login Form
    this.loginForm = new FormGroup<any>({
      email: new FormControl(emailValue, [Validators.email, Validators.required]),
      password: new FormControl(passwordValue, [Validators.required])
    });

  }
}
