import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
import { EventStore } from "./event-store.service";
import { Session } from "../models/event.models";

const SESSION_KEY="sbk-chithiram-session-v2";
@Injectable({providedIn:"root"})
export class AuthService{
  private http=inject(HttpClient); private store=inject(EventStore); readonly session=signal<Session|null>(this.read());
  private read():Session|null{try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw) as Session:null;}catch{return null;}}
  private setSession(s:Session|null){this.session.set(s);if(s)sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));else sessionStorage.removeItem(SESSION_KEY);}
  private url(path:string){return `${environment.apiUrl}${path}`;}
  async loginAdmin(email:string,password:string){
    if(environment.mode==="demo"){if(email.trim().toLowerCase()!=="admin@sbk.in"||password!=="Admin@123")throw Error("Invalid admin credentials.");this.setSession({name:"Event Administrator",role:"admin"});return;}
    await firstValueFrom(this.http.get(this.url("/auth/csrf"))); const s=await firstValueFrom(this.http.post<Session>(this.url("/auth/login"),{email,password,role:"admin"})); if(s.role!=="admin")throw Error("This account does not have admin access.");this.setSession(s);await this.store.loadAdmin();
  }
  async loginJudge(email:string,password:string){
    if(environment.mode==="demo"){const j=this.store.state().judges.find(j=>j.active&&j.email.toLowerCase()===email.trim().toLowerCase()&&j.temporaryPassword===password);if(!j)throw Error("Invalid judge credentials or inactive judge account.");this.setSession({name:j.name,role:"judge",judgeId:j.id});return;}
    await firstValueFrom(this.http.get(this.url("/auth/csrf"))); const s=await firstValueFrom(this.http.post<Session>(this.url("/auth/login"),{email,password,role:"judge"})); if(s.role!=="judge")throw Error("This account does not have judge access.");this.setSession(s);await this.store.loadJudge();
  }
  async restore(){
    if(environment.mode==="demo")return !!this.session();
    try{const s=await firstValueFrom(this.http.get<Session>(this.url("/auth/me")));this.setSession(s);if(s.role==="admin")await this.store.loadAdmin();else await this.store.loadJudge();return true;}catch{this.setSession(null);return false;}
  }
  async logout(){if(environment.mode!=="demo"){try{await firstValueFrom(this.http.post(this.url("/auth/logout"),{}));}catch{}}this.setSession(null);await this.store.load();}
}
