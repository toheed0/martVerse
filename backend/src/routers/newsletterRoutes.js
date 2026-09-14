import express from "express";

import { subscribeController } from "../controllers/newsletterController.js";

const router = express.Router();

// Public by design — the whole point is catching people before they have an
// account.
router.post("/", subscribeController);

export default router;
