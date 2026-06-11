import { consoleContract } from "@corral/schema";
import { Controller } from "@nestjs/common";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { ConsoleApiError, ConsoleContextService } from "./console-context.service";

@Controller()
export class ConsoleController {
  constructor(private readonly consoleContext: ConsoleContextService) {}

  @TsRestHandler(consoleContract.me)
  async me() {
    return tsRestHandler(consoleContract.me, async ({ headers }) =>
      withConsoleErrors(() => this.consoleContext.getConsoleMe(headers), 200),
    );
  }

  @TsRestHandler(consoleContract.listOrganizers)
  async listOrganizers() {
    return tsRestHandler(consoleContract.listOrganizers, async ({ headers }) =>
      withConsoleErrors(() => this.consoleContext.listCurrentUserOrganizers(headers), 200),
    );
  }

  @TsRestHandler(consoleContract.listOrganizerEvents)
  async listOrganizerEvents() {
    return tsRestHandler(consoleContract.listOrganizerEvents, async ({ headers, params }) =>
      withConsoleErrors(
        () => this.consoleContext.listCurrentUserOrganizerEvents(headers, params.organizerId),
        200,
      ),
    );
  }

  @TsRestHandler(consoleContract.adminListOrganizers)
  async adminListOrganizers() {
    return tsRestHandler(consoleContract.adminListOrganizers, async ({ headers, query }) =>
      withConsoleErrors(
        () =>
          this.consoleContext.listAdminOrganizers(headers, { reviewStatus: query?.reviewStatus }),
        200,
      ),
    );
  }

  @TsRestHandler(consoleContract.onboardingStatus)
  async onboardingStatus() {
    return tsRestHandler(consoleContract.onboardingStatus, async ({ headers }) =>
      withConsoleErrors(() => this.consoleContext.getOnboardingStatus(headers), 200),
    );
  }

  @TsRestHandler(consoleContract.createOrganizerOnboarding)
  async createOrganizerOnboarding() {
    return tsRestHandler(consoleContract.createOrganizerOnboarding, async ({ body, headers }) =>
      withConsoleErrors(() => this.consoleContext.createOrganizerOnboarding(headers, body), 201),
    );
  }

  @TsRestHandler(consoleContract.adminGetOrganizer)
  async adminGetOrganizer() {
    return tsRestHandler(consoleContract.adminGetOrganizer, async ({ headers, params }) =>
      withConsoleErrors(
        () => this.consoleContext.getAdminOrganizer(headers, params.organizerId),
        200,
      ),
    );
  }

  @TsRestHandler(consoleContract.adminReviewOrganizer)
  async adminReviewOrganizer() {
    return tsRestHandler(consoleContract.adminReviewOrganizer, async ({ body, headers, params }) =>
      withConsoleErrors(
        () => this.consoleContext.reviewAdminOrganizer(headers, params.organizerId, body),
        200,
      ),
    );
  }

  @TsRestHandler(consoleContract.adminListOrganizerMembers)
  async adminListOrganizerMembers() {
    return tsRestHandler(consoleContract.adminListOrganizerMembers, async ({ headers }) =>
      withConsoleErrors(() => this.consoleContext.listAdminOrganizerMembers(headers), 200),
    );
  }

  @TsRestHandler(consoleContract.adminCreateOrganizerMembership)
  async adminCreateOrganizerMembership() {
    return tsRestHandler(
      consoleContract.adminCreateOrganizerMembership,
      async ({ body, headers }) =>
        withConsoleErrors(
          () => this.consoleContext.createAdminOrganizerMembership(headers, body),
          201,
        ),
    );
  }

  @TsRestHandler(consoleContract.adminUpdateOrganizerMembership)
  async adminUpdateOrganizerMembership() {
    return tsRestHandler(
      consoleContract.adminUpdateOrganizerMembership,
      async ({ body, headers, params }) =>
        withConsoleErrors(
          () =>
            this.consoleContext.updateAdminOrganizerMembership(headers, params.membershipId, body),
          200,
        ),
    );
  }
}

async function withConsoleErrors<TBody, TStatus extends 200 | 201>(
  handler: () => Promise<TBody>,
  successStatus: TStatus,
): Promise<
  | { status: TStatus; body: TBody }
  | { status: 400 | 401 | 403 | 404 | 409; body: { message: string } }
> {
  try {
    return { status: successStatus, body: await handler() };
  } catch (error) {
    if (error instanceof ConsoleApiError) {
      return { status: error.status, body: { message: error.message } };
    }

    throw error;
  }
}
