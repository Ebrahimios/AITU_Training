
import { Injectable, inject } from '@angular/core';
import { AuthService, User } from './firebase.service';



@Injectable({
    providedIn: 'root',
})

export class userSerivce{
    constructor(
        public authService: AuthService,
    ){}

    private _userRole : string | null = null;
    private _isAdmin : boolean | null = null;
    private _currentUserData : User | null = null;

    get currentUserRole() {
        if (this._userRole === null) {
            this._userRole = this.authService.currentUserValue?.role ?? null;
        }
        return this._userRole;
    }

    get isAdmin() {
        if (this._isAdmin === null) {
            this._isAdmin = this.currentUserRole?.toLocaleLowerCase() === "administrative";
        }
        return this._isAdmin;
    }

    get userData(): User {
        if (!this._currentUserData) {
            this._currentUserData = this.authService.currentUserValue;
        }
        return this._currentUserData!;
    }
}