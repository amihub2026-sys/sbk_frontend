import {
  Component,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";

import { EventStore } from "../../../core/services/event-store.service";

import { Settings } from "../../../core/models/event.models";

import {
  imageFileToDataUrl,
} from "../../../core/utils/image-upload";


@Component({
  selector: "app-settings",

  standalone: true,

  imports: [
    FormsModule,
  ],

  templateUrl:
    "./settings.component.html",

  styleUrl:
    "./settings.component.css",
})
export class SettingsComponent {

  store =
    inject(EventStore);


  form: Settings = {
    ...this.store.settings(),
  };


  error =
    signal("");


  saving =
    signal(false);


  confirmReset =
    signal(false);


  /**
   * =========================================
   * BANNER IMAGE
   * =========================================
   */

  async onBanner(
    event: Event,
  ) {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    this.error.set("");


    try {

      this.form.bannerImage =
        await imageFileToDataUrl(
          file,
          1600,
        );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to process image.",
      );

    } finally {

      input.value = "";

    }

  }


  /**
   * =========================================
   * SAVE SETTINGS
   * =========================================
   */

  async save() {

    this.error.set("");


    if (
      !this.form.title.trim()
    ) {

      this.error.set(
        "English event title is required.",
      );

      return;

    }


    if (
      !this.form.presenters.trim()
    ) {

      this.error.set(
        "Presented by is required.",
      );

      return;

    }


    if (
      !this.form.prefix.trim()
    ) {

      this.error.set(
        "Registration prefix is required.",
      );

      return;

    }


    /**
     * Registration prefix:
     * 26SBK
     */

    this.form.prefix =
      this.form.prefix
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          "",
        );


    if (
      this.form.prefix.length < 2
    ) {

      this.error.set(
        "Enter a valid registration prefix.",
      );

      return;

    }


    this.saving.set(
      true,
    );


    try {

      await this.store
        .saveSettings({
          ...this.form,
        });


      /**
       * Reload latest server value
       */

      this.form = {
        ...this.store.settings(),
      };

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save settings.",
      );

    } finally {

      this.saving.set(
        false,
      );

    }

  }


  /**
   * =========================================
   * TEST DATA RESET
   * =========================================
   *
   * This is only available in demo mode.
   */

  reset() {

    if (!this.store.demo) {

      this.confirmReset.set(
        false,
      );

      return;

    }


    this.store
      .resetFrontendData();


    this.form = {
      ...this.store.settings(),
    };


    this.confirmReset.set(
      false,
    );

  }

}