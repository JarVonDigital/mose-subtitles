import {inject, Injectable} from '@angular/core';
import {collection, Firestore, getDocs, query} from '@angular/fire/firestore';
import {Subtitle} from '../../@interfaces/subtitle';

@Injectable({
  providedIn: 'root'
})
export class SubtitleService {

  private firestore: Firestore = inject(Firestore);

  async getSubtitleFiles(): Promise<Subtitle[]>  {

    try {

      // Get subtitles from cloud
      const subtitleQuery = await query(collection(this.firestore, 'subtitles'));
      return (await getDocs(subtitleQuery)).docs.map(sub => sub.data() as Subtitle);

    } catch(err) {
      return [];
    }

  }
}
