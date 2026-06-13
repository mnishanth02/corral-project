import { healthContract, publicContract } from "@corral/schema";
import { initClient } from "@ts-rest/core";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const apiClient = initClient(healthContract, { baseUrl });
export const publicApiClient = initClient(publicContract, { baseUrl });
