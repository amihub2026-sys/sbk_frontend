import { Component, computed, inject, signal } from "@angular/core";
import { CurrencyPipe } from "@angular/common";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EventStore } from "../../../core/services/event-store.service";
import {
  categoryFor,
  indiaDate,
  validateSelection,
} from "../../../core/utils/event-rules";
import { imageFileToDataUrl } from "../../../core/utils/image-upload";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  store = inject(EventStore);
  fb = inject(FormBuilder);
  router = inject(Router);
  step = signal<1 | 2 | 3>(1);
  error = signal("");
  busy = signal(false);
  selected = signal<string[]>([]);
  language = signal<"ta" | "en">("ta");
  consent = false;
  applicationDate = indiaDate();
  dob = signal("");
  photo = signal("");
  photoBusy = signal(false);
  form = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    ],
    fatherName: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    ],
    school: [
      "",
      [Validators.required, Validators.minLength(2), Validators.maxLength(140)],
    ],
    dob: ["", Validators.required],
email: [
  "",
  [
    Validators.required,
    Validators.email,
    Validators.pattern(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
    ),
    Validators.maxLength(160),
  ],
],
    phone: ["", [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });
  category = computed(() =>
    categoryFor(
      this.dob(),
      this.applicationDate,
      this.store.state().categories,
    ),
  );
  eligible = computed(() =>
    this.category() ? this.store.eligible(this.category()!.id) : [],
  );
  total = computed(() =>
    this.selected().reduce(
      (sum, id) => sum + (this.store.competition(id)?.fee || 0),
      0,
    ),
  );
  age = computed(() =>
    this.dob() ? this.store.ageLabel(this.dob(), this.applicationDate) : "",
  );
  constructor() {
    this.form.controls.dob.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        this.dob.set(v);
        this.selected.set([]);
      });
  }
  t(en: string, ta: string) {
    return this.language() === "ta" ? ta : en;
  }
  invalid(key: keyof typeof this.form.controls) {
    const c = this.form.controls[key];
    return c.invalid && c.touched;
  }
  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set("");
    this.photoBusy.set(true);
    try {
      this.photo.set(await imageFileToDataUrl(file, 700));
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : "Unable to process photo.",
      );
    } finally {
      this.photoBusy.set(false);
      input.value = "";
    }
  }
  removePhoto() {
    this.photo.set("");
  }
  toggle(id: string) {
    this.error.set("");
    const now = this.selected();
    if (now.includes(id)) {
      this.selected.set(now.filter((v) => v !== id));
      return;
    }
    const next = [...now, id];
    if (next.length > this.store.settings().maxEvents) {
      this.error.set(
        this.t(
          `Select a maximum of ${this.store.settings().maxEvents} competitions.`,
          `அதிகபட்சம் ${this.store.settings().maxEvents} போட்டிகளை மட்டும் தேர்வு செய்யவும்.`,
        ),
      );
      return;
    }
    this.selected.set(next);
  }
  private firstInvalidField():
  keyof typeof this.form.controls | null {

  const order: Array<
    keyof typeof this.form.controls
  > = [
    "name",
    "fatherName",
    "school",
    "dob",
    "email",
    "phone",
  ];

  return (
    order.find(
      (key) =>
        this.form.controls[key].invalid,
    ) || null
  );
}


private focusField(
  key: keyof typeof this.form.controls,
) {
  setTimeout(() => {

    const element =
      document.querySelector(
        `[formControlName="${key}"]`,
      ) as HTMLInputElement | null;

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      element.focus({
        preventScroll: true,
      });
    }, 400);

  }, 0);
}
  toReview() {
    this.error.set("");
    this.form.markAllAsTouched();
  if (this.form.invalid) {

  const firstInvalid =
    this.firstInvalidField();

  this.error.set(
    this.t(
      "Complete the highlighted required field.",
      "குறிப்பிட்ட தேவையான விவரத்தை பூர்த்தி செய்யவும்.",
    ),
  );

  if (firstInvalid) {
    this.focusField(firstInvalid);
  }

  return;
}
if (!this.category()) {

  this.error.set(
    this.t(
      "This date of birth is outside the eligible age groups.",
      "இந்த பிறந்த தேதி தகுதியான வயது பிரிவுகளில் இல்லை.",
    ),
  );

  this.focusField("dob");

  return;
}
    const err = validateSelection(
      this.selected(),
      this.category()!.id,
      this.store.state().competitions,
      this.store.state().slots,
      this.store.registrations(),
      this.store.settings().maxEvents,
    );
    if (err) {
      this.error.set(err);
      return;
    }
    this.step.set(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
async payAndRegister() {
  if (this.busy()) return;

  this.error.set("");

  if (!this.consent) {
    this.error.set(
      this.t(
        "Accept the terms and confirm the details before payment.",
        "கட்டணம் செலுத்துவதற்கு முன் விதிமுறைகளை ஏற்று விவரங்களை உறுதிப்படுத்தவும்.",
      ),
    );
    return;
  }

  this.busy.set(true);

  try {
    const current = this.store.activePass();

    const raw = {
      ...this.form.getRawValue(),
      photo: this.photo(),
    };

    const reusable =
      current &&
      current.source === "Online" &&
      current.payment === "Pending" &&
      current.name.trim() === raw.name.trim() &&
      current.dob === raw.dob &&
      current.phone === raw.phone &&
      current.competitionIds.length === this.selected().length &&
      current.competitionIds.every((id) =>
        this.selected().includes(id),
      );

    const record =
      reusable && current
        ? current
        : await this.store.registerOnline(
            raw,
            this.selected(),
            this.language(),
            this.applicationDate,
          );

    /*
     * IMPORTANT
     *
     * Remember this BEFORE opening Razorpay.
     *
     * After Razorpay returns to our website,
     * we will use this flag to automatically
     * download the beautiful pass.
     */
    sessionStorage.setItem(
      "sbk-auto-download-pass",
      "1",
    );

    sessionStorage.setItem(
      "sbk-last-registration-id",
      record.id,
    );

    const paid =
      await this.store.completeOnlinePayment(
        record.id,
      );

    /*
     * This section runs immediately for:
     *
     * - ₹0 registration
     * - dummy payment
     * - already-paid registration
     *
     * Real Razorpay normally redirects away
     * before reaching here.
     */
    if (
      paid &&
      paid.payment === "Paid"
    ) {
      this.store.activePass.set(paid);

      this.step.set(3);

      sessionStorage.setItem(
        "sbk-payment-success",
        "1",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

  } catch (e) {

    this.error.set(
      e instanceof Error
        ? e.message
        : "Registration failed.",
    );

  } finally {

    this.busy.set(false);

  }
}
  viewPass() {
    void this.router.navigate(["/pass"]);
  }
}
