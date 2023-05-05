import { type DateClickArg } from '@fullcalendar/interaction'
import { api } from "~/utils/api";
import { z } from "zod";
import React, { useCallback, useEffect, useState } from "react";
import ReservationDialog from "~/components/ReservationDialog";

import {
  type EventClickArg,
  type EventInput,
} from '@fullcalendar/core'
import { type ResourceInput } from "@fullcalendar/resource";
import FullCalendarWrapper from "./FullCalendarWrapper";
import EventDetailDialog from './EventDetailDialog';
import { useSession } from 'next-auth/react';
import { type EventImpl } from '@fullcalendar/core/internal';

export const ReservationInputSchema = z.object({
  startDateTime: z.date(),
  endDateTime: z.date(),
  courtId: z.string(),
});


export default function Calendar() {

  const { data: sessionData } = useSession();

  /**
   * -------------------------------------
   *      ----- trpc procedures -----
   * -------------------------------------
   */

  const utils = api.useContext();

  const reservationQuery = api.reservation.getAll.useQuery();
  const courtQuery = api.court.getAll.useQuery();

  const reservationAdd = api.reservation.insertOne.useMutation({
    async onSuccess() {
      await reservationQuery.refetch()
      // await utils.reservation.invalidate()
    },
  })
  const reservationDelete = api.reservation.deleteOne.useMutation({
    async onSuccess() {
      await reservationQuery.refetch()
      // await utils.reservation.()
    },
  })

  /**
   * ---------- end of trpc procedures ----------------
   */


    /**
   * -------------------------------------
   *      ----- DB Queries -----
   * -------------------------------------
   */

  const getCourtsFromDb = useCallback(() => {
    if (courtQuery.error) {
      console.error("Error: ", courtQuery.error);
    }
    if (!courtQuery.data) {
      return;
    }
    setCourts(courtQuery.data.map((court) => {
      return {
        id: court.id,
        title: court.name,
      }
    }))
  }, [courtQuery.data, courtQuery.error])


  const getEventsFromDb = useCallback(() => {
    const reservationFromDb = reservationQuery.data;
    if (reservationFromDb) {
      setEvents(reservationFromDb.map((reservation) => {
        return {
          id: reservation.id.toString(),
          title: reservation.user.name || "", //user.name can be null
          start: reservation.startTime,
          end: reservation.endTime,
          allDay: false,
          resourceId: reservation.courtId,
          extendedProps: {
            userId: reservation.user.id,
          }
        }
      }))
    }
  }, [reservationQuery.data])

  /**
   * ---------- end of DB Queries ----------------
   */


  function deleteEvent(eventId: string): void {
    console.log("delete Event: ", eventId);
    reservationDelete.mutate(eventId);
    setEventDetails(undefined);
  }


  const addEventOnClick = (selectInfo: DateClickArg) => {
    console.log(selectInfo.dateStr);
    console.log("resouceId: ", selectInfo.resource?.id);
    const calendarApi = selectInfo.view.calendar
    calendarApi.unselect() // clear date selection

    if (selectInfo.resource === undefined) {
      throw new Error("No court selected");
    }

    setCourtId(selectInfo.resource.id);
    setStartDate(new Date(selectInfo.dateStr));
    setOpenDialog(true);
  }

  const openEventDetails = (eventClickInfo: EventClickArg) => {
    console.log("eventClickInfo: ", eventClickInfo);
    setEventDetails(eventClickInfo.event)
  }


  const setEndDate = (endDate: Date | undefined) => {
    console.log("startDate in calendar: ", startDate);
    console.log("endDate in calendar: ", endDate);
    console.log("courtId: ", courtId)

    setOpenDialog(false);

    if (!endDate) {
      return;
    }

    if (!startDate || !courtId) {
      throw new Error(`startDate or courtId is undefined`);
    }

    reservationAdd.mutate({
      courtId: courtId,
      startDateTime: startDate,
      endDateTime: endDate
    })
  };

  const [courts, setCourts] = useState<ResourceInput[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [courtId, setCourtId] = useState<string>();
  const [eventDetails, setEventDetails] = useState<EventImpl>();

  useEffect(() => {
    getCourtsFromDb();
    getEventsFromDb();
  }, [getEventsFromDb, getCourtsFromDb])


  if (courtQuery.isLoading || reservationQuery.isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <FullCalendarWrapper
        events={events}
        courts={courts}
        onDateClick={addEventOnClick}
        onEventClick={openEventDetails}
      />

      <ReservationDialog
        open={openDialog}
        startDate={startDate}
        onClose={(endDate) => setEndDate(endDate)}
      />

      <EventDetailDialog
        open={eventDetails !== undefined}
        eventDetails={eventDetails}
        onDialogClose={() => setEventDetails(undefined)}
        sessionData={sessionData}
        onReservationDelete={(id) => deleteEvent(id)}
      />

    </div>
  )
}