import { Router, type Response } from 'express';
import { deletionHtml, privacyHtml, termsHtml } from '../legal/pages';

const legalRouter = Router();

function html(res: Response, body: string) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.type('html').status(200).send(body);
}

legalRouter.get('/privacy', (_req, res) => html(res, privacyHtml()));
legalRouter.get('/terms', (_req, res) => html(res, termsHtml()));
legalRouter.get('/delete-account', (_req, res) => html(res, deletionHtml()));
legalRouter.get('/', (_req, res) => res.redirect(302, '/legal/privacy'));

export default legalRouter;
