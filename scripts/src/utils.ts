import { createHash } from "crypto";

export function getType(data: Buffer) {
  const managerDiscriminator = Buffer.from(
    createHash("sha256").update("account:Manager").digest()
  ).subarray(0, 8);

  const groupDiscriminator = Buffer.from(
    createHash("sha256").update("account:TokenGroup").digest()
  ).subarray(0, 8);

  const memberDiscriminator = Buffer.from(
    createHash("sha256").update("account:TokenGroupMember").digest()
  ).subarray(0, 8);

  const approveDiscriminator = Buffer.from(
    createHash("sha256").update("account:ApproveAccount").digest()
  ).subarray(0, 8);

  const distributionDiscriminator = Buffer.from(
    createHash("sha256").update("account:DistributionAccount").digest()
  ).subarray(0, 8);

  const dataFirst8Bytes = data.subarray(0, 8);

  if (dataFirst8Bytes.equals(managerDiscriminator)) {
    return "manager";
  } else if (dataFirst8Bytes.equals(groupDiscriminator)) {
    return "tokenGroup";
  } else if (dataFirst8Bytes.equals(memberDiscriminator)) {
    return "tokenGroupMember";
  } else if (dataFirst8Bytes.equals(approveDiscriminator)) {
    return "approveAccount";
  } else if (dataFirst8Bytes.equals(distributionDiscriminator)) {
    return "distributionAccount";
  } else {
    return "unknown";
  }
}
