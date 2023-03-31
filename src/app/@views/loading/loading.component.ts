import {Component, inject, OnInit} from '@angular/core';
import {ElectronService} from '../../core/services';
import {Router} from '@angular/router';
import {Auth, signInWithEmailAndPassword} from "@angular/fire/auth";
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  initializers = [];
  isLoadingServices = true;
  loginForm: FormGroup<any>;

  private app: ElectronService = inject(ElectronService);
  private router: Router = inject(Router);
  private auth: Auth = inject(Auth);

  ngOnInit(): void {
    this.initCloudServices(); // ONLY RUNS ONCE
    this.initAVServices(); // ONLY RUNS ONCE
    this.initSecureServices(); // ONLY RUNS ONCE

    this.loginForm = new FormGroup<any>({
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [Validators.required])
    });
  }

  skipLoginService() {
    this.router.navigate(['home']);
  }

  onSignIn() {
    const email = this.loginForm.get('email').getRawValue();
    const password = this.loginForm.get('password').getRawValue();
    signInWithEmailAndPassword(this.auth, email, password)
      .then(user => {
        if(user) {
          console.log(user);
          this.router.navigate(['home']);
        }
      })
      .catch(err => console.log(`Credentials don't match, please try email and password again`));
  }

  private initAVServices() {
    this.app.initAVServices()
      .then((data) => {
        this.initializers.push({
          action: 'AV Services',
          status: data
        });
        this.checkInitializedServices();
      });
  }

  private initCloudServices() {
    setTimeout(() => {
      this.initializers.push({
        action: 'MOSE Cloud',
        status: true
      });
      this.checkInitializedServices();
    }, 2000);
  }

  private initSecureServices() {
    setTimeout(() => {
      this.initializers.push({
        action: 'Secure Services',
        status: true
      });
      this.checkInitializedServices();
    }, 6000);
  }

  private checkInitializedServices() {
    this.isLoadingServices = !(this.initializers.length === 3);
  }
}
