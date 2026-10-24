import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createUploader } from '../../middlewares/upload';
import * as resourceController from './resource.controller';
import { createResourceSchema, listResourcesSchema, updateResourceSchema } from './resource.validation';

const router = Router();
router.use(authenticate);

const fileUploader = createUploader('files');

// When a file is uploaded, treat the resource as a FILE type so the schema
// does not require a URL.
const inferTypeFromUpload = (req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
  if (req.file && req.body) {
    req.body.type = 'FILE';
  }
  next();
};

router.get('/', validate(listResourcesSchema, 'query'), resourceController.list);
router.post('/', fileUploader.single('file'), inferTypeFromUpload, validate(createResourceSchema), resourceController.create);
router.put('/:id', fileUploader.single('file'), inferTypeFromUpload, validate(updateResourceSchema), resourceController.update);
router.delete('/:id', resourceController.remove);

export default router;
