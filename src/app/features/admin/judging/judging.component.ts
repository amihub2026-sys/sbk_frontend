import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { AuthService } from "../../../core/services/auth.service";
import { EventStore } from "../../../core/services/event-store.service";

import {
  Registration,
  Score,
} from "../../../core/models/event.models";


@Component({
  selector: "app-judging",
  standalone: true,
  imports: [
    FormsModule,
  ],
  templateUrl: "./judging.component.html",
  styleUrl: "./judging.component.css",
})
export class JudgingComponent {

  auth = inject(AuthService);
  store = inject(EventStore);
  router = inject(Router);
  destroyRef = inject(DestroyRef);


  selectedCompetition =
    signal("");

  selectedCategory =
    signal("");

  search =
    signal("");

  error =
    signal("");


  drafts:
    Record<string, string> =
    {};

  editing =
    signal<
      Record<string, boolean>
    >({});


  /**
   * =========================================
   * ROLE
   * =========================================
   */

  isJudge =
    computed(
      () =>
        this.auth.session()?.role ===
        "judge",
    );


  /**
   * =========================================
   * CURRENT JUDGE
   * =========================================
   */

  currentJudge =
    computed(() => {

      const judgeId =
        this.auth.session()?.judgeId;

      if (!judgeId) {
        return undefined;
      }

      return this.store.judge(
        judgeId,
      );

    });


  /**
   * =========================================
   * COMPETITIONS
   * =========================================
   */

  assigned =
    computed(() => {

      if (!this.isJudge()) {

        return this.store
          .state()
          .competitions;

      }


      const judge =
        this.currentJudge();

      if (!judge) {
        return [];
      }


      return this.store
        .state()
        .competitions
        .filter(
          (competition) =>
            judge.competitionIds.includes(
              competition.id,
            ),
        );

    });


  /**
   * =========================================
   * CATEGORIES FOR SELECTED COMPETITION
   * =========================================
   */

  availableCategories =
    computed(() => {

      const competitionId =
        this.activeCompetitionId();

      if (!competitionId) {
        return [];
      }


      const competition =
        this.store.competition(
          competitionId,
        );

      if (!competition) {
        return [];
      }


      return this.store
        .state()
        .categories
        .filter(
          (category) =>
            competition.categoryIds.includes(
              category.id,
            ),
        )
        .slice()
        .sort(
          (a, b) =>
            a.minMonths -
            b.minMonths,
        );

    });


  /**
   * =========================================
   * JUDGE PARTICIPANTS
   * =========================================
   */

  participants =
    computed(() => {

      const competitionId =
        this.activeCompetitionId();

      if (!competitionId) {
        return [];
      }


      const q =
        this.search()
          .trim()
          .toLowerCase();


      return this.store
        .registrations()
        .filter(
          (registration) => {

            if (
              !this.isEligible(
                registration,
              )
            ) {
              return false;
            }


            if (
              !registration
                .competitionIds
                .includes(
                  competitionId,
                )
            ) {
              return false;
            }


            if (!q) {
              return true;
            }


            return [
              registration.applicationNo,
              registration.name,
              registration.school,
              registration.fatherName,
            ].some(
              (value) =>
                String(
                  value || "",
                )
                  .toLowerCase()
                  .includes(q),
            );

          },
        );

    });


  /**
   * =========================================
   * ADMIN PARTICIPANTS
   * =========================================
   */

  adminParticipants =
    computed(() => {

      const competitionId =
        this.activeCompetitionId();

      const categoryId =
        this.selectedCategory();


      if (!competitionId) {
        return [];
      }


      return this.store
        .registrations()
        .filter(
          (registration) => {

            if (
              !this.isEligible(
                registration,
              )
            ) {
              return false;
            }


            if (
              !registration
                .competitionIds
                .includes(
                  competitionId,
                )
            ) {
              return false;
            }


            if (
              categoryId &&
              registration.categoryId !==
                categoryId
            ) {
              return false;
            }


            return true;

          },
        );

    });


  /**
   * =========================================
   * ALL SCORES
   * =========================================
   */

  allScores =
    computed(() =>
      this.store
        .state()
        .scores
        .slice()
        .sort(
          (a, b) =>
            b.savedAt.localeCompare(
              a.savedAt,
            ),
        ),
    );


  constructor() {

    queueMicrotask(
      () => {

        if (
          !this.selectedCompetition() &&
          this.assigned()[0]
        ) {

          this.selectedCompetition
            .set(
              this.assigned()[0].id,
            );

        }

      },
    );


    if (
      !this.store.demo &&
      this.auth.session()?.role ===
        "judge"
    ) {

      const timer =
        window.setInterval(
          () =>
            void this.store
              .loadJudge()
              .catch(
                () => {},
              ),
          15000,
        );


      this.destroyRef
        .onDestroy(
          () =>
            window.clearInterval(
              timer,
            ),
        );

    }

  }


  /**
   * =========================================
   * ACTIVE COMPETITION
   * =========================================
   */

  private activeCompetitionId() {

    return (
      this.selectedCompetition() ||
      this.assigned()[0]?.id ||
      ""
    );

  }


  /**
   * =========================================
   * ELIGIBILITY
   * =========================================
   */

  private isEligible(
    registration: Registration,
  ) {

    if (
      registration.cancelled
    ) {
      return false;
    }


    const total =
      Number(
        registration.total || 0,
      );


    if (total <= 0) {
      return true;
    }


    return (
      registration.payment ===
      "Paid"
    );

  }


  /**
   * =========================================
   * CHANGE COMPETITION
   * =========================================
   */

  changeCompetition(
    id: string,
  ) {

    this.selectedCompetition
      .set(id);

    this.selectedCategory
      .set("");

    this.search.set("");

    this.error.set("");

    this.drafts = {};

    this.editing.set({});

  }


  /**
   * =========================================
   * CHANGE CATEGORY
   * =========================================
   */

  changeCategory(
    id: string,
  ) {

    this.selectedCategory
      .set(id);

  }


  /**
   * =========================================
   * JUDGE SCORE
   * =========================================
   */

  scoreFor(
    registration: Registration,
  ) {

    const judge =
      this.currentJudge();

    const competitionId =
      this.activeCompetitionId();


    if (
      !judge ||
      !competitionId
    ) {
      return undefined;
    }


    return this.store
      .scoreFor(
        registration.id,
        competitionId,
        judge.id,
      );

  }


  markFor(
    registration: Registration,
  ) {

    const key =
      registration.id;


    if (
      this.drafts[key] !==
      undefined
    ) {

      return this.drafts[key];

    }


    const score =
      this.scoreFor(
        registration,
      );


    return score
      ? String(score.mark)
      : "";

  }


  setDraft(
    id: string,
    value: string,
  ) {

    this.drafts[id] =
      value;

  }


  isEditing(
    registration: Registration,
  ) {

    return (
      !this.scoreFor(
        registration,
      ) ||
      !!this.editing()[
        registration.id
      ]
    );

  }


  startEdit(
    registration: Registration,
  ) {

    const score =
      this.scoreFor(
        registration,
      );


    if (score) {

      this.drafts[
        registration.id
      ] =
        String(score.mark);

    }


    this.editing.set({
      ...this.editing(),

      [registration.id]:
        true,
    });

  }


  cancelEdit(
    registration: Registration,
  ) {

    const next = {
      ...this.editing(),
    };


    delete next[
      registration.id
    ];


    this.editing.set(
      next,
    );


    delete this.drafts[
      registration.id
    ];

  }


  /**
   * =========================================
   * SAVE MARK
   * =========================================
   */

  async save(
    registration: Registration,
  ) {

    this.error.set("");


    const judge =
      this.currentJudge();


    if (!judge) {

      this.error.set(
        "Judge account was not found.",
      );

      return;

    }


    const competitionId =
      this.activeCompetitionId();


    if (!competitionId) {

      this.error.set(
        "Select a competition.",
      );

      return;

    }


    const mark =
      Number(
        this.markFor(
          registration,
        ),
      );


    if (
      !Number.isFinite(mark) ||
      mark < 0 ||
      mark > 100
    ) {

      this.error.set(
        "Enter a mark from 0 to 100.",
      );

      return;

    }


    const existing =
      this.store.scoreFor(
        registration.id,
        competitionId,
        judge.id,
      );


    const score: Score = {

      id:
        existing?.id ||
        crypto.randomUUID(),

      registrationId:
        registration.id,

      competitionId,

      judgeId:
        judge.id,

      mark,

      notes:
        existing?.notes || "",

      savedAt:
        new Date()
          .toISOString(),

    };


    try {

      await this.store
        .saveScore(
          score,
        );


      delete this.drafts[
        registration.id
      ];


      const next = {
        ...this.editing(),
      };


      delete next[
        registration.id
      ];


      this.editing.set(
        next,
      );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to save mark.",
      );

    }

  }


  /**
   * =========================================
   * ATTENDANCE
   * =========================================
   */

  attendance(
    registration: Registration,
  ) {

    const competitionId =
      this.activeCompetitionId();


    if (!competitionId) {
      return "Not marked";
    }


    return (
      registration
        .competitionAttendance?.[
          competitionId
        ] ||
      (
        this.store.anyScoreFor(
          registration.id,
          competitionId,
        )
          ? "Present"
          : "Not marked"
      )
    );

  }


  async markAbsent(
    registration: Registration,
  ) {

    this.error.set("");


    const competitionId =
      this.activeCompetitionId();


    if (!competitionId) {
      return;
    }


    try {

      await this.store
        .setCompetitionAttendance(
          registration.id,
          competitionId,
          "Absent",
        );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to mark participant absent.",
      );

    }

  }


  async clearAttendance(
    registration: Registration,
  ) {

    this.error.set("");


    const competitionId =
      this.activeCompetitionId();


    if (!competitionId) {
      return;
    }


    try {

      await this.store
        .setCompetitionAttendance(
          registration.id,
          competitionId,
          "Not marked",
        );

    } catch (e) {

      this.error.set(
        e instanceof Error
          ? e.message
          : "Unable to update attendance.",
      );

    }

  }


  /**
   * =========================================
   * ADMIN SCORES
   * =========================================
   */

  adminScores(
    registration: Registration,
  ) {

    const competitionId =
      this.activeCompetitionId();


    if (!competitionId) {
      return [];
    }


    return this.store
      .scoresFor(
        registration.id,
        competitionId,
      );

  }


  /**
   * =========================================
   * AVERAGE MARK
   * =========================================
   */

  adminAverage(
    registration: Registration,
  ): number | null {

    const scores =
      this.adminScores(
        registration,
      );


    if (
      scores.length === 0
    ) {
      return null;
    }


    const total =
      scores.reduce(
        (sum, score) =>
          sum +
          Number(
            score.mark || 0,
          ),
        0,
      );


    return (
      total /
      scores.length
    );

  }


  /**
   * =========================================
   * CATEGORY-WISE RANK
   * =========================================
   *
   * Rank is calculated only against:
   *
   * same competition
   * +
   * same category
   */

  adminRank(
    registration: Registration,
  ): number | null {

    const currentAverage =
      this.adminAverage(
        registration,
      );


    if (
      currentAverage === null
    ) {
      return null;
    }


    const sameCategory =
      this.adminParticipants()
        .filter(
          (participant) =>
            participant.categoryId ===
            registration.categoryId,
        );


    const averages =
      sameCategory
        .map(
          (participant) =>
            this.adminAverage(
              participant,
            ),
        )
        .filter(
          (
            value,
          ): value is number =>
            value !== null,
        )
        .map(
          (value) =>
            Number(
              value.toFixed(6),
            ),
        );


    const uniqueScores =
      Array.from(
        new Set(
          averages,
        ),
      )
        .sort(
          (a, b) =>
            b - a,
        );


    const current =
      Number(
        currentAverage
          .toFixed(6),
      );


    const index =
      uniqueScores.indexOf(
        current,
      );


    return index >= 0
      ? index + 1
      : null;

  }


  /**
   * =========================================
   * RANK LABEL
   * =========================================
   */

  rankLabel(
    rank: number | null,
  ) {

    if (!rank) {
      return "—";
    }


    if (rank === 1) {
      return "1st";
    }

    if (rank === 2) {
      return "2nd";
    }

    if (rank === 3) {
      return "3rd";
    }


    const mod100 =
      rank % 100;

    if (
      mod100 >= 11 &&
      mod100 <= 13
    ) {
      return `${rank}th`;
    }


    switch (
      rank % 10
    ) {

      case 1:
        return `${rank}st`;

      case 2:
        return `${rank}nd`;

      case 3:
        return `${rank}rd`;

      default:
        return `${rank}th`;

    }

  }


  adminScore(
    registration: Registration,
  ) {

    return this.adminScores(
      registration,
    )[0];

  }


  registrationFor(
    id: string,
  ) {

    return this.store
      .state()
      .registrations
      .find(
        (registration) =>
          registration.id === id,
      );

  }


  async logout() {

    await this.auth.logout();

    await this.router.navigate(
      [
        "/judge",
      ],
    );

  }

}