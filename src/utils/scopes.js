import Interface from 'forest-express';
import utils from './schema';

/**
 * Inject scope filters into params.
 * This ensure that records which are out of scope for a given user won't be included in the
 * resulting chart.
 */
export default async function getScopedParams(params, model, user) {
  const scopedFilters = await Interface.scopeManager.appendScopeForUser(
    params.filters || (params.filter && JSON.stringify(params.filter)),
    user,
    utils.getModelName(model),
  );

  return { ...params, filters: scopedFilters };
}
