
import { Injectable, inject } from '@angular/core';
import { AuthService, User } from './firebase.service';



@Injectable({
    providedIn: 'root',
})

export class userSerivce{
    constructor(public authService: AuthService) {
        this.authService.currentUser.subscribe((user) => {
            // Update internal state when user changes
            this._currentUserData = user;
            this._userRole = user?.role ?? null;
            this._isAdmin = user?.role?.toLowerCase() === 'administrative';
        });
    }

    private _userRole: string | null = null;
    private _isAdmin: boolean | null = null;
    private _currentUserData: User |null = null;

    get currentUserRole(): string | null {
        return this._userRole;
    }

    get isAdmin(): boolean {
        return this._isAdmin ?? false; // Default to false if null
    }

    get userData(): User | null  {
        return this?._currentUserData;
    }
}