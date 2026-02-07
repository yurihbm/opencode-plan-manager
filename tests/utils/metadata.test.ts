import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { mkdtemp, rm, mkdir } from "fs/promises";
import { tmpdir } from "os";
import {
  readMetadata,
  writeMetadata,
  validateMetadata,
} from "../../src/utils/metadata";
import type { PlanMetadata } from "../../src/types";

// ============================================================================
// Test setup
// ============================================================================

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "metadata-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function validMetadataObj(): PlanMetadata {
  return {
    plan_id: "feature_auth_20260206",
    type: "feature",
    status: "pending",
    created_at: "2026-02-06T14:00:00Z",
    updated_at: "2026-02-06T14:00:00Z",
    description: "Add user authentication flow",
  };
}

// ============================================================================
// validateMetadata
// ============================================================================

describe("validateMetadata", () => {
  test("returns valid metadata unchanged", () => {
    const data = validMetadataObj();
    const result = validateMetadata(data);

    expect(result).toEqual(data);
  });

  test("throws on missing fields", () => {
    expect(() => validateMetadata({})).toThrow("Invalid metadata");
  });

  test("throws on invalid plan_id format", () => {
    expect(() =>
      validateMetadata({ ...validMetadataObj(), plan_id: "UPPER CASE" }),
    ).toThrow("Invalid metadata");
  });

  test("throws on invalid status", () => {
    expect(() =>
      validateMetadata({ ...validMetadataObj(), status: "active" }),
    ).toThrow("Invalid metadata");
  });

  test("throws on invalid type", () => {
    expect(() =>
      validateMetadata({ ...validMetadataObj(), type: "chore" }),
    ).toThrow("Invalid metadata");
  });

  test("throws on invalid datetime", () => {
    expect(() =>
      validateMetadata({
        ...validMetadataObj(),
        created_at: "not-a-date",
      }),
    ).toThrow("Invalid metadata");
  });

  test("throws descriptive error messages", () => {
    try {
      validateMetadata({ plan_id: "" });
      expect(true).toBe(false); // should not reach here
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain("Invalid metadata");
      // Should have multiple validation issues
      expect(msg).toContain("plan_id");
    }
  });

  test("strips unknown/extra keys from metadata", () => {
    const dataWithExtra = {
      ...validMetadataObj(),
      extra_field: "should be stripped",
      another: 42,
    };

    const result = validateMetadata(dataWithExtra);

    expect(result).toEqual(validMetadataObj());
    expect((result as unknown as Record<string, unknown>)["extra_field"]).toBeUndefined();
    expect((result as unknown as Record<string, unknown>)["another"]).toBeUndefined();
  });
});

// ============================================================================
// writeMetadata & readMetadata (round-trip)
// ============================================================================

describe("writeMetadata", () => {
  test("writes valid metadata to metadata.json", async () => {
    const data = validMetadataObj();
    const result = await writeMetadata(testDir, data);

    expect(result).toEqual(data);

    // Verify file was created
    const filePath = join(testDir, "metadata.json");
    const fileExists = await Bun.file(filePath).exists();
    expect(fileExists).toBe(true);
  });

  test("writes formatted JSON with trailing newline", async () => {
    await writeMetadata(testDir, validMetadataObj());

    const filePath = join(testDir, "metadata.json");
    const content = await Bun.file(filePath).text();

    // Should be pretty-printed (2-space indent)
    expect(content).toContain("  ");
    // Should end with newline
    expect(content.endsWith("\n")).toBe(true);
    // Should be valid JSON
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test("throws on invalid metadata", async () => {
    const invalid = { ...validMetadataObj(), status: "invalid" } as unknown as PlanMetadata;

    expect(writeMetadata(testDir, invalid)).rejects.toThrow("Invalid metadata");
  });
});

describe("readMetadata", () => {
  test("reads and validates metadata from folder", async () => {
    const original = validMetadataObj();
    await writeMetadata(testDir, original);

    const result = await readMetadata(testDir);

    expect(result).toEqual(original);
  });

  test("throws if metadata.json does not exist", async () => {
    expect(readMetadata(testDir)).rejects.toThrow("metadata.json not found");
  });

  test("throws on corrupt JSON", async () => {
    const filePath = join(testDir, "metadata.json");
    await Bun.write(filePath, "{ this is not valid json }");

    expect(readMetadata(testDir)).rejects.toThrow();
  });

  test("throws on valid JSON but invalid schema", async () => {
    const filePath = join(testDir, "metadata.json");
    await Bun.write(
      filePath,
      JSON.stringify({ name: "not metadata", foo: "bar" }),
    );

    expect(readMetadata(testDir)).rejects.toThrow("Invalid metadata");
  });
});

// ============================================================================
// Round-trip tests
// ============================================================================

describe("round-trip", () => {
  test("write then read preserves all fields", async () => {
    const data = validMetadataObj();

    await writeMetadata(testDir, data);
    const result = await readMetadata(testDir);

    expect(result.plan_id).toBe(data.plan_id);
    expect(result.type).toBe(data.type);
    expect(result.status).toBe(data.status);
    expect(result.created_at).toBe(data.created_at);
    expect(result.updated_at).toBe(data.updated_at);
    expect(result.description).toBe(data.description);
  });

  test("overwrite updates the file", async () => {
    const original = validMetadataObj();
    await writeMetadata(testDir, original);

    const updated = {
      ...original,
      status: "in_progress" as const,
      updated_at: "2026-02-06T15:00:00Z",
    };
    await writeMetadata(testDir, updated);

    const result = await readMetadata(testDir);
    expect(result.status).toBe("in_progress");
    expect(result.updated_at).toBe("2026-02-06T15:00:00Z");
  });

  test("works with all plan types", async () => {
    const types = ["feature", "bug", "refactor", "docs"] as const;

    for (const type of types) {
      const subDir = join(testDir, type);
      await mkdir(subDir, { recursive: true });

      const data = { ...validMetadataObj(), type, plan_id: `${type}_test_20260206` };
      await writeMetadata(subDir, data);

      const result = await readMetadata(subDir);
      expect(result.type).toBe(type);
    }
  });

  test("works with all plan statuses", async () => {
    const statuses = ["pending", "in_progress", "done"] as const;

    for (const status of statuses) {
      const subDir = join(testDir, status);
      await mkdir(subDir, { recursive: true });

      const data = { ...validMetadataObj(), status };
      await writeMetadata(subDir, data);

      const result = await readMetadata(subDir);
      expect(result.status).toBe(status);
    }
  });
});
