import {
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";

import {
  CurrencyPipe,
  DatePipe,
} from "@angular/common";

import {
  Router,
  RouterLink,
} from "@angular/router";

import { EventStore } from "../../../core/services/event-store.service";

import { Registration } from "../../../core/models/event.models";


@Component({
  selector: "app-registrations",
  standalone: true,

  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
  ],

  templateUrl: "./registrations.component.html",
  styleUrl: "./registrations.component.css",
})
export class RegistrationsComponent {

  store = inject(EventStore);

  router = inject(Router);


  /**
   * ======================================================
   * FILTERS
   * ======================================================
   */

  search = signal("");

  category = signal("");

  competition = signal("");

  source = signal("");

  paymentStatus = signal("");

  status = signal("");

  fromDate = signal("");

  toDate = signal("");


  /**
   * ======================================================
   * SELECTED REGISTRATION
   * ======================================================
   */

  selected =
    signal<Registration | null>(
      null,
    );

  error = signal("");


  /**
   * ======================================================
   * REVIEW FORM
   * ======================================================
   */

  payment:
    Registration["payment"] =
      "Pending";

  approval:
    Registration["approval"] =
      "Pending";

  reviewNote = "";


  /**
   * ======================================================
   * CATEGORY OPTIONS
   * ======================================================
   */

  categories = computed(
    () =>
      this.store
        .state()
        .categories
        .slice()
        .sort(
          (a, b) =>
            a.minMonths -
            b.minMonths,
        ),
  );


  /**
   * ======================================================
   * COMPETITION OPTIONS
   *
   * If category is selected,
   * show only competitions belonging to that category.
   * ======================================================
   */

  competitionOptions = computed(
    () => {

      const categoryId =
        this.category();


      if (!categoryId) {

        return this.store
          .state()
          .competitions;
      }


      return this.store
        .state()
        .competitions
        .filter(
          (competition) =>
            competition.categoryIds.includes(
              categoryId,
            ),
        );
    },
  );


  /**
   * ======================================================
   * FILTERED REGISTRATION LIST
   * ======================================================
   */

  rows = computed(
    () => {

      const query =
        this.search()
          .trim()
          .toLowerCase();


      const categoryId =
        this.category();


      const competitionId =
        this.competition();


      const source =
        this.source();


      const payment =
        this.paymentStatus();


      const status =
        this.status();


      const from =
        this.fromDate();


      const to =
        this.toDate();


      return this.store
        .registrations()

        .filter(
          (registration) => {

            /**
             * SEARCH
             */

            if (query) {

              const values = [
                registration.applicationNo,
                registration.name,
                registration.fatherName,
                registration.school,
                registration.phone,
                registration.email,
              ];


              const matched =
                values.some(
                  (value) =>
                    String(
                      value || "",
                    )
                      .toLowerCase()
                      .includes(
                        query,
                      ),
                );


              if (!matched) {
                return false;
              }
            }


            /**
             * CATEGORY
             */

            if (
              categoryId &&
              registration.categoryId !==
                categoryId
            ) {
              return false;
            }


            /**
             * COMPETITION
             */

            if (
              competitionId &&
              !registration.competitionIds.includes(
                competitionId,
              )
            ) {
              return false;
            }


            /**
             * SOURCE
             */

            if (
              source &&
              registration.source !==
                source
            ) {
              return false;
            }


            /**
             * PAYMENT
             */

            if (
              payment &&
              registration.payment !==
                payment
            ) {
              return false;
            }


            /**
             * REGISTRATION STATUS
             */

            if (
              status &&
              !this.matchesStatus(
                registration,
                status,
              )
            ) {
              return false;
            }


            /**
             * DATE RANGE
             */

            const registrationDate =
              this.getRegistrationDate(
                registration,
              );


            if (
              from &&
              registrationDate <
                from
            ) {
              return false;
            }


            if (
              to &&
              registrationDate >
                to
            ) {
              return false;
            }


            return true;
          },
        )

        .slice()

        .reverse();
    },
  );


  /**
   * ======================================================
   * FILTER RESULT COUNT
   * ======================================================
   */

  filteredCount = computed(
    () =>
      this.rows().length,
  );


  totalCount = computed(
    () =>
      this.store
        .registrations()
        .length,
  );


  /**
   * ======================================================
   * CHECK WHETHER FILTER IS ACTIVE
   * ======================================================
   */

  hasFilters = computed(
    () =>
      !!(
        this.search() ||
        this.category() ||
        this.competition() ||
        this.source() ||
        this.paymentStatus() ||
        this.status() ||
        this.fromDate() ||
        this.toDate()
      ),
  );


  /**
   * ======================================================
   * CATEGORY FILTER CHANGE
   *
   * Automatically clears invalid competition.
   * ======================================================
   */

  setCategoryFilter(
    categoryId: string,
  ) {

    this.category.set(
      categoryId,
    );


    const competitionId =
      this.competition();


    if (!competitionId) {
      return;
    }


    const competition =
      this.store.competition(
        competitionId,
      );


    if (
      !competition ||
      (
        categoryId &&
        !competition.categoryIds.includes(
          categoryId,
        )
      )
    ) {

      this.competition.set(
        "",
      );
    }
  }


  /**
   * ======================================================
   * REGISTRATION DATE
   *
   * applicationDate is preferred.
   * submittedOn used as fallback.
   * ======================================================
   */

  getRegistrationDate(
    registration: Registration,
  ) {

    if (
      registration.applicationDate
    ) {

      return registration
        .applicationDate
        .slice(
          0,
          10,
        );
    }


    if (
      registration.submittedOn
    ) {

      return registration
        .submittedOn
        .slice(
          0,
          10,
        );
    }


    return "";
  }


  /**
   * ======================================================
   * FRIENDLY STATUS FILTER
   * ======================================================
   */

  matchesStatus(
    registration: Registration,
    status: string,
  ) {

    switch (status) {

      case "Confirmed":

        return (
          !registration.cancelled &&
          (
            registration.registrationStatus ===
              "Confirmed" ||
            registration.approval ===
              "Approved"
          )
        );


      case "Pending":

        return (
          !registration.cancelled &&
          (
            registration.registrationStatus ===
              "Payment Pending" ||
            registration.registrationStatus ===
              "Review Required" ||
            registration.approval ===
              "Pending"
          )
        );


      case "Correction requested":

        return (
          registration.approval ===
          "Correction requested"
        );


      case "Rejected":

        return (
          registration.registrationStatus ===
            "Rejected" ||
          registration.approval ===
            "Rejected"
        );


      case "Cancelled":

        return (
          registration.cancelled ||
          registration.registrationStatus ===
            "Cancelled"
        );


      default:

        return true;
    }
  }


  /**
   * ======================================================
   * RESET ALL FILTERS
   * ======================================================
   */

  resetFilters() {

    this.search.set("");

    this.category.set("");

    this.competition.set("");

    this.source.set("");

    this.paymentStatus.set("");

    this.status.set("");

    this.fromDate.set("");

    this.toDate.set("");
  }


  /**
   * ======================================================
   * TODAY FILTER
   * ======================================================
   */

  filterToday() {

    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1,
      ).padStart(
        2,
        "0",
      );

    const day =
      String(
        today.getDate(),
      ).padStart(
        2,
        "0",
      );


    const value =
      `${year}-${month}-${day}`;


    this.fromDate.set(
      value,
    );

    this.toDate.set(
      value,
    );
  }


  /**
   * ======================================================
   * OPEN REGISTRATION
   * ======================================================
   */

  open(
    registration: Registration,
  ) {

    this.selected.set(
      registration,
    );

    this.payment =
      registration.payment;

    this.approval =
      registration.approval;

    this.reviewNote =
      registration.reviewNote;

    this.error.set("");
  }


  /**
   * ======================================================
   * CLOSE REGISTRATION
   * ======================================================
   */

  close() {

    this.selected.set(
      null,
    );

    this.error.set("");
  }


  /**
   * ======================================================
   * SAVE MANUAL REVIEW
   * ======================================================
   */

  async saveReview() {

    const registration =
      this.selected();


    if (!registration) {
      return;
    }


    this.error.set("");


    try {

      let next = {
        ...registration,
        payment:
          this.payment,
      };


      await this.store
        .updateRegistration(
          next,
        );


      next =
        this.store
          .state()
          .registrations
          .find(
            (item) =>
              item.id ===
              registration.id,
          )!;


      await this.store
        .reviewRegistration(
          next,
          this.approval,
          this.reviewNote,
        );


      const updated =
        this.store
          .state()
          .registrations
          .find(
            (item) =>
              item.id ===
              registration.id,
          );


      if (updated) {

        this.open(
          updated,
        );
      }

    } catch (error) {

      this.error.set(
        error instanceof Error
          ? error.message
          : "Unable to save review.",
      );
    }
  }


  /**
   * ======================================================
   * EMAIL PASS
   * ======================================================
   */

  async emailPass() {

    const registration =
      this.selected();


    if (!registration) {
      return;
    }


    this.error.set("");


    try {

      await this.store
        .markEmailSent(
          registration,
        );


      const updated =
        this.store
          .state()
          .registrations
          .find(
            (item) =>
              item.id ===
              registration.id,
          );


      if (updated) {

        this.open(
          updated,
        );
      }

    } catch (error) {

      this.error.set(
        error instanceof Error
          ? error.message
          : "Unable to send pass email.",
      );
    }
  }


  /**
   * ======================================================
   * COMPETITION NAMES
   * ======================================================
   */

  competitionNames(
    registration: Registration,
  ) {

    return registration
      .competitionIds
      .map(
        (id) =>
          this.store.competition(
            id,
          )?.name ||
          id,
      )
      .join(
        " · ",
      );
  }


  /**
   * ======================================================
   * VIEW PASS
   * ======================================================
   */

  viewPass() {

    const registration =
      this.selected();


    if (!registration) {
      return;
    }


    this.store.activePass.set(
      registration,
    );


    void this.router.navigate(
      [
        "/pass",
      ],
    );
  }


  /**
   * ======================================================
   * SCHEDULE READY
   * ======================================================
   */

  scheduleReady(
    registration: Registration,
  ) {

    return registration
      .competitionIds
      .every(
        (id) => {

          const competition =
            this.store.competition(
              id,
            );


          const slot =
            competition
              ? this.store.slot(
                  competition.slotId,
                )
              : undefined;


          return !!(
            slot?.date &&
            slot.start &&
            slot.venue
          );
        },
      );
  }
}