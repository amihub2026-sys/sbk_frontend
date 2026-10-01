import {
  Component,
  DestroyRef,
  ElementRef,
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

  /* =========================================
     SERVICES
  ========================================= */

  store = inject(EventStore);

  private router =
    inject(Router);

  private destroyRef =
    inject(DestroyRef);

  private host =
    inject(ElementRef<HTMLElement>);


  /* =========================================
     FIND PASS FORM
  ========================================= */

  applicationNo = "";

  phone = "";


  /* =========================================
     STATES
  ========================================= */

  error = signal("");

  qr = signal("");

  busy = signal(false);

  downloading = signal(false);

  downloaded = signal(false);


  /* =========================================
     CONSTRUCTOR
  ========================================= */

  constructor() {

    /*
     * Generate QR whenever a confirmed
     * participant pass becomes available.
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


    /*
     * Initial page load.
     */
    queueMicrotask(
      () => void this.initialize(),
    );


    /*
     * Refresh participant every 10 seconds
     * only while a pass is currently open.
     */
    if (!this.store.demo) {

      const timer =
        window.setInterval(
          () => {

            if (
              !this.store.activePass()
            ) {
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

          window.clearInterval(
            timer,
          );

        },
      );

    }

  }


  /* =========================================
     INITIALIZE PAGE
  ========================================= */

  private async initialize() {

    try {

      /*
       * Load event settings,
       * competitions,
       * categories and slots.
       */
      if (!this.store.demo) {

        await this.store.load();

      }


      /*
       * =====================================
       * FIND PASS ROUTE
       * =====================================
       */

      if (
        this.router.url.startsWith(
          "/find-pass",
        )
      ) {

        const autoDownload =
          sessionStorage.getItem(
            "sbk-auto-download-pass",
          ) === "1";


        /*
         * NORMAL FIND MY PASS
         *
         * No payment return.
         * Show search form normally.
         */
        if (!autoDownload) {

          this.store.activePass.set(
            null,
          );

          this.qr.set("");

          return;

        }


        /*
         * PAYMENT RETURN
         *
         * Do NOT clear participant.
         *
         * Restore confirmed participant
         * from backend session.
         */
        await this.store
          .restoreParticipant();


        /*
         * Automatically download
         * beautiful pass.
         */
        await this
          .autoDownloadAfterPayment();


        return;

      }


      /*
       * =====================================
       * NORMAL PASS ROUTE
       * =====================================
       */

      await this.store
        .restoreParticipant();


      /*
       * If this route was opened as part
       * of payment success, download pass.
       */
      await this
        .autoDownloadAfterPayment();


    } catch (e) {

      /*
       * Participant session not existing
       * is okay on normal Find Pass page.
       */
      console.warn(
        "Pass initialization:",
        e,
      );

    }

  }


  /* =========================================
     FIND REGISTRATION
  ========================================= */

  async find() {

    this.error.set("");


    const applicationNo =
      this.applicationNo
        .trim()
        .toUpperCase();


    const phone =
      this.phone
        .replace(/\D/g, "");


    /* Application number */

    if (!applicationNo) {

      this.error.set(
        "Enter your application number.",
      );

      return;

    }


    /* Phone */

    if (
      !/^[6-9]\d{9}$/.test(
        phone,
      )
    ) {

      this.error.set(
        "Enter the registered 10-digit mobile number.",
      );

      return;

    }


    this.busy.set(true);


    try {

      /*
       * Lookup registration.
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


  /* =========================================
     CHECK PASS READY
  ========================================= */

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


  /* =========================================
     WAIT FOR IMAGES
  ========================================= */

  private async waitForImages(
    element: HTMLElement,
  ) {

    const images =
      Array.from(
        element.querySelectorAll(
          "img",
        ),
      ) as HTMLImageElement[];


    /*
     * Wait for:
     *
     * Student photo
     * Competition images
     * QR code
     */
    await Promise.all(

      images.map((img) => {

        if (img.complete) {

          return Promise.resolve();

        }


        return new Promise<void>(
          (resolve) => {

            const finish = () => {

              resolve();

            };


            img.addEventListener(
              "load",
              finish,
              {
                once: true,
              },
            );


            img.addEventListener(
              "error",
              finish,
              {
                once: true,
              },
            );

          },
        );

      }),

    );


    /*
     * Wait for Tamil / English fonts.
     */
    try {

      await document.fonts.ready;

    } catch {}


    /*
     * Extra render time.
     */
    await new Promise<void>(
      (resolve) => {

        window.setTimeout(
          resolve,
          400,
        );

      },
    );

  }


  /* =========================================
     DOWNLOAD BEAUTIFUL PASS
  ========================================= */

  async downloadPass() {

    const registration =
      this.store.activePass();


    if (!registration) {

      this.error.set(
        "Registration not found.",
      );

      return;

    }


    if (
      !this.passReady(
        registration,
      )
    ) {

      this.error.set(
        "Complete payment before downloading the pass.",
      );

      return;

    }


    if (
      this.downloading()
    ) {

      return;

    }


    this.downloading.set(
      true,
    );

    this.error.set("");


    try {

      /*
       * Capture complete pass page.
       *
       * We use pass-page because your
       * Chithiram background is applied
       * to this element.
       */
      const element =
        this.host.nativeElement
          .querySelector(
            ".pass-page",
          ) as HTMLElement | null;


      if (!element) {

        throw new Error(
          "Pass design not found.",
        );

      }


      /*
       * Wait until student photo,
       * QR and competition images load.
       */
      await this.waitForImages(
        element,
      );


      /* Load html2canvas */

      const html2canvasModule =
        await import(
          "html2canvas"
        );


      const html2canvas =
        html2canvasModule.default;


      /* Load jsPDF */

      const jsPDFModule =
        await import(
          "jspdf"
        );


      const jsPDF =
        jsPDFModule.jsPDF;


      /*
       * Capture exact Angular pass.
       */
      const canvas =
        await html2canvas(
          element,
          {

            scale: 2,

            useCORS: true,

            allowTaint: false,

            backgroundColor:
              "#f5f7f4",

            logging: false,


            /*
             * Hide buttons and controls
             * from downloaded PDF.
             */
            onclone: (
              clonedDocument,
            ) => {

              const hidden =
                clonedDocument
                  .querySelectorAll(
                    ".no-print",
                  );


              hidden.forEach(
                (item) => {

                  (
                    item as HTMLElement
                  ).style.display =
                    "none";

                },
              );

            },

          },
        );


      /*
       * Convert screenshot to image.
       */
      const imageData =
        canvas.toDataURL(
          "image/png",
          1,
        );


      /*
       * Create A4 PDF.
       */
      const pdf =
        new jsPDF({

          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",

          compress:
            true,

        });


      const pageWidth =
        pdf.internal
          .pageSize
          .getWidth();


      const pageHeight =
        pdf.internal
          .pageSize
          .getHeight();


      const imageWidth =
        pageWidth;


      const imageHeight =
        (
          canvas.height *
          imageWidth
        ) /
        canvas.width;


      let heightLeft =
        imageHeight;


      let position =
        0;


      /*
       * First page.
       */
      pdf.addImage(
        imageData,
        "PNG",
        0,
        position,
        imageWidth,
        imageHeight,
      );


      heightLeft -=
        pageHeight;


      /*
       * If pass becomes longer than
       * one A4 page, continue.
       */
      while (
        heightLeft > 0
      ) {

        position =
          heightLeft -
          imageHeight;


        pdf.addPage();


        pdf.addImage(
          imageData,
          "PNG",
          0,
          position,
          imageWidth,
          imageHeight,
        );


        heightLeft -=
          pageHeight;

      }


      /*
       * Example filename:
       *
       * 26SBK20-event-pass.pdf
       */
      pdf.save(
        `${registration.applicationNo}-event-pass.pdf`,
      );


      this.downloaded.set(
        true,
      );


    } catch (e) {

      console.error(
        "Pass download error:",
        e,
      );


      this.error.set(
        "Unable to download the pass. Please use Download pass again.",
      );


    } finally {

      this.downloading.set(
        false,
      );

    }

  }


  /* =========================================
     AUTO DOWNLOAD AFTER PAYMENT
  ========================================= */

  private async autoDownloadAfterPayment() {

    const shouldDownload =
      sessionStorage.getItem(
        "sbk-auto-download-pass",
      ) === "1";


    if (!shouldDownload) {

      return;

    }


    const registration =
      this.store.activePass();


    /*
     * Only download after backend
     * confirms successful payment.
     */
    if (
      !registration ||
      !this.passReady(
        registration,
      )
    ) {

      return;

    }


    /*
     * Remove the flag BEFORE download.
     *
     * This prevents:
     *
     * refresh
     * back button
     * reopening route
     *
     * from downloading repeatedly.
     */
    sessionStorage.removeItem(
      "sbk-auto-download-pass",
    );


    sessionStorage.setItem(
      "sbk-payment-success",
      "1",
    );


    /*
     * Give Angular time to render:
     *
     * QR
     * student photo
     * competition images
     * page background
     */
    await new Promise<void>(
      (resolve) => {

        window.setTimeout(
          resolve,
          1200,
        );

      },
    );


    /*
     * Download beautiful PDF.
     */
    await this.downloadPass();

  }


  /* =========================================
     PRINT
  ========================================= */

  print() {

    window.print();

  }

}