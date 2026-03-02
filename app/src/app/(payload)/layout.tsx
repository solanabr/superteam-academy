import type { ServerFunctionClient } from "payload";
import { RootLayout } from "@payloadcms/next/layouts";
import config from "@payload-config";
import { importMap } from "./cms/importMap";
import "@payloadcms/next/css";
import "../../styles/payload-admin.css";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverFunction: ServerFunctionClient = async (args) => {
    "use server";
    const { handleServerFunctions } = await import("@payloadcms/next/layouts");
    return handleServerFunctions({
      ...args,
      config,
      importMap,
    });
  };

  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  });
}
