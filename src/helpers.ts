import {
  ClientPropMapping,
  ClientSDKFlagValue,
  Environment,
  Experiment,
  FeatureFlag,
  FeatureFlagDraft,
  ForcedValue,
  SDKFlagManager,
} from '@avocet/core';
import { RepositoryManager } from '@avocet/mongo-client';
import cfg from './envalid.js';

export const repos = new RepositoryManager(cfg.MONGO_API_URI);

export async function computeFlagValue(
  flag: FeatureFlag,
  environmentName: string,
  clientProps: ClientPropMapping,
): Promise<ClientSDKFlagValue> {
  const defaultReturn = {
    value: flag.value.initial,
    metadata: SDKFlagManager.singleIdString(flag.id),
  };

  const envRules = FeatureFlagDraft.getEnvironmentRules(flag, environmentName);
  const selectedRule = SDKFlagManager.enroll(envRules, clientProps);
  if (selectedRule === undefined) return defaultReturn;

  let fullRule: Experiment | ForcedValue;
  if (selectedRule.type === 'Experiment') {
    fullRule = await repos.experiment.get(selectedRule.id);
  } else {
    fullRule = selectedRule;
  }

  const ruleValue = SDKFlagManager.ruleValueAndMetadata(
    fullRule,
    flag.id,
    clientProps,
  );
  return ruleValue ?? defaultReturn;
}

export const getEnvFromKey = async (apiKey: string): Promise<Environment> => {
  const connection = await repos.sdkConnection.findOne({ apiKeyHash: apiKey });
  if (!connection) throw new Error('No SDK connection found.');

  const environment = await repos.environment.get(connection.environmentId);
  if (!connection) throw new Error('No environment found.');

  return environment;
};
