import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  CurrencyPipe,
} from "@angular/common";
import {
  ActivatedRoute,
  Router,
} from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { EventStore } from "../../../core/services/event-store.service";

import {
  Category,
  Competition,
  Judge,
  Registration,
  Slot,
} from "../../../core/models/event.models";

import {
  categoryFor,
  indiaDate,
} from "../../../core/utils/event-rules";

import {
  imageFileToDataUrl,
} from "../../../core/utils/image-upload";

import {
  BrowserQRCodeReader,
} from "@zxing/browser";


@Component({
  selector: "app-manage",
  standalone: true,
imports: [
  FormsModule,
  CurrencyPipe,
 
],
  templateUrl:
    "./manage.component.html",
  styleUrl:
    "./manage.component.css",
})
export class ManageComponent {

  readonly Math = Math;

store =
  inject(EventStore);

route =
  inject(ActivatedRoute);

router =
  inject(Router);

  destroyRef =
    inject(DestroyRef);


  resource =
    signal("");

  error =
    signal("");


  editingCompetition =
    signal<Competition | null>(
      null,
    );
    editingCategory =
  signal<Category | null>(
    null,
  );

  editingSlot =
    signal<Slot | null>(
      null,
    );

  editingJudge =
    signal<Judge | null>(
      null,
    );


  selectedCheckin =
    signal<Registration | null>(
      null,
    );

  checkinCandidate =
    signal<Registration | null>(
      null,
    );


  cameraOpen =
    signal(false);

  cameraMessage =
    signal("");


  private qrReader:
    BrowserQRCodeReader | null =
    null;

  private qrControls:
    any =
    null;


 token = "";




  /**
   * ======================================================
   * PAPER / CASH REGISTRATION FORM
   * ======================================================
   */

  offline = {
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

    /**
     * Admin confirms that cash
     * was actually received.
     */
    cashPaid:
      true,

    /**
     * Actual amount received.
     */
    amountPaid:
      0,

    language:
      "en" as "ta" | "en",
  };


  constructor() {

    this.route.data
      .pipe(
        takeUntilDestroyed(),
      )
      .subscribe((d) => {

        this.resource.set(
          String(
            d["resource"] || "",
          ),
        );


        if (
          this.resource() !==
          "check-in"
        ) {
          this.stopCamera();
        }

      });


    this.destroyRef
      .onDestroy(
        () =>
          this.stopCamera(),
      );
  }

manageCashStudent(
  registration: Registration,
) {

  void this.router.navigate(
    [
      "/admin/registrations",
    ],
    {
      queryParams: {
        open:
          registration.id,
      },
    },
  );

}
  /**
   * ======================================================
   * PAPER REGISTRATION CATEGORY
   * ======================================================
   */

  offlineCategory() {

    return categoryFor(
      this.offline.dob,

      this.offline
        .applicationDate,

      this.store
        .state()
        .categories,
    );
  }

/**
 * ======================================================
 * OFFLINE PAGE TABS
 * ======================================================
 */

offlineView =
  signal<"form" | "students">(
    "form",
  );


cashStudentPage =
  signal(1);


cashApprovingId =
  signal("");


readonly cashStudentPageSize =
  10;


/**
 * Change Paper / Cash admin tab.
 */
setOfflineView(
  view: "form" | "students",
) {

  this.offlineView.set(
    view,
  );

  this.cashStudentPage.set(
    1,
  );

  this.error.set("");

}


/**
 * ======================================================
 * STUDENT PUBLIC CASH REGISTRATIONS
 * ======================================================
 *
 * Public cash-registration page stores:
 *
 * source        = Online
 * paymentMethod = Cash
 *
 * Admin-created Paper Entry uses:
 *
 * source        = Paper
 * paymentMethod = Cash
 *
 * So this safely separates them.
 */
studentCashRegistrations() {

  return this.store
    .registrations()
    .filter(
      (r) =>
        r.source === "Online" &&
        r.paymentMethod === "Cash",
    )
    .slice()
    .sort(
      (
        a,
        b,
      ) => {

        const aNumber =
          Number(
            a.applicationNo
              ?.match(/\d+$/)?.[0] ||
              0,
          );


        const bNumber =
          Number(
            b.applicationNo
              ?.match(/\d+$/)?.[0] ||
              0,
          );


        return (
          bNumber -
          aNumber
        );

      },
    );

}


/**
 * Number waiting for cash / approval.
 */
pendingStudentCashCount() {

  return this
    .studentCashRegistrations()
    .filter(
      (r) =>
        r.payment !== "Paid" ||
        r.approval !== "Approved",
    )
    .length;

}


/**
 * ======================================================
 * PAGINATION
 * ======================================================
 */

cashStudentTotalPages() {

  return Math.max(
    1,

    Math.ceil(
      this
        .studentCashRegistrations()
        .length /
        this.cashStudentPageSize,
    ),
  );

}


cashStudentRows() {

  const totalPages =
    this.cashStudentTotalPages();


  const page =
    Math.min(
      this.cashStudentPage(),
      totalPages,
    );


  const start =
    (page - 1) *
    this.cashStudentPageSize;


  return this
    .studentCashRegistrations()
    .slice(
      start,
      start +
        this.cashStudentPageSize,
    );

}


cashStudentPageNumbers() {

  const total =
    this.cashStudentTotalPages();


  const current =
    this.cashStudentPage();


  let start =
    Math.max(
      1,
      current - 2,
    );


  let end =
    Math.min(
      total,
      start + 4,
    );


  if (
    end - start < 4
  ) {

    start =
      Math.max(
        1,
        end - 4,
      );

  }


  return Array.from(
    {
      length:
        end - start + 1,
    },

    (
      _,
      index,
    ) =>
      start + index,
  );

}


setCashStudentPage(
  page: number,
) {

  const total =
    this.cashStudentTotalPages();


  const safePage =
    Math.max(
      1,
      Math.min(
        page,
        total,
      ),
    );


  this.cashStudentPage.set(
    safePage,
  );


  setTimeout(
    () => {

      document
        .getElementById(
          "student-cash-list",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

    },
    50,
  );

}


/**
 * Competition names for table.
 */
cashCompetitionNames(
  r: Registration,
) {

  const names =
    r.competitionIds
      .map(
        (id) =>
          this.store
            .competition(id)
            ?.name,
      )
      .filter(
        (
          name,
        ): name is string =>
          !!name,
      );


  return names.length
    ? names.join(", ")
    : "—";

}


/**
 * Already fully approved.
 */
isCashApproved(
  r: Registration,
) {

  return (
    r.payment === "Paid" &&
    r.approval === "Approved"
  );

}


/**
 * ======================================================
 * APPROVE STUDENT CASH REGISTRATION
 * ======================================================
 */
async approveStudentCash(
  r: Registration,
) {

  if (
    this.cashApprovingId()
  ) {
    return;
  }


  if (
    this.isCashApproved(r)
  ) {
    return;
  }


  const amount =
    Number(
      r.total || 0,
    );


  const confirmed =
    window.confirm(
      `Confirm cash payment for ${r.applicationNo}?\n\nStudent: ${r.name}\nAmount: ₹${amount}\n\nThis will mark the registration as Paid and Approved.`,
    );


  if (!confirmed) {
    return;
  }


  this.error.set("");

  this.cashApprovingId.set(
    r.id,
  );


  try {

    let current =
      r;


    /**
     * Step 1:
     * Mark payment as Paid.
     */
    if (
      current.payment !== "Paid"
    ) {

      await this.store
        .updateRegistration({
          ...current,

          payment:
            "Paid",
        });


      current =
        this.store
          .registrations()
          .find(
            (item) =>
              item.id === r.id,
          ) || {
            ...current,

            payment:
              "Paid",
          };

    }


    /**
     * Step 2:
     * Approve registration.
     *
     * Backend then makes:
     * registrationStatus = Confirmed
     * passStatus = Generated
     */
    if (
      current.approval !==
      "Approved"
    ) {

      await this.store
        .reviewRegistration(

          current,

          "Approved",

          "Cash payment received and verified by admin.",

        );

    }

  } catch (e) {

    this.error.set(
      e instanceof Error
        ? e.message
        : "Unable to approve cash registration.",
    );

  } finally {

    this.cashApprovingId.set(
      "",
    );

  }

}
  /**
   * ======================================================
   * ELIGIBLE COMPETITIONS
   * ======================================================
   */

  offlineEligible() {

    const c =
      this.offlineCategory();


    return c
      ? this.store.eligible(
          c.id,
        )
      : [];
  }


  /**
   * ======================================================
   * PAPER COMPETITION SELECTION
   * ======================================================
   *
   * Max competition count comes
   * from Event Settings.
   */

  toggleOffline(
    id: string,
  ) {

    this.offline
      .competitionIds =
      this.offline
        .competitionIds
        .includes(id)

        ? this.offline
            .competitionIds
            .filter(
              (v) =>
                v !== id,
            )

        : this.offline
              .competitionIds
              .length <
            this.store
              .settings()
              .maxEvents

          ? [
              ...this.offline
                .competitionIds,
              id,
            ]

          : this.offline
              .competitionIds;
  }


  /**
   * ======================================================
   * PAPER STUDENT PHOTO
   * ======================================================
   */

  async onOfflinePhoto(
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

      this.offline.photo =
        await imageFileToDataUrl(
          file,
          700,
        );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to process photo.",
      );

    } finally {

      input.value = "";

    }
  }


  /**
   * ======================================================
   * SAVE PAPER / CASH REGISTRATION
   * ======================================================
   */

  async saveOffline() {

    this.error.set("");


    try {

      const {
        applicationDate,

        competitionIds,

        cashPaid,

        amountPaid,

        language,

        ...student
      } = this.offline;


      /**
       * Convert amount safely.
       */

      const receivedAmount =
        Number(
          amountPaid || 0,
        );


      if (
        !Number.isFinite(
          receivedAmount,
        ) ||
        receivedAmount < 0
      ) {
        throw new Error(
          "Enter a valid amount paid.",
        );
      }


      /**
       * If Admin marks cash as received,
       * amount cannot be zero.
       */

      if (
        cashPaid &&
        receivedAmount <= 0
      ) {
        throw new Error(
          "Enter the cash amount received before confirming payment.",
        );
      }


      /**
       * Add Paper registration.
       *
       * Expected flow:
       *
       * cashPaid = true
       * =>
       * Paid
       * Approved
       * Confirmed
       */

      await this.store
        .addPaperRegistration(
          student,

          competitionIds,

          applicationDate,

          cashPaid,

          language,

          receivedAmount,
        );


      /**
       * Reset Paper Entry form.
       */

      this.offline = {
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
          [],

        cashPaid:
          true,

        amountPaid:
          0,

        language:
          "en",
      };

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save paper registration.",
      );

    }
  }
newCompetition() {

  this.error.set("");

  this.editingCompetition.set({
    id:
      this.store.demo
        ? crypto.randomUUID()
        : "new",

    name: "",

    tamil: "",

    kind: "Art",

    categoryIds: [],

    fee: 0,

    slotId: "",

    capacity: 100,

    status: "Open",

    instructions: "",

    instructionsTa: "",

    language: "Tamil / English",

    image: "",
  });
}


competitionCategoryNames(
  c: Competition,
) {

  const names =
    c.categoryIds
      .map(
        (id) =>
          this.store
            .category(id)
            ?.name,
      )
      .filter(
        (name): name is string =>
          !!name,
      );

  return names.length
    ? names.join(", ")
    : "No age category";
}


async deleteCompetition(
  c: Competition,
) {

  const ok =
    window.confirm(
      `Delete "${c.name}"?\n\nThis cannot be undone.`,
    );

  if (!ok) {
    return;
  }


  this.error.set("");


  try {

    await this.store
      .deleteCompetition(c);


    if (
      this.editingCompetition()
        ?.id === c.id
    ) {

      this.editingCompetition
        .set(null);

    }

  } catch (e) {

    this.error.set(
      e instanceof Error
        ? e.message
        : "Unable to delete competition.",
    );

  }
}

  /**
   * ======================================================
   * COMPETITION MANAGEMENT
   * ======================================================
   */

  editCompetition(
    c: Competition,
  ) {

    this.editingCompetition
      .set({
        ...c,

        categoryIds: [
          ...c.categoryIds,
        ],
      });
  }


  async onCompetitionImage(
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

      const data =
        await imageFileToDataUrl(
          file,
        );


      const c =
        this.editingCompetition();


      if (c) {

        this.editingCompetition
          .set({
            ...c,

            image:
              data,
          });
      }

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to process image.",
      );

    } finally {

      input.value =
        "";

    }
  }


  toggleCat(
    id: string,
  ) {

    const c =
      this.editingCompetition();


    if (!c) {
      return;
    }


    const ids =
      c.categoryIds
        .includes(id)

        ? c.categoryIds
            .filter(
              (v) =>
                v !== id,
            )

        : [
            ...c.categoryIds,
            id,
          ];


    this.editingCompetition
      .set({
        ...c,

        categoryIds:
          ids,
      });
  }


  async saveCompetition() {

    const c =
      this.editingCompetition();


    if (!c) {
      return;
    }


    if (
      !c.name.trim() ||
      !c.tamil.trim() ||
      !c.categoryIds.length
    ) {

      this.error.set(
        "Competition name and at least one age category are required.",
      );

      return;
    }


    this.error.set("");


    try {

      await this.store
        .saveCompetition(
          c,
        );


      this.editingCompetition
        .set(null);

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save competition.",
      );

    }
  }


  /**
   * ======================================================
   * SLOT / VENUE
   * ======================================================
   */

  newSlot() {

    this.editingSlot.set({
      id:
        this.store.demo
          ? crypto.randomUUID()
          : "new",

      name:
        "",

      date:
        this.store
          .settings()
          .date,

      start:
        "",

      end:
        "",

      venue:
        this.store
          .settings()
          .venue,
    });
  }


  editSlot(
    s: Slot,
  ) {

    this.editingSlot
      .set({
        ...s,
      });
  }


  async saveSlot() {

    const s =
      this.editingSlot();


    if (!s) {
      return;
    }


    if (
      !s.name.trim() ||
      !s.venue.trim() ||
      !s.date ||
      !s.start ||
      !s.end ||
      s.start >= s.end
    ) {

      this.error.set(
        "Enter a valid slot name, date, time and venue.",
      );

      return;
    }


    this.error.set("");


    try {

      await this.store
        .saveSlot(
          s,
        );


      this.editingSlot
        .set(null);

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save slot.",
      );

    }
  }


  /**
   * ======================================================
   * JUDGE
   * ======================================================
   */

  newJudge() {

    this.editingJudge
      .set({

        id:
          this.store.demo
            ? crypto.randomUUID()
            : "new",

        name:
          "",

        email:
          "",

        phone:
          "",

        competitionIds:
          [],

        active:
          true,

        temporaryPassword:
          "Judge@123",
      });
  }


  editJudge(
    j: Judge,
  ) {

    this.editingJudge
      .set({
        ...j,

        competitionIds: [
          ...j.competitionIds,
        ],
      });
  }


  toggleJudgeCompetition(
    id: string,
  ) {

    const j =
      this.editingJudge();


    if (!j) {
      return;
    }


    const ids =
      j.competitionIds
        .includes(id)

        ? j.competitionIds
            .filter(
              (v) =>
                v !== id,
            )

        : [
            ...j.competitionIds,
            id,
          ];


    this.editingJudge
      .set({
        ...j,

        competitionIds:
          ids,
      });
  }


  async saveJudge() {

    const j =
      this.editingJudge();


    if (!j) {
      return;
    }


    if (
      !j.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          j.email,
        ) ||
      (
        j.id === "new" &&
        !j.temporaryPassword
      )
    ) {

      this.error.set(
        "Enter judge name, valid email and temporary password for a new judge.",
      );

      return;
    }


    this.error.set("");


    try {

      await this.store
        .saveJudge(
          j,
        );


      this.editingJudge
        .set(null);

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save judge.",
      );

    }
  }
/**
 * ======================================================
 * AGE CATEGORY MANAGEMENT
 * ======================================================
 */

newCategory() {

  this.error.set("");

  this.editingCategory.set({
    id:
      this.store.demo
        ? crypto.randomUUID()
        : "new",

    name: "",

    nameTa: "",

    minMonths: 0,

    maxMonths: 1,
  });
}


editCategory(
  category: Category,
) {

  this.error.set("");

  this.editingCategory.set({
    ...category,
  });
}


async saveCategory() {

  const category =
    this.editingCategory();


  if (!category) {
    return;
  }


  const name =
    category.name.trim();

  const nameTa =
    category.nameTa.trim();

  const minMonths =
    Number(
      category.minMonths,
    );

  const maxMonths =
    Number(
      category.maxMonths,
    );


  if (
    !name ||
    !nameTa
  ) {

    this.error.set(
      "Enter the category English and Tamil names.",
    );

    return;
  }


  if (
    !Number.isFinite(minMonths) ||
    !Number.isFinite(maxMonths) ||
    minMonths < 0 ||
    maxMonths <= minMonths
  ) {

    this.error.set(
      "Enter a valid minimum and maximum age range.",
    );

    return;
  }


  this.error.set("");


  try {

    await this.store
      .saveCategory({
        ...category,

        name,

        nameTa,

        minMonths,

        maxMonths,
      });


    this.editingCategory
      .set(null);

  } catch (e) {

    this.error.set(
      e instanceof Error
        ? e.message
        : "Unable to save age category.",
    );

  }
}


async deleteCategory(
  category: Category,
) {

  const ok =
    window.confirm(
      `Delete "${category.name}"?\n\nThis age category will be permanently removed.`,
    );


  if (!ok) {
    return;
  }


  this.error.set("");


  try {

    await this.store
      .deleteCategory(
        category,
      );


    if (
      this.editingCategory()
        ?.id === category.id
    ) {

      this.editingCategory
        .set(null);

    }

  } catch (e) {

    this.error.set(
      e instanceof Error
        ? e.message
        : "Unable to delete age category.",
    );

  }
}


categoryRegistrationCount(
  categoryId: string,
) {

  return this.store
    .registrations()
    .filter(
      (r) =>
        r.categoryId ===
          categoryId,
    )
    .length;
}

  /**
   * ======================================================
   * CATEGORY COMPETITION COUNT
   * ======================================================
   */

  competitionCountForCategory(
    id: string,
  ) {

    return this.store
      .state()
      .competitions
      .filter(
        (c) =>
          c.categoryIds
            .includes(id),
      )
      .length;
  }


  /**
   * ======================================================
   * RECENT CHECK-INS
   * ======================================================
   */

  recentCheckins() {

    return this.store
      .registrations()
      .filter(
        (r) =>
          !!r.checkedInAt,
      )
      .slice()
      .sort(
        (
          a,
          b,
        ) =>
          (
            b.checkedInAt ||
            ""
          ).localeCompare(
            a.checkedInAt ||
            "",
          ),
      )
      .slice(
        0,
        12,
      );
  }


  openCheckin(
    r: Registration,
  ) {

    this.selectedCheckin
      .set(
        r,
      );
  }


  /**
   * ======================================================
   * LOOKUP PARTICIPANT
   * ======================================================
   */

  async lookupCheckin() {

    this.error.set("");


    try {

      const r =
        await this.store
          .lookupParticipant(
            this.token,
          );


      if (
        r.total > 0 &&
        r.payment !==
          "Paid"
      ) {

        this.checkinCandidate
          .set(null);


        this.error.set(
          "Payment is not confirmed. Check-in is blocked.",
        );

        return;
      }


      if (
        r.checkedInAt
      ) {

        this.selectedCheckin
          .set(
            r,
          );


        this.checkinCandidate
          .set(
            null,
          );


        this.error.set(
          `Already checked in at ${this.store.formatIndiaDateTime(
            r.checkedInAt,
          )}.`,
        );


        return;
      }


      this.checkinCandidate
        .set(
          r,
        );

    } catch (e) {

      this.checkinCandidate
        .set(
          null,
        );


      this.error.set(
        e instanceof Error
          ? e.message
          : "Participant not found.",
      );

    }
  }


  /**
   * ======================================================
   * CONFIRM CHECK-IN
   * ======================================================
   */

  async confirmCheckIn() {

    const r =
      this.checkinCandidate();


    if (!r) {
      return;
    }


    this.error.set("");


    try {

      const checked =
        await this.store
          .checkIn(
            r.applicationNo,
          );


      this.checkinCandidate
        .set(
          null,
        );


      this.selectedCheckin
        .set(
          checked,
        );


      this.token =
        "";

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Check-in failed.",
      );

    }
  }


  /**
   * ======================================================
   * QR CAMERA
   * ======================================================
   */

  async startCamera() {

    this.error.set("");

    this.cameraMessage
      .set(
        "",
      );


    this.stopCamera();


    if (
      !navigator
        .mediaDevices
        ?.getUserMedia
    ) {

      this.error.set(
        "Camera access is not available in this browser. Use registration number or a USB QR scanner.",
      );

      return;
    }


    this.cameraOpen
      .set(
        true,
      );




    setTimeout(
      async () => {

        const video =
          document
            .getElementById(
              "checkin-camera",
            ) as
              HTMLVideoElement |
              null;


        if (!video) {
          return;
        }


        try {

          this.qrReader =
            new BrowserQRCodeReader();


          this.qrControls =
            await this.qrReader
              .decodeFromVideoDevice(

                undefined,

                video,

                (
                  result,
                  _error,
                  controls,
                ) => {

                  if (!result) {
                    return;
                  }


                  const raw =
                    result.getText();


                  if (!raw) {
                    return;
                  }


                  this.token =
                    raw;


                  this.cameraMessage
                    .set(
                      "QR detected. Opening participant…",
                    );


                  controls.stop();


                  this.qrControls =
                    null;


                  this.cameraOpen
                    .set(
                      false,
                    );


                  void this
                    .lookupCheckin();

                },
              );

        } catch {

          this.error.set(
            "Camera permission was not granted or the camera could not start. Enter the registration number manually.",
          );


          this.stopCamera();

        }

      },
      0,
    );
  }


  /**
   * ======================================================
   * STOP CAMERA
   * ======================================================
   */

  stopCamera() {

    try {

      this.qrControls
        ?.stop?.();

    } catch {}


    this.qrControls =
      null;


    this.qrReader =
      null;


    this.cameraOpen
      .set(
        false,
      );


    const video =
      document
        .getElementById(
          "checkin-camera",
        ) as
          HTMLVideoElement |
          null;


    const stream =
      video?.srcObject as
        MediaStream |
        null;


    stream
      ?.getTracks()
      .forEach(
        (t) =>
          t.stop(),
      );


    if (video) {

      video.srcObject =
        null;

    }
  }
}