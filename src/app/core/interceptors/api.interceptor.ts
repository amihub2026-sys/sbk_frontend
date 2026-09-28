import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { environment } from "../../../environments/environment";

function getCookie(name: string): string {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Request-ID": crypto.randomUUID(),
  };

  const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (unsafeMethods.includes(req.method.toUpperCase())) {
    const csrfToken = getCookie("XSRF-TOKEN");

    if (csrfToken) {
      headers["X-XSRF-TOKEN"] = csrfToken;
    }
  }

  const apiReq = req.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.error?.error?.message ||
        error.message ||
        "Request failed.";

      return throwError(() => new Error(message));
    }),
  );
};