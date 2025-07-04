"use server";

import { getUserPageData as fetchUserData } from "./data";

export async function getUserPageData(userId: string) {
  return fetchUserData(userId);
}