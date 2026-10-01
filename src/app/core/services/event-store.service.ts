import { Injectable, computed, effect, inject, signal } from "@angular/core";

import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { firstValueFrom } from "rxjs";

import { environment } from "../../../environments/environment";

import { createDemoState } from "../data/demo-data";

import {
  Category,
  Competition,
  CompetitionAttendance,
  EventState,

  Judge,

  Registration,

  Score,

  Settings,

  Slot,

  Student,

} from "../models/event.models";

import {

  ageInMonths,

  categoryFor,

  indiaDate,

  validateSelection,

  validateStudent,

} from "../utils/event-rules";



const STORAGE_KEY = "sbk-chithiram-frontend-v5";

function backendOrigin() {
  try {
    return new URL(environment.apiUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function normalizePhoto(photo: string | null | undefined) {
  const value = String(photo || "").trim();
  if (!value) return "";

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    /^https?:\/\//i.test(value)
  ) {
    return value;
  }

  if (value.startsWith("/media/")) {
    return `${backendOrigin()}${value}`;
  }

  return value;
}

function normalizeRegistration(r: Registration): Registration {
  return {
    ...r,
    photo: normalizePhoto(r.photo),
    passEmailSentAt: r.passEmailSentAt ?? null,
    competitionAttendance:
      r.competitionAttendance ||
      (Object.fromEntries(
        (r.competitionIds || []).map((id) => [id, "Not marked"]),
      ) as Record<string, CompetitionAttendance>),
  };
}

function normalizeState(state: EventState): EventState {
  return {
    ...state,
    registrations: (state.registrations || []).map(normalizeRegistration),
  };
}

function readState(): EventState {

  if (environment.mode !== "demo") return createDemoState();

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) return normalizeState(JSON.parse(raw) as EventState);

  } catch {}

  return createDemoState();

}

function apiMessage(e: unknown, fallback = "Request failed.") {

  if (e instanceof HttpErrorResponse)

    return e.error?.error?.message || e.message || fallback;

  return e instanceof Error ? e.message : fallback;

}



@Injectable({ providedIn: "root" })

export class EventStore {

  private http = inject(HttpClient);

  readonly state = signal<EventState>(readState());

  readonly activePass = signal<Registration | null>(null);

  readonly notice = signal("");

  readonly error = signal("");

  readonly loading = signal(false);

  readonly demo = environment.mode === "demo";

  readonly settings = computed(() => this.state().settings);

  readonly registrations = computed(() =>

    this.state().registrations.filter((r) => !r.cancelled),

  );

  constructor() {

    effect(() => {

      if (!this.demo) return;

      try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));

      } catch {}

    });

  }

  private url(path: string) {
    return `${environment.apiUrl}${path}`;
  }

  private async ensureRegistrationReferences(registration: Registration) {
    if (this.demo) return;

    const categoryMissing = !this.category(String(registration.categoryId));
    const competitionMissing = (registration.competitionIds || []).some(
      (id) => !this.competition(String(id)),
    );

    if (!categoryMissing && !competitionMissing) return;

    const publicState = await firstValueFrom(
      this.http.get<EventState>(this.url("/event")),
    );

    this.state.set(normalizeState(publicState));
  }

  async load() {

    if (this.demo) return;

    try {

      const raw = sessionStorage.getItem("sbk-chithiram-session-v2");

      if (raw && JSON.parse(raw)?.role) return;

    } catch {}

    this.loading.set(true);

    try {

      this.state.set(

        normalizeState(

          await firstValueFrom(this.http.get<EventState>(this.url("/event"))),

        ),

      );

    } finally {

      this.loading.set(false);

    }

  }

  async loadAdmin() {

    if (this.demo) return;

    this.state.set(

      normalizeState(

        await firstValueFrom(

          this.http.get<EventState>(this.url("/admin/state")),

        ),

      ),

    );

  }

  async loadJudge() {

    if (this.demo) return;

    this.state.set(

      normalizeState(

        await firstValueFrom(

          this.http.get<EventState>(this.url("/judge/state")),

        ),

      ),

    );

  }

  notify(message: string) {

    this.notice.set(message);

    window.setTimeout(() => {

      if (this.notice() === message) this.notice.set("");

    }, 2600);

  }

  category(id: string) {

    return this.state().categories.find((c) => String(c.id) === String(id));

  }

  competition(id: string) {

    return this.state().competitions.find((c) => String(c.id) === String(id));

  }

  slot(id: string) {

    return this.state().slots.find((s) => String(s.id) === String(id));

  }

  judge(id: string) {

    return this.state().judges.find((j) => String(j.id) === String(id));

  }

  categoryLabel(id: string) {

    const c = this.category(id);

    if (!c) return "";

    const startY = Math.floor(c.minMonths / 12),

      startM = c.minMonths % 12,

      endY = Math.floor(c.maxMonths / 12),

      start = startM ? `${startY}y ${startM}m` : `${startY}`;

    return `${start} to below ${endY} years`;

  }

  ageLabel(dob: string, on: string) {

    const m = ageInMonths(dob, on);

    return m < 0 ? "" : `${Math.floor(m / 12)} years ${m % 12} months`;

  }

  formatIndiaDateTime(iso: string | null | undefined) {

    if (!iso) return "—";

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {

      timeZone: "Asia/Kolkata",

      day: "2-digit",

      month: "short",

      year: "numeric",

      hour: "numeric",

      minute: "2-digit",

      second: "2-digit",

      hour12: true,

    }).format(d);

  }

  remaining(c: Competition) {

    const registered = (c as Competition & { registeredCount?: number })

      .registeredCount;

    if (!this.demo && typeof registered === "number")

      return Math.max(0, c.capacity - registered);

    const used = this.registrations().filter((r) =>

      r.competitionIds.includes(c.id),

    ).length;

    return Math.max(0, c.capacity - used);

  }

  eligible(categoryId: string) {

    return this.state().competitions.filter(

      (c) => c.status === "Open" && c.categoryIds.includes(categoryId),

    );

  }

  nextApplicationNo() {

    const prefix = this.settings().prefix.toUpperCase(),

      nums = this.state()

        .registrations.map((r) => r.applicationNo.toUpperCase())

        .filter((n) => n.startsWith(prefix))

        .map((n) => Number(n.slice(prefix.length)))

        .filter(Number.isFinite);

    return (

      prefix +

      String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0")

    );

  }

  private assertSelection(ids: string[], categoryId: string) {

    const err = validateSelection(

      ids,

      categoryId,

      this.state().competitions,

      this.state().slots,

      this.registrations(),

      this.settings().maxEvents,

    );

    if (err) throw Error(err);

  }

  private makeRegistration(

    student: Student,

    ids: string[],

    language: "ta" | "en",

    applicationDate: string,

    source: "Online" | "Paper",

    paymentMethod: "Online" | "Cash",

    payment: Registration["payment"],

    approval: Registration["approval"],

  ): Registration {

    const studentError = validateStudent(student);

    if (studentError) throw Error(studentError);

    const cat = categoryFor(

      student.dob,

      applicationDate,

      this.state().categories,

    );

    if (!cat)

      throw Error("The date of birth is outside the eligible age groups.");

    this.assertSelection(ids, cat.id);

    const duplicate = this.registrations().some(

      (r) =>

        r.name.trim().toLowerCase() === student.name.trim().toLowerCase() &&

        r.dob === student.dob &&

        r.phone === student.phone,

    );

    if (duplicate)

      throw Error("A registration already exists for this student.");

    const fees = ids.map((id) => ({

      competitionId: id,

      fee: this.competition(id)?.fee ?? 0,

    }));

    return {

      ...student,

      name: student.name.trim(),

      fatherName: student.fatherName.trim(),

      school: student.school.trim(),

      photo: student.photo || "",

      id: crypto.randomUUID(),

      applicationNo: this.nextApplicationNo(),

      categoryId: cat.id,

      applicationDate,

      submittedOn: new Date().toISOString(),

      competitionIds: [...ids],

      feeSnapshot: fees,

      total: fees.reduce((s, f) => s + f.fee, 0),

      payment,

      paymentMethod,

      checkedInAt: null,

      qrToken: crypto.randomUUID(),

      language,

      source,

      cancelled: false,

      approval,

      reviewNote: "",

      emailStatus: approval === "Approved" ? "Ready" : "Pending",

      approvedAt: approval === "Approved" ? new Date().toISOString() : null,

      passEmailSentAt: null,

      competitionAttendance: Object.fromEntries(

        ids.map((id) => [id, "Not marked"]),

      ) as Record<string, CompetitionAttendance>,

    };

  }

  async registerOnline(

    student: Student,

    ids: string[],

    language: "ta" | "en",

    applicationDate = indiaDate(),

  ) {

    if (!this.demo) {
      const response = await firstValueFrom(
        this.http.post<Registration>(this.url("/registrations"), {
          student,
          competitionIds: ids,
          language,
          applicationDate,
        }),
      );

      const r = normalizeRegistration(response);
      await this.ensureRegistrationReferences(r);
      this.activePass.set(r);
      return r;
    }

    if (!this.settings().registrationOpen)

      throw Error("Online registration is currently closed.");

    if (

      this.settings().registrationDeadline &&

      applicationDate > this.settings().registrationDeadline

    )

      throw Error("The registration deadline has passed.");

    const r = this.makeRegistration(

      student,

      ids,

      language,

      applicationDate,

      "Online",

      "Online",

      "Pending",

      "Pending",

    );

    this.state.update((s) => ({

      ...s,

      registrations: [...s.registrations, r],

    }));

    this.activePass.set(r);

    return r;

  }
async registerCash(
  student: Student,
  ids: string[],
  language: "ta" | "en",
  applicationDate = indiaDate(),
) {
  if (!this.demo) {
    const response = await firstValueFrom(
      this.http.post<Registration>(
        this.url("/registrations/cash"),
        {
          student,
          competitionIds: ids,
          language,
          applicationDate,
        },
      ),
    );

    const r =
      normalizeRegistration(response);

    await this.ensureRegistrationReferences(
      r,
    );

    this.activePass.set(r);

    this.notify(
      `Cash registration submitted as ${r.applicationNo}.`,
    );

    return r;
  }


  // DEMO MODE
  if (!this.settings().registrationOpen) {
    throw Error(
      "Registration is currently closed.",
    );
  }


  const r = this.makeRegistration(
    student,
    ids,
    language,
    applicationDate,
    "Online",
    "Cash",
    "Pending",
    "Pending",
  );


  const pending: Registration = {
    ...r,

    amountPaid: 0,

    registrationStatus:
      "Payment Pending",

    paymentConfirmedAt: null,

    passStatus:
      "Pending",

    passGeneratedAt: null,
  };


  this.state.update((s) => ({
    ...s,

    registrations: [
      ...s.registrations,
      pending,
    ],
  }));


  this.activePass.set(
    pending,
  );


  this.notify(
    `Cash registration submitted as ${pending.applicationNo}.`,
  );


  return pending;
}
  async completeOnlinePayment(id: string) {
    if (!this.demo) {
      const checkout = await firstValueFrom(
        this.http.post<{
          url: string | null;
          free?: boolean;
          alreadyPaid?: boolean;
          dummy?: boolean;
          provider?: string;
          paymentRecordId?: string;
          registration?: Registration;
        }>(this.url(`/registrations/${id}/checkout`), {}),
      );

      if (checkout.url) {
        window.location.assign(checkout.url);
        return this.activePass()!;
      }

      if (checkout.dummy) {
        const response = await firstValueFrom(
          this.http.post<{ registration: Registration }>(
            this.url(`/registrations/${id}/dummy-payment`),
            { result: "success" },
          ),
        );

        const paid = normalizeRegistration(response.registration);
        await this.ensureRegistrationReferences(paid);
        this.activePass.set(paid);
        this.notify("Dummy payment confirmed successfully.");
        return paid;
      }

      if (checkout.registration) {
        const r = normalizeRegistration(checkout.registration);
        await this.ensureRegistrationReferences(r);
        this.activePass.set(r);
        return r;
      }

      const current = this.activePass();
      if (current) return current;
      throw Error("Registration not found.");
    }

    const record = this.state().registrations.find((r) => r.id === id);
    if (!record) throw Error("Registration not found.");

    const next = {
      ...record,
      payment: "Paid" as const,
      approval: "Approved" as const,
      approvedAt: new Date().toISOString(),
      emailStatus: "Ready" as const,
    };

    this.replaceRegistration(next);
    this.activePass.set(next);
    this.notify("Payment confirmed.");
    return next;
  }

  async completeDummyPayment(
    id: string,
    result: "success" | "pending" | "failed",
  ) {
    if (this.demo) {
      const record = this.state().registrations.find((r) => r.id === id);
      if (!record) throw Error("Registration not found.");

      const next = {
        ...record,
        payment:
          result === "success"
            ? ("Paid" as const)
            : result === "failed"
              ? ("Failed" as const)
              : ("Pending" as const),
      };

      this.replaceRegistration(next);
      this.activePass.set(next);
      return next;
    }

    const response = await firstValueFrom(
      this.http.post<{ registration: Registration }>(
        this.url(`/registrations/${id}/dummy-payment`),
        { result },
      ),
    );

    const registration = normalizeRegistration(response.registration);
    await this.ensureRegistrationReferences(registration);
    this.activePass.set(registration);
    return registration;
  }

  async restoreParticipant() {
    if (this.demo) return this.activePass();

    try {
      const response = await firstValueFrom(
        this.http.get<Registration>(this.url("/registrations/me")),
      );

      const r = normalizeRegistration(response);
      await this.ensureRegistrationReferences(r);
      this.activePass.set(r);
      return r;
    } catch {
      return null;
    }
  }

async addPaperRegistration(
  student: Student,
  ids: string[],
  applicationDate: string,
  paymentPaid: boolean,
  language: "ta" | "en" = "en",
  amountPaid: number = 0,
) {
  const receivedAmount =
    Number(amountPaid || 0);

  if (
    !Number.isFinite(receivedAmount) ||
    receivedAmount < 0
  ) {
    throw Error(
      "Enter a valid amount paid.",
    );
  }

  if (
    paymentPaid &&
    receivedAmount <= 0
  ) {
    throw Error(
      "Enter the cash amount received before confirming payment.",
    );
  }


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {
    const r =
      await firstValueFrom(
        this.http.post<Registration>(
          this.url(
            "/admin/registrations/offline",
          ),
          {
            student,

            competitionIds:
              ids,

            applicationDate,

            paymentPaid,

            amountPaid:
              receivedAmount,

            language,
          },
        ),
      );

    await this.loadAdmin();

    this.notify(
      `Paper application added as ${r.applicationNo}.`,
    );

    return r;
  }


  /* =========================================
     DEMO MODE
  ========================================= */

  const base =
    this.makeRegistration(
      student,
      ids,
      language,
      applicationDate,
      "Paper",
      "Cash",
      paymentPaid
        ? "Paid"
        : "Pending",
      paymentPaid
        ? "Approved"
        : "Pending",
    );


  const r: Registration = {
    ...base,

    amountPaid:
      receivedAmount,

    registrationStatus:
      paymentPaid
        ? "Confirmed"
        : "Review Required",

    paymentConfirmedAt:
      paymentPaid
        ? new Date().toISOString()
        : null,

    passStatus:
      paymentPaid
        ? "Generated"
        : "Pending",

    passGeneratedAt:
      paymentPaid
        ? new Date().toISOString()
        : null,
  };


  this.state.update(
    (s) => ({
      ...s,

      registrations: [
        ...s.registrations,
        r,
      ],
    }),
  );


  this.notify(
    `Paper application added as ${r.applicationNo}.`,
  );


  return r;
}

  replaceRegistration(record: Registration) {

    this.state.update((s) => ({

      ...s,

      registrations: s.registrations.map((r) =>

        r.id === record.id ? record : r,

      ),

    }));

    if (this.activePass()?.id === record.id) this.activePass.set(record);

  }

  async updateRegistration(record: Registration) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.put(this.url(`/admin/registrations/${record.id}`), {

          payment: record.payment,

          cancelled: record.cancelled,

        }),

      );

      await this.loadAdmin();

      return;

    }

    this.replaceRegistration(record);

    this.notify("Registration updated.");

  }

  async reviewRegistration(

    record: Registration,

    approval: Registration["approval"],

    reviewNote = "",

  ) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.post(this.url(`/admin/registrations/${record.id}/review`), {

          approval,

          reviewNote,

        }),

      );

      await this.loadAdmin();

      this.notify(

        approval === "Approved"

          ? "Approved. Participant pass is ready for email."

          : "Review status updated.",

      );

      return;

    }

    if (

      approval === "Approved" &&

      record.total > 0 &&

      record.payment !== "Paid"

    )

      throw Error("Confirm payment before approval.");

    if (approval === "Correction requested" && !reviewNote.trim())

      throw Error("Enter the correction required.");

    this.replaceRegistration({

      ...record,

      approval,

      reviewNote,

      approvedAt: approval === "Approved" ? new Date().toISOString() : null,

      emailStatus:

        approval === "Approved"

          ? record.emailStatus === "Sent"

            ? "Sent"

            : "Ready"

          : "Pending",

    });

  }

  async markEmailSent(record: Registration) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.post(

          this.url(`/admin/registrations/${record.id}/send-pass`),

          {},

        ),

      );

      await this.loadAdmin();

      this.notify("Participant pass email sent.");

      return;

    }

    if (record.approval !== "Approved")

      throw Error("Approve the registration before sending the event pass.");

this.replaceRegistration({

      ...record,

      emailStatus: "Sent",

      passEmailSentAt: new Date().toISOString(),

    });

    this.notify("Pass email marked as sent in frontend preview.");

  }

  async startLookup(applicationNo: string, phone: string) {
    const r = await this.lookup(applicationNo, phone);

    return {
      challengeId: "",
      emailHint: r.email || "",
      devCode: "",
    };
  }

  async verifyLookup(_challengeId: string, _code: string) {
    const r = this.activePass();
    if (!r) throw Error("No registration is currently open.");
    return r;
  }

  async lookup(applicationNo: string, phone: string) {
    const cleanApplicationNo = applicationNo.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanApplicationNo) throw Error("Enter the application number.");
    if (!/^[6-9]\d{9}$/.test(cleanPhone))
      throw Error("Enter a valid registered 10-digit mobile number.");

    if (!this.demo) {
      try {
        const response = await firstValueFrom(
          this.http.post<Registration>(this.url("/registrations/lookup"), {
            applicationNo: cleanApplicationNo,
            phone: cleanPhone,
          }),
        );

        const r = normalizeRegistration(response);
        await this.ensureRegistrationReferences(r);
        this.activePass.set(r);
        return r;
      } catch (e) {
        throw Error(apiMessage(e, "Unable to find registration."));
      }
    }

    const r = this.registrations().find(
      (v) =>
        v.applicationNo.toUpperCase() === cleanApplicationNo &&
        v.phone.replace(/\D/g, "") === cleanPhone,
    );

    if (!r) throw Error("No matching registration found.");
    this.activePass.set(r);
    return r;
  }

  findParticipant(value: string) {

    const token = value.trim();

    return this.registrations().find(

      (v) =>

        v.applicationNo.toLowerCase() === token.toLowerCase() ||

        v.qrToken === token,

    );

  }

  async lookupParticipant(value: string) {

    if (this.demo) {

      const r = this.findParticipant(value);

      if (!r) throw Error("Participant not found.");

      return r;

    }

    return firstValueFrom(

      this.http.post<Registration>(this.url("/admin/check-in/lookup"), {

        token: value,

      }),

    );

  }

  async checkIn(value: string) {

    if (!this.demo) {

      try {

        const r = await firstValueFrom(

          this.http.post<Registration>(this.url("/admin/check-in"), {

            token: value,

          }),

        );

        await this.loadAdmin();

        this.notify(`${r.applicationNo} checked in.`);

        return r;

      } catch (e) {

        throw Error(apiMessage(e, "Check-in failed."));

      }

    }

    const r = this.findParticipant(value);

    if (!r) throw Error("Participant not found.");

 
    if (r.total > 0 && r.payment !== "Paid")

      throw Error("Payment is not confirmed. Check-in is blocked.");

    if (r.checkedInAt)

      throw Error(

        `Already checked in at ${this.formatIndiaDateTime(r.checkedInAt)}.`,

      );

    const next = { ...r, checkedInAt: new Date().toISOString() };

    this.replaceRegistration(next);

    return next;

  }
async saveCategory(record: Category) {

  if (
    !record.name.trim() ||
    !record.nameTa.trim()
  ) {
    throw Error(
      "Category English and Tamil names are required.",
    );
  }


  const minMonths =
    Number(record.minMonths);

  const maxMonths =
    Number(record.maxMonths);


  if (
    !Number.isFinite(minMonths) ||
    !Number.isFinite(maxMonths) ||
    minMonths < 0 ||
    maxMonths <= minMonths
  ) {
    throw Error(
      "Enter a valid minimum and maximum age.",
    );
  }


  const data: Category = {
    ...record,
    name:
      record.name.trim(),
    nameTa:
      record.nameTa.trim(),
    minMonths,
    maxMonths,
  };


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {

    try {

      await firstValueFrom(
        this.http.put(
          this.url(
            `/admin/categories/${data.id}`,
          ),
          data,
        ),
      );


      await this.loadAdmin();


      this.notify(
        data.id === "new"
          ? "Age category created."
          : "Age category updated.",
      );


      return;

    } catch (e) {

      throw Error(
        apiMessage(
          e,
          "Unable to save age category.",
        ),
      );

    }

  }


  /* =========================================
     DEMO MODE
  ========================================= */

  const saved: Category = {
    ...data,

    id:
      data.id === "new"
        ? crypto.randomUUID()
        : data.id,
  };


  this.state.update(
    (s) => ({

      ...s,

      categories:
        s.categories.some(
          (c) =>
            c.id === saved.id,
        )

          ? s.categories.map(
              (c) =>
                c.id === saved.id
                  ? saved
                  : c,
            )

          : [
              ...s.categories,
              saved,
            ],

    }),
  );


  this.notify(
    data.id === "new"
      ? "Age category created."
      : "Age category updated.",
  );

}


async deleteCategory(
  record: Category,
) {

  if (!record?.id) {
    throw Error(
      "Category id is missing.",
    );
  }


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {

    try {

      await firstValueFrom(
        this.http.delete(
          this.url(
            `/admin/categories/${record.id}`,
          ),
        ),
      );


      await this.loadAdmin();


      this.notify(
        "Age category deleted.",
      );


      return;

    } catch (e) {

      throw Error(
        apiMessage(
          e,
          "Unable to delete age category.",
        ),
      );

    }

  }


  /* =========================================
     DEMO MODE SAFETY
  ========================================= */

  const usedByCompetition =
    this.state()
      .competitions
      .some(
        (c) =>
          c.categoryIds.includes(
            record.id,
          ),
      );


  const usedByRegistration =
    this.state()
      .registrations
      .some(
        (r) =>
          !r.cancelled &&
          r.categoryId ===
            record.id,
      );


  if (
    usedByCompetition ||
    usedByRegistration
  ) {

    throw Error(
      "This age category is already in use and cannot be deleted.",
    );

  }


  this.state.update(
    (s) => ({

      ...s,

      categories:
        s.categories.filter(
          (c) =>
            c.id !== record.id,
        ),

    }),
  );


  this.notify(
    "Age category deleted.",
  );

}
  async saveCompetition(record: Competition) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.put(this.url(`/admin/competitions/${record.id}`), record),

      );

      await this.loadAdmin();

      this.notify("Competition saved.");

      return;

    }

    this.state.update((s) => ({

      ...s,

      competitions: s.competitions.some((c) => c.id === record.id)

        ? s.competitions.map((c) => (c.id === record.id ? record : c))

        : [...s.competitions, record],

    }));

    this.notify("Competition saved.");

  }
async deleteCompetition(record: Competition) {

  if (!record?.id) {
    throw Error("Competition id is missing.");
  }


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {

    try {

      await firstValueFrom(
        this.http.delete(
          this.url(
            `/admin/competitions/${record.id}`,
          ),
        ),
      );


      await this.loadAdmin();


      this.notify(
        "Competition deleted.",
      );


      return;

    } catch (e) {

      throw Error(
        apiMessage(
          e,
          "Unable to delete competition.",
        ),
      );

    }

  }


  /* =========================================
     DEMO MODE
  ========================================= */

  const used =
    this.state()
      .registrations
      .some(
        (r) =>
          !r.cancelled &&
          r.competitionIds.includes(
            record.id,
          ),
      );


  if (used) {

    throw Error(
      "Competition has registrations and cannot be deleted.",
    );

  }


  this.state.update(
    (s) => ({
      ...s,

      competitions:
        s.competitions.filter(
          (c) =>
            c.id !== record.id,
        ),
    }),
  );


  this.notify(
    "Competition deleted.",
  );

}
  async saveSlot(record: Slot) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.put(this.url(`/admin/slots/${record.id}`), record),

      );

      await this.loadAdmin();

      this.notify("Slot saved.");

      return;

    }

    this.state.update((s) => ({

      ...s,

      slots: s.slots.some((v) => v.id === record.id)

        ? s.slots.map((v) => (v.id === record.id ? record : v))

        : [...s.slots, record],

    }));

    this.notify("Slot saved.");

  }
async deleteSlot(record: Slot) {

  if (!record?.id) {
    throw Error(
      "Slot id is missing.",
    );
  }


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {

    try {

      await firstValueFrom(
        this.http.delete(
          this.url(
            `/admin/slots/${record.id}`,
          ),
        ),
      );


      await this.loadAdmin();


      this.notify(
        "Slot deleted.",
      );


      return;

    } catch (e) {

      throw Error(
        apiMessage(
          e,
          "Unable to delete slot.",
        ),
      );

    }

  }


  /* =========================================
     DEMO MODE
  ========================================= */

  const usedByCompetition =
    this.state()
      .competitions
      .some(
        (c) =>
          c.slotId === record.id,
      );


  if (usedByCompetition) {

    throw Error(
      "This slot is assigned to a competition and cannot be deleted.",
    );

  }


  this.state.update(
    (s) => ({

      ...s,

      slots:
        s.slots.filter(
          (slot) =>
            slot.id !== record.id,
        ),

    }),
  );


  this.notify(
    "Slot deleted.",
  );

}
  async saveJudge(record: Judge) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.put(this.url(`/admin/judges/${record.id}`), record),

      );

      await this.loadAdmin();

      this.notify("Judge saved.");

      return;

    }

    this.state.update((s) => ({

      ...s,

      judges: s.judges.some((v) => v.id === record.id)

        ? s.judges.map((v) => (v.id === record.id ? record : v))

        : [...s.judges, record],

    }));

    this.notify("Judge saved.");

  }
async deleteJudge(record: Judge) {

  if (!record?.id) {
    throw Error(
      "Judge id is missing.",
    );
  }


  /* =========================================
     REAL BACKEND
  ========================================= */

  if (!this.demo) {

    try {

      await firstValueFrom(
        this.http.delete(
          this.url(
            `/admin/judges/${record.id}`,
          ),
        ),
      );


      await this.loadAdmin();


      this.notify(
        "Judge deleted.",
      );


      return;

    } catch (e) {

      throw Error(
        apiMessage(
          e,
          "Unable to delete judge.",
        ),
      );

    }

  }


  /* =========================================
     DEMO MODE
  ========================================= */

  this.state.update(
    (s) => ({

      ...s,

      judges:
        s.judges.filter(
          (judge) =>
            judge.id !== record.id,
        ),

    }),
  );


  this.notify(
    "Judge deleted.",
  );

}
  async saveSettings(settings: Settings) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.put(this.url("/admin/settings"), settings),

      );

      await this.loadAdmin();

      this.notify("Event settings saved.");

      return;

    }

    this.state.update((s) => ({ ...s, settings }));

    this.notify("Event settings saved.");

  }

  async setCompetitionAttendance(

    registrationId: string,

    competitionId: string,

    attendance: CompetitionAttendance,

  ) {

    if (!this.demo) {

      await firstValueFrom(

        this.http.patch(

          this.url(`/admin/registrations/${registrationId}/attendance`),

          { competitionId, attendance },

        ),

      );

      await this.loadAdmin();

      return;

    }

    const r = this.state().registrations.find((v) => v.id === registrationId);

    if (r)

      this.replaceRegistration({

        ...r,

        competitionAttendance: {

          ...(r.competitionAttendance || {}),

          [competitionId]: attendance,

        },

      });

  }

  async saveScore(score: Score) {

    if (!Number.isFinite(score.mark) || score.mark < 0 || score.mark > 100)

      throw Error("Mark must be between 0 and 100.");

    if (!this.demo) {

      const saved = await firstValueFrom(

        this.http.put<Score>(this.url(`/judge/scores/${score.id}`), score),

      );

      await this.loadJudge();

      this.notify("Mark saved.");

      return saved;

    }

    this.state.update((s) => ({

      ...s,

      scores: s.scores.some(

        (v) =>

          v.registrationId === score.registrationId &&

          v.competitionId === score.competitionId &&

          v.judgeId === score.judgeId,

      )

        ? s.scores.map((v) =>

            v.registrationId === score.registrationId &&

            v.competitionId === score.competitionId &&

            v.judgeId === score.judgeId

              ? score

              : v,

          )

        : [...s.scores, score],

    }));

    await this.setCompetitionAttendance(

      score.registrationId,

      score.competitionId,

      "Present",

    );

    this.notify("Mark saved.");

    return score;

  }

  scoreFor(registrationId: string, competitionId: string, judgeId: string) {

    return this.state().scores.find(

      (s) =>

        s.registrationId === registrationId &&

        s.competitionId === competitionId &&

        s.judgeId === judgeId,

    );

  }

  scoresFor(registrationId: string, competitionId: string) {

    return this.state()

      .scores.filter(

        (s) =>

          s.registrationId === registrationId &&

          s.competitionId === competitionId,

      )

      .sort((a, b) => a.judgeId.localeCompare(b.judgeId));

  }

  anyScoreFor(registrationId: string, competitionId: string) {

    return this.scoresFor(registrationId, competitionId)[0];

  }

  resetFrontendData() {

    if (!this.demo) {

      this.notify("Server data cannot be reset from the frontend.");

      return;

    }

    localStorage.removeItem(STORAGE_KEY);

    this.state.set(createDemoState());

    this.activePass.set(null);

    this.notify("Test data reset to the client competition setup.");

  }

}
