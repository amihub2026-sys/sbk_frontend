import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { DatePipe, CurrencyPipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";

import QRCode from "qrcode";

import { EventStore } from "../../../core/services/event-store.service";


@Component({
  selector: "app-pass",
  standalone: true,

  imports: [
    FormsModule,
    DatePipe,
    CurrencyPipe,
    RouterLink,
  ],

  templateUrl: "./pass.component.html",
  styleUrl: "./pass.component.css",
})
export class PassComponent {

  store = inject(EventStore);

  private router = inject(Router);

  private destroyRef =
    inject(DestroyRef);


  applicationNo = "";

  phone = "";


  error = signal("");

  qr = signal("");

  busy = signal(false);


  constructor() {

    /**
     * Generate QR for a confirmed registration.
     *
     * Date / Time / Venue are NOT required
     * for QR generation.
     */
    effect(() => {

      const registration =
        this.store.activePass();


      if (
        registration &&
        this.passReady(registration) &&
        registration.qrToken
      ) {

        QRCode.toDataURL(
          registration.qrToken,
          {
            width: 280,
            margin: 1,
          },
        )
          .then((value) => {
            this.qr.set(value);
          })
          .catch(() => {
            this.qr.set("");
          });

        return;
      }


      this.qr.set("");
    });


    /**
     * Initialise page.
     */
    queueMicrotask(
      () => void this.initialize(),
    );


    /**
     * Refresh registration only when
     * a participant pass is already open.
     *
     * IMPORTANT:
     * This will NOT automatically reopen an
     * old participant while Find My Pass form
     * is being displayed.
     */
    if (!this.store.demo) {

      const timer =
        window.setInterval(
          () => {

            if (!this.store.activePass()) {
              return;
            }


            void this.store
              .restoreParticipant()
              .catch(() => {});

          },
          10000,
        );


      this.destroyRef.onDestroy(
        () => {
          window.clearInterval(timer);
        },
      );
    }
  }


  /**
   * ==================================================
   * INITIAL PAGE LOAD
   * ==================================================
   */
  private async initialize() {

    try {

      /**
       * Load categories,
       * competitions,
       * settings and slots.
       */
      if (!this.store.demo) {
        await this.store.load();
      }


      /**
       * When the user opens:
       *
       * /find-pass
       *
       * ALWAYS show the lookup form.
       *
       * Do not restore a previous participant.
       */
      if (
        this.router.url.startsWith(
          "/find-pass",
        )
      ) {

        this.store.activePass.set(null);

        this.qr.set("");

        return;
      }


      /**
       * For another pass route,
       * restoring the current participant
       * is allowed.
       */
      await this.store.restoreParticipant();

    } catch {

      /**
       * No participant session is okay.
       */
    }
  }


  /**
   * ==================================================
   * FIND MY REGISTRATION
   * ==================================================
   *
   * NO OTP
   *
   * Application Number
   * +
   * Registered Mobile Number
   */
  async find() {

    this.error.set("");


    const applicationNo =
      this.applicationNo
        .trim()
        .toUpperCase();


    const phone =
      this.phone
        .replace(/\D/g, "");


    if (!applicationNo) {

      this.error.set(
        "Enter your application number.",
      );

      return;
    }


    if (
      !/^[6-9]\d{9}$/.test(phone)
    ) {

      this.error.set(
        "Enter the registered 10-digit mobile number.",
      );

      return;
    }


    this.busy.set(true);


    try {

      /**
       * Direct lookup.
       *
       * No OTP.
       */
      await this.store.lookup(
        applicationNo,
        phone,
      );


      this.applicationNo =
        applicationNo;

      this.phone =
        phone;


    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to find registration.",
      );

    } finally {

      this.busy.set(false);

    }
  }


  /**
   * ==================================================
   * PASS READY
   * ==================================================
   *
   * Successful payment automatically
   * confirms online registration.
   *
   * Schedule is NOT required.
   */
  passReady(r: any) {

    return (
      !r.cancelled &&
      r.payment === "Paid" &&
      (
        r.registrationStatus ===
          "Confirmed" ||
        r.approval ===
          "Approved"
      )
    );

  }


  /**
   * ==================================================
   * PRINT
   * ==================================================
   */
  print() {

    window.print();

  }

}