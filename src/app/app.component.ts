import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslationService } from './services/translation.service';

@Component({
    selector: 'app-root',
    imports: [RouterModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(public translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.currentLang$.subscribe(lang => {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
    });
  }
}
