import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

const handlers = createRouteHandler({ router: ourFileRouter });

export const maxDuration = 300;
export const { GET, POST } = handlers;
