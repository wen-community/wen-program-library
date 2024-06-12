import path from "path";
import { fileURLToPath } from "url";
import {
  renderRustVisitor,
  renderJavaScriptVisitor,
} from "@kinobi-so/renderers";
import { rootNodeFromAnchorWithoutDefaultVisitor } from "@kinobi-so/nodes-from-anchor";
import { readJson } from "@kinobi-so/renderers-core";
import { visit } from "@kinobi-so/visitors-core";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "clients");
const idlDir = path.join(__dirname, "target", "idl");

const idlFiles = await fs.readdir(idlDir);

for (const idlFile of idlFiles) {
  const idlPath = path.join(idlDir, idlFile);
  const idl = readJson(idlPath);

  const node = rootNodeFromAnchorWithoutDefaultVisitor(idl);

  const sdkName = idl.metadata.name;

  await visit(
    node,
    renderJavaScriptVisitor(
      path.join(clientDir, "js", sdkName, "src", "generated")
    )
  );

  visit(
    node,
    renderRustVisitor(
      path.join(clientDir, "rust", sdkName, "src", "generated"),
      { format: true }
    )
  );
}
