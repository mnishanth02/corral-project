import { publicContract } from "@corral/schema";
import { Controller } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { PublicEventsApiError, PublicEventsService } from "./public-events.service";

@Controller()
export class PublicEventsController {
  constructor(private readonly publicEvents: PublicEventsService) {}

  @AllowAnonymous()
  @TsRestHandler(publicContract.listEvents)
  async listEvents() {
    return tsRestHandler(publicContract.listEvents, async () =>
      withPublicErrors(() => this.publicEvents.listEvents(), 200),
    );
  }

  @AllowAnonymous()
  @TsRestHandler(publicContract.getEvent)
  async getEvent() {
    return tsRestHandler(publicContract.getEvent, async ({ params }) =>
      withPublicErrors(
        () => this.publicEvents.getEvent(params.organizerSlug, params.eventSlug),
        200,
      ),
    );
  }
}

async function withPublicErrors<TBody>(
  action: () => Promise<TBody>,
  successStatus: 200,
): Promise<{ status: 200; body: TBody } | { status: 404; body: { message: string } }> {
  try {
    return { status: successStatus, body: await action() };
  } catch (error) {
    if (error instanceof PublicEventsApiError) {
      return { status: error.status, body: { message: error.message } };
    }

    throw error;
  }
}
