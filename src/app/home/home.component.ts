import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, OpenIdConfiguration, UserDataResult } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import { Animal } from '../Models/animal';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { UserInfo } from '../Models/userinfo';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  title = 'Zoobuch';

  animals : Animal[] = [];

  newAnimal : Animal = {
    id: 0, 
    name : "",
    type : "",
    selected: false,
    hover: false
  }

  selectedAnimal : Animal = {
    id: 0,
    name: "",
    selected: false,
    type: "",
    hover: false,
  };

  configuration: OpenIdConfiguration;
  userDataChanged$: Observable<OidcClientNotification<any>>;
  userData$: Observable<UserDataResult>;
  isAuthenticated = false;
  roles : UserInfo;

  constructor(public oidcSecurityService: OidcSecurityService, public http: HttpClient){}

  ngOnInit() {
    this.configuration = this.oidcSecurityService.getConfiguration();
    this.userData$ = this.oidcSecurityService.userData$;

    this.oidcSecurityService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;

      if (isAuthenticated) {
        this.getAllAnimals();
        this.userData$.subscribe(({ userData }) => {
            this.roles = userData as UserInfo;
        })
      }
    });
  }

  deleteAnimal(animal: Animal): void {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.oidcSecurityService.getAccessToken(),
      }),
    }

    const test = this.http.delete("https://localhost:5010/animal/delete/" + animal.id.toString(), httpOptions).subscribe(() => {
      this.animals = this.animals.filter(a => a != animal);
    });
  }

  addAnimal(): void{
    if (this.newAnimal.name != "" && this.newAnimal.type != "") {
      var found = this.animals.find(animal => animal.name == this.newAnimal.name && animal.type == this.newAnimal.type);
      if (found == null) {
        const httpOptions = {
          headers: new HttpHeaders({
            Authorization: 'Bearer ' + this.oidcSecurityService.getAccessToken(),
          }),
        }
    
        //Post neues Tier --> Gibt Tier mit id zurück --> In Array hinzufügen
        this.http.post<Animal>("https://localhost:5010/animal", this.newAnimal, httpOptions).subscribe(postData => {
          this.animals.push(Object.assign({}, postData as Animal));
        });
      }
    }
  }

  toggleSelection(animal: Animal) {
    var found = this.animals.find(animal => animal.selected == true);

    if (animal.selected) {
      animal.selected = !animal.selected;
    } else {
      if (found != null) {
        found.selected = false;
      }
      animal.selected = !animal.selected;
    }

    if (animal.selected) {
      animal.hover = false;
    } else {
      animal.hover = true;
    }

    this.selectedAnimal = Object.assign({}, animal);
  }

  mouseEnterSelection(animal: Animal) {
    if (!animal.hover && !animal.selected) {
      animal.hover = true;
    }
  }

  mouseLeaveSelection(animal: Animal) {
    if (animal.hover) {
      animal.hover = false;
    }
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  refreshSession() {
    this.oidcSecurityService.forceRefreshSession().subscribe((result) => console.log(result));
  }

  logout() {
    this.oidcSecurityService.logoff();
  }

  logoffAndRevokeTokens() {
    this.oidcSecurityService.logoffAndRevokeTokens().subscribe((result) => console.log(result));
  }

  revokeRefreshToken() {
    this.oidcSecurityService.revokeRefreshToken().subscribe((result) => console.log(result));
  }

  revokeAccessToken() {
    this.oidcSecurityService.revokeAccessToken(this.oidcSecurityService.getRefreshToken()).subscribe((result) => console.log(result));
  }

  getAllAnimals() {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.oidcSecurityService.getAccessToken(),
      }),
    }

    this.http.get<Animal[]>("https://localhost:5010/animal", httpOptions).subscribe(data => {
      this.animals = (data as Animal[]).slice();
    });
  }

  updateAnimal() {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.oidcSecurityService.getAccessToken(),
      }),
    }

    this.http.put<Animal>("https://localhost:5010/animal/edit/" + this.selectedAnimal.id.toString(), this.selectedAnimal, httpOptions).subscribe(data => {
      const changedAnimal = data as Animal;
      const existing = this.animals.find(x => x.id == changedAnimal.id);
      if (existing != null) {
        existing.name = changedAnimal.name;
        existing.type = changedAnimal.type;
      }
    });
  }
}
