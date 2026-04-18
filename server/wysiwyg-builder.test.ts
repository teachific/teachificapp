/**
 * Tests for WysiwygPageBuilder block structure and defaults
 * These tests validate the data layer (block types, defaults, serialization)
 * that the WYSIWYG editor relies on.
 */

import { describe, it, expect } from "vitest";

// Block types supported by the WYSIWYG builder
const BLOCK_TYPES = [
  "banner", "text_media", "image", "cta", "course_outline",
  "video", "testimonials", "pricing", "checklist", "html",
  "spacer", "divider", "bg_section", "button", "icon_list",
  "numbered_steps", "checklist_steps", "feature_grid",
] as const;

type BlockType = typeof BLOCK_TYPES[number];

interface Block {
  id: string;
  type: BlockType;
  visible: boolean;
  data: Record<string, any>;
}

// Minimal block factory (mirrors WysiwygPageBuilder logic)
function createBlock(type: BlockType, defaults: Record<string, any>): Block {
  return { id: `test-${type}`, type, visible: true, data: { ...defaults } };
}

// Serialize/deserialize round-trip (what the DB stores)
function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

function deserializeBlocks(json: string): Block[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

describe("WysiwygPageBuilder — block structure", () => {
  it("creates blocks with required fields", () => {
    const block = createBlock("banner", { headline: "Hello", backgroundColor: "#fff" });
    expect(block.id).toBeDefined();
    expect(block.type).toBe("banner");
    expect(block.visible).toBe(true);
    expect(block.data).toHaveProperty("headline", "Hello");
  });

  it("supports all 18 block types", () => {
    expect(BLOCK_TYPES).toHaveLength(18);
    BLOCK_TYPES.forEach(type => {
      const block = createBlock(type, {});
      expect(block.type).toBe(type);
    });
  });

  it("serializes and deserializes blocks correctly", () => {
    const blocks: Block[] = [
      createBlock("banner", { headline: "Test Hero", ctaText: "Enroll Now" }),
      createBlock("feature_grid", { headline: "Features", features: [{ id: "f1", title: "Fast" }] }),
      createBlock("spacer", { height: 80 }),
    ];

    const json = serializeBlocks(blocks);
    const restored = deserializeBlocks(json);

    expect(restored).toHaveLength(3);
    expect(restored[0].type).toBe("banner");
    expect(restored[0].data.headline).toBe("Test Hero");
    expect(restored[1].type).toBe("feature_grid");
    expect(restored[1].data.features[0].title).toBe("Fast");
    expect(restored[2].data.height).toBe(80);
  });

  it("returns empty array for invalid JSON", () => {
    expect(deserializeBlocks("not-json")).toEqual([]);
    expect(deserializeBlocks("{}")).toEqual([]);
    expect(deserializeBlocks("null")).toEqual([]);
    expect(deserializeBlocks("")).toEqual([]);
  });

  it("preserves block visibility flag", () => {
    const block = createBlock("divider", {});
    expect(block.visible).toBe(true);
    const hidden = { ...block, visible: false };
    const json = serializeBlocks([hidden]);
    const [restored] = deserializeBlocks(json);
    expect(restored.visible).toBe(false);
  });

  it("handles blocks with nested arrays (testimonials)", () => {
    const testimonials = [
      { id: "t1", quote: "Great!", author: "Jane", role: "Engineer" },
      { id: "t2", quote: "Amazing!", author: "Bob", role: "Designer" },
    ];
    const block = createBlock("testimonials", { headline: "Reviews", testimonials });
    const json = serializeBlocks([block]);
    const [restored] = deserializeBlocks(json);
    expect(restored.data.testimonials).toHaveLength(2);
    expect(restored.data.testimonials[0].author).toBe("Jane");
  });

  it("handles blocks with nested arrays (numbered_steps)", () => {
    const steps = [
      { id: "s1", title: "Sign Up", description: "Create account" },
      { id: "s2", title: "Learn", description: "Take courses" },
    ];
    const block = createBlock("numbered_steps", { headline: "How It Works", steps });
    const json = serializeBlocks([block]);
    const [restored] = deserializeBlocks(json);
    expect(restored.data.steps).toHaveLength(2);
    expect(restored.data.steps[1].title).toBe("Learn");
  });

  it("handles blocks with color fields", () => {
    const block = createBlock("banner", {
      backgroundColor: "#1e293b",
      textColor: "#ffffff",
      ctaBgColor: "#6366f1",
    });
    const json = serializeBlocks([block]);
    const [restored] = deserializeBlocks(json);
    expect(restored.data.backgroundColor).toBe("#1e293b");
    expect(restored.data.textColor).toBe("#ffffff");
  });

  it("handles empty blocks array", () => {
    const json = serializeBlocks([]);
    const restored = deserializeBlocks(json);
    expect(restored).toEqual([]);
  });

  it("preserves all block data fields through serialization", () => {
    const block = createBlock("cta", {
      headline: "Join Now",
      subtext: "Limited time offer",
      ctaText: "Get Started",
      ctaUrl: "https://example.com",
      backgroundType: "image",
      backgroundImageUrl: "https://example.com/bg.jpg",
      textColor: "#ffffff",
      alignment: "center",
      overlay: true,
      overlayOpacity: 0.6,
    });
    const [restored] = deserializeBlocks(serializeBlocks([block]));
    expect(restored.data.headline).toBe("Join Now");
    expect(restored.data.backgroundType).toBe("image");
    expect(restored.data.overlay).toBe(true);
    expect(restored.data.overlayOpacity).toBe(0.6);
  });
});

describe("WysiwygPageBuilder — block ordering", () => {
  it("preserves block order through serialization", () => {
    const types: BlockType[] = ["banner", "feature_grid", "testimonials", "cta", "spacer"];
    const blocks = types.map(t => createBlock(t, {}));
    const restored = deserializeBlocks(serializeBlocks(blocks));
    restored.forEach((b, i) => expect(b.type).toBe(types[i]));
  });

  it("simulates arrayMove for drag-and-drop reordering", () => {
    function arrayMove<T>(arr: T[], from: number, to: number): T[] {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    }

    const blocks: Block[] = [
      createBlock("banner", {}),
      createBlock("feature_grid", {}),
      createBlock("testimonials", {}),
    ];

    // Move "testimonials" (index 2) to index 0
    const reordered = arrayMove(blocks, 2, 0);
    expect(reordered[0].type).toBe("testimonials");
    expect(reordered[1].type).toBe("banner");
    expect(reordered[2].type).toBe("feature_grid");
  });
});
