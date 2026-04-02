import { Router, Request, Response } from "express";
import { getOrderByToken, getDigitalProduct, incrementDownloadCount, logDownload } from "./lmsDb";
import { storageGet } from "./storage";

const router = Router();

/**
 * GET /api/download/:token
 * Validates the download token, checks access controls (expiry, download count),
 * logs the download, and redirects to a presigned S3 URL.
 */
router.get("/:token", async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const order = await getOrderByToken(token);

    if (!order) {
      return res.status(404).json({ error: "Download link not found." });
    }

    if (order.status !== "paid") {
      return res.status(403).json({ error: "Payment not confirmed. Please contact support." });
    }

    // Check expiry
    if (order.accessExpiresAt && new Date(order.accessExpiresAt) < new Date()) {
      return res.status(403).json({
        error: "This download link has expired.",
        expired: true,
      });
    }

    // Check download count limit
    if (order.maxDownloads !== null && order.maxDownloads !== undefined) {
      const count = order.downloadCount ?? 0;
      if (count >= order.maxDownloads) {
        return res.status(403).json({
          error: `Download limit reached (${order.maxDownloads} downloads allowed).`,
          limitReached: true,
        });
      }
    }

    // Get the product file
    const product = await getDigitalProduct(order.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    // Generate a presigned S3 URL (1 hour expiry)
    const { url: presignedUrl } = await storageGet(product.fileKey);

    // Log the download and increment count
    await Promise.all([
      incrementDownloadCount(order.id),
      logDownload({
        orderId: order.id,
        productId: product.id,
        ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      }),
    ]);

    // Redirect to the presigned URL
    return res.redirect(302, presignedUrl);
  } catch (err: any) {
    console.error("[DigitalDownload] Error:", err?.message ?? err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
