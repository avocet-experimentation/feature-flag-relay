import {
  ClientPropMapping,
  ClientSDKFlagMapping,
  ClientSDKFlagValue,
  SDKFlagManager,
} from '@avocet/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { getEnvFromKey, repos, computeFlagValue } from './helpers.js';

export const fetchFFlagHandler = async (
  request: FastifyRequest<{
    Body: {
      apiKey: string;
      clientProps: ClientPropMapping;
      flagName: string;
    };
  }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps, flagName } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    let currentValue: ClientSDKFlagValue = {
      value: null,
      metadata: SDKFlagManager.defaultIdString(),
    };

    const flag = await repos.featureFlag.findOne({
      name: flagName,
    });
    if (flag && environmentName in flag.environmentNames) {
      currentValue = await computeFlagValue(flag, environmentName, clientProps);
    }
    return await reply.code(200).send({ [flagName]: currentValue });
  } catch (e) {
    return reply.code(404);
  }
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<{
    Body: {
      apiKey: string;
      clientProps: ClientPropMapping;
    };
  }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    const featureFlags = await repos.featureFlag.getEnvironmentFlags(environmentName);

    const resolve = await Promise.all(
      featureFlags.map((flag) =>
        computeFlagValue(flag, environmentName, clientProps).then((result) => [
          flag.name,
          result,
        ])),
    );
    const environmentFlagMapping = Object.fromEntries(resolve);
    return await reply.code(200).send(environmentFlagMapping);
  } catch (e: unknown) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    return reply.code(404);
  }
};
