import { Component, OnInit } from '@angular/core';
import {ElectronService} from '../../core/services';
import {BehaviorSubject} from 'rxjs';
import {Router} from "@angular/router";
import * as zlib from "zlib";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  initializers = [];
  isLoadingServices = true;

  constructor(
    private app: ElectronService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initCloudServices(); // ONLY RUNS ONCE
    this.initAVServices(); // ONLY RUNS ONCE
    this.initSecureServices(); // ONLY RUNS ONCE
  }

  skipLoginService() {
    this.router.navigate(['home']);
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
