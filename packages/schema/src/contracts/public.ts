import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { errorResponseSchema } from "./console.schema";
import { publicEventDetailResponseSchema, publicEventsResponseSchema } from "./public.schema";

const c = initContract();

export const publicContract = c.router(
  {
    listEvents: {
      method: "GET",
      path: "/public/events",
      summary: "List published events visible to participants",
      responses: {
        200: publicEventsResponseSchema,
        404: errorResponseSchema,
      },
    },
    getEvent: {
      method: "GET",
      path: "/public/events/:organizerSlug/:eventSlug",
      summary: "Get a published participant-safe event by organizer and event slug",
      pathParams: z.object({
        organizerSlug: z.string().min(1),
        eventSlug: z.string().min(1),
      }),
      responses: {
        200: publicEventDetailResponseSchema,
        404: errorResponseSchema,
      },
    },
  },
  { strictStatusCodes: true },
);
