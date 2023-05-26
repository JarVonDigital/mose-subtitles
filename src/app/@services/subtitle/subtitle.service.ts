import {inject, Injectable} from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocsFromServer,
  query,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import {Subtitle} from '../../@interfaces/subtitle';
import {Auth, User, user} from '@angular/fire/auth';
import {firstValueFrom} from 'rxjs';
import {DocumentData} from '@angular/fire/compat/firestore';
import {AuthService} from "../auth/auth.service";
import {Errors} from "../../@enums/errors/errors";
import {ElectronService} from "../../core/services";

@Injectable({
  providedIn: 'root'
})
export class SubtitleService {

  private app: ElectronService = inject(ElectronService);
  private authService: AuthService = inject(AuthService);
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private user$ = user(this.auth);

  async getSubtitleFiles(): Promise<Subtitle[]>  {

    try {

      // Get subtitles from cloud
      const subtitleQuery = await query(collection(this.firestore, 'subtitles'));
      return (await getDocsFromServer(subtitleQuery)).docs.map(sub => sub.data() as Subtitle);

    } catch(err) {
      return [];
    }

  }

  async saveSubtitleFile(subtitle: Subtitle, doCheck = false) {

    try {

      const loggedInUser: User = await firstValueFrom(this.user$);
      if(!this.authService.validateUser().isLoggedIn) {throw new Error(Errors.authentication);}

      if(!subtitle.assignedTo) {
        subtitle.assignedTo = loggedInUser.email;
        subtitle.isLocked = true;
      }

      // Check to see if file exist in system
      const fireWorkingFile = doc(this.firestore, `subtitles`, subtitle.title);
      const document = await getDoc(fireWorkingFile);

      if(document.exists()) {
        if(doCheck) {

          const overrideCloudData = await this.app.showMessageBox({
            title: 'Data Import',
            message: 'Import video only?',
            type: 'question',
            buttons: ['Import Video Only', 'Import Video and Override Subtitle']
          });

          if(!overrideCloudData.response) {
            await updateDoc(doc(this.firestore, `subtitles`, subtitle.title), (subtitle as DocumentData));
          }

        } else {
          await updateDoc(doc(this.firestore, `subtitles`, subtitle.title), (subtitle as DocumentData));
        }
      } else {
        const saveLocation = doc(this.firestore, `subtitles`, subtitle.title);
        await setDoc(saveLocation, (subtitle as DocumentData));
      }

      return subtitle;

    } catch(err) {
      console.log(err);
    }
  }

}
