import { Component, DestroyRef, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { EventStore } from "../../../core/services/event-store.service";

@Component({selector:"app-admin-shell",standalone:true,imports:[RouterOutlet,RouterLink,RouterLinkActive],templateUrl:"./shell.component.html",styleUrl:"./shell.component.css"})
export class ShellComponent{
  auth=inject(AuthService);store=inject(EventStore);router=inject(Router);destroyRef=inject(DestroyRef);menu=signal(false);
  links=[
    ["/admin/dashboard","Dashboard","▦"],["/admin/registrations","Registrations","◉"],["/admin/offline-registration","Paper / Cash Entry","＋"],
    ["/admin/competitions","Competitions","✦"],["/admin/categories","Age Categories","◎"],["/admin/slots","Slots & Venues","◷"],
    ["/admin/judges","Judges","◇"],["/admin/check-in","Event Check-in","▣"],["/admin/marks","Marks","★"],["/admin/settings","Event Settings","⚙"],
  ];
  constructor(){
    if(!this.store.demo){const timer=window.setInterval(()=>void this.store.loadAdmin().catch(()=>{}),15000);this.destroyRef.onDestroy(()=>window.clearInterval(timer));}
  }
  async logout(){await this.auth.logout();await this.router.navigate(["/admin"]);}
}
