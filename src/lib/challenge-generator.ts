import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRecord, ChallengeTemplateRecord } from "@/lib/types";
import { 
  challengeTemplates, 
  CLASS_LABELS, 
  RARITY_LABELS, 
  KINGDOM_LABELS,
  type ChallengeTemplate, 
  type ChallengeTemplateCategory 
} from "./challenge-templates";

// Generate a deterministic UUID from a slug
function generateDeterministicId(slug: string): string {
  const hash = createHash("sha1").update(slug).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

// Get the user's level bracket
function getLevelBracket(xp: number): "early" | "mid" | "late" {
  const level = Math.floor(xp / 500) + 1;
  if (level <= 3) return "early";
  if (level <= 6) return "mid";
  return "late";
}

// Check cooldowns database and return lists of cooldown template IDs and categories
async function getActiveCooldowns(
  supabase: SupabaseClient,
  userId: string,
  now: Date
): Promise<{ templates: Set<string>; categories: Set<string> }> {
  const { data, error } = await supabase
    .from("user_challenge_cooldowns")
    .select("template_id, category")
    .eq("user_id", userId)
    .gt("expires_at", now.toISOString());

  if (error) {
    console.error("[ChallengeGenerator] Error fetching cooldowns:", error);
    return { templates: new Set(), categories: new Set() };
  }

  const templates = new Set<string>();
  const categories = new Set<string>();

  for (const row of (data ?? [])) {
    templates.add(row.template_id);
    categories.add(row.category);
  }

  return { templates, categories };
}

// Select templates using weighted randomness
function selectWeightedTemplates(
  pool: ChallengeTemplate[],
  count: number
): ChallengeTemplate[] {
  const selected: ChallengeTemplate[] = [];
  const available = [...pool];

  while (selected.length < count && available.length > 0) {
    const totalWeight = available.reduce((sum, t) => sum + t.generationWeight, 0);
    if (totalWeight <= 0) break;

    let roll = Math.random() * totalWeight;
    let index = 0;
    for (let i = 0; i < available.length; i++) {
      roll -= available[i].generationWeight;
      if (roll <= 0) {
        index = i;
        break;
      }
    }

    selected.push(available[index]);
    available.splice(index, 1);
  }

  return selected;
}

interface InstantiatedChallenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly";
  environmentType: "urban" | "rural" | "any";
  xpReward: number;
  targetCount: number;
  conditionType: string;
  templateId: string;
  category: string;
}

// Instantiate a template into a concrete challenge with resolved params
function instantiateTemplate(
  template: ChallengeTemplate,
  bracket: "early" | "mid" | "late",
  userId: string,
  windowStartStr: string,
  existingConditionTypes: Set<string>
): InstantiatedChallenge {
  const target = template.targetRules[bracket];
  const xpReward = template.rewardRules[bracket];
  let conditionType = "";
  let title = "";
  let description = "";

  // 1. Resolve parameters based on template category
  if (template.category === "class") {
    const classes = template.allowedClasses ?? ["Aves", "Mammalia", "Insecta"];
    let className = classes[0];
    
    for (const c of classes) {
      const cond = `capture_class:${c}`;
      if (!existingConditionTypes.has(cond)) {
        className = c;
        break;
      }
    }
    
    const classLabel = CLASS_LABELS[className] ?? className.toLowerCase();
    conditionType = `capture_class:${className}`;
    title = template.titleTemplate.replace("{classLabel}", CLASS_LABELS[className] ?? className);
    description = template.descriptionTemplate
      .replace("{target}", target.toString())
      .replace("{classLabel}", classLabel);
  } else if (template.category === "kingdom") {
    const kingdoms = template.allowedKingdoms ?? ["Plantae", "Fungi"];
    let kingdomName = kingdoms[0];

    for (const k of kingdoms) {
      const cond = `capture_kingdom:${k}`;
      if (!existingConditionTypes.has(cond)) {
        kingdomName = k;
        break;
      }
    }

    const kingdomLabel = KINGDOM_LABELS[kingdomName] ?? kingdomName.toLowerCase();
    conditionType = `capture_kingdom:${kingdomName}`;
    title = template.titleTemplate.replace("{kingdomLabel}", kingdomLabel.charAt(0).toUpperCase() + kingdomLabel.slice(1));
    description = template.descriptionTemplate
      .replace("{target}", target.toString())
      .replace("{kingdomLabel}", kingdomLabel);
  } else if (template.category === "rarity_min" || template.category === "rarity_exact") {
    const rarities = template.allowedRarities ?? ["common", "uncommon", "rare"];
    let rarity = rarities[0];

    const prefix = template.category === "rarity_min" ? "capture_rarity_min:" : "capture_rarity_exact:";
    for (const r of rarities) {
      const cond = `${prefix}${r}`;
      if (!existingConditionTypes.has(cond)) {
        rarity = r;
        break;
      }
    }

    const rarityLabel = RARITY_LABELS[rarity];
    conditionType = `${prefix}${rarity}`;
    title = template.titleTemplate.replace("{rarityLabel}", rarityLabel);
    description = template.descriptionTemplate
      .replace("{target}", target.toString())
      .replace("{rarityLabel}", rarityLabel);
  } else if (template.category === "any") {
    conditionType = "capture_any";
    title = template.titleTemplate;
    description = template.descriptionTemplate.replace("{target}", target.toString());
  } else if (template.category === "distinct_class") {
    conditionType = "capture_distinct_class";
    title = template.titleTemplate;
    description = template.descriptionTemplate.replace("{target}", target.toString());
  } else if (template.category === "distinct_kingdom") {
    conditionType = "capture_unique_kingdoms";
    title = template.titleTemplate;
    description = template.descriptionTemplate.replace("{target}", target.toString());
  } else if (template.category === "collect_all") {
    conditionType = "collect_all_rarities";
    title = template.titleTemplate;
    description = template.descriptionTemplate;
  }

  // Fallback if conditionType wasn't resolved properly
  if (!conditionType) {
    conditionType = "capture_any";
    title = template.titleTemplate;
    description = template.descriptionTemplate.replace("{target}", target.toString());
  }

  // 2. Generate deterministic ID
  const slug = `${userId}:${template.id}:${conditionType}:${target}:${windowStartStr}`;
  const id = generateDeterministicId(slug);

  return {
    id,
    title,
    description,
    type: template.type,
    environmentType: template.environmentScope,
    xpReward,
    targetCount: target,
    conditionType,
    templateId: template.id,
    category: template.category,
  };
}

export async function generateTailoredChallenges(
  supabase: SupabaseClient,
  user: UserRecord,
  type: "daily" | "weekly",
  windowStart: Date
): Promise<Array<{ challenge: ChallengeTemplateRecord; assignedAt: string; expiresAt: string }>> {
  const count = 5;
  const windowStartStr = windowStart.toISOString();
  
  const expiresAt = new Date(windowStart.getTime());
  if (type === "daily") {
    expiresAt.setDate(expiresAt.getDate() + 1);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }
  const expiresAtStr = expiresAt.toISOString();

  console.log(`[ChallengeGenerator] Generating ${type} challenges for user ${user.id} at window ${windowStartStr}`);

  // 1. Get active cooldowns
  const { templates: cooldownTemplates, categories: cooldownCategories } = 
    await getActiveCooldowns(supabase, user.id, windowStart);

  // 2. Filter available templates
  let pool = challengeTemplates.filter((t) => {
    if (t.type !== type || !t.enabled) return false;
    
    if (t.environmentScope !== "any" && t.environmentScope !== user.environmentType) {
      return false;
    }

    if (cooldownTemplates.has(t.id) || cooldownCategories.has(t.category)) {
      return false;
    }

    return true;
  });

  // Fallback: If cooldowns restrict the pool too much, relax them
  if (pool.length < count) {
    console.log(`[ChallengeGenerator] Pool too small (${pool.length}), relaxing category cooldowns...`);
    pool = challengeTemplates.filter((t) => {
      if (t.type !== type || !t.enabled) return false;
      if (t.environmentScope !== "any" && t.environmentScope !== user.environmentType) {
        return false;
      }
      return !cooldownTemplates.has(t.id);
    });
  }

  // Double Fallback: If still too small, relax all cooldowns
  if (pool.length < count) {
    console.log(`[ChallengeGenerator] Pool still too small (${pool.length}), relaxing all cooldowns...`);
    pool = challengeTemplates.filter((t) => {
      if (t.type !== type || !t.enabled) return false;
      return t.environmentScope === "any" || t.environmentScope === user.environmentType;
    });
  }

  if (pool.length === 0) {
    console.log("[ChallengeGenerator] Critical fallback: using all templates of matching type.");
    pool = challengeTemplates.filter((t) => t.type === type && t.enabled);
  }

  // 3. Pick 5 templates
  const selectedTemplates = selectWeightedTemplates(pool, count);

  while (selectedTemplates.length < count && pool.length > 0) {
    selectedTemplates.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // 4. Instantiate selected templates
  const bracket = getLevelBracket(user.totalXp);
  const concreteChallenges: InstantiatedChallenge[] = [];
  const conditionTypes = new Set<string>();

  for (const template of selectedTemplates) {
    const instantiated = instantiateTemplate(template, bracket, user.id, windowStartStr, conditionTypes);
    concreteChallenges.push(instantiated);
    conditionTypes.add(instantiated.conditionType);
  }

  // 5. Batch insert instantiated challenges into the DB
  const challengesToInsert = concreteChallenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    environment_type: c.environmentType,
    xp_reward: c.xpReward,
    target_count: c.targetCount,
    condition_type: c.conditionType,
  }));

  const { error: challengeInsertError } = await supabase
    .from("challenges")
    .upsert(challengesToInsert, { onConflict: "id" });

  if (challengeInsertError) {
    console.error("[ChallengeGenerator] Error saving instantiated challenges:", challengeInsertError);
    throw challengeInsertError;
  }

  // 6. Write cooldown entries to DB
  const cooldownsToInsert = concreteChallenges.map((c) => {
    const template = challengeTemplates.find((t) => t.id === c.templateId);
    const cooldownDays = template?.cooldownDays ?? 2;
    const cooldownExpires = new Date(windowStart.getTime());
    cooldownExpires.setDate(cooldownExpires.getDate() + cooldownDays);

    return {
      user_id: user.id,
      template_id: c.templateId,
      category: c.category,
      assigned_at: windowStartStr,
      expires_at: cooldownExpires.toISOString(),
    };
  });

  const { error: cooldownError } = await supabase
    .from("user_challenge_cooldowns")
    .insert(cooldownsToInsert);

  if (cooldownError) {
    console.error("[ChallengeGenerator] Error writing challenge cooldowns:", cooldownError);
  }

  return concreteChallenges.map((c) => ({
    challenge: {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      environmentType: c.environmentType,
      xpReward: c.xpReward,
      targetCount: c.targetCount,
      conditionType: c.conditionType,
    },
    assignedAt: windowStartStr,
    expiresAt: expiresAtStr,
  }));
}
