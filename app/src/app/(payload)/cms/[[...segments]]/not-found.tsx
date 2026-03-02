import { NotFoundPage } from "@payloadcms/next/views";
import config from "@payload-config";
import { importMap } from "../importMap";

export default function NotFound() {
  return NotFoundPage({
    config,
    importMap,
    params: Promise.resolve({ segments: [] }),
    searchParams: Promise.resolve({}),
  });
}
