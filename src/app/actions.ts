"use server";

import { requireOnboardedUser } from "@/lib/session";
import {
  getHomeData,
  getCollectionData,
  getChallengesData,
  getLeaderboardData,
  getProfileData,
} from "@/lib/domain";

export async function fetchHomeDataAction() {
  const user = await requireOnboardedUser();
  return getHomeData(user.id);
}

export async function fetchCollectionDataAction() {
  const user = await requireOnboardedUser();
  return getCollectionData(user.id);
}

export async function fetchChallengesDataAction() {
  const user = await requireOnboardedUser();
  return getChallengesData(user.id);
}

export async function fetchLeaderboardDataAction() {
  const user = await requireOnboardedUser();
  const [weekly, monthly, allTime] = await Promise.all([
    getLeaderboardData(user.id, "weekly"),
    getLeaderboardData(user.id, "monthly"),
    getLeaderboardData(user.id, "all-time"),
  ]);
  return {
    weekly: weekly.rows,
    monthly: monthly.rows,
    allTime: allTime.rows,
  };
}

export async function fetchProfileDataAction() {
  const user = await requireOnboardedUser();
  return getProfileData(user.id);
}
