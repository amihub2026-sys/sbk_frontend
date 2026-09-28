import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { EventStore } from "../../core/services/event-store.service";

@Component({ selector:"app-auth", standalone:true, imports:[FormsModule], templateUrl:"./auth.component.html", styleUrl:"./auth.component.css" })
export class AuthComponent {
  auth = inject(AuthService); store = inject(EventStore); route = inject(ActivatedRoute); router = inject(Router);
  email=""; password=""; error=signal(""); busy=signal(false);
  role = (this.route.snapshot.data["role"] as "admin"|"judge") || "admin";
  async login(){
    this.error.set(""); this.busy.set(true);
    try {
      if(this.role==="admin") { await this.auth.loginAdmin(this.email,this.password); await this.router.navigate(["/admin/dashboard"]); }
      else { await this.auth.loginJudge(this.email,this.password); await this.router.navigate(["/judge/participants"]); }
    } catch(e){ this.error.set(e instanceof Error?e.message:"Sign in failed."); }
    finally{ this.busy.set(false); }
  }
}
