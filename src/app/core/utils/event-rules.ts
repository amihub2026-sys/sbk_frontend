import {
  Category,
  Competition,
  Registration,
  Slot,
} from "../models/event.models";

export function indiaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  return `${parts.find((p) => p.type === "year")!.value}-${
    parts.find((p) => p.type === "month")!.value
  }-${parts.find((p) => p.type === "day")!.value}`;
}

export function ageInMonths(dob: string, on: string): number {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(on)
  ) {
    return -1;
  }

  const [y, m, d] = dob.split("-").map(Number);
  const [yy, mm, dd] = on.split("-").map(Number);

  const check = new Date(Date.UTC(yy, mm - 1, dd));

  if (
    check.getUTCFullYear() !== yy ||
    check.getUTCMonth() !== mm - 1 ||
    check.getUTCDate() !== dd
  ) {
    return -1;
  }

  const parsed = new Date(Date.UTC(y, m - 1, d));

  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d ||
    dob > on
  ) {
    return -1;
  }

  return (yy - y) * 12 + mm - m - (dd < d ? 1 : 0);
}

export function categoryFor(
  dob: string,
  on: string,
  categories: Category[],
): Category | undefined {
  const months = ageInMonths(dob, on);

  return categories.find(
    (c) => months >= c.minMonths && months < c.maxMonths,
  );
}

export function slotsOverlap(a: Slot, b: Slot): boolean {
  return a.date === b.date && a.start < b.end && b.start < a.end;
}

export function validateSelection(
  ids: string[],
  categoryId: string,
  competitions: Competition[],
  slots: Slot[],
  registrations: Registration[],
  max: number,
): string | null {
  if (!ids.length) {
    return "Select at least one competition.";
  }

  if (new Set(ids).size !== ids.length) {
    return "Duplicate competition selection.";
  }

  if (ids.length > max) {
    return `Choose a maximum of ${max} competitions.`;
  }

  const selected = ids.map((id) =>
    competitions.find((c) => c.id === id),
  );

  for (const c of selected) {
    if (!c || c.status !== "Open") {
      return "One of these competitions is no longer open.";
    }

    if (!c.categoryIds.includes(categoryId)) {
      return `${c.name} is not available for this age group.`;
    }

    const registeredCount = registrations.filter(
      (r) =>
        !r.cancelled &&
        r.competitionIds.includes(c.id),
    ).length;

    if (registeredCount >= c.capacity) {
      return `${c.name} is full. Please choose another competition.`;
    }
  }

  // Do not require slot, time or venue during student registration.
  // Admin will assign them later based on participant count,
  // available space and crowd.

  return null;
}

export function validateCategories(cats: Category[]): string | null {
  const sorted = [...cats].sort(
    (a, b) => a.minMonths - b.minMonths,
  );

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];

    if (
      !Number.isInteger(c.minMonths) ||
      !Number.isInteger(c.maxMonths) ||
      c.minMonths < 0 ||
      c.maxMonths <= c.minMonths
    ) {
      return "Use valid completed-month boundaries; maximum is exclusive.";
    }

    if (
      i &&
      c.minMonths < sorted[i - 1].maxMonths
    ) {
      return "Age categories must not overlap.";
    }
  }

  return null;
}

export function csvEncode(
  rows: (string | number)[][],
): string {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(
                  /^(\s*[=+@\-\t\r\n])/,
                  "'$&",
                )
                .replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}

export function validateStudent(
  student: import("../models/event.models").Student,
): string | null {
  if (
    [
      student.name,
      student.fatherName,
      student.school,
    ].some((v) => v.trim().length < 2)
  ) {
    return "Enter the student name, father’s name and school name.";
  }

  if (
    student.name.length > 80 ||
    student.fatherName.length > 80 ||
    student.school.length > 140
  ) {
    return "A name exceeds the allowed length.";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      student.email,
    ) ||
    student.email.length > 160
  ) {
    return "Enter a valid email address.";
  }

  if (
    !/^[6-9]\d{9}$/.test(
      student.phone,
    )
  ) {
    return "Enter a valid 10-digit Indian mobile number.";
  }

  return null;
}