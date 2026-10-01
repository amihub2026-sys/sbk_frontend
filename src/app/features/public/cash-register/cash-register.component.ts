import {
  Component,
  inject,
  signal,
} from "@angular/core";

import {
  CurrencyPipe,
} from "@angular/common";

import {
  FormsModule,
} from "@angular/forms";

import {
  EventStore,
} from "../../../core/services/event-store.service";

import {
  Registration,
} from "../../../core/models/event.models";

import {
  categoryFor,
  indiaDate,
} from "../../../core/utils/event-rules";

import {
  imageFileToDataUrl,
} from "../../../core/utils/image-upload";


@Component({
  selector: "app-cash-register",

  standalone: true,

  imports: [
    FormsModule,
    CurrencyPipe,
  ],

  templateUrl:
    "./cash-register.component.html",

  styleUrl:
    "./cash-register.component.css",
})
export class CashRegisterComponent {

  store =
    inject(EventStore);


  error =
    signal("");


  busy =
    signal(false);


  submitted =
    signal<Registration | null>(
      null,
    );


  cash = {

    name: "",

    fatherName: "",

    school: "",

    dob: "",

    email: "",

    phone: "",

    photo: "",

    applicationDate:
      indiaDate(),

    competitionIds:
      [] as string[],

    // No language selector in UI.
    // Keep English internally for backend.
    language:
      "en" as "ta" | "en",

  };


  constructor() {

    queueMicrotask(
      () =>
        void this.initialize(),
    );

  }


  /**
   * ======================================================
   * LOAD PUBLIC EVENT DATA
   * ======================================================
   */
  private async initialize() {

    try {

      await this.store.load();

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to load registration details.",
      );

    }

  }


  /**
   * ======================================================
   * AGE CATEGORY
   * ======================================================
   */
  cashCategory() {

    if (
      !this.cash.dob
    ) {
      return null;
    }


    return categoryFor(

      this.cash.dob,

      this.cash.applicationDate,

      this.store
        .state()
        .categories,

    );

  }


  /**
   * ======================================================
   * DOB CHANGE
   *
   * Clear old competition selection whenever DOB changes
   * because category / eligibility can change.
   * ======================================================
   */
  onDobChange() {

    this.cash.competitionIds =
      [];

    this.error.set("");

  }


  /**
   * ======================================================
   * ELIGIBLE COMPETITIONS
   * ======================================================
   */
  cashEligible() {

    const category =
      this.cashCategory();


    if (!category) {
      return [];
    }


    return this.store.eligible(
      category.id,
    );

  }


  /**
   * ======================================================
   * SELECT / UNSELECT COMPETITION
   * ======================================================
   */
  toggleCompetition(
    id: string,
  ) {

    this.error.set("");


    const selected =
      this.cash.competitionIds;


    if (
      selected.includes(id)
    ) {

      this.cash.competitionIds =
        selected.filter(
          (value) =>
            value !== id,
        );

      return;

    }


    const maxEvents =
      this.store
        .settings()
        .maxEvents;


    if (
      selected.length >=
      maxEvents
    ) {

      this.error.set(
        `You can select a maximum of ${maxEvents} competitions.`,
      );

      this.goToField(
        "cash-competitions",
      );

      return;

    }


    this.cash.competitionIds = [
      ...selected,
      id,
    ];

  }


  /**
   * ======================================================
   * STUDENT PHOTO
   * ======================================================
   */
  async onPhoto(
    event: Event,
  ) {

    const input =
      event.target as
        HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    this.error.set("");


    try {

      this.cash.photo =
        await imageFileToDataUrl(
          file,
          700,
        );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to process the student photo.",
      );

    } finally {

      input.value = "";

    }

  }


  /**
   * ======================================================
   * TOTAL REGISTRATION FEE
   * ======================================================
   */
  totalFee() {

    return this.cash
      .competitionIds
      .reduce(
        (
          total,
          id,
        ) => {

          const competition =
            this.store
              .competition(id);


          return (
            total +
            Number(
              competition?.fee ||
              0,
            )
          );

        },
        0,
      );

  }


  /**
   * ======================================================
   * SCROLL + FOCUS INVALID FIELD
   * ======================================================
   */
  private goToField(
    id: string,
  ) {

    setTimeout(
      () => {

        const element =
          document.getElementById(
            id,
          );


        if (!element) {
          return;
        }


        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });


        setTimeout(
          () => {

            if (
              element instanceof
                HTMLInputElement ||
              element instanceof
                HTMLSelectElement ||
              element instanceof
                HTMLTextAreaElement
            ) {

              element.focus();

            }

          },
          350,
        );

      },
      50,
    );

  }


  /**
   * ======================================================
   * SUBMIT PUBLIC CASH REGISTRATION
   * ======================================================
   */
  async submit() {

    if (
      this.busy()
    ) {
      return;
    }


    this.error.set("");


    const phone =
      this.cash.phone.replace(
        /\D/g,
        "",
      );


    /**
     * STUDENT NAME
     */
    if (
      !this.cash.name.trim()
    ) {

      this.error.set(
        "Enter the student name.",
      );

      this.goToField(
        "cash-student-name",
      );

      return;

    }


    /**
     * FATHER NAME
     */
    if (
      !this.cash
        .fatherName
        .trim()
    ) {

      this.error.set(
        "Enter the father's name.",
      );

      this.goToField(
        "cash-father-name",
      );

      return;

    }


    /**
     * SCHOOL
     */
    if (
      !this.cash.school.trim()
    ) {

      this.error.set(
        "Enter the school name.",
      );

      this.goToField(
        "cash-school",
      );

      return;

    }


    /**
     * DATE OF BIRTH
     */
    if (
      !this.cash.dob
    ) {

      this.error.set(
        "Select the student's date of birth.",
      );

      this.goToField(
        "cash-dob",
      );

      return;

    }


    /**
     * AGE CATEGORY
     */
    if (
      !this.cashCategory()
    ) {

      this.error.set(
        "The selected date of birth is outside the eligible age category.",
      );

      this.goToField(
        "cash-dob",
      );

      return;

    }


    /**
     * EMAIL
     */
    const email =
      this.cash.email
        .trim()
        .toLowerCase();


    if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
        .test(email)
    ) {

      this.error.set(
        "Enter a valid email address.",
      );

      this.goToField(
        "cash-email",
      );

      return;

    }


    /**
     * PHONE
     */
    if (
      !/^[6-9]\d{9}$/
        .test(phone)
    ) {

      this.error.set(
        "Enter a valid 10-digit mobile number.",
      );

      this.goToField(
        "cash-phone",
      );

      return;

    }


    /**
     * COMPETITION
     */
    if (
      !this.cash
        .competitionIds
        .length
    ) {

      this.error.set(
        "Select at least one competition.",
      );

      this.goToField(
        "cash-competitions",
      );

      return;

    }


    this.busy.set(true);


    try {

      const student = {

        name:
          this.cash
            .name
            .trim(),

        fatherName:
          this.cash
            .fatherName
            .trim(),

        school:
          this.cash
            .school
            .trim(),

        dob:
          this.cash.dob,

        email,

        phone,

        photo:
          this.cash.photo,

      };


      const registration =
        await this.store
          .registerCash(

            student,

            this.cash
              .competitionIds,

            this.cash.language,

            this.cash
              .applicationDate,

          );


      this.submitted.set(
        registration,
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to submit cash registration.",
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } finally {

      this.busy.set(false);

    }

  }

}