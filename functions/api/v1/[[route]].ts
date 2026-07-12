import { handle } from "hono/cloudflare-pages";
import { createApp } from "../../../server/app";

export const onRequest = handle(createApp());
