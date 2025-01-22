import { join } from "path";
import { existsSync, createReadStream } from "fs";

export default async function handler(req, res) {
  const { path } = req.query;

  // Construct the absolute path to the requested file
  const filePath = join(process.cwd(), "uploads", ...path);

  // Check if the requested file exists
  if (!existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Set appropriate headers
  res.setHeader("Content-Type", "application/octet-stream");
  createReadStream(filePath).pipe(res);
}
