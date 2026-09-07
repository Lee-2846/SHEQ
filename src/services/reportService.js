import { reports } from "../data/mockData";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getReports() {
  await wait(450);
  return [...reports];
}

export async function createReport(report) {
  await wait(700);
  return {
    ...report,
    id: Date.now(),
    status: "Under review",
    confirmations: 0,
    disputes: 0
  };
}

export async function verifyReport(id) {
  await wait(350);
  return { id, verified: true };
}
