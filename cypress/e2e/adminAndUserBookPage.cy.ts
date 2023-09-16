import dayjs from "dayjs";
import {
  allEnglandClubName,
  foroItalicoName,
  pietrangeliCourtName,
} from "~/utils/constants";
import {
  ADMIN_FORO,
  USER1,
  loginAndVisitCalendarPage,
  saveClubInfoAndCleanReservations,
} from "./constants";

beforeEach("Retrieve clubs and delete reservations (no login)", function () {
  saveClubInfoAndCleanReservations(
    foroItalicoName,
    "clubIdForoItalico",
    "foroItalico",
    "clubSettingsForoItalico"
  );
  saveClubInfoAndCleanReservations(
    allEnglandClubName,
    "clubIdAllEngland",
    "allEngland",
    "clubSettingsAllEngland"
  );
});

describe("New Reservation", () => {
  describe("GIVEN logged in user WHEN select a free slot THEN he can make a reservation", () => {
    [USER1, ADMIN_FORO].forEach((user) => {
      it(`Testing for ${user.type}`, function () {
        //initial setup
        loginAndVisitCalendarPage(
          user.username,
          user.password,
          this.clubIdForoItalico as string
        );

        cy.navigateDaysFromToday(2);

        cy.clickOnCalendarSlot(pietrangeliCourtName, 11, 0);

        // save startTime
        cy.get("[data-test='startTime']").invoke("val").as("startTime");

        // save endTime
        cy.get("[data-test='endTime']")
          .wait(100) //wait for the rerender
          .invoke("val")
          .as("endTime");

        // reserve and close the dialog
        cy.get("[data-test=reserveButton]").click();

        // reservation is added
        cy.get("[data-test=calendar-event]").should("be.visible");
      });
    });
  });

  describe("GIVEN logged user WHEN reserve with a clash THEN show error banner and reservation not added", () => {
    [USER1, ADMIN_FORO].forEach((user) => {
      it(`Testing for ${user.type}`, function () {
        //initial setup
        loginAndVisitCalendarPage(
          user.username,
          user.password,
          this.clubIdForoItalico as string
        );
        // create a reservation in the next day, for avoiding `reservation in the past` warning
        const startDate = dayjs()
          .add(1, "day")
          .hour(12)
          .minute(0)
          .second(0)
          .millisecond(0);

        cy.addReservationToDB(
          startDate.toDate(),
          startDate.add(1, "hour").toDate(),
          this.clubIdForoItalico as string,
          pietrangeliCourtName,
          Cypress.env("USER1_MAIL") as string
        );

        cy.reload().waitForCalendarPageToLoad();

        cy.navigateDaysFromToday(1);

        cy.clickOnCalendarSlot(pietrangeliCourtName, 11, 0);

        cy.get("[data-test='endTime']").type("12:30");

        cy.get("[data-test=reserveButton]").click();

        cy.get("[data-test='error-alert']")
          .should("be.visible")
          .and(
            "have.text",
            "La tua prenotazione non puo' essere effettuata. Per favore, scegli un orario in cui il campo è libero"
          );
        // close the error dialog
        cy.get(".MuiAlert-action > .MuiButtonBase-root").click();

        // check that no reservation has been added
        cy.get("[data-test='calendar-event']").should("have.length", 1);
      });
    });
  });

  describe("GIVEN logged user WHEN end time or start time is not 00 or 30 THEN show error and reservation not added", () => {
    [USER1, ADMIN_FORO].forEach((user) => {
      it(`Testing for ${user.type}`, function () {
        loginAndVisitCalendarPage(
          user.username,
          user.password,
          this.clubIdForoItalico as string
        );
        cy.navigateDaysFromToday(2);

        cy.clickOnCalendarSlot(pietrangeliCourtName, 11, 0);

        // insert wrong endTime
        cy.get("[data-test='endTime']").type("12:15");

        cy.get(".MuiFormHelperText-root").should(
          "have.text",
          "Prenota 1 ora, 1 ora e mezzo o 2 ore"
        );

        // try to reserve by clicking confirm button
        cy.get("[data-test=reserveButton]").should("be.disabled");
      });
    });
  });
});
