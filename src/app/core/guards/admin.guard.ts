import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const adminGuard:CanActivateFn=async()=>{const auth=inject(AuthService),router=inject(Router);if(auth.session()?.role==="admin")return true;return await auth.restore()&&auth.session()?.role==="admin"?true:router.createUrlTree(["/admin"]);};
export const judgeGuard:CanActivateFn=async()=>{const auth=inject(AuthService),router=inject(Router);if(auth.session()?.role==="judge")return true;return await auth.restore()&&auth.session()?.role==="judge"?true:router.createUrlTree(["/judge"]);};
