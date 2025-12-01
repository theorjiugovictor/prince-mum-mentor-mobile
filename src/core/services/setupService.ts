import AsyncStorage from "@react-native-async-storage/async-storage";
import { createChildProfile } from "./childProfile.service";
import { createProfileSetup } from "./profileSetup.service";
import type {
  CreateChildProfileRequest,
  CreateProfileSetupRequest,
} from "./types";

// -------- Types --------
export interface MomSetupData {
  momStatus: string;
  selectedGoals: string[];
  partner?: {
    name: string;
    email: string;
  };
}

export interface ChildData {
  fullName: string;
  dob: string;
  gender: "male" | "female" | "other";
}

// -------- Helpers --------
function mapMomStatus(status: string): string {
  const mapping: { [key: string]: string } = {
    Pregnant: "pregnant",
    "New Mom": "new_mom",
    "Toddler Mom": "toddler_mom",
    Mixed: "mixed",
  };

  return mapping[status] || status.toLowerCase().replace(/ /g, "_");
}

// -------- Updated Integration Flow --------
export async function completeSetupFlow(
  momSetupData: MomSetupData,
  children: ChildData[]
): Promise<{
  success: boolean;
  profile_setup_id?: string;
  childrenCreated?: number;
  childrenFailed?: number;
  error?: { message: string; status_code?: number; detail?: string };
}> {
  let profile_setup_id: string | undefined;

  try {
    // ---------------------------------------
    // Step 1 — Create Mom Profile Setup
    // ---------------------------------------
    const setupRequest: CreateProfileSetupRequest = {
      mom_status: mapMomStatus(momSetupData.momStatus),
      goals: momSetupData.selectedGoals,
      partner: momSetupData.partner || null,
      children: [], // children added individually afterward
    };

    const profileResp = await createProfileSetup(setupRequest);

    if (!profileResp?.id) {
      throw {
        message: "Failed to create profile setup",
        detail: "Backend did not return an ID",
      };
    }

    profile_setup_id = profileResp.id;
    await AsyncStorage.setItem("profile_setup_id", profile_setup_id);

    // ---------------------------------------
    // Step 2 — Create All Child Profiles
    // ---------------------------------------
    const childrenCreated: string[] = [];
    const childrenFailed: { child: ChildData; error: any }[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      try {
        const childReq: CreateChildProfileRequest = {
          profile_setup_id,
          full_name: child.fullName,
          date_of_birth: child.dob,
          gender: child.gender,
          birth_order: i + 1,
        };

        const result = await createChildProfile(childReq);
        childrenCreated.push(result?.id);
      } catch (err: any) {
        childrenFailed.push({
          child,
          error: err?.response?.data || err,
        });
      }
    }

    // ---------------------------------------
    // CRITICAL RULE — ANY CHILD FAILURE = TOTAL FAILURE
    // ---------------------------------------
    if (childrenFailed.length > 0) {
      throw {
        message: "One or more child records failed",
        detail: `${childrenFailed.length} child entries failed`,
        status_code: 400,
      };
    }

    // ---------------------------------------
    // Step 3 — Mark Setup Complete (ONLY if all OK)
    // ---------------------------------------
    await AsyncStorage.setItem("isSetupComplete", "true");

    return {
      success: true,
      profile_setup_id,
      childrenCreated: childrenCreated.length,
      childrenFailed: 0,
    };
  } catch (error: any) {
    // ---------------------------------------
    // On Any Error → Mark as NOT Complete
    // ---------------------------------------
    await AsyncStorage.setItem("isSetupComplete", "false");

    return {
      success: false,
      profile_setup_id,
      error: {
        message: error?.message || "Setup failed",
        detail: error?.detail,
        status_code:
          error?.status_code || error?.response?.data?.status_code || undefined,
      },
    };
  }
}

// ---------------------------------------
// Helpers for setup state
// ---------------------------------------
export async function isSetupComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem("isSetupComplete")) === "true";
  } catch {
    return false;
  }
}

export async function resetSetup(): Promise<void> {
  await AsyncStorage.removeItem("isSetupComplete");
  await AsyncStorage.removeItem("profile_setup_id");
  await AsyncStorage.removeItem("momSetupData");
}
