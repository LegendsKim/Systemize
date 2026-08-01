import { describe, expect, it } from "vitest";
import {
  companyPersonSchema,
  companyProjectSchema,
  invitationLifecycleSchema,
  invitationReissueSchema,
  projectDetailsSchema,
  projectInvitationSchema,
} from "../schemas";

describe("portal admin schemas", () => {
  it("accepts a valid company project", () => {
    expect(
      companyProjectSchema.safeParse({
        companyName: "Example",
        projectName: "Operations portal",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
      }).success
    ).toBe(true);
  });

  it("requires a Gmail address for an invitation", () => {
    expect(
      projectInvitationSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        invitationId: "123e4567-e89b-42d3-a456-426614174001",
        invitationToken: "a".repeat(43),
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
        fullName: "Client Owner",
        email: "owner@company.test",
        phone: "0501234567",
      }).success
    ).toBe(false);
  });

  it("requires exact UUID identifiers for invitation lifecycle mutations", () => {
    expect(
      invitationLifecycleSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        invitationId: "123e4567-e89b-42d3-a456-426614174001",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
      }).success
    ).toBe(true);
    expect(
      invitationLifecycleSchema.safeParse({
        projectId: "not-a-project",
        invitationId: "123e4567-e89b-42d3-a456-426614174001",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
      }).success
    ).toBe(false);
  });

  it("binds reissue retries to one replacement token and identifier", () => {
    expect(
      invitationReissueSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        invitationId: "123e4567-e89b-42d3-a456-426614174001",
        replacementInvitationId:
          "123e4567-e89b-42d3-a456-426614174003",
        invitationToken: "a".repeat(43),
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
      }).success
    ).toBe(true);
  });

  it("validates editable project details", () => {
    expect(
      projectDetailsSchema.safeParse({
        projectId: "123e4567-e89b-42d3-a456-426614174000",
        companyName: "Example",
        projectName: "Operations",
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
      }).success
    ).toBe(true);
  });

  it("keeps edited contacts on an exact Gmail address", () => {
    const base = {
      projectId: "123e4567-e89b-42d3-a456-426614174000",
      personId: "123e4567-e89b-42d3-a456-426614174001",
      fullName: "Client Owner",
      phone: "0501234567",
      idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
    };

    expect(
      companyPersonSchema.safeParse({
        ...base,
        email: "owner@gmail.com",
      }).success
    ).toBe(true);
    expect(
      companyPersonSchema.safeParse({
        ...base,
        email: "owner@company.test",
      }).success
    ).toBe(false);
  });
});
