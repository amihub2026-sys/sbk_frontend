import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { EventStore } from "./core/services/event-store.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  store = inject(EventStore);
  router = inject(Router);
  constructor(){ void this.store.load(); }
  get isWorkspace() { return this.router.url.startsWith("/admin/") || this.router.url.startsWith("/judge/"); }
  get isLogin() { return this.router.url === "/admin" || this.router.url === "/judge"; }
}
