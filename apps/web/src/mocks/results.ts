import type { LeaderboardRow, Result } from "./types";

export const participantResults: Result[] = [
  {
    id: "result-ananya-10k-live",
    registrationId: "reg-ananya-10k-confirmed",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-10k-open",
    bibNumber: "1042",
    participantName: "Ananya Krishnan",
    status: "certificate-ready",
    rankOverall: 42,
    rankGender: 9,
    finishTime: "00:54:18",
    pace: "5:26/km",
    certificateReady: true,
    publishedAt: "2026-07-19T09:30:00+05:30",
  },
  {
    id: "result-karthik-5k-not-live",
    registrationId: "reg-karthik-5k-pending",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-5k-fun-run",
    bibNumber: "TBD",
    participantName: "Karthik Narayanan",
    status: "not-live",
    certificateReady: false,
  },
  {
    id: "result-sahana-21k-live",
    registrationId: "reg-sahana-21k-confirmed",
    eventId: "coimbatore-marathon-2026",
    categoryId: "cat-21k-half-marathon",
    bibNumber: "2107",
    participantName: "Sahana Iyer",
    status: "live",
    rankOverall: 18,
    rankGender: 4,
    finishTime: "01:43:12",
    pace: "4:54/km",
    certificateReady: false,
    publishedAt: "2026-07-19T09:45:00+05:30",
  },
];

export const leaderboardRows: LeaderboardRow[] = [
  {
    rank: 1,
    bibNumber: "1001",
    participantName: "Rahul Menon",
    categoryId: "cat-10k-open",
    gender: "male",
    finishTime: "00:38:45",
    pace: "3:52/km",
  },
  {
    rank: 2,
    bibNumber: "1033",
    participantName: "Priya Raman",
    categoryId: "cat-10k-open",
    gender: "female",
    finishTime: "00:42:08",
    pace: "4:13/km",
  },
  {
    rank: 42,
    bibNumber: "1042",
    participantName: "Ananya Krishnan",
    categoryId: "cat-10k-open",
    gender: "female",
    finishTime: "00:54:18",
    pace: "5:26/km",
  },
];

export const certificateReadyResult = participantResults[0] as Result;
