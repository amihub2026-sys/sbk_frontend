import {
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";

import { CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";

import { EventStore } from "../../../core/services/event-store.service";


type DashboardView =
  | "overview"
  | "participants"
  | "categories"
  | "competitions"
  | "live"
  | "payments"
  | "results";


type ResultFilter =
  | ""
  | "Marked"
  | "Pending"
  | "Present"
  | "Absent"
  | "Top 3";


@Component({
  selector: "app-dashboard",
  standalone: true,

  imports: [
    CurrencyPipe,
    RouterLink,
  ],

  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {

  store = inject(EventStore);


  /**
   * ======================================================
   * DASHBOARD TABS
   * ======================================================
   */

  activeView = signal<DashboardView>("overview");


  readonly dashboardViews: {
    id: DashboardView;
    label: string;
    shortLabel: string;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      shortLabel: "Overview",
    },
    {
      id: "participants",
      label: "Participants",
      shortLabel: "Participants",
    },
    {
      id: "categories",
      label: "Categories",
      shortLabel: "Categories",
    },
    {
      id: "competitions",
      label: "Competitions",
      shortLabel: "Competitions",
    },
    {
      id: "live",
      label: "Live Event",
      shortLabel: "Live",
    },
    {
      id: "payments",
      label: "Payments",
      shortLabel: "Payments",
    },
    {
      id: "results",
      label: "Marks / Results",
      shortLabel: "Results",
    },
  ];


  setView(view: string) {

    const exists =
      this.dashboardViews.some(
        (item) =>
          item.id === view,
      );


    if (!exists) {
      return;
    }


    this.activeView.set(
      view as DashboardView,
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  isView(
    view: DashboardView,
  ) {

    return (
      this.activeView() ===
      view
    );
  }


  currentViewLabel() {

    return (
      this.dashboardViews.find(
        (item) =>
          item.id ===
          this.activeView(),
      )?.label ||
      "Overview"
    );
  }


  /**
   * ======================================================
   * GENERAL DASHBOARD FILTERS
   * ======================================================
   */

  selectedCategory =
    signal("");

  selectedCompetition =
    signal("");

  selectedSource =
    signal("");

  selectedPayment =
    signal("");

  selectedAttendance =
    signal("");

  selectedCompetitionStatus =
    signal("");


  /**
   * ======================================================
   * LIVE EVENT FILTERS
   * ======================================================
   */

  liveCategoryId =
    signal("");

  liveCompetitionId =
    signal("");

  liveStage =
    signal("");

  liveSearch =
    signal("");


  /**
   * ======================================================
   * MARKS / RESULTS FILTERS
   * ======================================================
   */

  resultCategoryId =
    signal("");

  resultCompetitionId =
    signal("");

  resultJudgeId =
    signal("");

  resultStatus =
    signal<ResultFilter>("");

  resultSearch =
    signal("");


  /**
   * ======================================================
   * CLIENT PRIZE POINTS
   * ======================================================
   */

  readonly prizePoints = {
    first: 30,
    second: 20,
    third: 10,
  };


  /**
   * ======================================================
   * BASE DATA
   * ======================================================
   */

  registrations =
    computed(
      () =>
        this.store.registrations(),
    );


  competitions =
    computed(
      () =>
        this.store.state().competitions,
    );


  categories =
    computed(
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


  judges =
    computed(
      () =>
        this.store.state().judges,
    );


  scores =
    computed(
      () =>
        this.store.state().scores,
    );


  /**
   * ======================================================
   * VALID EVENT PARTICIPANTS
   * ======================================================
   */

  validRegistrations =
    computed(
      () =>
        this.registrations().filter(
          (registration) =>
            !registration.cancelled &&
            (
              registration.approval ===
                "Approved" ||
              registration.registrationStatus ===
                "Confirmed"
            ),
        ),
    );


  /**
   * ======================================================
   * GENERAL FILTERED REGISTRATIONS
   * ======================================================
   */

  filteredRegistrations =
    computed(
      () => {

        let rows =
          this.registrations();


        const categoryId =
          this.selectedCategory();

        const competitionId =
          this.selectedCompetition();

        const source =
          this.selectedSource();

        const payment =
          this.selectedPayment();

        const attendance =
          this.selectedAttendance();


        if (categoryId) {

          rows =
            rows.filter(
              (registration) =>
                registration.categoryId ===
                categoryId,
            );
        }


        if (competitionId) {

          rows =
            rows.filter(
              (registration) =>
                registration.competitionIds.includes(
                  competitionId,
                ),
            );
        }


        if (source) {

          rows =
            rows.filter(
              (registration) =>
                registration.source ===
                source,
            );
        }


        if (payment) {

          rows =
            rows.filter(
              (registration) =>
                registration.payment ===
                payment,
            );
        }


        if (
          attendance ===
          "Checked In"
        ) {

          rows =
            rows.filter(
              (registration) =>
                !!registration.checkedInAt,
            );
        }


        if (
          attendance ===
          "Not Checked In"
        ) {

          rows =
            rows.filter(
              (registration) =>
                !registration.checkedInAt,
            );
        }


        return rows;
      },
    );


  /**
   * ======================================================
   * MAIN COUNTS
   * ======================================================
   */

  totalParticipants =
    computed(
      () =>
        this.filteredRegistrations()
          .length,
    );


  onlineRegistrations =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.source ===
              "Online",
          )
          .length,
    );


  directRegistrations =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.source ===
              "Paper",
          )
          .length,
    );


  /**
   * ======================================================
   * PAYMENT COUNTS
   * ======================================================
   */

  paidRegistrations =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.payment ===
              "Paid",
          )
          .length,
    );


  pendingPayments =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.payment ===
              "Pending",
          )
          .length,
    );


  failedPayments =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.payment ===
              "Failed",
          )
          .length,
    );


  totalCollected =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.payment ===
              "Paid",
          )
          .reduce(
            (
              total,
              registration,
            ) =>
              total +
              Number(
                registration.total ||
                  0,
              ),
            0,
          ),
    );


  onlineCollected =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.source ===
                "Online" &&
              registration.payment ===
                "Paid",
          )
          .reduce(
            (
              total,
              registration,
            ) =>
              total +
              Number(
                registration.total ||
                  0,
              ),
            0,
          ),
    );


  directCollected =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.source ===
                "Paper" &&
              registration.payment ===
                "Paid",
          )
          .reduce(
            (
              total,
              registration,
            ) =>
              total +
              Number(
                registration.total ||
                  0,
              ),
            0,
          ),
    );


  /**
   * ======================================================
   * REGISTRATION STATUS
   * ======================================================
   */

  confirmedRegistrations =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.approval ===
                "Approved" ||
              registration.registrationStatus ===
                "Confirmed",
          )
          .length,
    );


  pendingRegistrations =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              registration.approval ===
              "Pending",
          )
          .length,
    );


  /**
   * ======================================================
   * CHECK-IN
   * ======================================================
   */

  checkedIn =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              !!registration.checkedInAt,
          )
          .length,
    );


  notCheckedIn =
    computed(
      () =>
        this.filteredRegistrations()
          .filter(
            (registration) =>
              !registration.checkedInAt,
          )
          .length,
    );


  /**
   * ======================================================
   * COMPETITION COUNTS
   * ======================================================
   */

  totalCompetitions =
    computed(
      () =>
        this.competitions().length,
    );


  openCompetitions =
    computed(
      () =>
        this.competitions()
          .filter(
            (competition) =>
              competition.status ===
              "Open",
          )
          .length,
    );


  closedCompetitions =
    computed(
      () =>
        this.competitions()
          .filter(
            (competition) =>
              competition.status ===
              "Closed",
          )
          .length,
    );


  /**
   * ======================================================
   * CATEGORY STATISTICS
   * ======================================================
   */

  categoryStats =
    computed(
      () => {

        const registrations =
          this.filteredRegistrations();

        const selectedCategoryId =
          this.selectedCategory();


        return this.categories()

          .filter(
            (category) =>
              !selectedCategoryId ||
              category.id ===
                selectedCategoryId,
          )

          .map(
            (category) => {

              const students =
                registrations.filter(
                  (registration) =>
                    registration.categoryId ===
                    category.id,
                );


              const online =
                students.filter(
                  (registration) =>
                    registration.source ===
                    "Online",
                ).length;


              const direct =
                students.filter(
                  (registration) =>
                    registration.source ===
                    "Paper",
                ).length;


              const checkedIn =
                students.filter(
                  (registration) =>
                    !!registration.checkedInAt,
                ).length;


              return {
                category,

                total:
                  students.length,

                online,

                direct,

                checkedIn,

                notCheckedIn:
                  students.length -
                  checkedIn,
              };
            },
          );
      },
    );


  /**
   * ======================================================
   * GENERAL COMPETITION STATISTICS
   * ======================================================
   */

  competitionStats =
    computed(
      () => {

        const registrations =
          this.filteredRegistrations();

        const status =
          this.selectedCompetitionStatus();

        const selectedCompetitionId =
          this.selectedCompetition();


        let competitions =
          this.competitions();


        if (status) {

          competitions =
            competitions.filter(
              (competition) =>
                competition.status ===
                status,
            );
        }


        if (selectedCompetitionId) {

          competitions =
            competitions.filter(
              (competition) =>
                competition.id ===
                selectedCompetitionId,
            );
        }


        return competitions.map(
          (competition) => {

            const participants =
              registrations.filter(
                (registration) =>
                  registration.competitionIds.includes(
                    competition.id,
                  ),
              );


            const present =
              participants.filter(
                (registration) =>
                  registration
                    .competitionAttendance?.[
                      competition.id
                    ] ===
                  "Present",
              ).length;


            const absent =
              participants.filter(
                (registration) =>
                  registration
                    .competitionAttendance?.[
                      competition.id
                    ] ===
                  "Absent",
              ).length;


            const notMarked =
              participants.filter(
                (registration) => {

                  const value =
                    registration
                      .competitionAttendance?.[
                        competition.id
                      ];


                  return (
                    !value ||
                    value ===
                      "Not marked"
                  );
                },
              ).length;


            const scoredRegistrationIds =
              new Set(
                this.scores()
                  .filter(
                    (score) =>
                      score.competitionId ===
                      competition.id,
                  )
                  .map(
                    (score) =>
                      score.registrationId,
                  ),
              );


            const marksSubmitted =
              participants.filter(
                (registration) =>
                  scoredRegistrationIds.has(
                    registration.id,
                  ),
              ).length;


            const marksPending =
              Math.max(
                0,
                present -
                  marksSubmitted,
              );


            const online =
              participants.filter(
                (registration) =>
                  registration.source ===
                  "Online",
              ).length;


            const direct =
              participants.filter(
                (registration) =>
                  registration.source ===
                  "Paper",
              ).length;


            return {
              competition,

              total:
                participants.length,

              online,

              direct,

              present,

              absent,

              notMarked,

              marksSubmitted,

              marksPending,

              slot:
                this.store.slot(
                  competition.slotId,
                ),
            };
          },
        );
      },
    );


  /**
   * ======================================================
   * COMPETITION CATEGORY BREAKDOWN
   * ======================================================
   */

  competitionCategoryStats =
    computed(
      () => {

        const registrations =
          this.filteredRegistrations();

        const selectedCompetitionId =
          this.selectedCompetition();


        return this.competitions()

          .filter(
            (competition) =>
              !selectedCompetitionId ||
              competition.id ===
                selectedCompetitionId,
          )

          .map(
            (competition) => {

              const categories =
                this.categories()

                  .filter(
                    (category) =>
                      competition.categoryIds.includes(
                        category.id,
                      ),
                  )

                  .map(
                    (category) => {

                      const students =
                        registrations.filter(
                          (registration) =>
                            registration.categoryId ===
                              category.id &&
                            registration.competitionIds.includes(
                              competition.id,
                            ),
                        );


                      return {
                        category,

                        total:
                          students.length,

                        present:
                          students.filter(
                            (registration) =>
                              registration
                                .competitionAttendance?.[
                                  competition.id
                                ] ===
                              "Present",
                          ).length,

                        absent:
                          students.filter(
                            (registration) =>
                              registration
                                .competitionAttendance?.[
                                  competition.id
                                ] ===
                              "Absent",
                          ).length,
                      };
                    },
                  );


              return {
                competition,

                total:
                  categories.reduce(
                    (
                      sum,
                      item,
                    ) =>
                      sum +
                      item.total,
                    0,
                  ),

                categories,
              };
            },
          );
      },
    );


  /**
   * ======================================================
   * ATTENDANCE TOTALS
   * ======================================================
   */

  competitionAttendanceTotals =
    computed(
      () => {

        let present = 0;
        let absent = 0;
        let notMarked = 0;


        for (
          const stat
          of this.competitionStats()
        ) {

          present +=
            stat.present;

          absent +=
            stat.absent;

          notMarked +=
            stat.notMarked;
        }


        return {
          present,
          absent,
          notMarked,
        };
      },
    );


  /**
   * ======================================================
   * MARK COUNTS
   * ======================================================
   */

  participantsWithMarks =
    computed(
      () => {

        const ids =
          new Set(
            this.scores().map(
              (score) =>
                score.registrationId,
            ),
          );


        return this.filteredRegistrations()
          .filter(
            (registration) =>
              ids.has(
                registration.id,
              ),
          )
          .length;
      },
    );


  totalScoreEntries =
    computed(
      () =>
        this.scores().length,
    );


  marksSubmittedTotal =
    computed(
      () =>
        this.competitionStats()
          .reduce(
            (
              total,
              stat,
            ) =>
              total +
              stat.marksSubmitted,
            0,
          ),
    );


  marksPendingTotal =
    computed(
      () =>
        this.competitionStats()
          .reduce(
            (
              total,
              stat,
            ) =>
              total +
              stat.marksPending,
            0,
          ),
    );


  /**
   * ======================================================
   * BASIC LIVE COMPETITION STATUS
   * ======================================================
   */

  liveCompetitionStats =
    computed(
      () =>
        this.competitionStats()
          .map(
            (stat) => {

              let stage:
                | "Not started"
                | "Attendance"
                | "Evaluation"
                | "Completed";


              if (
                stat.total ===
                0
              ) {

                stage =
                  "Not started";

              } else if (
                stat.notMarked >
                0
              ) {

                stage =
                  "Attendance";

              } else if (
                stat.marksPending >
                0
              ) {

                stage =
                  "Evaluation";

              } else {

                stage =
                  "Completed";
              }


              return {
                ...stat,
                stage,
              };
            },
          ),
    );


  activeLiveCompetitions =
    computed(
      () =>
        this.liveCompetitionStats()
          .filter(
            (stat) =>
              stat.total >
                0 &&
              stat.stage !==
                "Completed",
          )
          .length,
    );


  completedCompetitions =
    computed(
      () =>
        this.liveCompetitionStats()
          .filter(
            (stat) =>
              stat.stage ===
              "Completed",
          )
          .length,
    );


  /**
   * ======================================================
   * LIVE EVENT
   * CATEGORY -> RELEVANT COMPETITIONS
   * ======================================================
   */

  liveCompetitionOptions =
    computed(
      () => {

        const categoryId =
          this.liveCategoryId();


        if (!categoryId) {
          return this.competitions();
        }


        return this.competitions()
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
   * LIVE EVENT FULL DETAILS
   * ======================================================
   */

  liveEventStats =
    computed(
      () => {

        const categoryId =
          this.liveCategoryId();

        const competitionId =
          this.liveCompetitionId();

        const selectedStage =
          this.liveStage();

        const search =
          this.liveSearch()
            .trim()
            .toLowerCase();


        let competitions =
          this.liveCompetitionOptions();


        if (competitionId) {

          competitions =
            competitions.filter(
              (competition) =>
                competition.id ===
                competitionId,
            );
        }


        return competitions

          .map(
            (competition) => {

              let registrations =
                this.validRegistrations()
                  .filter(
                    (registration) =>
                      registration.competitionIds.includes(
                        competition.id,
                      ),
                  );


              if (categoryId) {

                registrations =
                  registrations.filter(
                    (registration) =>
                      registration.categoryId ===
                      categoryId,
                  );
              }


              if (search) {

                registrations =
                  registrations.filter(
                    (registration) =>
                      registration.name
                        .toLowerCase()
                        .includes(
                          search,
                        ) ||
                      registration.applicationNo
                        .toLowerCase()
                        .includes(
                          search,
                        ) ||
                      registration.school
                        .toLowerCase()
                        .includes(
                          search,
                        ),
                  );
              }


              const participants =
                registrations.map(
                  (registration) => {

                    const attendance =
                      registration
                        .competitionAttendance?.[
                          competition.id
                        ] ||
                      "Not marked";


                    const marks =
                      this.scores()
                        .filter(
                          (score) =>
                            score.registrationId ===
                              registration.id &&
                            score.competitionId ===
                              competition.id,
                        );


                    const averageMark =
                      marks.length
                        ? marks.reduce(
                            (
                              total,
                              score,
                            ) =>
                              total +
                              Number(
                                score.mark ||
                                  0,
                              ),
                            0,
                          ) /
                          marks.length
                        : null;


                    return {
                      registration,

                      attendance,

                      marks,

                      averageMark,

                      markSubmitted:
                        marks.length >
                        0,
                    };
                  },
                );


              const present =
                participants.filter(
                  (participant) =>
                    participant.attendance ===
                    "Present",
                ).length;


              const absent =
                participants.filter(
                  (participant) =>
                    participant.attendance ===
                    "Absent",
                ).length;


              const attendancePending =
                participants.filter(
                  (participant) =>
                    participant.attendance ===
                    "Not marked",
                ).length;


              const marksSubmitted =
                participants.filter(
                  (participant) =>
                    participant.markSubmitted,
                ).length;


              const marksPending =
                Math.max(
                  0,
                  present -
                    marksSubmitted,
                );


              let stage:
                | "Not started"
                | "Attendance"
                | "Evaluation"
                | "Completed";


              if (
                participants.length ===
                0
              ) {

                stage =
                  "Not started";

              } else if (
                attendancePending >
                0
              ) {

                stage =
                  "Attendance";

              } else if (
                marksPending >
                0
              ) {

                stage =
                  "Evaluation";

              } else {

                stage =
                  "Completed";
              }


              const assignedJudges =
                this.judges()
                  .filter(
                    (judge) =>
                      judge.active &&
                      judge.competitionIds.includes(
                        competition.id,
                      ),
                  );


              const categoryBreakdown =
                this.categories()

                  .filter(
                    (category) =>
                      competition.categoryIds.includes(
                        category.id,
                      ),
                  )

                  .map(
                    (category) => {

                      const categoryStudents =
                        this.validRegistrations()
                          .filter(
                            (registration) =>
                              registration.categoryId ===
                                category.id &&
                              registration.competitionIds.includes(
                                competition.id,
                              ),
                          );


                      return {
                        category,

                        count:
                          categoryStudents.length,

                        present:
                          categoryStudents.filter(
                            (registration) =>
                              registration
                                .competitionAttendance?.[
                                  competition.id
                                ] ===
                              "Present",
                          ).length,
                      };
                    },
                  );


              return {
                competition,

                slot:
                  this.store.slot(
                    competition.slotId,
                  ),

                participants,

                total:
                  participants.length,

                present,

                absent,

                attendancePending,

                marksSubmitted,

                marksPending,

                stage,

                assignedJudges,

                categoryBreakdown,
              };
            },
          )

          .filter(
            (stat) =>
              !selectedStage ||
              stat.stage ===
                selectedStage,
          );
      },
    );


  /**
   * ======================================================
   * LIVE EVENT TOTALS
   * ======================================================
   */

  liveEventTotals =
    computed(
      () => {

        const stats =
          this.liveEventStats();


        return {
          competitions:
            stats.length,

          students:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.total,
              0,
            ),

          present:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.present,
              0,
            ),

          absent:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.absent,
              0,
            ),

          attendancePending:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.attendancePending,
              0,
            ),

          marksSubmitted:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.marksSubmitted,
              0,
            ),

          marksPending:
            stats.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.marksPending,
              0,
            ),
        };
      },
    );


  /**
   * ======================================================
   * RESULTS
   * CATEGORY -> RELEVANT COMPETITIONS
   * ======================================================
   */

  resultCompetitionOptions =
    computed(
      () => {

        const categoryId =
          this.resultCategoryId();


        if (!categoryId) {
          return this.competitions();
        }


        return this.competitions()
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
   * RESULTS JUDGE OPTIONS
   * ======================================================
   */

  resultJudgeOptions =
    computed(
      () => {

        const competitionId =
          this.resultCompetitionId();


        if (!competitionId) {
          return this.judges();
        }


        return this.judges()
          .filter(
            (judge) =>
              judge.competitionIds.includes(
                competitionId,
              ),
          );
      },
    );


  /**
   * ======================================================
   * RESULT BASE ROWS
   * Student + Competition + Judge + Marks
   * ======================================================
   */

  resultBaseRows =
    computed(
      () => {

        const categoryId =
          this.resultCategoryId();

        const competitionId =
          this.resultCompetitionId();

        const judgeId =
          this.resultJudgeId();

        const search =
          this.resultSearch()
            .trim()
            .toLowerCase();


        const selectedJudge =
          judgeId
            ? this.judges().find(
                (judge) =>
                  judge.id ===
                  judgeId,
              )
            : null;


        const rows: any[] =
          [];


        for (
          const registration
          of this.validRegistrations()
        ) {

          if (
            categoryId &&
            registration.categoryId !==
              categoryId
          ) {
            continue;
          }


          if (
            search &&
            !(
              registration.name
                .toLowerCase()
                .includes(search) ||
              registration.applicationNo
                .toLowerCase()
                .includes(search) ||
              registration.school
                .toLowerCase()
                .includes(search) ||
              registration.phone
                .toLowerCase()
                .includes(search)
            )
          ) {
            continue;
          }


          for (
            const id
            of registration.competitionIds
          ) {

            if (
              competitionId &&
              id !==
                competitionId
            ) {
              continue;
            }


            const competition =
              this.store.competition(
                id,
              );


            if (!competition) {
              continue;
            }


            if (
              selectedJudge &&
              !selectedJudge.competitionIds.includes(
                competition.id,
              )
            ) {
              continue;
            }


            const allScores =
              this.scores()
                .filter(
                  (score) =>
                    score.registrationId ===
                      registration.id &&
                    score.competitionId ===
                      competition.id,
                );


            const relevantScores =
              judgeId
                ? allScores.filter(
                    (score) =>
                      score.judgeId ===
                      judgeId,
                  )
                : allScores;


            const markDetails =
              relevantScores.map(
                (score) => {

                  const judge =
                    this.judges().find(
                      (item) =>
                        item.id ===
                        score.judgeId,
                    );


                  return {
                    score,
                    judge,
                  };
                },
              );


            const assignedJudges =
              this.judges()
                .filter(
                  (judge) =>
                    judge.active &&
                    judge.competitionIds.includes(
                      competition.id,
                    ),
                );


            const averageMark =
              relevantScores.length
                ? relevantScores.reduce(
                    (
                      total,
                      score,
                    ) =>
                      total +
                      Number(
                        score.mark ||
                          0,
                      ),
                    0,
                  ) /
                  relevantScores.length
                : null;


            const attendance =
              registration
                .competitionAttendance?.[
                  competition.id
                ] ||
              "Not marked";


            rows.push({
              registration,

              competition,

              category:
                this.store.category(
                  registration.categoryId,
                ),

              attendance,

              markDetails,

              assignedJudges,

              averageMark,

              marked:
                relevantScores.length >
                0,

              rank:
                null as
                  number | null,

              prize:
                "",

              prizePoints:
                0,
            });
          }
        }


        /**
         * Calculate rank competition-wise.
         */
        const competitionIds =
          [
            ...new Set(
              rows.map(
                (row) =>
                  row.competition.id,
              ),
            ),
          ];


        for (
          const currentCompetitionId
          of competitionIds
        ) {

          const competitionRows =
            rows.filter(
              (row) =>
                row.competition.id ===
                  currentCompetitionId &&
                row.averageMark !==
                  null,
            );


          const uniqueMarks =
            [
              ...new Set(
                competitionRows.map(
                  (row) =>
                    Number(
                      row.averageMark,
                    ),
                ),
              ),
            ].sort(
              (a, b) =>
                b - a,
            );


          for (
            const row
            of competitionRows
          ) {

            const rank =
              uniqueMarks.indexOf(
                Number(
                  row.averageMark,
                ),
              ) +
              1;


            row.rank =
              rank;


            if (rank === 1) {

              row.prize =
                "1st Prize";

              row.prizePoints =
                this.prizePoints.first;

            } else if (
              rank === 2
            ) {

              row.prize =
                "2nd Prize";

              row.prizePoints =
                this.prizePoints.second;

            } else if (
              rank === 3
            ) {

              row.prize =
                "3rd Prize";

              row.prizePoints =
                this.prizePoints.third;
            }
          }
        }


        return rows;
      },
    );


  /**
   * ======================================================
   * RESULTS AFTER STATUS FILTER
   * ======================================================
   */

  resultRows =
    computed(
      () => {

        const filter =
          this.resultStatus();


        const rows =
          this.resultBaseRows();


        if (!filter) {
          return rows;
        }


        if (
          filter ===
          "Marked"
        ) {

          return rows.filter(
            (row) =>
              row.marked,
          );
        }


        if (
          filter ===
          "Pending"
        ) {

          return rows.filter(
            (row) =>
              !row.marked,
          );
        }


        if (
          filter ===
          "Present"
        ) {

          return rows.filter(
            (row) =>
              row.attendance ===
              "Present",
          );
        }


        if (
          filter ===
          "Absent"
        ) {

          return rows.filter(
            (row) =>
              row.attendance ===
              "Absent",
          );
        }


        if (
          filter ===
          "Top 3"
        ) {

          return rows.filter(
            (row) =>
              row.rank !==
                null &&
              row.rank <=
                3,
          );
        }


        return rows;
      },
    );


  /**
   * ======================================================
   * RESULT SUMMARY
   * ======================================================
   */

  resultSummary =
    computed(
      () => {

        const rows =
          this.resultBaseRows();


        return {
          total:
            rows.length,

          present:
            rows.filter(
              (row) =>
                row.attendance ===
                "Present",
            ).length,

          absent:
            rows.filter(
              (row) =>
                row.attendance ===
                "Absent",
            ).length,

          attendancePending:
            rows.filter(
              (row) =>
                row.attendance ===
                "Not marked",
            ).length,

          marked:
            rows.filter(
              (row) =>
                row.marked,
            ).length,

          pending:
            rows.filter(
              (row) =>
                !row.marked,
            ).length,

          winners:
            rows.filter(
              (row) =>
                row.rank !==
                  null &&
                row.rank <=
                  3,
            ).length,
        };
      },
    );


  /**
   * ======================================================
   * RESULT GROUPED BY COMPETITION
   * ======================================================
   */

  resultCompetitionGroups =
    computed(
      () => {

        const rows =
          this.resultRows();


        const ids =
          [
            ...new Set(
              rows.map(
                (row) =>
                  row.competition.id,
              ),
            ),
          ];


        return ids.map(
          (competitionId) => {

            const competition =
              this.store.competition(
                competitionId,
              );


            const participants =
              rows
                .filter(
                  (row) =>
                    row.competition.id ===
                    competitionId,
                )
                .sort(
                  (a, b) => {

                    if (
                      a.averageMark ===
                        null &&
                      b.averageMark ===
                        null
                    ) {
                      return 0;
                    }


                    if (
                      a.averageMark ===
                      null
                    ) {
                      return 1;
                    }


                    if (
                      b.averageMark ===
                      null
                    ) {
                      return -1;
                    }


                    return (
                      Number(
                        b.averageMark,
                      ) -
                      Number(
                        a.averageMark,
                      )
                    );
                  },
                );


            return {
              competition,
              participants,
            };
          },
        );
      },
    );


  /**
   * ======================================================
   * MOST REGISTERED COMPETITIONS
   * ======================================================
   */

  topCompetitions =
    computed(
      () =>
        this.competitionStats()
          .slice()
          .sort(
            (a, b) =>
              b.total -
              a.total,
          )
          .slice(
            0,
            10,
          ),
    );


  /**
   * ======================================================
   * FILTER HANDLERS
   * ======================================================
   */

  setLiveCategory(
    categoryId: string,
  ) {

    this.liveCategoryId.set(
      categoryId,
    );


    const competitionId =
      this.liveCompetitionId();


    if (!competitionId) {
      return;
    }


    const valid =
      this.competitions()
        .some(
          (competition) =>
            competition.id ===
              competitionId &&
            (
              !categoryId ||
              competition.categoryIds.includes(
                categoryId,
              )
            ),
        );


    if (!valid) {

      this.liveCompetitionId.set(
        "",
      );
    }
  }


  setResultCategory(
    categoryId: string,
  ) {

    this.resultCategoryId.set(
      categoryId,
    );


    const competitionId =
      this.resultCompetitionId();


    if (competitionId) {

      const valid =
        this.competitions()
          .some(
            (competition) =>
              competition.id ===
                competitionId &&
              (
                !categoryId ||
                competition.categoryIds.includes(
                  categoryId,
                )
              ),
          );


      if (!valid) {

        this.resultCompetitionId.set(
          "",
        );
      }
    }


    this.resultJudgeId.set(
      "",
    );
  }


  setResultCompetition(
    competitionId: string,
  ) {

    this.resultCompetitionId.set(
      competitionId,
    );


    const judgeId =
      this.resultJudgeId();


    if (!judgeId) {
      return;
    }


    const judge =
      this.judges()
        .find(
          (item) =>
            item.id ===
            judgeId,
        );


    if (
      !judge ||
      (
        competitionId &&
        !judge.competitionIds.includes(
          competitionId,
        )
      )
    ) {

      this.resultJudgeId.set(
        "",
      );
    }
  }


  /**
   * ======================================================
   * RESET LIVE FILTERS
   * ======================================================
   */

  resetLiveFilters() {

    this.liveCategoryId.set(
      "",
    );

    this.liveCompetitionId.set(
      "",
    );

    this.liveStage.set(
      "",
    );

    this.liveSearch.set(
      "",
    );
  }


  /**
   * ======================================================
   * RESET RESULT FILTERS
   * ======================================================
   */

  resetResultFilters() {

    this.resultCategoryId.set(
      "",
    );

    this.resultCompetitionId.set(
      "",
    );

    this.resultJudgeId.set(
      "",
    );

    this.resultStatus.set(
      "",
    );

    this.resultSearch.set(
      "",
    );
  }


  /**
   * ======================================================
   * GENERAL HELPERS
   * ======================================================
   */

  categoryName(
    categoryId: string,
  ) {

    return (
      this.store.category(
        categoryId,
      )?.name ||
      "Unknown category"
    );
  }


  competitionName(
    competitionId: string,
  ) {

    return (
      this.store.competition(
        competitionId,
      )?.name ||
      "Unknown competition"
    );
  }


  judgeName(
    judgeId: string,
  ) {

    return (
      this.judges()
        .find(
          (judge) =>
            judge.id ===
            judgeId,
        )?.name ||
      "Unknown judge"
    );
  }


  competitionJudges(
    competitionId: string,
  ) {

    return this.judges()
      .filter(
        (judge) =>
          judge.active &&
          judge.competitionIds.includes(
            competitionId,
          ),
      );
  }


  competitionRegisteredCount(
    competitionId: string,
  ) {

    return this.filteredRegistrations()
      .filter(
        (registration) =>
          registration.competitionIds.includes(
            competitionId,
          ),
      )
      .length;
  }


  categoryRegisteredCount(
    categoryId: string,
  ) {

    return this.filteredRegistrations()
      .filter(
        (registration) =>
          registration.categoryId ===
          categoryId,
      )
      .length;
  }


  /**
   * ======================================================
   * RESET GENERAL FILTERS
   * ======================================================
   */

  resetFilters() {

    this.selectedCategory.set(
      "",
    );

    this.selectedCompetition.set(
      "",
    );

    this.selectedSource.set(
      "",
    );

    this.selectedPayment.set(
      "",
    );

    this.selectedAttendance.set(
      "",
    );

    this.selectedCompetitionStatus.set(
      "",
    );
  }


  /**
   * ======================================================
   * OLD DASHBOARD COMPATIBILITY
   * ======================================================
   */

  paid() {
    return this.totalCollected();
  }


  approved() {
    return this.confirmedRegistrations();
  }


  checkins() {
    return this.checkedIn();
  }


  paidNoShow() {

    return this.filteredRegistrations()
      .filter(
        (registration) =>
          registration.payment ===
            "Paid" &&
          (
            registration.approval ===
              "Approved" ||
            registration.registrationStatus ===
              "Confirmed"
          ) &&
          !registration.checkedInAt,
      )
      .length;
  }


  participated() {

    return this.filteredRegistrations()
      .filter(
        (registration) =>
          Object.values(
            registration.competitionAttendance ||
              {},
          ).some(
            (value) =>
              value ===
              "Present",
          ),
      )
      .length;
  }
}