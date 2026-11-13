const express = require('express');
const multer = require('multer');
const { z } = require('zod');

const env = require('../../config/env');
const { requireAuth, loadUser } = require('../../middleware/auth');
const { validateBody } = require('../../middleware/validate');
const manualActivityService = require('../../services/manualActivityService');
const { httpError } = require('../../utils/httpError');

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.manualActivity.maxScreenshotMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        httpError(
          400,
          'Screenshot harus JPG, PNG, atau WebP',
          'INVALID_SCREENSHOT_TYPE'
        )
      );
      return;
    }
    callback(null, true);
  },
});

const manualActivitySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum([...manualActivityService.ACTIVITY_TYPES]),
    minutes: z.coerce.number().int().min(1).max(600),
    note: z.string().max(300).optional().default(''),
  })
  .strict();

function uploadScreenshot(req, res, next) {
  upload.single('screenshot')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          httpError(
            413,
            `Screenshot maksimal ${env.manualActivity.maxScreenshotMb} MB`,
            'SCREENSHOT_TOO_LARGE'
          )
        );
        return;
      }

      next(httpError(400, error.message, 'UPLOAD_ERROR'));
      return;
    }

    next(error.status ? error : httpError(400, error.message, 'UPLOAD_ERROR'));
  });
}

// GET /api/v1/activities/manual
router.get('/manual', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(await manualActivityService.listManualActivities(req.user));
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/activities/manual (multipart/form-data)
router.post(
  '/manual',
  requireAuth,
  loadUser,
  uploadScreenshot,
  validateBody(manualActivitySchema),
  async (req, res, next) => {
    try {
      const result = await manualActivityService.createManualActivity(
        req.user,
        req.body,
        req.file
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/activities/manual/:id
router.delete('/manual/:id', requireAuth, loadUser, async (req, res, next) => {
  try {
    res.json(
      await manualActivityService.deleteManualActivity(req.user, req.params.id)
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
