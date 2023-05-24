import {inject, Injectable} from '@angular/core';
import {Auth, user, User, Persistence, signInWithEmailAndPassword} from '@angular/fire/auth';
import {doc, Firestore, getDoc} from "@angular/fire/firestore";
import {UserInfo} from "../../@interfaces/user/user-info";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userInfo: UserInfo | undefined;

  private persistence: Persistence = 'LOCAL' as unknown as Persistence;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private user = user(this.auth);


  validateUser(): { activeUserInfo: any; activeUser: User; isLoggedIn: boolean } {
    return {
      isLoggedIn: !!this.auth.currentUser,
      activeUser: this.auth.currentUser,
      activeUserInfo: this.getUserInfo()
    };
  }

  getUserInfo() {
    return this.userInfo;
  }

  async signIn(email: string, password: string) {
    try {

      // Login User
      await this.auth.setPersistence(this.persistence);
      await signInWithEmailAndPassword(this.auth, email, password);

      // Set Item
      localStorage.setItem('email', email);
      localStorage.setItem('password', password);

      // Set User Info
      this.userInfo = (await getDoc(doc(this.firestore, 'users', email))).data() as UserInfo;

      return true;

    } catch (err) {
      console.log('Unable to sign in, please try again.');
      window.alert('Unable to sign in, please try again.');
      return false;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
      this.userInfo = undefined;
      return true;
    } catch (err) {
      console.log('Unable to sign out, please try again.');
    }
  }
}
